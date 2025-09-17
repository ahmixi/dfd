"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface StatusEffectProps {
  icon: string | React.ReactNode
  duration?: number
  remaining?: number
  size?: "sm" | "md" | "lg"
  variant?: "buff" | "debuff" | "neutral"
  className?: string
  showTimer?: boolean
  tooltip?: string
}

export function StatusEffect({
  icon,
  duration,
  remaining,
  size = "md",
  variant = "neutral",
  className,
  showTimer = true,
  tooltip
}: StatusEffectProps) {
  const percentage = duration && remaining ? (remaining / duration) * 100 : 0

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "w-8 h-8"
      case "lg":
        return "w-12 h-12"
      default:
        return "w-10 h-10"
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case "buff":
        return {
          background: "bg-green-500/10",
          border: "border-green-500/50",
          glow: "shadow-green-500/30"
        }
      case "debuff":
        return {
          background: "bg-red-500/10",
          border: "border-red-500/50",
          glow: "shadow-red-500/30"
        }
      default:
        return {
          background: "bg-blue-500/10",
          border: "border-blue-500/50",
          glow: "shadow-blue-500/30"
        }
    }
  }

  const sizeClass = getSizeClass()
  const styles = getVariantStyles()

  return (
    <div className="relative group">
      <motion.div
        className={cn(
          "relative rounded-lg border backdrop-blur-sm shadow-lg",
          sizeClass,
          styles.background,
          styles.border,
          styles.glow,
          className
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {typeof icon === "string" ? (
            <span className="text-2xl">{icon}</span>
          ) : (
            icon
          )}
        </div>

        {showTimer && duration && remaining && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              className="stroke-current text-white/10"
              strokeWidth="4"
              fill="none"
              r="48"
              cx="50"
              cy="50"
            />
            <motion.circle
              className="stroke-current"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              r="48"
              cx="50"
              cy="50"
              style={{
                strokeDasharray: "301.59289474462014",
                strokeDashoffset: 301.59289474462014 * (1 - percentage / 100),
                stroke: variant === "buff" ? "#22c55e" : 
                        variant === "debuff" ? "#ef4444" : "#3b82f6"
              }}
            />
          </svg>
        )}
      </motion.div>

      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-sm bg-black/90 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
          {tooltip}
        </div>
      )}
    </div>
  )
}