import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display' })
const inter = Inter({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Trip Journal',
  description: 'A place to remember where you went and how it felt.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="bg-stone-50 text-stone-900 font-body min-h-screen">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}