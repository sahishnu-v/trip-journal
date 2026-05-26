import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to, destination, startDate, endDate } = await request.json()

  // Sanity check — make sure the email matches the signed-in user
  if (to !== user.email) {
    return NextResponse.json({ error: 'Email mismatch' }, { status: 403 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY!)

  try {
    await resend.emails.send({
      from: 'Trip Journal <onboarding@resend.dev>',
      to,
      subject: `Your trip to ${destination} has been logged`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #1c1917;">
          <p style="text-transform: uppercase; letter-spacing: 3px; font-size: 12px; color: #115e59;">Trip Journal</p>
          <h1 style="font-size: 28px; font-weight: 300; margin: 8px 0 24px;">Trip saved 🗺️</h1>
          <p style="line-height: 1.6;">Your trip to <strong>${destination}</strong> has been added to your journal.</p>
          <p style="line-height: 1.6; color: #57534e;">Dates: ${startDate} → ${endDate}</p>
          <p style="line-height: 1.6;">Open the app to add photos and generate an AI summary of how it felt.</p>
          <p style="margin-top: 32px; font-size: 13px; color: #78716c;">— Trip Journal</p>
        </div>
      `,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Email failed' }, { status: 500 })
  }
}