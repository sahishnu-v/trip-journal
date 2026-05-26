'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'

type Errors = { destination?: string; start_date?: string; end_date?: string }

export default function NewTripModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const supabase = createClient()
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  // UX #6 — inline validation per field on blur
  function validateField(field: keyof Errors) {
    const next = { ...errors }
    if (field === 'destination') {
      if (!destination.trim()) next.destination = 'This field is required.'
      else delete next.destination
    }
    if (field === 'start_date') {
      if (!startDate) next.start_date = 'This field is required.'
      else delete next.start_date
    }
    if (field === 'end_date') {
      if (!endDate) next.end_date = 'This field is required.'
      else if (startDate && endDate < startDate) next.end_date = 'End date must be after start date.'
      else delete next.end_date
    }
    setErrors(next)
  }

  function validateAll() {
    const e: Errors = {}
    if (!destination.trim()) e.destination = 'This field is required.'
    if (!startDate) e.start_date = 'This field is required.'
    if (!endDate) e.end_date = 'This field is required.'
    else if (startDate && endDate < startDate) e.end_date = 'End date must be after start date.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validateAll()) {
      toast.error('Please fix the highlighted fields.')
      return
    }
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in again.'); setSubmitting(false); return }

    const { data, error } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        destination: destination.trim(),
        start_date: startDate,
        end_date: endDate,
        notes: notes.trim() || null,
      })
      .select()
      .single()

    if (error || !data) {
      toast.error('Could not save the trip.')
      setSubmitting(false)
      return
    }

    // Fire-and-forget confirmation email (doesn't block UI)
    fetch('/api/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: user.email,
        destination: data.destination,
        startDate: data.start_date,
        endDate: data.end_date,
      }),
    }).catch(() => { /* swallow — email failure shouldn't block */ })

    toast.success('Trip logged. Confirmation email on its way.')
    setSubmitting(false)
    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-700">
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-display text-2xl mb-6">Log a new trip</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-stone-700 mb-1">Destination</label>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              onBlur={() => validateField('destination')}
              placeholder="Kyoto, Japan"
              className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-teal-800/10 ${
                errors.destination ? 'border-red-500' : 'border-stone-300 focus:border-teal-800'
              }`}
            />
            {errors.destination && <p className="text-xs text-red-600 mt-1">{errors.destination}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-stone-700 mb-1">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                onBlur={() => validateField('start_date')}
                className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none ${
                  errors.start_date ? 'border-red-500' : 'border-stone-300 focus:border-teal-800'
                }`}
              />
              {errors.start_date && <p className="text-xs text-red-600 mt-1">{errors.start_date}</p>}
            </div>
            <div>
              <label className="block text-sm text-stone-700 mb-1">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                onBlur={() => validateField('end_date')}
                className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none ${
                  errors.end_date ? 'border-red-500' : 'border-stone-300 focus:border-teal-800'
                }`}
              />
              {errors.end_date && <p className="text-xs text-red-600 mt-1">{errors.end_date}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-stone-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="What did you do? How did it feel?"
              className="w-full px-4 py-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-800/10"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-stone-900 text-stone-50 py-3 rounded-full hover:bg-teal-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Saving…' : 'Save trip'}
          </button>
        </div>
      </div>
    </div>
  )
}