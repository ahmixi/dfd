"use client"

import { motion } from 'framer-motion'
import { Heart, Zap, Shield, Star } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { GameStats } from '@/types/game'
import { cn } from '@/lib/utils'

interface GameHUDProps {
  stats: GameStats
  onPause: () => void
  onHome: () => void
  className?: string
}

export function GameHUD({ stats, onPause, onHome, className }: GameHUDProps) {
  return (
    <div className={cn("fixed inset-x-0 top-0 z-20 p-4", className)}>
      {/* Top Bar */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-black/30 backdrop-blur-sm rounded-2xl p-3 border border-white/10"
      >
        <div className="flex items-center justify-between">
          {/* Score */}
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-lg font-bold text-white">{stats.score}</span>
          </div>

          {/* Wave */}
          <div className="bg-white/10 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-white">Wave {stats.wave}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPause}
              className="w-8 h-8 text-white hover:bg-white/20 rounded-full"
            >
              <span className="sr-only">Pause game</span>
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                <rect x="14" y="4" width="4" height="16" fill="currentColor" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onHome}
              className="w-8 h-8 text-white hover:bg-white/20 rounded-full"
            >
              <span className="sr-only">Return to home</span>
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path
                  fill="currentColor"
                  d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Status Bars */}
        <div className="grid grid-cols-2 gap-4 mt-3">
          {/* Health */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-white">
                {stats.health}/{stats.maxHealth}
              </span>
            </div>
            <Progress
              value={(stats.health / stats.maxHealth) * 100}
              className="h-2 bg-white/10"
              indicatorClassName="bg-gradient-to-r from-red-500 to-red-400"
            />
          </div>

          {/* Energy */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">
                {stats.energy}/{stats.maxEnergy}
              </span>
            </div>
            <Progress
              value={(stats.energy / stats.maxEnergy) * 100}
              className="h-2 bg-white/10"
              indicatorClassName="bg-gradient-to-r from-yellow-500 to-yellow-400"
            />
          </div>
        </div>

        {/* Shield Status (if active) */}
        {stats.shield > 0 && (
          <div className="mt-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">
                Shield: {Math.round(stats.shield)}
              </span>
            </div>
            <Progress
              value={(stats.shield / stats.maxShield) * 100}
              className="h-1.5 mt-1 bg-white/10"
              indicatorClassName="bg-gradient-to-r from-blue-500 to-blue-400"
            />
          </div>
        )}
      </motion.div>
    </div>
  )
}