'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ArrowLeft, Trash2, Upload, Sparkles, Loader2, Save, X } from 'lucide-react'

type Trip = {
  id: string
  user_id: string
  destination: string
  start_date: string
  end_date: string
  notes: string | null
  ai_summary: string | null
}

type Photo = { id: string; storage_path: string; caption: string | null }

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export default function TripDetailClient({ initialTrip }: { initialTrip: Trip }) {
  const router = useRouter()
  const supabase = createClient()
  const [trip, setTrip] = useState<Trip>(initialTrip)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    destination: initialTrip.destination,
    start_date: initialTrip.start_date,
    end_date: initialTrip.end_date,
    notes: initialTrip.notes ?? '',
  })
  const [showDelete, setShowDelete] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [streamingSummary, setStreamingSummary] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadPhotos() {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('trip_id', trip.id)
      .order('created_at', { ascending: true })
    setPhotos(data ?? [])
  }
  useEffect(() => { loadPhotos() }, [trip.id])

  function publicUrl(path: string) {
    return supabase.storage.from('trip-photos').getPublicUrl(path).data.publicUrl
  }

  // UPDATE
  async function saveEdits() {
    const { error } = await supabase
      .from('trips')
      .update({
        destination: editForm.destination.trim(),
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        notes: editForm.notes.trim() || null,
      })
      .eq('id', trip.id)

    if (error) { toast.error('Could not save changes.'); return }
    setTrip({ ...trip, ...editForm, notes: editForm.notes || null })
    setEditing(false)
    toast.success('Trip updated.')
  }

  // DELETE (UX #5 — confirmation modal)
  async function confirmDelete() {
    const { error } = await supabase.from('trips').delete().eq('id', trip.id)
    if (error) { toast.error('Could not delete trip.'); return }
    toast.success('Trip deleted.')
    router.push('/trips')
  }

  // PHOTO UPLOAD with validation
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED.includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP images allowed.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be under 5 MB.')
      return
    }

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in again.'); setUploading(false); return }

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${trip.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('trip-photos')
      .upload(path, file)
    if (uploadError) { toast.error('Upload failed.'); setUploading(false); return }

    const { error: dbError } = await supabase.from('photos').insert({
      trip_id: trip.id,
      user_id: user.id,
      storage_path: path,
    })
    if (dbError) { toast.error('Could not save photo record.'); setUploading(false); return }

    toast.success('Photo uploaded.')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploading(false)
    loadPhotos()
  }

  async function deletePhoto(photo: Photo) {
    await supabase.storage.from('trip-photos').remove([photo.storage_path])
    await supabase.from('photos').delete().eq('id', photo.id)
    toast.success('Photo removed.')
    loadPhotos()
  }

  // AI summary with streaming
  async function generateSummary() {
    setGenerating(true)
    setStreamingSummary('')

    try {
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          notes: trip.notes,
          photoCount: photos.length,
        }),
      })

      if (!response.ok || !response.body) throw new Error('No response')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        full += chunk
        setStreamingSummary(full)
      }

      // Persist the final summary
      await supabase.from('trips').update({ ai_summary: full }).eq('id', trip.id)
      setTrip({ ...trip, ai_summary: full })
      toast.success('Summary generated.')
    } catch {
      toast.error('Could not generate summary.')
    }
    setGenerating(false)
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href="/trips"
        className="inline-flex items-center gap-2 text-stone-500 hover:text-teal-800 text-sm mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to trips
      </Link>

      {!editing ? (
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-teal-800 mb-2">
            {formatRange(trip.start_date, trip.end_date)}
          </p>
          <h1 className="font-display text-5xl font-light mb-4">{trip.destination}</h1>
          {trip.notes && <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{trip.notes}</p>}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setEditing(true)}
              className="text-sm border border-stone-300 px-4 py-2 rounded-full hover:bg-stone-100"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-full hover:bg-red-50 inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </header>
      ) : (
        <section className="mb-10 bg-white border border-stone-200 rounded-2xl p-6">
          <h2 className="font-display text-xl mb-4">Edit trip</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={editForm.destination}
              onChange={e => setEditForm({ ...editForm, destination: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-stone-300"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={editForm.start_date}
                onChange={e => setEditForm({ ...editForm, start_date: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-stone-300"
              />
              <input
                type="date"
                value={editForm.end_date}
                onChange={e => setEditForm({ ...editForm, end_date: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-stone-300"
              />
            </div>
            <textarea
              value={editForm.notes}
              onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-stone-300"
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdits}
                className="bg-stone-900 text-stone-50 px-4 py-2 rounded-full text-sm inline-flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="border border-stone-300 px-4 py-2 rounded-full text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* AI Summary */}
      <section className="mb-10 bg-teal-50 border border-teal-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-800" /> AI summary
          </h2>
          <button
            onClick={generateSummary}
            disabled={generating}
            className="text-sm bg-teal-800 text-stone-50 px-4 py-2 rounded-full hover:bg-teal-900 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {generating && <Loader2 className="w-4 h-4 animate-spin" />}
            {trip.ai_summary ? 'Regenerate' : 'Generate'}
          </button>
        </div>
        {(streamingSummary || trip.ai_summary) ? (
          <p className="text-stone-700 leading-relaxed italic whitespace-pre-wrap">
            {streamingSummary || trip.ai_summary}
          </p>
        ) : (
          <p className="text-stone-500 text-sm">Click generate to have AI write a narrative summary of this trip.</p>
        )}
      </section>

      {/* Photos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Photos</h2>
          <label className="text-sm border border-stone-300 px-4 py-2 rounded-full hover:bg-stone-100 inline-flex items-center gap-2 cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Upload photo'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-stone-200 rounded-2xl">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-stone-500 text-sm">No photos yet. Upload your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map(photo => (
              <div key={photo.id} className="relative group aspect-square overflow-hidden rounded-xl">
                <img
                  src={publicUrl(photo.storage_path)}
                  alt={photo.caption ?? 'Trip photo'}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => deletePhoto(photo)}
                  className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete photo"
                >
                  <X className="w-4 h-4 text-stone-700" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* UX #5 — Delete confirmation modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-display text-xl mb-2">Delete this trip?</h3>
            <p className="text-sm text-stone-600 mb-6">
              This will permanently delete <strong>{trip.destination}</strong> and all its photos. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDelete(false)}
                className="px-4 py-2 rounded-full border border-stone-300 text-sm hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-full bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function formatRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
  return `${new Date(start).toLocaleDateString('en-US', opts)} — ${new Date(end).toLocaleDateString('en-US', opts)}`
}