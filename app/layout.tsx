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
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#d97706",
  manifest: "/manifest.json",
}

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
