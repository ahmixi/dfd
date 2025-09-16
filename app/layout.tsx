import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense, useEffect } from "react"
import "./globals.css"
import dynamic from 'next/dynamic'
// Register ad placements on client to avoid server-side ad code running in Node.
const isClient = typeof window !== 'undefined';
if (isClient) {
  // dynamic import the adService so it runs only on client side
  import('../lib/ad-service').then(({ adService }) => {
    adService.registerPlacement({ id: 'reward_shield', type: 'rewarded', cooldownSec: 180, sessionLimit: 3 });
    adService.registerPlacement({ id: 'interstitial_mid', type: 'interstitial', cooldownSec: 60, sessionLimit: 2 });
  }).catch(() => {});
}

export const metadata: Metadata = {
  title: "Emoji Blast Games - Play Fun Emoji Games!",
  description:
    "Play exciting emoji-based games, collect characters, and compete for high scores in this amazing gaming platform!",
  generator: "v0.app",
  // viewport and themeColor moved to their dedicated exports below to match
  // Next.js app router metadata guidance (avoid unsupported entries here).
  manifest: "/manifest.json",
}

// Export viewport separately so Next can handle it correctly (see Next 14+)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  // use boolean camelCase here for userScalable per recommended export shape
  userScalable: false,
}

// Export themeColor as its own export to avoid placing it inside metadata.
export const themeColor = '#d97706'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  )
}
