import type { Metadata } from 'next'
import './globals.css'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: 'OpenClaw AI — Enterprise Hub',
  description: 'AI Agent Management & WhatsApp Bridge',
}

// Only loaded in development — tree-shaken out in production builds
const InspectorToggle = process.env.NODE_ENV === 'development'
  ? dynamic(() => import('@/components/devtools/InspectorToggle'), { ssr: false })
  : () => null

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <InspectorToggle />
      </body>
    </html>
  )
}
