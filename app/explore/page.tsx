import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MapPin, ArrowLeft } from 'lucide-react'

export const revalidate = 60 // refresh every minute

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trips } = await supabase
    .from('trips')
    .select('id, destination, start_date, end_date, notes, ai_summary')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(60)

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <Link
        href={user ? '/trips' : '/'}
        className="inline-flex items-center gap-2 text-stone-500 hover:text-teal-800 text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> {user ? 'Your trips' : 'Home'}
      </Link>
      <header className="mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-teal-800 mb-2">Explore</p>
        <h1 className="font-display text-4xl md:text-5xl font-light">Recently shared trips</h1>
        <p className="text-stone-500 mt-2">Journeys made public by travelers using Trip Journal.</p>
      </header>

      {(!trips || trips.length === 0) ? (
        <div className="text-center py-24 border-2 border-dashed border-stone-200 rounded-2xl">
          <div className="text-5xl mb-4">🌍</div>
          <h2 className="font-display text-2xl mb-2">Nothing public yet</h2>
          <p className="text-stone-500">Be the first to share a trip.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map(trip => (
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