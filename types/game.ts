export interface GameStats {
  score: number
  level: number
  health: number
  maxHealth: number
  shield: number
  maxShield: number
  shieldRings: Array<{
    radius: number
    rotation: number
    speed: number
    opacity: number
    segments: number
    active: boolean
  }>
  shieldActivationCost: number
  shieldDuration: number
  shieldActivationTime: number
  energy: number
  maxEnergy: number
  enemies: number
  combo: number
  comboMultiplier: number
  wave: number
  enemiesKilled: number
  enemiesTotal: number
  fps: number
  timeLeft: number
  cameraShake: number
  particles: Array<{
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
    color: string
    size: number
    life: number
    maxLife: number
    drag: number
    type: 'circle' | 'spark' | 'trail' | 'explosion'
    gradient?: string[]
    emoji: string
    rotationSpeed: number
  }>
}

export interface GameParticle {
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