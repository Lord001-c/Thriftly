import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reference, buyer_id, seller_id, listing_id, delivery_address, delivery_city, delivery_phone } = await req.json()

    if (!reference) {
      return new Response(JSON.stringify({ error: 'Missing reference' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}` },
    })
    const result = await paystackRes.json()

    if (!result.status || result.data?.status !== 'success') {
      return new Response(JSON.stringify({ error: 'Payment not confirmed', status: result.data?.status, paystack_message: result.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Idempotency check
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('paystack_ref', reference)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ success: true, already_saved: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const amount = result.data.amount / 100

    const sellerPayout = Math.round(amount * 0.85 * 100) / 100
    const platformFee = Math.round(amount * 0.15 * 100) / 100

    const { data: orderData, error: orderError } = await supabase.from('orders').insert({
      buyer_id,
      seller_id,
      listing_id,
      amount,
      seller_payout: sellerPayout,
      platform_fee: platformFee,
      payout_status: 'pending',
      paystack_ref: reference,
      status: 'paid',
      delivery_method: 'delivery',
      delivery_address,
      delivery_city,
      delivery_phone,
    }).select('id').single()

    if (orderError) {
      return new Response(JSON.stringify({ error: orderError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Decrement quantity; mark sold if it hits 0
    const { data: listing } = await supabase
      .from('listings')
      .select('quantity')
      .eq('id', listing_id)
      .maybeSingle()

    const newQty = Math.max(0, (listing?.quantity ?? 1) - 1)
    await supabase
      .from('listings')
      .update({ quantity: newQty, ...(newQty === 0 ? { status: 'sold' } : {}) })
      .eq('id', listing_id)

    // Fire email notification — don't await so it doesn't slow the response
    const notifyPayload = async () => {
      try {
        const [{ data: listing }, { data: buyer }] = await Promise.all([
          supabase.from('listings').select('title').eq('id', listing_id).maybeSingle(),
          supabase.from('profiles').select('full_name').eq('id', buyer_id).maybeSingle(),
        ])

        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-admin`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'purchase',
            listing_title: listing?.title ?? 'Unknown item',
            amount: amount.toFixed(2),
            buyer_name: buyer?.full_name ?? 'Unknown buyer',
            delivery_address,
            delivery_city,
            delivery_phone,
          }),
        })
      } catch (_) { /* silent — don't fail the payment response */ }
    }
    notifyPayload()

    return new Response(JSON.stringify({ success: true, order_id: orderData?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
