"use client"

import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Home, Gamepad2, ShoppingBag, Settings } from "lucide-react"

export function Navigation() {
  const { currentScreen, setCurrentScreen } = useGameStore()

  const navItems = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "game", label: "Play", icon: Gamepad2 },
    { id: "shop", label: "Shop", icon: ShoppingBag },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border md:hidden z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentScreen === item.id

          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => setCurrentScreen(item.id as any)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3 transition-all duration-300 hover:scale-110",
                isActive && "text-primary bg-primary/10 scale-110",
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform", isActive && "animate-pulse")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
