"use client"

import React from "react"
import { useGameStore } from "@/lib/game-store"
import { GameHeader } from "@/components/game-header"
import { Navigation } from "@/components/navigation"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { Dashboard } from "@/components/dashboard"
import { CharacterShop } from "@/components/character-shop"
import { GameSettings } from "@/components/game-settings"
import { EmojiBlastGame } from "@/components/emoji-blast-game"
// other games removed — only Emoji Blast remains
import { StatisticsPage } from "@/components/statistics-page"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { AchievementToast } from "@/components/achievement-toast"

export default function HomePage() {
  const currentScreen = useGameStore((state) => state.currentScreen)

  const isGameplay = currentScreen === "game"

  // When gameplay is active, lock body scrolling to give a true fullscreen experience
  // and avoid background gutters or accidental scroll on mobile.
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    const prev = document.body.style.overflow
    if (isGameplay) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = prev || ''
    }

    return () => { document.body.style.overflow = prev || '' }
  }, [isGameplay])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Desktop Sidebar (hide during gameplay) */}
      {!isGameplay && <SidebarNavigation />}

      {/* Main Content */}
      <div className={isGameplay ? "flex-1 flex flex-col w-full h-screen" : "flex-1 flex flex-col"}>
        {/* Mobile Header (hide during gameplay) */}
        {!isGameplay && (
          <div className="md:hidden">
            <GameHeader />
          </div>
        )}

        {/* Main: when gameplay is active we remove container padding and make it fullscreen */}
        <main
          className={isGameplay
            ? "flex-1 w-full h-full p-0 m-0 relative"
            : "flex-1 container mx-auto px-4 py-6 md:px-6 md:py-8 transition-all duration-300 backdrop-blur-sm"
          }
        >
          {currentScreen === "dashboard" && <Dashboard />}
          {currentScreen === "game" && <EmojiBlastGame />}
          {currentScreen === "shop" && <CharacterShop />}
          {currentScreen === "settings" && <GameSettings />}
          {currentScreen === "leaderboard" && <StatisticsPage />}
          {currentScreen === "achievements" && <StatisticsPage />}
        </main>
      </div>

      {/* Mobile Bottom Navigation (hide during gameplay) */}
      {!isGameplay && <Navigation />}

      {/* PWA Install Prompt (hide during gameplay to avoid distractions) */}
      {!isGameplay && <PWAInstallPrompt />}

      {/* Achievement Toast (keep hidden during gameplay to avoid overlays) */}
      {!isGameplay && <AchievementToast />}
    </div>
  )
}
