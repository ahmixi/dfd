export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameOver'

export interface GameState {
  phase: GamePhase
  score: number
  highScore: number
  combo: number
  distance: number
  health: number
  maxHealth: number
  energy: number
  maxEnergy: number
}

export interface GamePlayer {
  x: number
  y: number
  width: number
  height: number
  velX: number
  velY: number
  grounded: boolean
  invulnerable: number
  abilities: Map<string, AbilityState>
  effects: {
    trail: Trail[]
    particles: Particle[]
  }
}

export interface AbilityState {
  cooldown: number
  active: boolean
  energy: number
}

export interface Trail {
  x: number
  y: number
  life: number
  color: string
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

export interface GameObstacle {
  type: 'spike' | 'laser' | 'drone'
  x: number
  y: number
  width: number
  height: number
  passed: boolean
  pattern?: {
    speed: number
    amplitude: number
    offset: number
  }
}

export interface GameCollectible {
  type: 'energy' | 'health' | 'score' | 'powerup'
  x: number
  y: number
  width: number
  height: number
  value: number
  collected: boolean
  effect?: string
}