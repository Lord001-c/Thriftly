import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const apiKey = Deno.env.get('REMOVE_BG_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'no_key' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const formData = await req.formData()
    const imageFile = formData.get('image_file') as File | null

    if (!imageFile) {
      return new Response(JSON.stringify({ error: 'Missing image_file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Re-wrap as a fresh Blob so Deno sends it correctly as multipart
    const arrayBuffer = await imageFile.arrayBuffer()
    const blob = new Blob([arrayBuffer], { type: imageFile.type || 'image/jpeg' })

    const body = new FormData()
    body.append('image_file', blob, imageFile.name || 'image.jpg')
    body.append('size', 'auto')
    body.append('format', 'png')
    body.append('type', 'product')

    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body,
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('remove.bg error', res.status, text)
      return new Response(JSON.stringify({ error: 'remove_bg_error', status: res.status, detail: text }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const imageBuffer = await res.arrayBuffer()
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
      },
    })
  } catch (err) {
    console.error('remove-bg exception', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
