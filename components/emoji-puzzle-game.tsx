"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGameStore } from "@/lib/game-store"

export function EmojiPuzzleGame() {
  const { setCurrentScreen } = useGameStore()

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-lg w-full text-center">
        <CardContent className="space-y-4">
          <div className="text-6xl">🧩</div>
          <h2 className="text-2xl font-bold">Emoji Puzzle</h2>
          <p className="text-sm text-muted-foreground">This game has been removed. Coming Soon.</p>
          <div className="flex justify-center gap-2 mt-4">
            <Button onClick={() => setCurrentScreen("dashboard")}>Back to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
