import { GameObject, ShieldRing, PlayerAbility } from './types'

export interface Player extends GameObject {
  emoji: string
  health: number
  maxHealth: number
  shieldRings: ShieldRing[]
  shieldActivationCost: number
  shieldDuration: number
  shieldActivationTime: number
  shieldCooldown: number
  cameraShake: number
  bombCooldown: number
  speed: number
  shield: number
  maxShield: number
  energy: number
  maxEnergy: number
  abilities: PlayerAbility[]
  experience: number
  level: number
  combo: number
  comboMultiplier: number
  lastDamageTime: number
  invulnerabilityTime: number
  dashCooldown: number
  specialCooldown: number
}

export interface Enemy extends GameObject {
  emoji: string
  health: number
  maxHealth: number
  speed: number
  targetX: number
  targetY: number
  type: "basic" | "fast" | "tank" | "ninja" | "boss" | "elite" | "mini_boss"
  aiState: "patrol" | "chase" | "attack" | "flee" | "stunned"
  aiTimer: number
  attackCooldown: number
  attackRange: number
  damage: number
  experienceValue: number
  dropChance: number
  specialAbilities: string[]
  glowColor: string
  particleTrail: boolean
}

export interface Bomb extends GameObject {
  emoji: string
  timer: number
  maxTimer: number
  explosionRadius: number
  damage: number
  owner: Player | Enemy
}

export interface PowerUp extends GameObject {
  type: "health" | "shield" | "energy" | "speed" | "damage" | "special"
  value: number
  duration?: number
  emoji: string
  pulseRate: number
  glowColor: string
}