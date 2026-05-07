import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROMPT = 'Does this image contain a person wearing clothes, shoes, or accessories, OR show any clothing or fashion item (on a hanger, flat lay, or mannequin)? Answer NO only if it is obviously unrelated to fashion — such as just an animal, food, a vehicle, or a landscape with no people or clothing. Answer YES or NO only.'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image_base64, media_type } = await req.json()

    if (!image_base64 || !media_type) {
      return new Response(JSON.stringify({ error: 'Missing image data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prompt = PROMPT

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: media_type, data: image_base64 },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    })

    const result = await response.json()

    if (result.error) {
      return new Response(JSON.stringify({ isClothing: true, skipped: true, reason: result.error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rawAnswer: string = result.content?.[0]?.text ?? ''
    const answer: string = rawAnswer.trim().toUpperCase()
    const isClothing: boolean = answer.startsWith('YES')

    return new Response(JSON.stringify({ isClothing, debug_answer: rawAnswer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
