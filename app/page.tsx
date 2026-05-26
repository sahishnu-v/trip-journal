import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignInButton from '@/components/SignInButton'
import { MapPin } from 'lucide-react'

export const revalidate = 60

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/trips')

  // Fetch a preview of public trips for the landing page
  const { data: publicTrips } = await supabase
    .from('trips')
    .select('id, destination, start_date, end_date, ai_summary, notes')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <main className="min-h-screen px-6">
      {/* Hero */}
      <section className="max-w-xl mx-auto text-center pt-24 pb-16">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-800 mb-6">A place to remember</p>
        <h1 className="font-display text-6xl md:text-7xl font-light text-stone-900 leading-tight mb-6">
          Your trips,<br />
          <em className="text-teal-800">in your own words.</em>
        </h1>
        <p className="text-stone-600 mb-10 text-lg">
          Log destinations, upload photos, and let AI craft a narrative summary of how the trip felt.
        </p>
        <SignInButton />
      </section>

      {/* Public trips preview */}
      {publicTrips && publicTrips.length > 0 && (
        <section className="max-w-6xl mx-auto pb-24">
          <div className="flex items-end justify-between mb-8 border-t border-stone-200 pt-12">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-800 mb-2">Explore</p>
              <h2 className="font-display text-3xl font-light">Recently shared</h2>
            </div>
            <Link href="/explore" className="text-sm text-teal-800 hover:underline">
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicTrips.map(trip => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="group bg-white border border-stone-200 rounded-2xl p-6 hover:border-teal-800 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-2 text-teal-800 mb-3">
                  <MapPin className="w-4 h-4 mt-1 shrink-0" />
                  <h3 className="font-display text-xl leading-snug group-hover:underline">
                    {trip.destination}
                  </h3>
                </div>
                <p className="text-xs uppercase tracking-wider text-stone-500 mb-3">
                  {formatRange(trip.start_date, trip.end_date)}
                </p>
                {(trip.ai_summary || trip.notes) && (
                  <p className="text-sm text-stone-600 line-clamp-3 italic">
                    {trip.ai_summary || trip.notes}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

function formatRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  const s = new Date(start).toLocaleDateString('en-US', opts)
  const e = new Date(end).toLocaleDateString('en-US', opts)
  return `${s} → ${e}`
}