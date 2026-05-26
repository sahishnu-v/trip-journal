import Link from 'next/link'

export default function AuthError() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="font-display text-3xl mb-2">Sign-in didn&apos;t work</h1>
        <p className="text-stone-600 mb-6">Something went wrong with Google authentication.</p>
        <Link href="/" className="text-teal-800 underline">← Try again</Link>
      </div>
    </main>
  )
}