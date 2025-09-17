"use client"

import { useState } from 'react'
import { useLocalStorage } from './use-local-storage'

export interface GameSettings {
  sound: boolean
  haptic: boolean
  accessibility: {
    enabled: boolean
    colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
    highContrast: boolean
    screenReader: boolean
  }
  controls: {
    moveUp: string
    moveDown: string
    moveLeft: string
    moveRight: string
    shoot: string
    pause: string
  }
  performance: {
    batteryOptimized: boolean
    reducedMotion: boolean
    lowGraphics: boolean
  }
}

const defaultSettings: GameSettings = {
  sound: true,
  haptic: true,
  accessibility: {
    enabled: false,
    colorblindMode: 'none',
    highContrast: false,
    screenReader: false
  },
  controls: {
    moveUp: 'KeyW',
    moveDown: 'KeyS',
    moveLeft: 'KeyA',
    moveRight: 'KeyD',
    shoot: 'Space',
    pause: 'Escape'
  },
  performance: {
    batteryOptimized: false,
    reducedMotion: false,
    lowGraphics: false
  }
}

export function useGameSettings() {
  const [settings, setSettings] = useLocalStorage<GameSettings>('game-settings', defaultSettings)

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev: GameSettings) => ({
      ...prev,
      ...newSettings
    }))
  }

  const updateAccessibility = (newAccessibility: Partial<GameSettings['accessibility']>) => {
    setSettings((prev: GameSettings) => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        ...newAccessibility
      }
    }))
  }

  const updateControls = (newControls: Partial<GameSettings['controls']>) => {
    setSettings((prev: GameSettings) => ({
      ...prev,
      controls: {
        ...prev.controls,
        ...newControls
      }
    }))
  }

  const updatePerformance = (newPerformance: Partial<GameSettings['performance']>) => {
    setSettings((prev: GameSettings) => ({
      ...prev,
      performance: {
        ...prev.performance,
        ...newPerformance
      }
    }))
  }

  return {
    settings,
    updateSettings,
    updateAccessibility,
    updateControls,
    updatePerformance
  }
}