"use client"

import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import dynamic from 'next/dynamic'

const AdCTA = dynamic(() => import('@/components/ad-cta'), { ssr: false });

export function GameHeader() {
  const { user, setCurrentScreen } = useGameStore()
  const selectedCharacter = useGameStore((state) => state.characters.find((c) => c.id === state.user.selectedCharacter))

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{selectedCharacter?.emoji || "🧍‍♂️"}</div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Emoji Games</h1>
          <p className="text-sm text-muted-foreground">Welcome back!</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
          <span className="text-lg">🪙</span>
          <span className="font-bold text-primary">{user.coins.toLocaleString()}</span>
        </div>
  {/* Ad CTA placeholder (will show when client-side) */}
  <AdCTA />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentScreen("settings")}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
