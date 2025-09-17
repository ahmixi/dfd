"use client"

import * as React from "react"

export type Screen = 
  | "dashboard"
  | "game"
  | "shop"
  | "leaderboard"
  | "achievements"
  | "settings"

interface NavigationContextType {
  currentScreen: Screen
  history: Screen[]
  navigate: (screen: Screen) => void
  goBack: () => void
  canGoBack: boolean
}

const NavigationContext = React.createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = React.useState<Screen>("dashboard")
  const [history, setHistory] = React.useState<Screen[]>([])

  const navigate = React.useCallback((screen: Screen) => {
    setHistory(prev => [...prev, currentScreen])
    setCurrentScreen(screen)
  }, [currentScreen])

  const goBack = React.useCallback(() => {
    const previousScreen = history[history.length - 1]
    if (previousScreen) {
      setCurrentScreen(previousScreen)
      setHistory(prev => prev.slice(0, -1))
    }
  }, [history])

  const value = React.useMemo(() => ({
    currentScreen,
    history,
    navigate,
    goBack,
    canGoBack: history.length > 0
  }), [currentScreen, history, navigate, goBack])

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = React.useContext(NavigationContext)
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider")
  }
  return context
}