"use client"

import { useState, useCallback } from 'react'
import { GameStats } from '@/types/game'

export type GameState = "menu" | "playing" | "paused" | "gameOver" | "settings"

const initialGameStats: GameStats = {
  score: 0,
  level: 1,
  health: 100,
  maxHealth: 100,
  shield: 0,
  maxShield: 50,
  shieldRings: [
    { radius: 60, rotation: 0, speed: 0.02, opacity: 0, segments: 12, active: false },
    { radius: 85, rotation: 0.5, speed: 0.03, opacity: 0, segments: 16, active: false },
    { radius: 110, rotation: 1, speed: 0.04, opacity: 0, segments: 20, active: false }
  ],
  shieldActivationCost: 50,
  shieldDuration: 8000,
  shieldActivationTime: 0,
  energy: 100,
  maxEnergy: 100,
  enemies: 0,
  combo: 0,
  comboMultiplier: 1,
  wave: 1,
  enemiesKilled: 0,
  enemiesTotal: 10,
  fps: 60,
  timeLeft: 60,
  cameraShake: 0,
  particles: []
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>("menu")
  const [gameStats, setGameStats] = useState<GameStats>(initialGameStats)
  const [floatingHits, setFloatingHits] = useState<Array<{id: string; x: number; y: number; text: string}>>([])
  const [flash, setFlash] = useState<{alpha: number; id?: string} | null>(null)

  const resetGame = useCallback(() => {
    setGameStats(initialGameStats)
    setGameState("menu")
    setFloatingHits([])
    setFlash(null)
  }, [])

  const updateGameStats = useCallback((newStats: Partial<GameStats>) => {
    setGameStats(prev => ({
      ...prev,
      ...newStats
    }))
  }, [])

  const addFloatingHit = useCallback((hit: { x: number; y: number; text: string }) => {
    const id = Math.random().toString(36).substring(7)
    setFloatingHits(prev => [...prev, { ...hit, id }])
    setTimeout(() => {
      setFloatingHits(prev => prev.filter(h => h.id !== id))
    }, 1000)
  }, [])

  const triggerFlash = useCallback((alpha: number = 0.3) => {
    const id = Math.random().toString(36).substring(7)
    setFlash({ alpha, id })
    setTimeout(() => {
      setFlash(prev => prev?.id === id ? null : prev)
    }, 120)
  }, [])

  return {
    gameState,
    setGameState,
    gameStats,
    updateGameStats,
    floatingHits,
    addFloatingHit,
    flash,
    triggerFlash,
    resetGame
  }
}