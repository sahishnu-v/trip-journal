import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignInButton from '@/components/SignInButton'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/trips')

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-800 mb-6">A place to remember</p>
        <h1 className="font-display text-6xl md:text-7xl font-light text-stone-900 leading-tight mb-6">
          Your trips,<br />
          <em className="text-teal-800">in your own words.</em>
        </h1>
        <p className="text-stone-600 mb-10 text-lg">
          Log destinations, upload photos, and let AI craft a narrative summary of how the trip felt.
        </p>
        <SignInButton />
      </div>
    </main>
  )
}