"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  color?: string
  glowColor?: string
  showLabel?: boolean
  showValue?: boolean
  animate?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "danger"
  orientation?: "horizontal" | "vertical"
}

export function AnimatedProgress({
  value,
  max = 100,
  color,
  glowColor,
  showLabel = false,
  showValue = false,
  animate = true,
  size = "md",
  variant = "default",
  orientation = "horizontal",
  className,
  ...props
}: AnimatedProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          backgroundColor: "rgb(34 197 94 / 0.2)",
          indicatorColor: "rgb(34 197 94)",
          glowColor: "rgb(34 197 94 / 0.5)"
        }
      case "warning":
        return {
          backgroundColor: "rgb(234 179 8 / 0.2)",
          indicatorColor: "rgb(234 179 8)",
          glowColor: "rgb(234 179 8 / 0.5)"
        }
      case "danger":
        return {
          backgroundColor: "rgb(239 68 68 / 0.2)",
          indicatorColor: "rgb(239 68 68)",
          glowColor: "rgb(239 68 68 / 0.5)"
        }
      default:
        return {
          backgroundColor: "rgb(var(--primary) / 0.2)",
          indicatorColor: "rgb(var(--primary))",
          glowColor: "rgb(var(--primary) / 0.5)"
        }
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "h-2"
      case "lg":
        return "h-4"
      default:
        return "h-3"
    }
  }

  const variantStyles = getVariantStyles()
  const sizeClass = getSizeStyles()

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn(
        "relative overflow-hidden rounded-full",
        sizeClass,
        orientation === "vertical" && "h-full w-3",
        className
      )}
      style={{
        backgroundColor: color ? `${color}33` : variantStyles.backgroundColor
      }}
      {...props}
    >
      <motion.div
        initial={animate ? { width: 0 } : false}
        animate={{ 
          width: `${percentage}%`,
          height: orientation === "vertical" ? `${percentage}%` : undefined
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "h-full rounded-full transition-all",
          orientation === "vertical" && "absolute bottom-0 w-full"
        )}
        style={{
          backgroundColor: color || variantStyles.indicatorColor,
          boxShadow: `0 0 10px ${glowColor || variantStyles.glowColor}`
        }}
      />

      {(showLabel || showValue) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white mix-blend-difference">
            {showLabel && props["aria-label"]}
            {showValue && `${Math.round(percentage)}%`}
          </span>
        </div>
      )}
    </div>
  )
}