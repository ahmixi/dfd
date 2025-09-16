"use client"

import React, { useEffect, useState } from "react"

type Props = {
  text: string
  onClose?: () => void
  duration?: number
  className?: string
}

export function SpeechBubble({ text, onClose, duration = 2500, className = "" }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    const t2 = setTimeout(() => setVisible(false), duration - 250)
    const t3 = setTimeout(() => onClose && onClose(), duration)
    return () => {
      clearTimeout(t)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [duration, onClose])

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none transform transition-all duration-150 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
      } ${className}`}
      role="status"
    >
      {/* Container allows parent to position precisely; we apply a 50% scale for subtle, meme-sized bubbles */}
      <div style={{ transform: 'scale(0.5)', transformOrigin: 'bottom left' }}>
        <div className="inline-block bg-white/95 dark:bg-black/85 text-black dark:text-white rounded-full px-2 py-1 text-xs shadow-md border border-gray-200 dark:border-gray-800">
          {text}
        </div>
        {/* small pointer triangle aligned with bottom-left of the bubble */}
        <div
          className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white dark:border-t-black/85 mt-[-6px]"
          style={{ marginLeft: 8 }}
        />
      </div>
    </div>
  )
}

export default SpeechBubble
