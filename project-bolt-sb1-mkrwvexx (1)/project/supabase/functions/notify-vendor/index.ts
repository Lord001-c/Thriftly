import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function formatGhanaWhatsApp(phone: string): string {
  const trimmed = phone.trim()
  if (trimmed.startsWith('+')) {
    return `whatsapp:${trimmed}`
  }
  if (trimmed.startsWith('0')) {
    return `whatsapp:+233${trimmed.slice(1)}`
  }
  // Assume it's a local number without leading zero
  return `whatsapp:+233${trimmed}`
}

async function sendWhatsApp(to: string, body: string): Promise<void> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID') ?? ''
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''
  const from = Deno.env.get('TWILIO_WHATSAPP_FROM') ?? 'whatsapp:+14155238886'

  const credentials = btoa(`${accountSid}:${authToken}`)
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

  const params = new URLSearchParams()
  params.append('To', to)
  params.append('From', from)
  params.append('Body', body)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Twilio error ${res.status}: ${errorText}`)
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ── CRON MODE ──────────────────────────────────────────────────────────────
    if (body.check_pending === true) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      const { data: pending, error: fetchError } = await supabase
        .from('order_notifications')
        .select('id, order_id, seller_phone, send_count')
        .eq('acknowledged', false)
        .or(`last_sent_at.is.null,last_sent_at.lte.${fiveMinutesAgo}`)

      if (fetchError) {
        return new Response(JSON.stringify({ error: fetchError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const results: Array<{ id: string; success: boolean; error?: string }> = []

      for (const notification of pending ?? []) {
        try {
          // Fetch listing title via order
          const { data: orderData } = await supabase
            .from('orders')
            .select('listing:listing_id(title)')
            .eq('id', notification.order_id)
            .maybeSingle()

          const title = (orderData?.listing as any)?.title ?? 'your item'
          const sendCount = notification.send_count
          const toNumber = formatGhanaWhatsApp(notification.seller_phone)

          let messageBody = `🛍️ Thriftly: New order for "${title}"! A buyer has paid. Open your Thriftly seller dashboard to confirm delivery.`
          if (sendCount > 0) {
            messageBody += `\n\nReminder #${sendCount} — please check your orders.`
          }

          await sendWhatsApp(toNumber, messageBody)

          await supabase
            .from('order_notifications')
            .update({
              last_sent_at: new Date().toISOString(),
              send_count: sendCount + 1,
            })
            .eq('id', notification.id)

          results.push({ id: notification.id, success: true })
        } catch (err) {
          results.push({ id: notification.id, success: false, error: String(err) })
        }
      }

      return new Response(JSON.stringify({ processed: results.length, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── IMMEDIATE MODE ─────────────────────────────────────────────────────────
    const { order_id, seller_user_id, seller_phone, listing_title } = body

    if (!order_id || !seller_user_id || !seller_phone || !listing_title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: order_id, seller_user_id, seller_phone, listing_title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const toNumber = formatGhanaWhatsApp(seller_phone)
    const messageBody = `🛍️ Thriftly: New order for "${listing_title}"! A buyer has paid. Open your Thriftly seller dashboard to confirm delivery.`

    await sendWhatsApp(toNumber, messageBody)

    const { error: insertError } = await supabase
      .from('order_notifications')
      .insert({
        order_id,
        seller_user_id,
        seller_phone,
        acknowledged: false,
        send_count: 1,
        last_sent_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Failed to insert order_notification:', insertError.message)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
