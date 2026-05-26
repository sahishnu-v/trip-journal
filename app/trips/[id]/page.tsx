import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import TripDetailClient from '@/components/TripDetailClient'

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single()

  if (!trip) notFound()

  return <TripDetailClient initialTrip={trip} />
}