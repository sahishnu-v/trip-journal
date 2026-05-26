'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Search, Plus, MapPin, LogOut } from 'lucide-react'
import NewTripModal from './NewTripModal'

type Trip = {
  id: string
  destination: string
  start_date: string
  end_date: string
  notes: string | null
  created_at: string
}

export default function TripsClient({ userEmail }: { userEmail: string }) {
  const supabase = createClient()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debouncing, setDebouncing] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)

  async function loadTrips() {
    setLoading(true)
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) {
      toast.error('Could not load trips')
    } else {
      setTrips(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { loadTrips() }, [])

  // UX #8 — debounced search (300ms)
  useEffect(() => {
    setDebouncing(true)
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setDebouncing(false)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim()
    if (!q) return trips
    return trips.filter(
      t =>
        t.destination.toLowerCase().includes(q) ||
        (t.notes?.toLowerCase().includes(q) ?? false)
    )
  }, [trips, debouncedSearch])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-teal-800 mb-2">Trip Journal</p>
          <h1 className="font-display text-4xl md:text-5xl font-light">Your trips</h1>
          <p className="text-sm text-stone-500 mt-1">{userEmail}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 bg-stone-900 text-stone-50 px-5 py-2.5 rounded-full hover:bg-teal-800 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> New trip
          </button>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 border border-stone-300 px-5 py-2.5 rounded-full hover:bg-stone-100 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </header>

      {/* Search bar */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search destinations or notes…"
          className="w-full pl-11 pr-11 py-3 rounded-full border border-stone-300 bg-white focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-800/10"
        />
        {debouncing && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 animate-spin" />
        )}
      </div>

      {/* UX #1 — Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-teal-800 animate-spin mb-4" />
          <p className="text-stone-500">Gathering your trips…</p>
        </div>
      )}

      {/* UX #2 — Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-24 border-2 border-dashed border-stone-200 rounded-2xl">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="font-display text-2xl mb-2">
            {trips.length === 0 ? 'No trips yet' : 'No matches'}
          </h2>
          <p className="text-stone-500 mb-6">
            {trips.length === 0
              ? 'Log your first journey to get started.'
              : 'Try a different search term.'}
          </p>
          {trips.length === 0 && (
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 bg-teal-800 text-stone-50 px-5 py-2.5 rounded-full hover:bg-teal-900 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> Log a trip
            </button>
          )}
        </div>
      )}

      {/* UX #10 — Responsive grid: 1 / 2 / 3 columns */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(trip => (
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
              {trip.notes && (
                <p className="text-sm text-stone-600 line-clamp-3">{trip.notes}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {showNewModal && (
        <NewTripModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => { setShowNewModal(false); loadTrips() }}
        />
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