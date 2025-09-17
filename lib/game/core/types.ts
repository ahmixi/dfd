export interface GameObject {
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  active: boolean
  rotation: number
  scale: number
  alpha: number
  zIndex: number
  id: string
  createdAt: number
  lifetime?: number
  particles?: Particle[]
}

export interface Particle extends GameObject {
  color: string
  size: number
  life: number
  maxLife: number
  drag: number
  type: 'circle' | 'spark' | 'trail' | 'explosion'
  gradient?: string[]
  emoji: string
  rotationSpeed: number
}

export interface CameraEffect {
  type: 'shake' | 'zoom' | 'flash'
  intensity: number
  duration: number
  currentTime: number
  startValue: number
  endValue: number
}

export interface ShieldRing {
  radius: number
  rotation: number
  speed: number
  opacity: number
  segments: number
  active: boolean
}

export interface PlayerAbility {
  id: string
  name: string
  description: string
  cooldown: number
  energyCost: number
  isActive: boolean
  lastUsed: number
  icon: string
}