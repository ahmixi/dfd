"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  Play, 
  Heart, 
  Zap, 
  Shield, 
  Target, 
  Settings, 
  Trophy,
  Star,
  Sparkles,
  Gamepad2,
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
  Home,
  Battery,
  X,
  Move,
  Bomb,
  Wand2,
  Bot,
  Hand
} from "lucide-react"
import { GameEngine } from "@/lib/game-engine"
import type { Character } from "@/lib/game-store"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import SpeechBubble from "@/components/speech-bubble"
import { useSpeech } from "@/hooks/use-speech"

export function EmojiBlastGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameEngineRef = useRef<GameEngine | null>(null)
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameOver" | "settings">("menu")
  interface GameStats {
    score: number
    level: number
    health: number
    maxHealth: number
    shield: number
    maxShield: number
    shieldRings: Array<{
      radius: number
      rotation: number
      speed: number
      opacity: number
      segments: number
      active: boolean
    }>
    shieldActivationCost: number
    shieldDuration: number
    shieldActivationTime: number
    energy: number
    maxEnergy: number
    enemies: number
    combo: number
    comboMultiplier: number
    wave: number
    enemiesKilled: number
    enemiesTotal: number
    fps: number
    timeLeft: number
    cameraShake: number
    particles: Array<{
      x: number
      y: number
      width: number
      height: number
      vx: number
      vy: number
      active: boolean
      rotation: number
      scale: number
      alpha: number
      zIndex: number
      id: string
      createdAt: number
      color: string
      size: number
      life: number
      maxLife: number
      drag: number
      type: 'circle' | 'spark' | 'trail' | 'explosion'
      gradient?: string[]
      emoji: string
      rotationSpeed: number
    }>
  }

  const [gameStats, setGameStats] = useState<GameStats>({
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
  })
  const [showSettings, setShowSettings] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [hapticEnabled, setHapticEnabled] = useState(true)
  const [achievements, setAchievements] = useState<string[]>([])
  const [achievementNotifications, setAchievementNotifications] = useState<Array<{id: string, text: string, timestamp: number}>>([])
  // Floating hit texts and transient screen flash for visual feedback
  const [floatingHits, setFloatingHits] = useState<Array<{id: string; x: number; y: number; text: string}>>([])
  const [flash, setFlash] = useState<{alpha: number; id?: string} | null>(null)
  const [accessibilityMode, setAccessibilityMode] = useState(false)
  const [colorblindMode, setColorblindMode] = useState<'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('none')
  const [highContrast, setHighContrast] = useState(false)
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false)
  const [customControls, setCustomControls] = useState({
    moveUp: 'KeyW',
    moveDown: 'KeyS',
    moveLeft: 'KeyA',
    moveRight: 'KeyD',
    shoot: 'Space',
    pause: 'Escape'
  })

  const { setCurrentScreen, user, updateGameStats, updateCoins, updatePlayerStats } = useGameStore()
  // Small meme-like speech system for the character
  const { current: speechCurrent, show: showSpeech } = useSpeech()
  const [bubblePos, setBubblePos] = useState<{ left: number; top: number }>({ left: 48, top: 48 })
  const prevGameStats = useRef<typeof gameStats | null>(null)
  // Only use selected character if unlocked, otherwise fallback to default
  const selected = useGameStore((state) => {
    // Always use only unlocked characters
    const unlockedSet = new Set(state.user.unlockedCharacters);
    const sel = state.characters.find((c) => c.id === state.user.selectedCharacter && unlockedSet.has(c.id));
    if (sel && sel.unlocked) return sel;
    // Fallback to first unlocked character, or default
    const fallback = state.characters.find((c) => unlockedSet.has(c.id) && c.unlocked);
    return fallback || state.characters.find((c) => c.id === "default");
  });
  // Helper to get character sprite (image or emoji)
  const getCharacterSprite = (character: Character | undefined) => {
    if (!character) return "";
    return character.image ? character.image : (character.emoji || "🧍‍♂️");
  }

  // Haptic feedback function
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticEnabled || !navigator.vibrate) return
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50, 10, 50]
    }
    
    navigator.vibrate(patterns[type])
  }, [hapticEnabled])

  // Mobile gesture detection and controls
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [touchHistory, setTouchHistory] = useState<Array<{ x: number; y: number; time: number }>>([])
  const [gestureMode, setGestureMode] = useState<'move' | 'shoot' | 'special'>('move')
  const [autoShoot, setAutoShoot] = useState(false)
  const [mobileSensitivity, setMobileSensitivity] = useState(1.0)
  const [thumbZone, setThumbZone] = useState<{ x: number; y: number; radius: number } | null>(null)
  const [batteryOptimized, setBatteryOptimized] = useState(false)
  const [performanceMode, setPerformanceMode] = useState<'high' | 'balanced' | 'battery'>('balanced')

  useEffect(() => {
    // Detect mobile device and battery optimization
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768
      setIsMobile(mobile)
      
      // Enable battery optimization on mobile
      if (mobile) {
        setBatteryOptimized(true)
        setPerformanceMode('battery')
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Battery API monitoring
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryStatus = () => {
          if (battery.level < 0.2) {
            setPerformanceMode('battery')
            setBatteryOptimized(true)
          } else if (battery.level < 0.5) {
            setPerformanceMode('balanced')
          } else {
            setPerformanceMode('high')
          }
        }
        
        updateBatteryStatus()
        battery.addEventListener('levelchange', updateBatteryStatus)
        battery.addEventListener('chargingchange', updateBatteryStatus)
      })
    }
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Show quick quips based on gameplay deltas (score, health, enemies)
  useEffect(() => {
    // Only show speech during active gameplay
    if (gameState !== 'playing') {
      prevGameStats.current = gameStats
      return
    }

    if (!prevGameStats.current) {
      prevGameStats.current = gameStats
      return
    }

    const prev = prevGameStats.current

    // helper to pick evolved/meme messages
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

    // Score increased -> celebratory quip (more meme-like evolving messages)
    if (gameStats.score > prev.score) {
      const cheers = [
        "Poggers! 🤌",
        "Yeeted! 💥",
        "That’s a W ✅",
        "Ratio'd 'em, EZ 😎",
        "GG EZ 😂",
        "Big brain play! 🧠",
        "SIMP for that combo 😎",
      ]
      showSpeech(pick(cheers), 2000)
    }

    // Health decreased -> ouch/warning
    if (gameStats.health < prev.health) {
      const ouches = [
        "Oof! That stung 😵",
        "Bruh… not today.",
        "Yikes. My vibes!",
        "Ow! That was sus 🫠",
        "That hurt ngl 🤕",
        "Low HP — panic mode! 🔥",
      ]
      showSpeech(pick(ouches), 1800)
    }

    // Large number of enemies remaining -> panic quip
    const prevRemaining = prev.enemiesTotal - prev.enemiesKilled
    const remaining = gameStats.enemiesTotal - gameStats.enemiesKilled
    if (remaining >= 12 && remaining > prevRemaining) {
      const panics = [
        "Send help — emoji spam! 😱",
        "Bro it's raining emojis 🌧️",
        "This is chaos, clip it! 🎬",
        "Massive sus incoming… �",
        "Not the horde again... 🚨",
        "I'm outta here (jk) 😂",
      ]
      showSpeech(pick(panics), 2600)
    }

    // Combo milestones
    if (gameStats.combo > prev.combo && gameStats.combo > 1) {
      const combos = [
        "Combo sauce! 🔥 x{combo}",
        "Unfair advantage — me? yes. Pog. 🏆",
        "We goin' viral �",
        "No chill, absolute chef 🧑‍🍳",
        "Combo of the century 🤯",
        "CHAOS MODE 😈",
        "SEND HELP — jk 😏",
      ]
      showSpeech(pick(combos), 2000)
    }

    prevGameStats.current = gameStats
  }, [gameStats, showSpeech, gameState])

  // Shield is now managed by GameEngine.activateShield() and GameEngine.updateShieldRings()

  

  useEffect(() => {
  if (!canvasRef.current) return

  const canvas = canvasRef.current
  const rect = canvas.parentElement?.getBoundingClientRect()

  // Set canvas size with high DPI support and expand to parent/viewport
  // Remove hard caps to allow true fullscreen gameplay and avoid unused gutters
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const parentWidth = rect?.width ?? window.innerWidth
  const parentHeight = rect?.height ?? window.innerHeight

  // For mobile, keep some reasonable padding if parent is very small, otherwise fill parent
  const displayWidth = isMobile ? Math.max(Math.min(parentWidth, window.innerWidth), 320) : parentWidth
  const displayHeight = isMobile ? Math.max(Math.min(parentHeight, window.innerHeight), 320) : parentHeight
    
    canvas.width = displayWidth * dpr
    canvas.height = displayHeight * dpr
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }

    // Initialize game engine
  // Pass the selected character image path if available, otherwise pass emoji
  const playerSprite = getCharacterSprite(selected)
  gameEngineRef.current = new GameEngine(canvas, playerSprite)
    // Apply selected character stats to the engine's player (if available)
    if (gameEngineRef.current && selected) {
      const p = gameEngineRef.current.player as any
      if (selected.stats.speed) p.speed = selected.stats.speed * 25 // map to engine units
      if (selected.stats.health) {
        p.maxHealth = selected.stats.health * 12
        p.health = Math.min(p.health, p.maxHealth)
      }
      if (selected.stats.bombPower) p.bombPower = selected.stats.bombPower
      if ((selected.stats as any).energy) {
        p.maxEnergy = (selected.stats as any).energy
        p.energy = Math.min(p.energy, p.maxEnergy)
      }
  // If image path present, we could add a public setter on GameEngine to reload sprites.
  // For now the engine loads the sprite during construction; to switch sprites at runtime
  // we would call a public method (not implemented). This is intentionally left out to
  // avoid touching GameEngine private fields from the component.
    }

    // Advanced mobile touch events with gesture recognition
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      const rect = canvas.getBoundingClientRect()
      const touchX = touch.clientX - rect.left
      const touchY = touch.clientY - rect.top
      
      setTouchStart({
        x: touchX,
        y: touchY,
        time: Date.now()
      })
      
      // Initialize thumb zone for comfortable mobile play
      if (!thumbZone) {
        setThumbZone({
          x: touchX,
          y: touchY,
          radius: 60
        })
      }
      
      // Determine gesture mode based on touch position
      const canvasWidth = canvas.width / (window.devicePixelRatio || 1)
      const canvasHeight = canvas.height / (window.devicePixelRatio || 1)
      
      if (touchX < canvasWidth * 0.3) {
        setGestureMode('move')
      } else if (touchX > canvasWidth * 0.7) {
        setGestureMode('shoot')
      } else {
        setGestureMode('special')
      }
      
      triggerHaptic('light')
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (touchStart && gameEngineRef.current) {
        const touch = e.touches[0]
        const rect = canvas.getBoundingClientRect()
        const touchX = touch.clientX - rect.left
        const touchY = touch.clientY - rect.top
        
        // Update touch history for gesture recognition
        setTouchHistory(prev => {
          const newHistory = [...prev, { x: touchX, y: touchY, time: Date.now() }]
          return newHistory.slice(-10) // Keep last 10 touch points
        })
        
        if (gestureMode === 'move') {
          const deltaX = (touchX - touchStart.x) * mobileSensitivity
          const deltaY = (touchY - touchStart.y) * mobileSensitivity
          
          // Smooth player movement with momentum
          const player = gameEngineRef.current.player
          const maxSpeed = 300
          const acceleration = 0.3
          
          player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx + deltaX * acceleration))
          player.vy = Math.max(-maxSpeed, Math.min(maxSpeed, player.vy + deltaY * acceleration))
          
          // Update thumb zone position
          setThumbZone(prev => prev ? {
            ...prev,
            x: touchX,
            y: touchY
          } : null)
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      if (touchStart) {
        const touch = e.changedTouches[0]
        const rect = canvas.getBoundingClientRect()
        const touchX = touch.clientX - rect.left
        const touchY = touch.clientY - rect.top
        
        const deltaTime = Date.now() - touchStart.time
        const deltaX = touchX - touchStart.x
        const deltaY = touchY - touchStart.y
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        
        // Gesture recognition
        if (gestureMode === 'shoot' || (deltaTime < 200 && distance < 50)) {
          // Quick tap = shoot
          if (gameEngineRef.current) {
            gameEngineRef.current.throwBomb()
            triggerHaptic('medium')
          }
        } else if (gestureMode === 'special' && distance > 100) {
          // Swipe gesture = special ability
          if (gameEngineRef.current) {
            // Determine swipe direction for different abilities
            const angle = Math.atan2(deltaY, deltaX)
            const degrees = (angle * 180 / Math.PI + 360) % 360
            
            if (degrees < 45 || degrees > 315) {
              // Right swipe - dash
              gameEngineRef.current.player.vx = 400
              triggerHaptic('heavy')
            } else if (degrees > 135 && degrees < 225) {
              // Left swipe - shield
              try {
                const p = gameEngineRef.current?.player
                if (p) {
                  p.shield = Math.min(p.maxShield || 0, (p.shield || 0) + 20)
                  triggerHaptic('medium')

                  // Auto-activate when fully charged
                  if ((p.shield || 0) >= (p.maxShield || 0)) {
                    setTimeout(() => { try { activateShield() } catch (e) {} }, 80)
                    p.shield = 0
                  }
                }
              } catch (e) {
                // ignore if engine/player not available
              }
            } else if (degrees > 45 && degrees < 135) {
              // Down swipe - special bomb
              if (gameEngineRef.current.player.energy >= 50) {
                gameEngineRef.current.player.energy -= 50
                // Create special bomb with larger explosion
                const bomb = {
                  x: gameEngineRef.current.player.x,
                  y: gameEngineRef.current.player.y,
                  vx: 0,
                  vy: 0,
                  width: 20,
                  height: 20,
                  active: true,
                  rotation: 0,
                  scale: 1.5,
                  alpha: 1,
                  zIndex: 5,
                  id: `bomb_${Date.now()}`,
                  createdAt: Date.now(),
                  lifetime: 2000,
                  emoji: '',
                  timer: 2000,
                  maxTimer: 2000,
                  explosionRadius: 120,
                  damage: 50,
                  bombType: 'normal' as const,
                  clusterCount: 0,
                  freezeDuration: 0,
                  poisonDamage: 0,
                  poisonDuration: 0,
                  trail: [],
                  glowIntensity: 1.0
                }
                gameEngineRef.current.bombs.push(bomb)
                triggerHaptic('heavy')
              }
            }
          }
        }
        
        setTouchStart(null)
        setTouchHistory([])
      }
    }

    // Add mobile touch events
    if (isMobile) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
    }

    // Handle window resize with mobile optimization
    const handleResize = () => {
      const newRect = canvas.parentElement?.getBoundingClientRect()
      const newParentWidth = newRect?.width ?? window.innerWidth
      const newParentHeight = newRect?.height ?? window.innerHeight

      const newDisplayWidth = isMobile ? Math.max(Math.min(newParentWidth, window.innerWidth), 320) : newParentWidth
      const newDisplayHeight = isMobile ? Math.max(Math.min(newParentHeight, window.innerHeight), 320) : newParentHeight

      canvas.width = Math.round(newDisplayWidth * dpr)
      canvas.height = Math.round(newDisplayHeight * dpr)
      canvas.style.width = `${newDisplayWidth}px`
      canvas.style.height = `${newDisplayHeight}px`

      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop()
      }
      window.removeEventListener('resize', handleResize)
      
      if (isMobile) {
        canvas.removeEventListener('touchstart', handleTouchStart)
        canvas.removeEventListener('touchmove', handleTouchMove)
        canvas.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [selected, isMobile, triggerHaptic])

  

  // Auto-shoot functionality for mobile
  useEffect(() => {
  if (!autoShoot || !gameEngineRef.current || gameState !== 'playing') return

    const autoShootInterval = setInterval(() => {
      if (gameEngineRef.current && gameEngineRef.current.player.energy > 10) {
        gameEngineRef.current.throwBomb()
        gameEngineRef.current.player.energy -= 5 // Energy cost for auto-shoot
      }
    }, 300) // Auto-shoot every 300ms

    return () => clearInterval(autoShootInterval)
  }, [autoShoot, gameState])


  useEffect(() => {
    if (!gameEngineRef.current) return

    const updateStats = () => {
      if (gameEngineRef.current) {
        const engine = gameEngineRef.current
        setGameStats(prevStats => ({
          ...prevStats,
          score: engine.score,
          level: engine.level,
          health: engine.player.health,
          maxHealth: engine.player.maxHealth,
          shield: engine.player.shield,
          maxShield: engine.player.maxShield,
          shieldRings: engine.player.shieldRings,
          shieldActivationCost: engine.player.shieldActivationCost,
          shieldDuration: engine.player.shieldDuration,
          shieldActivationTime: engine.player.shieldActivationTime,
          energy: engine.player.energy,
          maxEnergy: engine.player.maxEnergy,
          enemies: engine.enemies.length,
          combo: engine.combo,
          comboMultiplier: engine.comboMultiplier,
          wave: engine.waveNumber,
          enemiesKilled: engine.waveEnemiesKilled,
          enemiesTotal: engine.waveEnemiesTotal,
          fps: engine.currentFps,
          timeLeft: Math.max(0, 60 - Math.floor(engine.gameTime / 1000)),
          cameraShake: engine.player.cameraShake,
          particles: engine.particles
        }))

        // Check for achievements
        checkAchievements(engine)

        // Check game over
        if (engine.player.health <= 0 && gameState === "playing") {
          handleGameOver()
        }
      }
    }

    const interval = setInterval(updateStats, 16) // 60fps updates
    return () => clearInterval(interval)
  }, [gameState])

  const checkAchievements = useCallback((engine: GameEngine) => {
    const newAchievements: string[] = []
    
    if (engine.score >= 1000 && !achievements.includes('score_1000')) {
      newAchievements.push('score_1000')
    }
    if (engine.combo >= 10 && !achievements.includes('combo_10')) {
      newAchievements.push('combo_10')
    }
    if (engine.waveNumber >= 5 && !achievements.includes('wave_5')) {
      newAchievements.push('wave_5')
    }
    
    if (newAchievements.length > 0) {
      // Use functional update to ensure we compare against the latest achievements
      setAchievements(prev => {
        const uniqueNew = newAchievements.filter(a => !prev.includes(a))
        if (uniqueNew.length === 0) return prev

        // For each truly new achievement, create a single notification
        uniqueNew.forEach(achievement => {
          const achievementText = getAchievementText(achievement)
          const notification = {
            id: `${achievement}_${Date.now()}`,
            text: achievementText,
            timestamp: Date.now()
          }
          setAchievementNotifications(prevNotifs => {
            // Avoid adding duplicate notifications for same achievement id
            if (prevNotifs.some(n => n.text === notification.text && n.id.startsWith(achievement))) return prevNotifs
            return [...prevNotifs, notification]
          })

          // Auto-remove after 3 seconds
          setTimeout(() => {
            setAchievementNotifications(prevNotifs => prevNotifs.filter(n => n.id !== notification.id))
          }, 3000)
        })

        return [...prev, ...uniqueNew]
      })
    }
  }, [achievements])

  const getAchievementText = (achievement: string): string => {
    const texts: Record<string, string> = {
      'score_1000': 'First 1000 Points!',
      'combo_10': '10x Combo Master!',
      'wave_5': 'Wave 5 Champion!'
    }
    return texts[achievement] || 'Achievement Unlocked!'
  }

  const removeAchievementNotification = (id: string) => {
    setAchievementNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const startGame = () => {
    if (!gameEngineRef.current) return

    gameEngineRef.current.reset()
    gameEngineRef.current.start()
    setGameState("playing")
    triggerHaptic('medium')
  }

  const pauseGame = () => {
    if (!gameEngineRef.current) return

    gameEngineRef.current.pause()
    setGameState(gameEngineRef.current.isPaused ? "paused" : "playing")
    triggerHaptic('light')
  }

  const resetGame = () => {
    if (!gameEngineRef.current) return

    gameEngineRef.current.stop()
    gameEngineRef.current.reset()
    setGameState("menu")
  }

  const activateShield = useCallback(() => {
    if (!gameEngineRef.current) return
    try { gameEngineRef.current.activateShield() } catch (e) {}
  }, [])

  // Keyboard shortcut for shield (Q) - registered after activateShield to avoid TDZ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyQ') {
        activateShield()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [activateShield])

  // Debug overlay state (poll engine for shield status)
  const [debugShield, setDebugShield] = useState<{active: boolean; timeLeft: number; energy: number; rings: number}>({ active: false, timeLeft: 0, energy: 0, rings: 0 })
  useEffect(() => {
    const t = setInterval(() => {
      const engine = gameEngineRef.current
      if (!engine || !engine.player) return
      const active = engine.player.shieldRings?.some((r: any) => r.active) || false
      const timeLeft = active ? Math.max(0, (engine.player.shieldDuration || 0) - (Date.now() - (engine.player.shieldActivationTime || 0))) : 0
      setDebugShield({ active, timeLeft, energy: engine.player.energy || 0, rings: engine.player.shieldRings?.length || 0 })
    }, 250)
    return () => clearInterval(t)
  }, [])

  // Update overlay bubble position to follow player mouth when speech is active
  useEffect(() => {
    let raf = 0
    const update = () => {
      const engine = gameEngineRef.current as any
      const canvas = canvasRef.current
      if (engine && canvas && speechCurrent) {
        const rect = canvas.getBoundingClientRect()
        // engine.player.x/y are in CSS pixels because ctx was scaled using dpr
        const px = rect.left + (engine.player?.x ?? 0)
        const py = rect.top + (engine.player?.y ?? 0)
        // offset upwards to appear near the mouth
        const mouthOffset = Math.max(32, (engine.player?.height ?? 48) / 2)
        setBubblePos({ left: px, top: py - mouthOffset })
      }
      raf = requestAnimationFrame(update)
    }

    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [speechCurrent])

  const handleGameOver = () => {
    if (!gameEngineRef.current) return

    const engine = gameEngineRef.current
    const finalScore = engine.score
    const coinsEarned = Math.floor(finalScore / 10)

    // Decide win condition (simple, adjustable): reaching a milestone wave or high score
    const isWin = (engine.waveNumber >= 5) || (finalScore >= 1000)

    // Read current stored stats
    const store = useGameStore.getState()
    const prevGameStats = store.gameStats["emoji-blast"] || { highScore: 0, totalGames: 0, totalCoins: 0, currentStreak: 0, levelProgress: 1 }

    const newTotalGames = (prevGameStats.totalGames || 0) + 1
    const newCurrentStreak = isWin ? (prevGameStats.currentStreak || 0) + 1 : 0

    // Update game-specific stats (persisted)
    updateGameStats("emoji-blast", {
      highScore: Math.max(finalScore, prevGameStats.highScore || 0),
      totalGames: newTotalGames,
      totalCoins: (prevGameStats.totalCoins || 0) + coinsEarned,
      currentStreak: newCurrentStreak,
      levelProgress: Math.max(engine.level, prevGameStats.levelProgress || 1),
    })

    // Update aggregate player stats (wins/losses/winRate/longestStreak)
    const prevPlayer = store.playerStats || { gamesWon: 0, gamesLost: 0, longestStreak: 0 }
    const gamesWon = (prevPlayer.gamesWon || 0) + (isWin ? 1 : 0)
    const gamesLost = (prevPlayer.gamesLost || 0) + (isWin ? 0 : 1)
    const longestStreak = Math.max(prevPlayer.longestStreak || 0, newCurrentStreak)
    const winRate = gamesWon + gamesLost > 0 ? Math.round((gamesWon / (gamesWon + gamesLost)) * 100) : 0

    updatePlayerStats({
      gamesWon,
      gamesLost,
      winRate,
      longestStreak,
    })

    // Award coins
    updateCoins(coinsEarned)

    // --- Daily challenge progress updates ---
    try {
      const now = Date.now()
      const completedIds: string[] = []

      const updatedChallenges = (store.dailyChallenges || []).map((ch) => {
        // skip already completed or expired
        const expiresAt = new Date(ch.expiresAt).getTime()
        if (ch.completed) return ch
        if (expiresAt <= now) return ch

        let progress = ch.progress || 0

        switch (ch.requirement.type) {
          case 'games_played':
            progress = progress + 1
            break
          case 'score':
            // single-game best progress
            progress = Math.max(progress, finalScore)
            break
          case 'streak':
            progress = Math.max(progress, newCurrentStreak)
            break
          case 'level_reached':
            progress = Math.max(progress, engine.level || 0)
            break
          case 'enemies_killed':
            // best-effort: add wave kill count
            progress = progress + (engine.waveEnemiesKilled || 0)
            break
          case 'survive_time':
            // engine.gameTime is in ms (if available)
            progress = progress + Math.floor((engine.gameTime || 0) / 1000)
            break
          case 'bombs_thrown':
            // engine may not expose this field on all engine builds; guard with any
            progress = progress + (((engine as any).totalBombsThrown as number) || 0)
            break
          case 'coins_earned':
            progress = progress + coinsEarned
            break
          default:
            break
        }

        const meets = progress >= ch.requirement.value
        if (meets && !ch.completed) completedIds.push(ch.id)

        return {
          ...ch,
          progress: Math.min(progress, ch.requirement.value),
          completed: meets || ch.completed,
        }
      })

      // Persist updated progress
      useGameStore.setState({ dailyChallenges: updatedChallenges })

      // Complete challenges (awards coins via store action)
      completedIds.forEach((id) => {
        try { useGameStore.getState().completeDailyChallenge(id) } catch (e) {}
      })
    } catch (e) {
      // don't block game over on store issues
      console.warn('Daily challenge update failed', e)
    }

    // --- Achievement triggers for streak milestones ---
    try {
      // unlock built-in 5-win streak achievement
      if (longestStreak >= 5 && (prevPlayer.longestStreak || 0) < 5) {
        useGameStore.getState().unlockAchievement('streak_5')
        const notif = { id: `ach_streak5_${Date.now()}`, text: `On Fire — 5 Win Streak!`, timestamp: Date.now() }
        setAchievementNotifications(prev => [...prev, notif])
        setTimeout(() => setAchievementNotifications(prev => prev.filter(n => n.id !== notif.id)), 3500)
      }

      // unlock new 10-win streak achievement and show notification
      if (longestStreak >= 10 && (prevPlayer.longestStreak || 0) < 10) {
        useGameStore.getState().unlockAchievement('streak_10')
        const notif = { id: `ach_streak10_${Date.now()}`, text: `Legendary — 10 Win Streak!`, timestamp: Date.now() }
        setAchievementNotifications(prev => [...prev, notif])
        setTimeout(() => setAchievementNotifications(prev => prev.filter(n => n.id !== notif.id)), 4000)
      }
    } catch (e) {
      console.warn('Streak achievement handling failed', e)
    }

    // Small reward + notification for streaks or wins
    if (isWin) {
      const notif = { id: `win_${Date.now()}`, text: `W! Streak: ${newCurrentStreak}`, timestamp: Date.now() }
      setAchievementNotifications(prev => [...prev, notif])
      setTimeout(() => setAchievementNotifications(prev => prev.filter(n => n.id !== notif.id)), 3000)
    }

    setGameState("gameOver")
  }


  const renderGameMenu = () => (
  <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
  className="w-full max-w-2xl mx-auto max-h-[calc(100vh-160px)] overflow-auto"
    >
      <Card className="bg-gradient-to-br from-slate-900/95 to-purple-900/95 border-purple-500/30 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center pb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6 flex items-center justify-center"
          >
            {selected?.image ? (
              <img
                src={selected.image}
                alt={selected.name}
                className="w-24 h-24 object-contain rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                style={{ background: 'white' }}
              />
            ) : (
              <span className="text-8xl">{selected?.emoji || "🧍‍♂️"}</span>
            )}
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <CardTitle className="text-4xl bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-bold mb-4">
          Emoji Blast
        </CardTitle>
            <p className="text-slate-300 text-lg">Experience the ultimate emoji battle with cutting-edge graphics and gameplay!</p>
          </motion.div>
      </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Character Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6 rounded-2xl border border-purple-500/30"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Character Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{selected?.stats.speed || 5}</div>
                <div className="text-sm text-slate-300">Speed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{selected?.stats.bombPower || 5}</div>
                <div className="text-sm text-slate-300">Power</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{selected?.stats.health || 5}</div>
                <div className="text-sm text-slate-300">Health</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{selected?.stats.luck || 5}</div>
                <div className="text-sm text-slate-300">Luck</div>
              </div>
            </div>
          </motion.div>

          {/* Game Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="grid grid-cols-3 gap-4"
          >
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 p-4 rounded-xl text-center border border-yellow-500/30">
              <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-400">
              {useGameStore.getState().gameStats["emoji-blast"].highScore}
            </div>
              <div className="text-sm text-yellow-200">High Score</div>
          </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 p-4 rounded-xl text-center border border-blue-500/30">
              <Gamepad2 className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-cyan-400">
              {useGameStore.getState().gameStats["emoji-blast"].totalGames}
            </div>
              <div className="text-sm text-cyan-200">Games Played</div>
          </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-4 rounded-xl text-center border border-purple-500/30">
              <Sparkles className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-400">
                {useGameStore.getState().user.coins}
        </div>
              <div className="text-sm text-purple-200">Coins</div>
        </div>
          </motion.div>

          {/* Daily Mission Card (retention) */}
          {useGameStore.getState().dailyChallenges[0] && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.95, duration: 0.5 }}
              className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600/20 to-cyan-600/10 border border-indigo-500/20"
            >
              {(() => {
                const mission = useGameStore.getState().dailyChallenges[0]
                const progress = Math.min(1, (mission.progress || 0) / mission.requirement.value)
                return (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold">Daily Mission</div>
                      <div className="text-sm text-muted-foreground">{mission.title} — {mission.description}</div>
                      <div className="w-full bg-black/10 rounded h-2 mt-2">
                        <div className="h-2 bg-indigo-500 rounded" style={{ width: `${progress * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-sm text-primary">+{mission.reward.coins} coins</div>
                      <Button className="mt-2" onClick={startGame}>Play</Button>
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="space-y-4"
          >
        <Button
          onClick={startGame}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 text-white shadow-2xl shadow-purple-500/25 h-14 text-lg font-semibold"
          size="lg"
        >
              <Play className="h-6 w-6 mr-3" />
              Start Epic Battle
        </Button>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                className="flex-1 border-purple-500/50 text-purple-200 hover:bg-purple-600/20 h-12"
              >
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Button>
              <Button
                onClick={() => setCurrentScreen("dashboard")}
                variant="outline"
                className="flex-1 border-slate-500/50 text-slate-200 hover:bg-slate-600/20 h-12"
              >
                <Home className="h-5 w-5 mr-2" />
                Home
              </Button>
        </div>
          </motion.div>

          {/* Controls Info */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50"
          >
            <p className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Controls
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-300">
              <p>🖱️ Desktop: WASD/Arrow keys + Mouse click</p>
              <p>📱 Mobile: Touch to move + Tap to shoot</p>
        </div>
          </motion.div>
      </CardContent>
    </Card>
    </motion.div>
  )

  const renderGameOver = () => (
  <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
  className="w-full max-w-2xl mx-auto max-h-[calc(100vh-160px)] overflow-auto"
    >
      <Card className="bg-gradient-to-br from-red-900/95 to-purple-900/95 border-red-500/30 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center pb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="text-8xl mb-6"
          >
            💀
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <CardTitle className="text-4xl bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent font-bold mb-4">
          Game Over!
        </CardTitle>
            <p className="text-slate-300 text-lg">Your epic battle has ended, but the legend continues!</p>
          </motion.div>
      </CardHeader>
        
        <CardContent className="p-0">
          <div className="flex flex-col max-h-[calc(100vh-160px)]">
            {/* Scrollable area with final stats */}
            <div className="overflow-auto p-8 space-y-6">
              {/* Final Stats */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 p-6 rounded-2xl text-center border border-yellow-500/30">
                  <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-yellow-400">{gameStats.score.toLocaleString()}</div>
                  <div className="text-sm text-yellow-200">Final Score</div>
                </div>
                <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 p-6 rounded-2xl text-center border border-green-500/30">
                  <Sparkles className="h-8 w-8 text-green-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-green-400">{Math.floor(gameStats.score / 10)}</div>
                  <div className="text-sm text-green-200">Coins Earned</div>
                </div>
              </motion.div>

              {/* Wave and Combo Stats */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 p-4 rounded-xl text-center border border-blue-500/30">
                  <Target className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-cyan-400">Wave {gameStats.wave}</div>
                  <div className="text-sm text-cyan-200">Reached</div>
                </div>
                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-4 rounded-xl text-center border border-purple-500/30">
                  <Zap className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-400">{gameStats.combo}x</div>
                  <div className="text-sm text-purple-200">Max Combo</div>
                </div>
              </motion.div>

              {/* Achievements */}
              {achievements.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.6 }}
                  className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 p-4 rounded-2xl border border-yellow-500/30"
                >
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    New Achievements!
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {achievements.map((achievement, index) => (
                      <Badge key={index} className="bg-yellow-500/20 text-yellow-200 border-yellow-400/50">
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sticky footer with action buttons - always visible on small screens */}
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-black/25 to-transparent backdrop-blur-md p-4">
              <div className="max-w-full mx-auto flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={startGame}
                  className="w-full sm:flex-1 bg-gradient-to-r from-green-600 via-emerald-600 to-cyan-600 hover:from-green-700 hover:via-emerald-700 hover:to-cyan-700 text-white shadow-2xl shadow-green-500/25 h-12 text-lg font-semibold"
                  size="lg"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Battle Again
                </Button>

                <Button
                  onClick={resetGame}
                  variant="outline"
                  className="w-full sm:flex-1 border-purple-500/50 text-purple-200 h-12"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Main Menu
                </Button>

                <Button
                  onClick={() => setCurrentScreen("dashboard")}
                  variant="outline"
                  className="w-full sm:flex-1 border-slate-500/50 text-slate-200 h-12"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Home
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
    </Card>
    </motion.div>
  )

  const renderModernGameUI = () => {
    const engine = gameEngineRef.current as any
    let playerScreen = { left: 0, top: 0 }
    let shieldActive = false
    let shieldPercent = 0
    try {
      const canvas = canvasRef.current
      if (engine && canvas && engine.player) {
        const rect = canvas.getBoundingClientRect()
        playerScreen.left = rect.left + (engine.player.x ?? 0)
        playerScreen.top = rect.top + (engine.player.y ?? 0)
        shieldActive = engine.player.shieldRings?.some((r: any) => r.active)
        const elapsed = Date.now() - (engine.player.shieldActivationTime || 0)
        shieldPercent = Math.max(0, Math.min(1, 1 - (elapsed / (engine.player.shieldDuration || 1))))
      }
    } catch (e) {}

    return (
      <>
      {/* Top HUD */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute top-0 left-0 right-0 z-20"
      >
        <div className="bg-gradient-to-b from-black/50 to-transparent backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            {/* Left side - Score and Stats */}
            <div className="flex items-center gap-6">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl px-4 py-2 border border-yellow-500/30">
                <div className="text-2xl font-bold text-yellow-400 drop-shadow-lg">
                  {gameStats.score.toLocaleString()}
            </div>
                <div className="text-xs text-yellow-200">SCORE</div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl px-4 py-2 border border-blue-500/30">
                <div className="text-xl font-bold text-cyan-400 drop-shadow-lg">
                  Wave {gameStats.wave}
                </div>
                <div className="text-xs text-cyan-200">ENEMIES {gameStats.enemiesKilled}/{gameStats.enemiesTotal}</div>
          </div>
        </div>

            {/* Right side - Controls */}
        <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={pauseGame}
                className="w-10 h-10 text-white hover:bg-white/20 rounded-full backdrop-blur-sm"
              >
                <Pause className="h-5 w-5" />
              </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentScreen("dashboard")}
                className="w-10 h-10 text-white hover:bg-white/20 rounded-full backdrop-blur-sm"
          >
                <Home className="h-5 w-5" />
          </Button>
        </div>
      </div>
        </div>
      </motion.div>

      {/* Health and Energy Bars */}
      <motion.div
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute top-20 left-4 z-20 space-y-3"
      >
        {/* Health Bar */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-3 border border-red-500/30 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-white">Health</span>
            <span className="text-xs text-red-200 ml-auto">{gameStats.health}/{gameStats.maxHealth}</span>
        </div>
          <Progress 
            value={(gameStats.health / gameStats.maxHealth) * 100} 
            className="h-2 bg-red-900/50"
          />
      </div>

        {/* Shield Bar */}
        {gameStats.shield > 0 && (
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-3 border border-blue-500/30 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Shield</span>
              <span className="text-xs text-blue-200 ml-auto">{gameStats.shield}/{gameStats.maxShield}</span>
      </div>
            <Progress 
              value={(gameStats.shield / gameStats.maxShield) * 100} 
              className="h-2 bg-blue-900/50"
            />
          </div>
        )}

        {/* Energy Bar */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-3 border border-purple-500/30 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Energy</span>
            <span className="text-xs text-purple-200 ml-auto">{gameStats.energy}/{gameStats.maxEnergy}</span>
          </div>
          <Progress 
            value={(gameStats.energy / gameStats.maxEnergy) * 100} 
            className="h-2 bg-purple-900/50"
          />
        </div>
      </motion.div>

      {/* Combo Display */}
      <AnimatePresence>
        {gameStats.combo > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, type: "spring" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl px-8 py-4 border border-yellow-500/50">
              <div className="text-4xl font-bold text-yellow-400 drop-shadow-lg text-center">
                {gameStats.combo}x COMBO!
              </div>
              <div className="text-sm text-yellow-200 text-center">x{gameStats.comboMultiplier} Multiplier</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Mobile Controls */}
      {isMobile && (
        <>
          {/* Thumb Zone Indicator */}
          {thumbZone && (
            <div
              className="absolute pointer-events-none z-15"
              style={{
                left: thumbZone.x - thumbZone.radius,
                top: thumbZone.y - thumbZone.radius,
                width: thumbZone.radius * 2,
                height: thumbZone.radius * 2,
                borderRadius: '50%',
                border: '2px dashed rgba(255, 255, 255, 0.3)',
                animation: 'pulse 2s infinite'
              }}
            />
          )}
          
          {/* Mobile Control Panel - Optimized */}
          <div className="absolute bottom-1 left-1 right-1 z-20">
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
              {/* Control Mode Indicator - Smaller */}
              <div className="flex justify-center mb-1">
                <div className="bg-white/5 rounded-full px-2 py-0.5">
                  <span className="text-white/70 text-xs font-medium">
                    {gestureMode === 'move' ? 'Move' : 
                     gestureMode === 'shoot' ? 'Shoot' : 'Special'}
                  </span>
                </div>
              </div>
              
              {/* Mobile Touch Areas - Optimized for gameplay */}
              <div className="flex justify-between items-center px-2">
                {/* Move Control */}
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className="w-10 h-10 bg-gradient-to-br from-blue-500/40 to-cyan-500/40 rounded-full flex items-center justify-center touch-manipulation active:scale-95 transition-all duration-150 shadow-md"
                    onClick={() => {
                      setGestureMode('move')
                      triggerHaptic('light')
                    }}
                    role="button"
                    aria-label="Move control"
                  >
                    <Move className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-white/50">Move</span>
                </div>
                
                {/* Shoot Control */}
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className="w-10 h-10 bg-gradient-to-br from-red-500/40 to-pink-500/40 rounded-full flex items-center justify-center touch-manipulation active:scale-95 transition-all duration-150 shadow-md"
                    onClick={() => {
                      setGestureMode('shoot')
                      if (gameEngineRef.current) {
                        gameEngineRef.current.throwBomb()
                        triggerHaptic('medium')
                      }
                    }}
                    role="button"
                    aria-label="Shoot button"
                  >
                    <Bomb className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-white/50">Shoot</span>
                </div>
                
                {/* Special Abilities */}
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className="w-10 h-10 bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-full flex items-center justify-center touch-manipulation active:scale-95 transition-all duration-150 shadow-md"
                    onClick={() => {
                      setGestureMode('special')
                      triggerHaptic('light')
                    }}
                    role="button"
                    aria-label="Special abilities"
                  >
                    <Wand2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-white/50">Special</span>
                </div>
                
                {/* Auto Shoot Toggle */}
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center touch-manipulation active:scale-95 transition-all duration-150 shadow-md ${
                      autoShoot 
                        ? 'bg-gradient-to-br from-green-500/40 to-emerald-500/40' 
                        : 'bg-gradient-to-br from-gray-500/40 to-slate-500/40'
                    }`}
                    onClick={() => {
                      setAutoShoot(!autoShoot)
                      triggerHaptic('light')
                    }}
                    role="button"
                    aria-label="Auto shoot toggle"
                  >
                    {autoShoot ? <Bot className="w-4 h-4 text-white" /> : <Hand className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-xs text-white/50">Auto</span>
                </div>
                
                {/* Pause Control */}
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className="w-10 h-10 bg-gradient-to-br from-orange-500/40 to-red-500/40 rounded-full flex items-center justify-center touch-manipulation active:scale-95 transition-all duration-150 shadow-md"
                    onClick={pauseGame}
                    role="button"
                    aria-label="Pause button"
                  >
                    <Pause className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-white/50">Pause</span>
                </div>
              </div>
              
              {/* Mobile Instructions - Compact */}
              <div className="mt-1 text-center">
                <div className="text-white/40 text-xs">
                  {gestureMode === 'move' && 'Touch & drag to move'}
                  {gestureMode === 'shoot' && 'Tap to shoot'}
                  {gestureMode === 'special' && 'Swipe for abilities'}
                </div>

                {/* Shield Button (mobile) */}
                <div className="flex justify-center mt-2">
                  <button
                    onClick={() => { try { activateShield() } catch (e) {} }}
                    className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-4 py-2 rounded-full shadow-lg border border-blue-400/30"
                  >
                    <Shield className="w-4 h-4 inline-block mr-2" />
                    <span className="text-sm font-semibold">Shield</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Small debug overlay for shield (only visible during dev/testing) */}
      <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '8px 10px', borderRadius: 8, fontSize: 12, pointerEvents: 'none' }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Shield Debug</div>
        <div>Active: {debugShield.active ? 'yes' : 'no'}</div>
        <div>Rings: {debugShield.rings}</div>
        <div>Energy: {Math.floor(debugShield.energy)}</div>
        <div>Time Left: {Math.ceil(debugShield.timeLeft / 1000)}s</div>
      </div>

      {/* Desktop shield indicator/button */}
      <div className="absolute top-32 right-6 z-20 hidden md:flex flex-col items-end gap-2">
        {/* Shield duration ring / percent */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-2 border border-blue-500/20 w-44">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-300" />
            <div className="flex-1">
              <div className="text-xs text-white/80">Shield</div>
              <Progress value={shieldActive ? shieldPercent * 100 : 0} className="h-2 mt-1 bg-blue-900/40" />
            </div>
            <button
              onClick={() => { try { activateShield() } catch (e) {} }}
              className="ml-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2 w-9 h-9 flex items-center justify-center"
              title="Activate Shield (Q)"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Shield Controls */}
      <div className={cn(
        "fixed z-20",
        isMobile ? "bottom-32 right-4" : "bottom-24 right-8"
      )}>
        <div className={cn(
          "relative group",
          gameStats.shieldRings.some(ring => ring.active) && "animate-pulse"
        )}>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-200" />
          <Button
            variant="ghost"
            size={isMobile ? "default" : "lg"}
            onClick={activateShield}
            disabled={gameStats.energy < gameStats.shieldActivationCost}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 bg-black/50 backdrop-blur-sm border-2",
              gameStats.energy >= gameStats.shieldActivationCost 
                ? "border-blue-500/50 hover:border-blue-400 text-blue-400 hover:text-blue-300" 
                : "border-gray-700 text-gray-500",
              gameStats.shieldRings.some(ring => ring.active) && "border-cyan-400/70"
            )}
          >
            <div className="relative">
              <Shield className={cn(
                "w-8 h-8 md:w-10 md:h-10",
                gameStats.shieldRings.some(ring => ring.active) && "animate-spin-slow"
              )} />
              {gameStats.shieldRings.some(ring => ring.active) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-blue-500/20 animate-ping" />
                </div>
              )}
            </div>
            <div className="text-xs md:text-sm font-medium text-center">
              Shield
              <div className="text-[10px] md:text-xs opacity-80">
                {Math.floor(gameStats.shieldActivationCost)} Energy
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Desktop Controls */}
      <div className="absolute bottom-4 left-4 hidden md:block z-20">
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
          <div className="text-white/60 text-sm">
            WASD to move • Click to shoot • Space for shield
          </div>
        </div>
      </div>

      {/* FPS Counter */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className={cn(
          "text-xs font-mono px-2 py-1 rounded backdrop-blur-sm",
          gameStats.fps >= 55 ? "text-green-400 bg-green-500/20" : 
          gameStats.fps >= 30 ? "text-yellow-400 bg-yellow-500/20" : 
          "text-red-400 bg-red-500/20"
        )}>
          {gameStats.fps} FPS
        </div>
      </div>
      {/* Persistent shield overlay (follows player) */}
      {shieldActive && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-40"
          style={{
            // Compute overlay size from the largest shield ring radius and clamp to viewport
            left: Math.round(playerScreen.left),
            top: Math.round(playerScreen.top),
            transform: 'translate(-50%, -50%)',
            width: Math.min(window.innerWidth * 0.9, (Math.max(...(engine?.player?.shieldRings || [{ radius: 90 }]).map((r: any) => r.radius || 90)) * 2) + 40),
            height: Math.min(window.innerHeight * 0.9, (Math.max(...(engine?.player?.shieldRings || [{ radius: 90 }]).map((r: any) => r.radius || 90)) * 2) + 40),
          }}
        >
          {(engine?.player?.shieldRings || [{ radius: 90 }]).map((ring: any, i: number) => {
            const size = (ring.radius || 90) * 2
            const opacity = ring.active ? 0.9 : 0.18
            const scale = 0.9 + (i * 0.08)
            return (
              <div
                key={`shield_overlay_${i}`}
                className={cn('absolute rounded-full', ring.active ? 'animate-pulse' : '')}
                style={{
                  left: '50%',
                  top: '50%',
                  width: size,
                  height: size,
                  marginLeft: -size / 2,
                  marginTop: -size / 2,
                  border: `3px solid rgba(96,165,250,${opacity})`,
                  boxShadow: `0 0 ${12 + i * 6}px rgba(96,165,250,${0.25 + i * 0.1})`,
                  transform: `scale(${scale}) rotate(${(ring.rotation || 0)}rad)`,
                  opacity: Math.max(0.12, shieldPercent),
                }}
              />
            )
          })}

          <div
            className="absolute rounded-full"
            style={{
              left: '50%',
              top: '50%',
              width: 48,
              height: 48,
              marginLeft: -24,
              marginTop: -24,
              background: 'radial-gradient(circle at 30% 30%, rgba(96,165,250,0.9), rgba(59,130,246,0.25))',
              filter: 'blur(6px)',
              opacity: Math.max(0.35, shieldPercent)
            }}
          />
        </div>
      )}
    </>
  )
  }

  const renderSettingsModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowSettings(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
  className="bg-gradient-to-br from-slate-900/95 to-purple-900/95 border border-purple-500/30 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full max-h-[calc(100vh-160px)] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Game Settings
        </h2>
        
        <div className="space-y-6">
          {/* Audio Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Audio & Feedback</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="h-5 w-5 text-green-400" /> : <VolumeX className="h-5 w-5 text-red-400" />}
                <span className="text-white">Sound Effects</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={cn(
                  "w-16",
                  soundEnabled ? "border-green-500 text-green-400" : "border-red-500 text-red-400"
                )}
                aria-label={`Sound effects ${soundEnabled ? 'enabled' : 'disabled'}`}
              >
                {soundEnabled ? "ON" : "OFF"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-purple-400" />
                <span className="text-white">Haptic Feedback</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHapticEnabled(!hapticEnabled)}
                className={cn(
                  "w-16",
                  hapticEnabled ? "border-purple-500 text-purple-400" : "border-gray-500 text-gray-400"
                )}
                aria-label={`Haptic feedback ${hapticEnabled ? 'enabled' : 'disabled'}`}
              >
                {hapticEnabled ? "ON" : "OFF"}
              </Button>
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Accessibility</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-blue-400" />
                <span className="text-white">Accessibility Mode</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAccessibilityMode(!accessibilityMode)}
                className={cn(
                  "w-16",
                  accessibilityMode ? "border-blue-500 text-blue-400" : "border-gray-500 text-gray-400"
                )}
                aria-label={`Accessibility mode ${accessibilityMode ? 'enabled' : 'disabled'}`}
              >
                {accessibilityMode ? "ON" : "OFF"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-yellow-400" />
                <span className="text-white">High Contrast</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHighContrast(!highContrast)}
                className={cn(
                  "w-16",
                  highContrast ? "border-yellow-500 text-yellow-400" : "border-gray-500 text-gray-400"
                )}
                aria-label={`High contrast ${highContrast ? 'enabled' : 'disabled'}`}
              >
                {highContrast ? "ON" : "OFF"}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm">Colorblind Support</label>
              <select
                value={colorblindMode}
                onChange={(e) => setColorblindMode(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                aria-label="Colorblind mode selection"
              >
                <option value="none">None</option>
                <option value="protanopia">Protanopia (Red-blind)</option>
                <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                <option value="tritanopia">Tritanopia (Blue-blind)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-pink-400" />
                <span className="text-white">Screen Reader Support</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScreenReaderEnabled(!screenReaderEnabled)}
                className={cn(
                  "w-16",
                  screenReaderEnabled ? "border-pink-500 text-pink-400" : "border-gray-500 text-gray-400"
                )}
                aria-label={`Screen reader support ${screenReaderEnabled ? 'enabled' : 'disabled'}`}
              >
                {screenReaderEnabled ? "ON" : "OFF"}
              </Button>
            </div>
          </div>

          {/* Mobile Settings */}
          {isMobile && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Mobile Settings</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-green-400" />
                  <span className="text-white">Auto Shoot</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoShoot(!autoShoot)}
                  className={cn(
                    "w-16",
                    autoShoot ? "border-green-500 text-green-400" : "border-gray-500 text-gray-400"
                  )}
                  aria-label={`Auto shoot ${autoShoot ? 'enabled' : 'disabled'}`}
                >
                  {autoShoot ? "ON" : "OFF"}
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Touch Sensitivity</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={mobileSensitivity}
                  onChange={(e) => setMobileSensitivity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="Touch sensitivity"
                />
                <div className="text-xs text-white/60 text-center">
                  {mobileSensitivity}x Sensitivity
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-blue-400" />
                  <span className="text-white">Gesture Mode</span>
                </div>
                <select
                  value={gestureMode}
                  onChange={(e) => setGestureMode(e.target.value as any)}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  aria-label="Gesture mode selection"
                >
                  <option value="move">Move</option>
                  <option value="shoot">Shoot</option>
                  <option value="special">Special</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <span className="text-white">Performance Mode</span>
                </div>
                <select
                  value={performanceMode}
                  onChange={(e) => setPerformanceMode(e.target.value as any)}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  aria-label="Performance mode selection"
                >
                  <option value="battery">Battery Saver</option>
                  <option value="balanced">Balanced</option>
                  <option value="high">High Performance</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Battery className="h-5 w-5 text-green-400" />
                  <span className="text-white">Battery Optimization</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBatteryOptimized(!batteryOptimized)}
                  className={cn(
                    "w-16",
                    batteryOptimized ? "border-green-500 text-green-400" : "border-gray-500 text-gray-400"
                  )}
                  aria-label={`Battery optimization ${batteryOptimized ? 'enabled' : 'disabled'}`}
                >
                  {batteryOptimized ? "ON" : "OFF"}
                </Button>
              </div>
            </div>
          )}

          {/* Custom Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Custom Controls</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-white text-sm">Move Up</label>
                <input
                  type="text"
                  value={customControls.moveUp}
                  onChange={(e) => setCustomControls(prev => ({ ...prev, moveUp: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  aria-label="Move up key"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm">Move Down</label>
                <input
                  type="text"
                  value={customControls.moveDown}
                  onChange={(e) => setCustomControls(prev => ({ ...prev, moveDown: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  aria-label="Move down key"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm">Move Left</label>
                <input
                  type="text"
                  value={customControls.moveLeft}
                  onChange={(e) => setCustomControls(prev => ({ ...prev, moveLeft: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  aria-label="Move left key"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm">Move Right</label>
                <input
                  type="text"
                  value={customControls.moveRight}
                  onChange={(e) => setCustomControls(prev => ({ ...prev, moveRight: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  aria-label="Move right key"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm">Shoot</label>
                <input
                  type="text"
                  value={customControls.shoot}
                  onChange={(e) => setCustomControls(prev => ({ ...prev, shoot: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  aria-label="Shoot key"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm">Pause</label>
                <input
                  type="text"
                  value={customControls.pause}
                  onChange={(e) => setCustomControls(prev => ({ ...prev, pause: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  aria-label="Pause key"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Button
            onClick={() => setShowSettings(false)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
          >
            Save Settings
          </Button>
          <Button
            onClick={() => setShowSettings(false)}
            variant="outline"
            className="flex-1 border-slate-500 text-slate-200"
          >
            Cancel
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )

  // Apply accessibility styles
  const getAccessibilityStyles = () => {
    const baseStyles = "fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 overflow-hidden"
    
    if (highContrast) {
      return `${baseStyles} contrast-200 brightness-150`
    }
    
    if (colorblindMode !== 'none') {
      const colorblindFilters = {
        protanopia: 'protanopia',
        deuteranopia: 'deuteranopia', 
        tritanopia: 'tritanopia'
      }
      return `${baseStyles} ${colorblindFilters[colorblindMode]}`
    }
    
    return baseStyles
  }

  return (
    <div 
      className={getAccessibilityStyles()}
      role="application"
      aria-label="Emoji Blast Game"
      aria-live="polite"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10"
        style={{
          touchAction: "none",
        }}
        aria-label="Game canvas"
        role="img"
        aria-describedby="game-description"
      />
      {/* Character Speech Bubble (meme quips) */}
      {speechCurrent && gameState === 'playing' && (
        (() => {
          // compute bubble position anchored to player's mouth
          const canvas = canvasRef.current
          const engine = gameEngineRef.current
          if (!canvas || !engine) return null
          const rect = canvas.getBoundingClientRect()
          // player coords are in CSS pixels relative to canvas
          const player = engine.player
          // mouth offset: slightly right and above center depending on player size
          const mouthOffsetX = Math.max(8, player.width * 0.15)
          const mouthOffsetY = -Math.max(12, player.height * 0.6)
          // compute screen position
          const left = rect.left + player.x + mouthOffsetX
          const top = rect.top + player.y + mouthOffsetY

          // keep bubble within viewport bounds
          const bubbleLeft = Math.max(8, Math.min(window.innerWidth - 160, left))
          const bubbleTop = Math.max(8, Math.min(window.innerHeight - 48, top))

          return (
            <div
              className="absolute z-50 pointer-events-none"
              style={{ left: bubbleLeft, top: bubbleTop, transform: 'translate(-50%, -100%)' }}
            >
              <SpeechBubble
                text={speechCurrent.text}
                duration={speechCurrent.duration}
                onClose={() => { /* handled inside hook */ }}
                className=""
              />
            </div>
          )
        })()
      )}
      
      {/* Screen Reader Description */}
      {/* Floating hit texts */}
      <div className="pointer-events-none fixed inset-0 z-60">
        {floatingHits.map(hit => {
          // Convert engine coords to screen coords if engine exists
          const engine = gameEngineRef.current
          let left = hit.x
          let top = hit.y
          if (engine && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            left = rect.left + hit.x
            top = rect.top + hit.y
          }

          // schedule removal after 800ms
          setTimeout(() => setFloatingHits(prev => prev.filter(h => h.id !== hit.id)), 800)

          return (
            <div key={hit.id} className="absolute text-yellow-300 font-bold drop-shadow-lg text-lg" style={{ left, top, transform: 'translate(-50%, -50%)' }}>
              {hit.text}
            </div>
          )
        })}
      </div>

      {/* Flash overlay */}
      {flash && (
        <div style={{ pointerEvents: 'none' }} className="fixed inset-0 z-70">
          <div style={{ background: `rgba(255,255,255,${flash.alpha})`, transition: 'opacity 120ms linear' }} />
        </div>
      )}
      {screenReaderEnabled && (
        <div id="game-description" className="sr-only">
          Emoji Blast Game. Current score: {gameStats.score}. 
          Health: {gameStats.health} out of {gameStats.maxHealth}. 
          Wave: {gameStats.wave}. 
          Enemies remaining: {gameStats.enemiesTotal - gameStats.enemiesKilled}.
          {gameStats.combo > 0 && ` Combo multiplier: ${gameStats.combo}x.`}
        </div>
      )}

      {/* Modern UI overlay */}
      {(gameState === "playing" || gameState === "paused") && renderModernGameUI()}

      {/* Game State Overlays */}
      <AnimatePresence mode="wait">
      {gameState === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            // container-bound overlay so it follows the game canvas/container
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 z-30"
          >
            <div className="w-full max-w-[min(95vw,900px)]">
              {renderGameMenu()}
            </div>
          </motion.div>
      )}

      {gameState === "gameOver" && (
          <motion.div
            key="gameOver"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 z-30"
          >
            <div className="w-full max-w-[min(96vw,1000px)] max-h-[calc(100vh-120px)] overflow-auto">
              {renderGameOver()}
            </div>
          </motion.div>
      )}

      {gameState === "paused" && (
          <motion.div
            key="paused"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, type: "spring" }}
              className="w-full max-w-[min(92vw,720px)]"
            >
              <Card className="bg-gradient-to-br from-slate-900/95 to-purple-900/95 border-purple-500/30 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-6 md:p-8 text-center overflow-auto">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                    className="text-6xl mb-4 md:mb-6"
                  >
                    ⏸️
                  </motion.div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">Game Paused</h3>
                  <p className="text-slate-300 mb-6">Take a break or continue your epic battle!</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={pauseGame}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 px-6 sm:px-8 w-full sm:w-auto"
              >
                      <Play className="h-5 w-5 mr-2" />
                Resume
              </Button>
                    <Button
                      onClick={resetGame}
                      variant="outline"
                      className="border-slate-500 text-slate-200 hover:bg-slate-600/20 h-12 px-8"
                    >
                      <Home className="h-5 w-5 mr-2" />
                      Main Menu
                    </Button>
                  </div>
            </CardContent>
          </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && renderSettingsModal()}
      </AnimatePresence>

      {/* Achievement Notifications */}
      <AnimatePresence>
        {achievementNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ x: 300, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 300, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="fixed top-4 right-4 z-40"
          >
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-4 border border-yellow-500/50 shadow-2xl">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <div className="flex-1">
                  <div className="text-yellow-400 font-bold text-sm">{notification.text}</div>
                </div>
                <button
                  onClick={() => removeAchievementNotification(notification.id)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4 text-yellow-300" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
