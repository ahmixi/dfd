"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface ScreenTransitionProps {
  children: React.ReactNode
  type?: "fade" | "slide" | "scale" | "flip"
  direction?: "up" | "down" | "left" | "right"
  duration?: number
  className?: string
}

export function ScreenTransition({
  children,
  type = "fade",
  direction = "up",
  duration = 0.3,
  className
}: ScreenTransitionProps) {
  const getTransitionVariants = () => {
    switch (type) {
      case "slide":
        const offset = 50
        const slideOffset = {
          up: { y: offset },
          down: { y: -offset },
          left: { x: offset },
          right: { x: -offset }
        }[direction]

        return {
          initial: { opacity: 0, ...slideOffset },
          animate: { opacity: 1, x: 0, y: 0 },
          exit: { opacity: 0, ...slideOffset }
        }
      case "scale":
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.1 }
        }
      case "flip":
        return {
          initial: { opacity: 0, rotateX: 90 },
          animate: { opacity: 1, rotateX: 0 },
          exit: { opacity: 0, rotateX: -90 }
        }
      default: // fade
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        }
    }
  }

  return (
    <motion.div
      className={cn(
        "w-full h-full",
        type === "flip" && "perspective-1000",
        className
      )}
      variants={getTransitionVariants()}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration,
        ease: [0.32, 0.72, 0, 1]
      }}
    >
      {children}
    </motion.div>
  )
}

interface ScreenManagerProps {
  screens: Record<string, React.ReactNode>
  current: string
  type?: ScreenTransitionProps["type"]
  direction?: ScreenTransitionProps["direction"]
  duration?: number
  className?: string
}

export function ScreenManager({
  screens,
  current,
  type,
  direction,
  duration,
  className
}: ScreenManagerProps) {
  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      <AnimatePresence mode="wait">
        <ScreenTransition
          key={current}
          type={type}
          direction={direction}
          duration={duration}
        >
          {screens[current]}
        </ScreenTransition>
      </AnimatePresence>
    </div>
  )
}