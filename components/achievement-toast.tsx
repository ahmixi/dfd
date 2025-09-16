"use client"

import { useState, useEffect, useRef } from "react"
import { useGameStore } from "@/lib/game-store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, X } from "lucide-react"

export function AchievementToast() {
  const [recentAchievement, setRecentAchievement] = useState<any>(null)
  const [showToast, setShowToast] = useState(false)
  const achievements = useGameStore((state) => state.achievements)
  // Capture the time the component mounted. We only want to show toasts for achievements
  // that were unlocked after this time (i.e., newly unlocked during this session).
  const mountTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    // Only consider achievements that have a dateUnlocked and were unlocked after
    // the component mounted. This prevents showing toasts for previously unlocked
    // achievements that were persisted to state.
    const unlockedAchievements = achievements
      .filter((a) => a.unlocked && a.dateUnlocked)
      .filter((a) => new Date(a.dateUnlocked!).getTime() >= mountTimeRef.current)

    const mostRecent = unlockedAchievements.sort(
      (a, b) => new Date(b.dateUnlocked!).getTime() - new Date(a.dateUnlocked!).getTime(),
    )[0]

    if (mostRecent && mostRecent !== recentAchievement) {
      setRecentAchievement(mostRecent)
      setShowToast(true)

      const timer = setTimeout(() => {
        setShowToast(false)
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [achievements, recentAchievement])

  if (!showToast || !recentAchievement) return null

  return (
    <div className="fixed top-20 md:top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-top-4">
      <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-yellow-500/20 rounded-full">
              <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm text-yellow-400">Achievement Unlocked!</span>
                <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-200">
                  +{recentAchievement.reward.coins}
                </Badge>
              </div>
              <div className="text-xs text-yellow-200">{recentAchievement.title}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl">{recentAchievement.icon}</div>
              <button
                onClick={() => setShowToast(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4 text-yellow-300" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
