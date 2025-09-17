"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface GameTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  delay?: number
  className?: string
}

export function GameTooltip({
  content,
  children,
  side = "top",
  align = "center",
  delay = 200,
  className
}: GameTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [shouldRender, setShouldRender] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const handleMouseEnter = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setShouldRender(true)
      setIsVisible(true)
    }, delay)
  }, [delay])

  const handleMouseLeave = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
    setTimeout(() => setShouldRender(false), 200) // Match exit animation duration
  }, [])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getSideStyles = () => {
    switch (side) {
      case "right":
        return {
          left: "100%",
          marginLeft: "0.5rem",
          ...(align === "start" && { top: 0 }),
          ...(align === "center" && { top: "50%", transform: "translateY(-50%)" }),
          ...(align === "end" && { bottom: 0 })
        }
      case "bottom":
        return {
          top: "100%",
          marginTop: "0.5rem",
          ...(align === "start" && { left: 0 }),
          ...(align === "center" && { left: "50%", transform: "translateX(-50%)" }),
          ...(align === "end" && { right: 0 })
        }
      case "left":
        return {
          right: "100%",
          marginRight: "0.5rem",
          ...(align === "start" && { top: 0 }),
          ...(align === "center" && { top: "50%", transform: "translateY(-50%)" }),
          ...(align === "end" && { bottom: 0 })
        }
      default: // top
        return {
          bottom: "100%",
          marginBottom: "0.5rem",
          ...(align === "start" && { left: 0 }),
          ...(align === "center" && { left: "50%", transform: "translateX(-50%)" }),
          ...(align === "end" && { right: 0 })
        }
    }
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {shouldRender && (
          <motion.div
            className={cn(
              "absolute z-50 min-w-[8rem] max-w-xs",
              className
            )}
            style={getSideStyles()}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ 
              opacity: isVisible ? 1 : 0, 
              scale: isVisible ? 1 : 0.96,
              transition: { duration: 0.1 }
            }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <div className="rounded-lg bg-black/90 px-3 py-2 text-sm text-white shadow-lg backdrop-blur-sm">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}