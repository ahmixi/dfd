"use client"

import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Home, Gamepad2, ShoppingBag, Settings, Trophy, Star } from "lucide-react"

export function SidebarNavigation() {
  const { currentScreen, setCurrentScreen, user } = useGameStore()

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, description: "Main hub" },
    { id: "game", label: "Play Games", icon: Gamepad2, description: "Start playing" },
    { id: "shop", label: "Character Shop", icon: ShoppingBag, description: "Buy characters" },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy, description: "Top players" },
    { id: "achievements", label: "Achievements", icon: Star, description: "Your progress" },
    { id: "settings", label: "Settings", icon: Settings, description: "Preferences" },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border h-screen sticky top-0 animate-in slide-in-from-left-4">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="text-3xl animate-bounce">🎮</div>
          <div>
            <h2 className="font-bold text-sidebar-foreground">Emoji Games</h2>
            <p className="text-sm text-sidebar-foreground/70">Gaming Platform</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-2">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = currentScreen === item.id

          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              onClick={() => setCurrentScreen(item.id as any)}
              className={cn(
                "w-full justify-start gap-3 h-auto py-3 px-4 transition-all duration-300 hover:scale-105 animate-in fade-in-0 slide-in-from-left-4",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg scale-105"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Icon className={cn("h-5 w-5 transition-transform", isActive && "animate-pulse")} />
              <div className="flex flex-col items-start">
                <span className="font-medium">{item.label}</span>
                <span className="text-xs opacity-70">{item.description}</span>
              </div>
            </Button>
          )
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-3 bg-sidebar-accent rounded-lg hover:bg-sidebar-accent/80 transition-all duration-300 hover:scale-105 cursor-pointer">
          <div className="text-2xl animate-spin" style={{ animationDuration: "3s" }}>
            🪙
          </div>
          <div>
            <div className="font-bold text-sidebar-accent-foreground">{user.coins.toLocaleString()}</div>
            <div className="text-xs text-sidebar-accent-foreground/70">Total Coins</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
