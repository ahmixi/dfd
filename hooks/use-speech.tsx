"use client"

import { useCallback, useRef, useState } from "react"

type Speech = { id: number; text: string; duration?: number }

export function useSpeech() {
  const [current, setCurrent] = useState<Speech | null>(null)
  const queue = useRef<Speech[]>([])
  const idRef = useRef(1)
  const cooldown = useRef(false)

  const show = useCallback((text: string, duration = 2500) => {
    const next: Speech = { id: idRef.current++, text, duration }
    // simple dedupe: if same as current or last queued, ignore
    const last = queue.current[queue.current.length - 1]
    if ((current && current.text === text) || (last && last.text === text)) return
    queue.current.push(next)
    if (!current && !cooldown.current) {
      const item = queue.current.shift()!
      setCurrent(item)
      cooldown.current = true
      setTimeout(() => {
        setCurrent(null)
        cooldown.current = false
        if (queue.current.length > 0) {
          const it = queue.current.shift()!
          setCurrent(it)
          cooldown.current = true
          setTimeout(() => setCurrent(null), it.duration)
        }
      }, item.duration)
    }
  }, [current])

  return { current, show }
}

export default useSpeech
