import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const secret = Deno.env.get('PAYSTACK_SECRET_KEY') ?? ''
    const signature = req.headers.get('x-paystack-signature') ?? ''
    const body = await req.text()

    // Verify the webhook signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    )
    const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
    const expectedSig = Array.from(new Uint8Array(sigBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (expectedSig !== signature) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const event = JSON.parse(body)

    if (event.event !== 'charge.success') {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ref: string = event.data?.reference ?? ''
    const metadata = event.data?.metadata ?? {}

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if order already exists (idempotency)
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('paystack_ref', ref)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Insert the order
    const { error: orderError } = await supabase.from('orders').insert({
      buyer_id: metadata.buyer_id,
      seller_id: metadata.seller_id,
      listing_id: metadata.listing_id,
      amount: event.data.amount / 100,
      paystack_ref: ref,
      status: 'paid',
      delivery_method: 'delivery',
      delivery_address: metadata.delivery_address,
      delivery_city: metadata.delivery_city,
      delivery_phone: metadata.delivery_phone,
    })

    if (orderError) {
      console.error('Order insert error:', orderError)
      return new Response(JSON.stringify({ error: orderError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Mark listing as sold
    await supabase
      .from('listings')
      .update({ status: 'sold' })
      .eq('id', metadata.listing_id)

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
