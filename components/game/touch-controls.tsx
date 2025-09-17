"use client"

import { useEffect, useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { Move, Bomb, Wand2 } from 'lucide-react'

interface TouchControlsProps {
  onMove: (x: number, y: number) => void
  onShoot: (x: number, y: number) => void
  onSpecial: () => void
  enabled: boolean
}

export function TouchControls({ onMove, onShoot, onSpecial, enabled }: TouchControlsProps) {
  const [gestureMode, setGestureMode] = useState<'move' | 'shoot' | 'special'>('move')
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null)
  
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return
    
    e.preventDefault()
    const touch = e.touches[0]
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    setTouchPosition({ x, y })
    
    switch (gestureMode) {
      case 'move':
        onMove(x, y)
        break
      case 'shoot':
        onShoot(x, y)
        break
      case 'special':
        onSpecial()
        break
    }
  }, [enabled, gestureMode, onMove, onShoot, onSpecial])
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !touchPosition) return
    
    e.preventDefault()
    const touch = e.touches[0]
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    if (gestureMode === 'move') {
      onMove(x, y)
    }
  }, [enabled, gestureMode, onMove, touchPosition])
  
  const handleTouchEnd = useCallback(() => {
    setTouchPosition(null)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const target = document.getElementById('touch-controls')
    if (!target) return

    target.addEventListener('touchstart', handleTouchStart)
    target.addEventListener('touchmove', handleTouchMove)
    target.addEventListener('touchend', handleTouchEnd)

    return () => {
      target.removeEventListener('touchstart', handleTouchStart)
      target.removeEventListener('touchmove', handleTouchMove)
      target.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div 
      id="touch-controls"
      className="fixed bottom-4 left-4 right-4 z-20"
    >
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
        {/* Mode Selector */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setGestureMode('move')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              gestureMode === 'move' ? 'bg-primary text-white' : 'bg-white/5 text-white/70'
            )}
          >
            <Move className="w-5 h-5" />
          </button>
          <button
            onClick={() => setGestureMode('shoot')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              gestureMode === 'shoot' ? 'bg-primary text-white' : 'bg-white/5 text-white/70'
            )}
          >
            <Bomb className="w-5 h-5" />
          </button>
          <button
            onClick={() => setGestureMode('special')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              gestureMode === 'special' ? 'bg-primary text-white' : 'bg-white/5 text-white/70'
            )}
          >
            <Wand2 className="w-5 h-5" />
          </button>
        </div>

        {/* Touch Area */}
        <div 
          className="w-full h-32 bg-white/5 rounded-lg relative overflow-hidden"
          style={{ touchAction: 'none' }}
        >
          {touchPosition && (
            <div 
              className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30"
              style={{
                left: touchPosition.x,
                top: touchPosition.y
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}