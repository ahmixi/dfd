"use client"

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/game-store'
import { GameEngine } from '@/lib/game/core/GameEngine'

export function EmojiRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const rafRef = useRef<number>()
  const { setCurrentScreen } = useGameStore()

  const [state, setState] = useState<'loading' | 'tutorial' | 'playing' | 'paused' | 'gameOver'>('loading')
  const [score, setScore] = useState(0)
  const [distance, setDistance] = useState(0)
  const [coins, setCoins] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new GameEngine({ canvas, width: window.innerWidth, height: window.innerHeight })
    engineRef.current = engine
    let last = performance.now()

    const step = () => {
      if (state === 'playing') {
        const now = performance.now()
        const dt = (now - last) / 1000
        last = now
        // Small fallback in case engine listeners aren't set
        setDistance((d) => d + dt * 10)
      } else {
        last = performance.now()
      }
      rafRef.current = requestAnimationFrame(step)
    }
    engine.setScoreListener(setScore)
    engine.setDistanceListener((d) => setDistance(Math.floor(d)))
    engine.setCoinsListener(setCoins)
    engine.setGameOverListener(() => setState('gameOver'))
    engine.start()
    setState('tutorial')
    rafRef.current = requestAnimationFrame(step)

    const onResize = () => engine.resize(window.innerWidth, window.innerHeight)
    window.addEventListener('resize', onResize)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      engine.stop()
      engineRef.current = null
    }
  }, [])
  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!engineRef.current) return
      if (state !== 'playing') return
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') engineRef.current.moveLane(-1)
      if (e.code === 'ArrowRight' || e.code === 'KeyD') engineRef.current.moveLane(1)
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') engineRef.current.jump()
      if (e.code === 'ArrowDown' || e.code === 'KeyS') engineRef.current.slide(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return
      if (state !== 'playing') return
      if (e.code === 'ArrowDown' || e.code === 'KeyS') engineRef.current.slide(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [state])


  useEffect(() => {
    if (!engineRef.current) return
    if (state === 'paused') engineRef.current.pause()
    if (state === 'playing') engineRef.current.resume()
  }, [state])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Minimal HUD */}
      {state === 'playing' && (
        <div className="pointer-events-none absolute top-4 left-4 flex flex-col gap-1 text-white">
          <div className="text-sm/4 font-medium opacity-80">Score</div>
          <div className="text-2xl font-semibold">{score.toLocaleString()}</div>
          <div className="text-xs mt-1 opacity-70">{distance} m • {coins} coins</div>
        </div>
      )}

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {state === 'tutorial' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <div className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-2xl p-8 text-center max-w-lg mx-auto">
              <div className="text-6xl mb-4">🏃‍♂️✨</div>
              <h2 className="text-white text-3xl font-semibold mb-2">Emoji Runner — Next Gen</h2>
              <p className="text-white/70 mb-6">Jump, slide, and flow through a cinematic world. Collect, combo, and chase perfection.</p>
              <button
                onClick={() => setState('playing')}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-medium shadow-lg shadow-fuchsia-500/25 hover:brightness-110"
              >
                Start Playing
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Menu */}
      <AnimatePresence>
        {state === 'paused' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-2xl p-8 text-center max-w-md mx-auto">
              <h3 className="text-white text-2xl font-semibold mb-6">Paused</h3>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-xs">Score</div>
                  <div className="text-white text-xl font-bold">{score}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-xs">Distance</div>
                  <div className="text-white text-xl font-bold">{Math.floor(distance)}m</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-xs">Coins</div>
                  <div className="text-yellow-300 text-xl font-bold">{coins}</div>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setState('playing')} className="px-5 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20">Resume</button>
                <button onClick={() => setCurrentScreen('dashboard')} className="px-5 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20">Exit</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* On-screen controls (compact) */}
      {state === 'playing' && (
        <div className="absolute bottom-5 right-5 flex gap-2">
          <button onClick={() => engineRef.current?.moveLane(-1)} className="px-3 py-2 rounded-md bg-white/10 text-white">◀︎</button>
          <button onClick={() => engineRef.current?.jump()} className="px-3 py-2 rounded-md bg-white/10 text-white">⤒</button>
          <button onMouseDown={() => engineRef.current?.slide(true)} onMouseUp={() => engineRef.current?.slide(false)} className="px-3 py-2 rounded-md bg-white/10 text-white">⤓</button>
          <button onClick={() => engineRef.current?.moveLane(1)} className="px-3 py-2 rounded-md bg-white/10 text-white">▶︎</button>
        </div>
      )}
    </div>
  )
}
