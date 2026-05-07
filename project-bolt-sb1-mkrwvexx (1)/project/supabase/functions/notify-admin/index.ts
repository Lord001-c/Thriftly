import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { type } = body

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? 'one431346@gmail.com'

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let subject = ''
    let html = ''

    if (type === 'signup') {
      const { name, email, role } = body
      subject = `New ${role || 'user'} signed up on Thriftly`
      html = `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="margin:0 0 16px;font-size:20px;color:#09090b">New Signup 🎉</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#71717a;font-size:14px;width:80px">Name</td><td style="padding:8px 0;font-size:14px;color:#09090b;font-weight:600">${name || 'N/A'}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a;font-size:14px">Email</td><td style="padding:8px 0;font-size:14px;color:#09090b">${email || 'N/A'}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a;font-size:14px">Role</td><td style="padding:8px 0;font-size:14px;color:#09090b;text-transform:capitalize">${role || 'buyer'}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a;font-size:14px">Time</td><td style="padding:8px 0;font-size:14px;color:#09090b">${new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td></tr>
          </table>
        </div>
      `
    } else if (type === 'purchase') {
      const { listing_title, amount, buyer_name, delivery_address, delivery_city, delivery_phone } = body
      const earned = (Number(amount) * 0.85).toFixed(2)
      subject = `New order: ${listing_title || 'Item'} — GHS ${amount}`
      html = `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="margin:0 0 16px;font-size:20px;color:#09090b">New Order 🛍️</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#71717a;font-size:14px;width:120px">Item</td><td style="padding:8px 0;font-size:14px;color:#09090b;font-weight:600">${listing_title || 'Unknown'}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a;font-size:14px">Amount paid</td><td style="padding:8px 0;font-size:14px;color:#09090b">GHS ${amount}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a;font-size:14px">You earn</td><td style="padding:8px 0;font-size:14px;color:#09090b;font-weight:600">GHS ${earned}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a;font-size:14px">Buyer</td><td style="padding:8px 0;font-size:14px;color:#09090b">${buyer_name || 'N/A'}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a;font-size:14px">Deliver to</td><td style="padding:8px 0;font-size:14px;color:#09090b">${[delivery_address, delivery_city].filter(Boolean).join(', ') || 'N/A'}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a;font-size:14px">Phone</td><td style="padding:8px 0;font-size:14px;color:#09090b">${delivery_phone || 'N/A'}</td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:13px;color:#71717a">Go to your <a href="https://thriftly.vercel.app/seller/orders" style="color:#09090b">seller dashboard</a> to mark it as delivered.</p>
        </div>
      `
    } else {
      return new Response(JSON.stringify({ error: 'Unknown notification type' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Thriftly <onboarding@resend.dev>',
        to: [ADMIN_EMAIL],
        subject,
        html,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      return new Response(JSON.stringify({ error: result }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
