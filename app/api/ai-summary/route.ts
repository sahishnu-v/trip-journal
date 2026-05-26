import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Auth check — only signed-in users can call this
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { destination, startDate, endDate, notes, photoCount } = await request.json()

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const prompt = `Write a warm, reflective 3-4 sentence narrative summary of this trip, as if recalling it months later. Use a literary, journal-entry voice. Avoid clichés.

Destination: ${destination}
Dates: ${startDate} to ${endDate}
Photos taken: ${photoCount}
Traveler's notes: ${notes || '(no notes)'}`

  // Stream the response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({
          model: 'claude-haiku-4-5',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }],
        })

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(new TextEncoder().encode(event.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}