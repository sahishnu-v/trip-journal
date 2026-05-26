import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TripDetailClient from '@/components/TripDetailClient'

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single()

  // 404 if trip doesn't exist OR if it's private and viewer isn't the owner
  if (!trip) notFound()
  if (!trip.is_public && trip.user_id !== user?.id) notFound()

  const isOwner = !!user && user.id === trip.user_id

  return <TripDetailClient initialTrip={trip} isOwner={isOwner} />
}