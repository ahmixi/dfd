"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface FloatingTextProps {
  text: string | number
  x: number
  y: number
  variant?: "damage" | "heal" | "critical" | "buff" | "debuff" | "exp" | "score"
  duration?: number
  scale?: number
  className?: string
}

export function FloatingText({
  text,
  x,
  y,
  variant = "damage",
  duration = 1000,
  scale = 1,
  className
}: FloatingTextProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "heal":
        return {
          color: "text-green-400",
          glow: "drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
        }
      case "critical":
        return {
          color: "text-yellow-400",
          glow: "drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
        }
      case "buff":
        return {
          color: "text-blue-400",
          glow: "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
        }
      case "debuff":
        return {
          color: "text-purple-400",
          glow: "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
        }
      case "exp":
        return {
          color: "text-cyan-400",
          glow: "drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
        }
      case "score":
        return {
          color: "text-pink-400",
          glow: "drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]"
        }
      default:
        return {
          color: "text-red-400",
          glow: "drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <motion.div
      className={cn(
        "absolute pointer-events-none font-bold",
        styles.color,
        styles.glow,
        className
      )}
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`
      }}
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [0, -30, -60],
        scale: [0.5, 1.2, 1],
        transition: {
          duration: duration / 1000,
          times: [0, 0.2, 0.8, 1]
        }
      }}
      exit={{ opacity: 0 }}
    >
      {text}
    </motion.div>
  )
}

interface FloatingTextManagerProps {
  items: Array<{
    id: string
    text: string | number
    x: number
    y: number
    variant?: FloatingTextProps["variant"]
    scale?: number
  }>
}

export function FloatingTextManager({ items }: FloatingTextManagerProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {items.map(({ id, ...props }) => (
          <FloatingText key={id} {...props} />
        ))}
      </AnimatePresence>
    </div>
  )
}