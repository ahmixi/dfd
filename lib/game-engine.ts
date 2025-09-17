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

export interface ShieldRing {
  radius: number
  rotation: number
  speed: number
  opacity: number
  segments: number
  active: boolean
}

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
  bombType: "normal" | "cluster" | "freeze" | "poison" | "homing"
  homingTarget?: Enemy
  clusterCount: number
  freezeDuration: number
  poisonDamage: number
  poisonDuration: number
  trail: { x: number; y: number; time: number }[]
  glowIntensity: number
  // Visual styling for non-emoji decorative bombs
  gradient?: string[]
  color?: string
  shape?: 'orb' | 'cube' | 'gem'
}

export interface PlayerAbility {
  id: string
  name: string
  description: string
  cooldown: number
  energyCost: number
  duration: number
  effect: (game: GameEngine) => void
  icon: string
  unlocked: boolean
}

export interface PowerUp extends GameObject {
  type: "health" | "shield" | "energy" | "speed" | "damage" | "multishot" | "freeze" | "invulnerability"
  value: number
  duration: number
  rarity: "common" | "rare" | "epic" | "legendary"
  glowColor: string
  pulseScale: number
  rotationSpeed: number
}

export interface Projectile extends GameObject {
  damage: number
  speed: number
  target?: Enemy
  homing: boolean
  piercing: boolean
  trail: { x: number; y: number; time: number }[]
  glowColor: string
}

export interface ScreenShake {
  intensity: number
  duration: number
  frequency: number
  decay: number
}

export interface Camera {
  x: number
  y: number
  zoom: number
  targetX: number
  targetY: number
  targetZoom: number
  shake: ScreenShake
  followSpeed: number
  zoomSpeed: number
}

export interface Explosion extends GameObject {
  emoji: string
  timer: number
  maxTimer: number
  // Optional decorative shockwave ring for richer explosions
  ring?: {
    maxRadius: number
    color?: string
    strokeWidth?: number
  }
}

export class GameEngine {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  gl: WebGLRenderingContext | null = null
  width: number
  height: number

  // Game objects
  player: Player
  enemies: Enemy[] = []
  bombs: Bomb[] = []
  explosions: Explosion[] = []
  particles: Particle[] = []
  powerUps: PowerUp[] = []
  projectiles: Projectile[] = []

  // Game state
  isRunning = false
  isPaused = false
  score = 0
  level = 1
  gameTime = 0
  enemySpawnTimer = 0
  waveNumber = 1
  waveEnemiesKilled = 0
  waveEnemiesTotal = 10

  // Camera and effects
  camera: Camera
  screenShake: ScreenShake = { intensity: 0, duration: 0, frequency: 0, decay: 0.95 }
  
  // Input handling
  keys: Set<string> = new Set()
  mousePos: { x: number; y: number } = { x: 0, y: 0 }
  touchPos: { x: number; y: number } | null = null
  lastTouchTime = 0

  // Game settings
  enemySpawnRate = 2000 // milliseconds
  maxEnemies = 15
  difficulty = 1
  combo = 0
  comboMultiplier = 1
  comboTime = 0
  maxComboTime = 3000

  // Rendering
  private renderer: any = null
  private particleSystem: any = null
  private postProcessor: any = null
  // Interval handle for periodic shield projectiles
  private shieldProjectileInterval: number | null = null
  // Player sprite
  private playerImage: HTMLImageElement | null = null
  private playerImageLoaded = false
  private playerTrail: Array<{ x: number; y: number; alpha: number; scale: number }> = []
  
  // Audio
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private missBuffer: AudioBuffer | null = null
  private missSource: AudioBufferSourceNode | null = null
  private missStopTimeout: number | null = null
  
  // Performance
  private lastFrameTime = 0
  private frameCount = 0
  private fps = 60
  private objectPool: Map<string, GameObject[]> = new Map()
  private resizeObserver: ResizeObserver | null = null

  // Public getter for fps
  get currentFps(): number {
    return this.fps
  }

  // playerSprite can be an emoji or a path to an image (starting with '/').
  constructor(canvas: HTMLCanvasElement, playerSprite: string) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")!
  // Use CSS (layout) size for logical coordinates because the component
  // applies a DPR scale on the context (ctx.scale). This keeps engine
  // logic in CSS pixels which matches mouse/touch client coordinates.
  const rect = this.canvas.getBoundingClientRect()
  this.width = rect.width || canvas.width
  this.height = rect.height || canvas.height

    // Initialize WebGL
    this.initWebGL()
    
    // Initialize systems
    this.initAudio()
    this.initRenderer()
    this.initParticleSystem()
    this.initPostProcessor()

    // Initialize camera
    this.camera = {
      x: this.width / 2,
      y: this.height / 2,
      zoom: 1,
      targetX: this.width / 2,
      targetY: this.height / 2,
      targetZoom: 1,
      shake: { intensity: 0, duration: 0, frequency: 0, decay: 0.95 },
      followSpeed: 0.1,
      zoomSpeed: 0.05
    }

    // Initialize player with enhanced properties
    this.player = {
      x: this.width / 2,
      y: this.height / 2,
      width: 40,
      height: 40,
      vx: 0,
      vy: 0,
      active: true,
      rotation: 0,
      shieldRings: [
        { radius: 60, rotation: 0, speed: 0.02, opacity: 0, segments: 12, active: false },
        { radius: 85, rotation: 0.5, speed: 0.03, opacity: 0, segments: 16, active: false },
        { radius: 110, rotation: 1, speed: 0.04, opacity: 0, segments: 20, active: false }
      ],
      shieldActivationCost: 20,
      shieldDuration: 5000,
      shieldActivationTime: 0,
      shieldCooldown: 0,
      cameraShake: 0,
      scale: 1,
      alpha: 1,
      zIndex: 10,
      id: 'player',
      createdAt: Date.now(),
      emoji: typeof playerSprite === 'string' && !playerSprite.startsWith('/') ? playerSprite : '🧍‍♂️',
      health: 100,
      maxHealth: 100,
      bombCooldown: 0,
      speed: 200,
      shield: 0,
      maxShield: 50,
      energy: 100,
      maxEnergy: 100,
      abilities: [],
      experience: 0,
      level: 1,
      combo: 0,
      comboMultiplier: 1,
      lastDamageTime: 0,
      invulnerabilityTime: 0,
      dashCooldown: 0,
      specialCooldown: 0
    }

    // If a sprite path was provided, try to load it
    if (playerSprite && playerSprite.startsWith('/')) {
      try {
        this.playerImage = new Image()
        this.playerImage.src = playerSprite
        this.playerImage.onload = () => {
          this.playerImageLoaded = true
          // adjust player size heuristically based on image
          const w = Math.min(80, this.playerImage!.width / 2)
          this.player.width = w
          this.player.height = Math.min(80, this.playerImage!.height / 2)
        }
        this.playerImage.onerror = () => {
          this.playerImage = null
          this.playerImageLoaded = false
        }
      } catch (e) {
        this.playerImage = null
        this.playerImageLoaded = false
      }
    }

    this.setupEventListeners()
    this.initializeObjectPools()

    // Debug: log when shield rings are present
    try {
      // eslint-disable-next-line no-console
      console.debug('GameEngine initialized with shieldRings:', this.player.shieldRings.length)
    } catch (e) {}

  // Removed hardcoded loading of /charcter.png. Only load the image passed as playerSprite.

    // Keep in sync with layout changes (responsive / DPR changes done by the component)
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize())
      this.resizeObserver.observe(this.canvas)
    } else {
      // Fallback: listen for window resize
      window.addEventListener('resize', () => this.handleResize())
    }
  }

  private handleResize() {
    try {
      const rect = this.canvas.getBoundingClientRect()
      // Use CSS pixels for engine width/height
      this.width = rect.width || this.canvas.width
      this.height = rect.height || this.canvas.height

      // Notify renderer / postprocessor if present (they may use pixel sizes)
      if (this.renderer && typeof this.renderer.resize === 'function') {
        try {
          // Pass backing pixel size which is canvas.width/height
          this.renderer.resize(this.canvas.width, this.canvas.height)
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
  }

  private initWebGL() {
    try {
      const gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl')
      if (gl) {
        this.gl = gl as WebGLRenderingContext
        console.log('WebGL initialized successfully')
      }
    } catch (error) {
      console.log('WebGL not supported, falling back to 2D canvas')
    }
  }

  private initRenderer() {
    // WebGL renderer will be implemented later
    this.renderer = null
  }

  private initParticleSystem() {
    // Particle system will be implemented later
    this.particleSystem = null
  }

  private initPostProcessor() {
    // Post processor will be implemented later
    this.postProcessor = null
  }

  private initializeObjectPools() {
    this.objectPool.set('enemies', [])
    this.objectPool.set('bombs', [])
    this.objectPool.set('explosions', [])
    this.objectPool.set('particles', [])
    this.objectPool.set('powerUps', [])
    this.objectPool.set('projectiles', [])
  }

  private async initAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create gain nodes for audio mixing
      this.musicGain = this.audioContext.createGain()
      this.sfxGain = this.audioContext.createGain()
      
      this.musicGain.gain.value = 0.3
      this.sfxGain.gain.value = 0.7

      // Preload project sound effect (mac-quack.mp3) from public/ and decode into AudioBuffer
      try {
        const resp = await fetch('/mac-quack.mp3')
        if (resp.ok) {
          const array = await resp.arrayBuffer()
          try {
            // decodeAudioData returns an AudioBuffer (may return a Promise depending on browser)
            this.missBuffer = await this.audioContext.decodeAudioData(array.slice(0))
          } catch (e) {
            // Fallback older signature
            this.missBuffer = await new Promise((resolve, reject) => {
              ;(this.audioContext as AudioContext).decodeAudioData(array.slice(0), resolve, reject)
            })
          }
        }
      } catch (e) {
        this.missBuffer = null
      }
      
      this.musicGain.connect(this.audioContext.destination)
      this.sfxGain.connect(this.audioContext.destination)

      // Create enhanced sound effects
      await this.createSoundEffect("explosion", [200, 150, 100, 50], 0.5)
      await this.createSoundEffect("shoot", [800, 600, 400], 0.2)
      await this.createSoundEffect("hit", [300, 200, 150], 0.3)
      await this.createSoundEffect("pickup", [600, 800, 1000, 1200], 0.2)
      await this.createSoundEffect("powerup", [400, 600, 800], 0.3)
      await this.createSoundEffect("levelup", [200, 300, 400, 500], 0.4)
      await this.createSoundEffect("combo", [500, 700, 900], 0.2)
      await this.createSoundEffect("dash", [100, 200, 300], 0.1)
    } catch (error) {
      console.log("Audio not supported")
    }
  }

  private async createSoundEffect(name: string, frequencies: number[], duration: number) {
    if (!this.audioContext) return

    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < length; i++) {
      let sample = 0
      frequencies.forEach((freq, index) => {
        const decay = Math.exp(-i / (sampleRate * 0.1))
        sample += Math.sin((2 * Math.PI * freq * i) / sampleRate) * decay * (1 / frequencies.length)
      })
      data[i] = sample * 0.3
    }

    this.sounds.set(name, buffer)
  }

  private playSound(name: string, volume: number = 0.1, pitch: number = 1) {
    if (!this.audioContext || !this.sounds.has(name)) return

    const buffer = this.sounds.get(name)!
    const source = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()
    const pitchNode = this.audioContext.createGain()

    source.buffer = buffer
    source.playbackRate.value = pitch
    gainNode.gain.value = volume

    source.connect(pitchNode)
    pitchNode.connect(gainNode)
    gainNode.connect(this.sfxGain!)
    source.start()
  }

  private playSpatialSound(name: string, x: number, y: number, volume: number = 0.1) {
    if (!this.audioContext || !this.sounds.has(name)) return

    const buffer = this.sounds.get(name)!
    const source = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()
    const pannerNode = this.audioContext.createPanner()

    // Calculate distance-based volume
    const distance = Math.sqrt((x - this.player.x) ** 2 + (y - this.player.y) ** 2)
    const maxDistance = Math.sqrt(this.width ** 2 + this.height ** 2)
    const distanceVolume = Math.max(0, 1 - distance / maxDistance)

    source.buffer = buffer
    gainNode.gain.value = volume * distanceVolume

    // Set up 3D positioning
    pannerNode.panningModel = 'HRTF'
    pannerNode.distanceModel = 'exponential'
    pannerNode.rolloffFactor = 1
    pannerNode.maxDistance = maxDistance
    pannerNode.setPosition(x, 0, 0)

    source.connect(pannerNode)
    pannerNode.connect(gainNode)
    gainNode.connect(this.sfxGain!)
    source.start()
  }

  // Play a short miss sound using HTMLAudioElement to avoid WebAudio scheduling edge cases.
  // Behavior: if a miss sound is already playing, stop it and replay (ensures latest miss is audible).
  private playMissSound() {
    try {
      if (!this.audioContext || !this.missBuffer) return

      // Stop previous source if playing
      try {
        if (this.missSource) {
          try { this.missSource.stop() } catch (e) {}
          this.missSource.disconnect()
          this.missSource = null
        }
      } catch (e) {}

      // Create a fresh source for the buffer
      const src = this.audioContext.createBufferSource()
      src.buffer = this.missBuffer

      // Use a small gain node for this sound so it respects sfx mixing
      const g = this.audioContext.createGain()
      g.gain.value = 0.6

      src.connect(g)
      g.connect(this.sfxGain!)

      src.start()
      this.missSource = src

      // Clear any previous stop timeout and set a new one for 3s
      if (this.missStopTimeout) {
        clearTimeout(this.missStopTimeout)
      }
      this.missStopTimeout = window.setTimeout(() => {
        try {
          if (this.missSource) {
            try { this.missSource.stop() } catch (e) {}
            try { this.missSource.disconnect() } catch (e) {}
            this.missSource = null
          }
        } catch (e) {}
      }, 3000)

      // Cleanup when source naturally ends
      src.onended = () => {
        if (this.missSource === src) this.missSource = null
        if (this.missStopTimeout) { clearTimeout(this.missStopTimeout); this.missStopTimeout = null }
      }
    } catch (e) {
      // ignore audio errors
    }
  }

  addScreenShake(intensity: number, duration: number) {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity)
    this.screenShake.duration = Math.max(this.screenShake.duration, duration)
    this.screenShake.frequency = 0.1
  }

  updateCamera(deltaTime: number) {
    // Follow player with smooth interpolation
    this.camera.targetX = this.player.x
    this.camera.targetY = this.player.y

    // Apply screen shake
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= deltaTime
      const shakeX = (Math.random() - 0.5) * this.screenShake.intensity
      const shakeY = (Math.random() - 0.5) * this.screenShake.intensity
      
      this.camera.x += shakeX
      this.camera.y += shakeY
      this.screenShake.intensity *= this.screenShake.decay
    } else {
      // Smooth camera movement
      this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.followSpeed
      this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.followSpeed
    }

    // Dynamic zoom based on game intensity
    const enemyCount = this.enemies.length
    const intensity = Math.min(1, enemyCount / 10)
    this.camera.targetZoom = 1 + intensity * 0.2

    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * this.camera.zoomSpeed
  }

  start() {
    this.isRunning = true
    this.isPaused = false
    this.gameLoop()
  }

  pause() {
    this.isPaused = !this.isPaused
  }

  stop() {
    this.isRunning = false
    this.isPaused = false
  }

  reset() {
    this.player.x = this.width / 2
    this.player.y = this.height / 2
    this.player.health = this.player.maxHealth
    this.player.bombCooldown = 0
    this.enemies = []
    this.bombs = []
    this.explosions = []
    this.particles = []
    this.score = 0
    this.level = 1
    this.gameTime = 0
    this.enemySpawnTimer = 0
  }

  gameLoop = () => {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime

    // Calculate FPS
    this.frameCount++
    if (this.frameCount % 60 === 0) {
      this.fps = Math.round(1000 / deltaTime)
    }

    if (!this.isPaused) {
      this.update(deltaTime)
    }

    this.render()

    // Use requestAnimationFrame for better performance
    requestAnimationFrame(this.gameLoop)
  }

  update(deltaTime: number) {
    this.gameTime += deltaTime

    // Update camera
    this.updateCamera(deltaTime)

    // Update player
    this.updatePlayer(deltaTime)

  // Update player trail (for afterimage / motion blur)
  this.updatePlayerTrail(deltaTime)

    // Update combo system
    this.updateCombo(deltaTime)

    // Spawn enemies
    this.updateEnemySpawning(deltaTime)

    // Update game objects
    this.updateEnemies(deltaTime)
    this.updateBombs(deltaTime)
    this.updateExplosions(deltaTime)
    this.updatePowerUps(deltaTime)
    this.updateProjectiles(deltaTime)
    // Update shield rings
    this.updateShieldRings(deltaTime)

    // Update particle system
    if (this.particleSystem) {
      this.particleSystem.update(deltaTime)
    }

    // Check collisions
    this.checkCollisions()

    // Update level progression
    this.updateLevel()

    // Update wave system
    this.updateWave(deltaTime)

    // Check game over
    if (this.player.health <= 0) {
      this.stop()
    }
  }

  private updatePlayerTrail(deltaTime: number) {
    // push current pos (subtle afterimage)
    this.playerTrail.push({ x: this.player.x, y: this.player.y, alpha: 0.4, scale: this.player.scale })
    // limit length to keep it subtle and performant
    if (this.playerTrail.length > 5) this.playerTrail.shift()

    // decay alphas with slightly faster falloff for a cleaner look
    for (let i = 0; i < this.playerTrail.length; i++) {
      this.playerTrail[i].alpha *= 0.85
    }
  }

  private updateCombo(deltaTime: number) {
    if (this.combo > 0) {
      this.comboTime -= deltaTime
      if (this.comboTime <= 0) {
        this.combo = 0
        this.comboMultiplier = 1
      }
    }
  }

  private updateWave(deltaTime: number) {
    if (this.waveEnemiesKilled >= this.waveEnemiesTotal) {
      this.waveNumber++
      this.waveEnemiesKilled = 0
      this.waveEnemiesTotal = Math.min(20, 10 + this.waveNumber * 2)
      this.enemySpawnRate = Math.max(500, this.enemySpawnRate - 50)
      this.difficulty = 1 + this.waveNumber * 0.1
      
      // Spawn power-up on wave completion
      this.spawnPowerUp(this.player.x, this.player.y)
    }
  }

  private updatePowerUps(deltaTime: number) {
    this.powerUps.forEach(powerUp => {
      if (!powerUp.active) return
      
      powerUp.rotation += powerUp.rotationSpeed * deltaTime
      powerUp.scale = 1 + Math.sin(this.gameTime * 0.005) * powerUp.pulseScale
      
      // Check if power-up is picked up
      const dx = powerUp.x - this.player.x
      const dy = powerUp.y - this.player.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < (powerUp.width + this.player.width) / 2) {
        this.pickupPowerUp(powerUp)
        powerUp.active = false
      }
    })
    
    this.powerUps = this.powerUps.filter(powerUp => powerUp.active)
  }

  private updateProjectiles(deltaTime: number) {
    this.projectiles.forEach(projectile => {
      if (!projectile.active) return
      
      // Update position
      projectile.x += projectile.vx * (deltaTime / 1000)
      projectile.y += projectile.vy * (deltaTime / 1000)
      
      // Add to trail
      projectile.trail.push({
        x: projectile.x,
        y: projectile.y,
        time: this.gameTime
      })
      
      // Limit trail length
      if (projectile.trail.length > 20) {
        projectile.trail.shift()
      }
      
      // Check bounds
      if (projectile.x < 0 || projectile.x > this.width || 
          projectile.y < 0 || projectile.y > this.height) {
        projectile.active = false
      }
    })
    
    this.projectiles = this.projectiles.filter(projectile => projectile.active)
  }

  updatePlayer(deltaTime: number) {
    // Handle input
    let moveX = 0
    let moveY = 0

    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) moveY -= 1
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) moveY += 1
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) moveX -= 1
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) moveX += 1

    // Touch movement
    if (this.touchPos) {
      const dx = this.touchPos.x - this.player.x
      const dy = this.touchPos.y - this.player.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 30) {
        moveX = dx / distance
        moveY = dy / distance
      }
    }

    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.707
      moveY *= 0.707
    }

    // Apply movement
    this.player.x += moveX * this.player.speed * (deltaTime / 1000)
    this.player.y += moveY * this.player.speed * (deltaTime / 1000)

    // Keep player in bounds
    this.player.x = Math.max(this.player.width / 2, Math.min(this.width - this.player.width / 2, this.player.x))
    this.player.y = Math.max(this.player.height / 2, Math.min(this.height - this.player.height / 2, this.player.y))

    // Update bomb cooldown
    if (this.player.bombCooldown > 0) {
      this.player.bombCooldown -= deltaTime
    }

    // Emit subtle movement particles when moving fast
    const speed = Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy)
    if (speed > 70) {
      // Emit fewer particles but with softer visuals for premium feel
      if (Math.random() < Math.min(0.18, speed / 1400)) {
        this.particles.push({
          x: this.player.x + (Math.random() - 0.5) * 8,
          y: this.player.y + (Math.random() - 0.5) * 8,
          width: 10 + Math.random() * 6,
          height: 10 + Math.random() * 6,
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30 - 6,
          active: true,
          rotation: 0,
          scale: 1,
          alpha: 1,
          zIndex: 0,
          id: `move_particle_${Date.now()}_${Math.random()}`,
          createdAt: Date.now(),
          emoji: '✨',
          color: '#FFD700',
          size: 10 + Math.random() * 6,
          life: 360 + Math.random() * 300,
          maxLife: 360 + Math.random() * 300,
          drag: 0.98,
          type: 'spark',
          rotationSpeed: (Math.random() - 0.5) * 2,
          gradient: ['#FFD700', '#FFA500'],
        })
      }
    }
  }

  updateEnemySpawning(deltaTime: number) {
    this.enemySpawnTimer += deltaTime

    if (this.enemySpawnTimer >= this.enemySpawnRate && this.enemies.length < this.maxEnemies) {
      this.spawnEnemy()
      this.enemySpawnTimer = 0
    }
  }

  spawnEnemy() {
    const side = Math.floor(Math.random() * 4)
    let x, y

    switch (side) {
      case 0:
        x = Math.random() * this.width
        y = -30
        break
      case 1:
        x = this.width + 30
        y = Math.random() * this.height
        break
      case 2:
        x = Math.random() * this.width
        y = this.height + 30
        break
      case 3:
        x = -30
        y = Math.random() * this.height
        break
      default:
        x = 0
        y = 0
    }

    const enemyTypes = ["basic", "fast", "tank", "ninja", "boss"] as const
    const weights = [40, 25, 20, 10, 5] // Weighted spawn rates
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    const random = Math.random() * totalWeight

    let currentWeight = 0
    let selectedIndex = 0
    for (let i = 0; i < weights.length; i++) {
      currentWeight += weights[i]
      if (random <= currentWeight) {
        selectedIndex = i
        break
      }
    }

    const type = enemyTypes[selectedIndex]

    let emoji, health, speed
    switch (type) {
      case "basic":
        emoji = ["😅", "🤣", "😂", "🤐", "😇"][Math.floor(Math.random() * 5)]
        health = 1
        speed = 50 + this.level * 5
        break
      case "fast":
        emoji = ["😘", "☺️", "🤩", "😊", "🙃"][Math.floor(Math.random() * 5)]
        health = 1
        speed = 100 + this.level * 8
        break
      case "tank":
        emoji = ["🤭", "🫡", "😋", "🥲", "😇"][Math.floor(Math.random() * 5)]
        health = 3 + Math.floor(this.level / 3)
        speed = 30 + this.level * 2
        break
      case "ninja":
        emoji = ["🤐", "😊", "🙃", "🤭", "😋"][Math.floor(Math.random() * 5)]
        health = 2
        speed = 80 + this.level * 6
        break
      case "boss":
        emoji = ["🤩", "😇", "🫡", "🤣", "😂"][Math.floor(Math.random() * 5)]
        health = 5 + Math.floor(this.level / 2)
        speed = 40 + this.level * 3
        break
    }

    this.enemies.push({
      x,
      y,
      width: type === "boss" ? 50 : 30,
      height: type === "boss" ? 50 : 30,
      vx: 0,
      vy: 0,
      active: true,
      rotation: 0,
      scale: 1,
      alpha: 1,
      zIndex: 5,
      id: `enemy_${Date.now()}_${Math.random()}`,
      createdAt: Date.now(),
      emoji,
      health,
      maxHealth: health,
      speed,
      targetX: this.player.x,
      targetY: this.player.y,
      type: type as any,
      aiState: "chase",
      aiTimer: 0,
      attackCooldown: 0,
      attackRange: 50,
      damage: type === "boss" ? 25 : type === "tank" ? 15 : 10,
      experienceValue: type === "boss" ? 50 : type === "tank" ? 20 : 10,
      dropChance: type === "boss" ? 0.8 : type === "tank" ? 0.3 : 0.1,
      specialAbilities: [],
      glowColor: type === "boss" ? "#ef4444" : type === "tank" ? "#f59e0b" : "#ec4899",
      particleTrail: type === "boss" || type === "tank"
    })
  }

  updateEnemies(deltaTime: number) {
    this.enemies.forEach((enemy) => {
      if (!enemy.active) return

      // Move towards player
      const dx = this.player.x - enemy.x
      const dy = this.player.y - enemy.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0) {
        enemy.x += (dx / distance) * enemy.speed * (deltaTime / 1000)
        enemy.y += (dy / distance) * enemy.speed * (deltaTime / 1000)
      }
    })

    // Remove inactive enemies
    this.enemies = this.enemies.filter((enemy) => enemy.active)
  }

  // Accept optional client coordinates (CSS pixels relative to viewport) so callers
  // can pass exact pointer/touch positions. If omitted, fall back to last known positions.
  throwBomb(clientCoords?: { x: number; y: number }) {
    if (this.player.bombCooldown > 0) return

    this.playSound("shoot")

    // Resolve client coordinates (CSS pixels relative to viewport)
    let clientX = clientCoords?.x ?? this.mousePos.x
    let clientY = clientCoords?.y ?? this.mousePos.y

    if (this.touchPos && !clientCoords) {
      clientX = this.touchPos.x
      clientY = this.touchPos.y
    }

    // Get canvas DOM rect to convert CSS pixels to canvas-local coordinates
    const rect = this.canvas.getBoundingClientRect()
    // If rect.width/height are zero (detached), fallback to engine width/height
    const cssWidth = rect.width || this.width
    const cssHeight = rect.height || this.height

    // Convert client (viewport) coordinates -> canvas-local CSS coordinates
    // clientX/clientY are expected to be relative to the canvas when stored by event handlers
    const canvasLocalX = clientX - rect.left
    const canvasLocalY = clientY - rect.top

    // Map CSS pixels to engine logical coordinates (we keep engine in CSS pixels)
    const canvasX = (canvasLocalX / cssWidth) * this.width
    const canvasY = (canvasLocalY / cssHeight) * this.height

    // Convert canvas coordinates to world coordinates (inverse of the camera transform used in render)
    const targetX = this.camera.x - this.width / 2 + canvasX / this.camera.zoom
    const targetY = this.camera.y - this.height / 2 + canvasY / this.camera.zoom

    const dx = targetX - this.player.x
    const dy = targetY - this.player.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance === 0) return

  const speed = 300 + this.level * 20
  const vx = (dx / distance) * speed
  const vy = (dy / distance) * speed

    const bombEmojis = ["🤐", "🫡", "😋", "🥲", "🤭"]
    const selectedBomb = bombEmojis[Math.floor(Math.random() * bombEmojis.length)]

    // Factor in player's bombPower if available (fallback 0)
    const playerBombPower = (this.player as any).bombPower || 0

    this.bombs.push({
      x: this.player.x,
      y: this.player.y,
      width: 20,
      height: 20,
      vx,
      vy,
      active: true,
      rotation: 0,
      scale: 1,
      alpha: 1,
      zIndex: 3,
      id: `bomb_${Date.now()}_${Math.random()}`,
      createdAt: Date.now(),
  // Use decorative orb visuals instead of plain emoji for impact
  emoji: '',
  gradient: ['#FFD580', '#FF6B6B'],
  color: '#FFB86B',
  shape: 'orb',
      timer: 2000,
      maxTimer: 2000,
      explosionRadius: 80 + this.level * 5 + playerBombPower * 6,
      damage: 2 + Math.floor(this.level / 3) + playerBombPower,
      bombType: "normal",
      clusterCount: 0,
      freezeDuration: 0,
      poisonDamage: 0,
      poisonDuration: 0,
      trail: [],
      glowIntensity: 1
    })

    this.player.bombCooldown = Math.max(300, 500 - this.level * 10)
  }

  updateBombs(deltaTime: number) {
    this.bombs.forEach((bomb) => {
      if (!bomb.active) return

      // Move bomb
      bomb.x += bomb.vx * (deltaTime / 1000)
      bomb.y += bomb.vy * (deltaTime / 1000)

      // Update timer
      bomb.timer -= deltaTime

      this.enemies.forEach((enemy) => {
        if (!enemy.active) return

        const dx = enemy.x - bomb.x
        const dy = enemy.y - bomb.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Direct hit collision detection
        if (distance <= (enemy.width + bomb.width) / 2) {
          this.explodeBomb(bomb)
          bomb.active = false
          return
        }
      })

      // Explode when timer reaches 0 or hits boundary
      if (bomb.timer <= 0 || bomb.x < 0 || bomb.x > this.width || bomb.y < 0 || bomb.y > this.height) {
        this.explodeBomb(bomb)
        bomb.active = false
      }
    })

    // Remove inactive bombs
    this.bombs = this.bombs.filter((bomb) => bomb.active)
  }

  explodeBomb(bomb: Bomb) {
    // Play explosion with slight pitch variance for richness
    const pitch = 0.9 + Math.random() * 0.3
    this.playSound("explosion", 0.14, pitch)

    const explosionEmojis = ["😅", "🤣", "😂", "🤩", "😇", "😊"]

    // Add an explosion object with optional decorative ring
    this.explosions.push({
      x: bomb.x,
      y: bomb.y,
      width: bomb.explosionRadius * 2,
      height: bomb.explosionRadius * 2,
      vx: 0,
      vy: 0,
      active: true,
      rotation: 0,
      scale: 1,
      alpha: 1,
      zIndex: 8,
      id: `explosion_${Date.now()}_${Math.random()}`,
      createdAt: Date.now(),
      emoji: explosionEmojis[Math.floor(Math.random() * explosionEmojis.length)],
      timer: 600,
      maxTimer: 600,
      ring: {
        maxRadius: bomb.explosionRadius * 1.6,
        color: '#FFD580',
        strokeWidth: 6
      }
    })

    let anyHit = false
  this.enemies.forEach((enemy) => {
      const dx = enemy.x - bomb.x
      const dy = enemy.y - bomb.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // More precise collision detection using actual radius
        if (distance <= bomb.explosionRadius + enemy.width / 2) {
        anyHit = true
        enemy.health -= bomb.damage
          this.playSound("hit")

          // brief camera punch for hit
          this.addScreenShake(4, 120)

        if (enemy.health <= 0) {
          enemy.active = false
          const baseScore = enemy.type === "boss" ? 50 : enemy.type === "tank" ? 20 : 10
          this.score += baseScore * this.level
          this.playSound("pickup")

          // stronger screen shake on kill
          this.addScreenShake(8, 260)

          // Micro slow-motion effect (if supported)
          try {
            if ((this as any).timeScale !== undefined) {
              const prevScale = (this as any).timeScale
              ;(this as any).timeScale = Math.max(0.35, prevScale * 0.35)
              setTimeout(() => { try { (this as any).timeScale = prevScale } catch (e) {} }, 140)
            }
          } catch (e) {}

          // Spawn non-emoji shard particles for satisfying shatter effect
          this.createShardParticles(enemy.x, enemy.y, 14, ['#FFB86B','#FF6B6B','#FFD56B'])
        } else {
          // emoji hit sparks with brighter gradients
          this.createParticles(enemy.x, enemy.y, ["😅", "🤣", "😂"])
        }
      }
    })

    // Decorative spark burst at explosion center (colorful)
    this.createParticles(bomb.x, bomb.y, ["✨", "�", "🎇", "🤩"])

    // Shatter the thrown orb into colored shards for visual payoff
    this.createShardParticles(bomb.x, bomb.y, 18, ['#FFB86B', '#FF6B6B', '#FFD56B'])

    // If explosion did not hit any enemy, play the miss sound
    if (!anyHit) {
      this.playMissSound()
    }
  }

  updateExplosions(deltaTime: number) {
    this.explosions.forEach((explosion) => {
      explosion.timer -= deltaTime
      if (explosion.timer <= 0) {
        explosion.active = false
      }
    })

    this.explosions = this.explosions.filter((explosion) => explosion.active)
  }

  createParticles(x: number, y: number, emojis: string | string[]) {
    const emojiArray = Array.isArray(emojis) ? emojis : [emojis]

    const particleCount = Math.random() * 5 + 3

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        width: Math.random() * 10 + 10,
        height: Math.random() * 10 + 10,
        vx: (Math.random() - 0.5) * 150,
        vy: (Math.random() - 0.5) * 150,
        active: true,
        rotation: 0,
        scale: 1,
        alpha: 1,
        zIndex: 1,
        id: `particle_${Date.now()}_${Math.random()}`,
        createdAt: Date.now(),
        emoji: emojiArray[Math.floor(Math.random() * emojiArray.length)],
        color: '#FFD700',
        size: Math.random() * 10 + 10,
        life: Math.random() * 500 + 800,
        maxLife: Math.random() * 500 + 800,
        rotationSpeed: (Math.random() - 0.5) * 15,
        drag: 0.98,
        type: 'explosion',
        gradient: ['#FFD700', '#FFA500'],
      })
    }
  }

  // Create non-emoji shattering fragment particles (used for enemy deaths)
  createShardParticles(x: number, y: number, count = 10, colors?: string[]) {
    const shardCount = Math.max(4, Math.min(32, count))
    const palette = colors && colors.length ? colors : ['#F97316','#FB7185','#F59E0B','#F43F5E','#FDE68A']

    for (let s = 0; s < shardCount; s++) {
      const a = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 8
      const size = 6 + Math.random() * 10
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        width: size,
        height: size,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - (Math.random() * 2),
        active: true,
        rotation: a,
        scale: 1,
        alpha: 1,
        zIndex: 7,
        id: `shard_${Date.now()}_${Math.random()}`,
        createdAt: Date.now(),
        color: palette[Math.floor(Math.random() * palette.length)],
        size,
        life: 600 + Math.random() * 800,
        maxLife: 600 + Math.random() * 800,
        drag: 0.96,
        type: 'trail',
        emoji: '', // empty => draw as colored shard in renderer
        rotationSpeed: (Math.random() - 0.5) * 1.2,
      })
    }
  }

  updateParticles(deltaTime: number) {
    this.particles.forEach((particle) => {
      particle.x += particle.vx * (deltaTime / 1000)
      particle.y += particle.vy * (deltaTime / 1000)
      particle.rotation += particle.rotationSpeed * (deltaTime / 1000)
      particle.life -= deltaTime

      if (particle.life <= 0) {
        particle.active = false
      }
    })

    this.particles = this.particles.filter((particle) => particle.active)
  }

  checkCollisions() {
    this.enemies.forEach((enemy) => {
      if (!enemy.active) return

      const dx = enemy.x - this.player.x
      const dy = enemy.y - this.player.y
      const distance = Math.sqrt(dx * dx + dy * dy)

        // Shield ring collision check
        let shieldBlocked = false;
        if (this.player.shieldRings && this.player.shieldRings.some(ring => ring.active)) {
          this.player.shieldRings.forEach((ring, ringIndex) => {
            if (!ring.active) return;
            // Increase tolerance slightly to account for coordinate rounding and dynamic enemy sizes
            const tolerance = Math.max(16, enemy.width / 2 + 12);
            const ringCollision = Math.abs(distance - ring.radius) < tolerance;
            if (ringCollision) {
              // Damage enemy and block
              enemy.health -= 10 * (ringIndex + 1); // Outer rings do more damage
              shieldBlocked = true;
              // Optional: deactivate shield ring after hit
              // ring.active = false;
              this.createParticles(enemy.x, enemy.y, ["✨", "🛡️"]);
                try { console.debug('shield blocked enemy', { enemyId: enemy.id, ringIndex, distance, ringRadius: ring.radius, enemyHealth: enemy.health }); } catch (e) {}
              this.playSound("shield");
                // Add a satisfying screen shake and small particle burst on block
                this.addScreenShake(6 + ringIndex * 2, 180);
                this.createParticles(enemy.x, enemy.y, ["💥", "✨"]);
            }
          });
        }
        if (!shieldBlocked && distance < (enemy.width + this.player.width) / 2.5) {
          const damage = enemy.type === "boss" ? 25 : enemy.type === "tank" ? 15 : 10;
          this.player.health -= damage;
          enemy.active = false;
          this.playSound("hit");
          this.createParticles(enemy.x, enemy.y, ["😅", "🤣", "😂", "🤐"]);
        } else if (shieldBlocked && enemy.health <= 0) {
          enemy.active = false;
          // Shield-blocked death: show shards rather than emojis
          this.createShardParticles(enemy.x, enemy.y, 12)
        }
    })
  }

  updateLevel() {
    const newLevel = Math.floor(this.score / 100) + 1
    if (newLevel > this.level) {
      this.level = newLevel
      this.enemySpawnRate = Math.max(500, this.enemySpawnRate - 100)
      this.maxEnemies = Math.min(20, this.maxEnemies + 2)
    }
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height)

    // Apply camera transform
    this.ctx.save()
    this.ctx.translate(-this.camera.x + this.width / 2, -this.camera.y + this.height / 2)
    this.ctx.scale(this.camera.zoom, this.camera.zoom)

    // Draw background with dynamic effects
    this.drawAdvancedBackground()

    // Draw game objects with enhanced effects
    this.drawEnemies()
    this.drawBombs()
    this.drawExplosions()
    this.drawPowerUps()
    this.drawProjectiles()
    this.drawPlayer()

    // Draw particle system
    if (this.particleSystem) {
      this.particleSystem.render(this.ctx)
    }

    this.ctx.restore()

    // Draw UI (not affected by camera)
    this.drawAdvancedUI()

    if (this.isPaused) {
      this.drawPauseOverlay()
    }
  }

  private drawAdvancedBackground() {
    // Create dynamic gradient based on game state
    const intensity = Math.min(1, this.enemies.length / 10)
    const time = this.gameTime * 0.001
    
    const gradient = this.ctx.createRadialGradient(
      this.camera.x,
      this.camera.y,
      0,
      this.camera.x,
      this.camera.y,
      Math.max(this.width, this.height) * 1.5,
    )
    
    // Dynamic colors based on intensity
    const baseColor1 = `hsl(${240 + intensity * 60}, 70%, ${20 + intensity * 10}%)`
    const baseColor2 = `hsl(${280 + intensity * 40}, 60%, ${15 + intensity * 5}%)`
    const baseColor3 = `hsl(${320 + intensity * 20}, 50%, ${10 + intensity * 3}%)`
    
    gradient.addColorStop(0, baseColor1)
    gradient.addColorStop(0.5, baseColor2)
    gradient.addColorStop(1, baseColor3)

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(
      this.camera.x - this.width,
      this.camera.y - this.height,
      this.width * 2,
      this.height * 2
    )

    // Draw animated grid
    this.drawAnimatedGrid()
    
    // Draw energy waves
    this.drawEnergyWaves()
  }

  private drawAnimatedGrid() {
    const gridSize = 50
    const time = this.gameTime * 0.001
    const offsetX = (this.camera.x % gridSize) - gridSize
    const offsetY = (this.camera.y % gridSize) - gridSize
    
    this.ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 + Math.sin(time) * 0.05})`
    this.ctx.lineWidth = 1
    
    // Vertical lines
    for (let x = offsetX; x < this.camera.x + this.width; x += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, this.camera.y - this.height)
      this.ctx.lineTo(x, this.camera.y + this.height)
      this.ctx.stroke()
    }
    
    // Horizontal lines
    for (let y = offsetY; y < this.camera.y + this.height; y += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(this.camera.x - this.width, y)
      this.ctx.lineTo(this.camera.x + this.width, y)
      this.ctx.stroke()
    }
  }

  private drawEnergyWaves() {
    const time = this.gameTime * 0.002
    const centerX = this.camera.x
    const centerY = this.camera.y
    
    for (let i = 0; i < 3; i++) {
      const radius = 100 + i * 150 + Math.sin(time + i) * 50
      const alpha = 0.1 - i * 0.03
      
      this.ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      this.ctx.stroke()
    }
  }

  private drawAdvancedUI() {
    // Create glassmorphism effect for UI
    this.ctx.save()
    
    // Background blur effect
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    this.ctx.fillRect(0, 0, this.width, 80)
    
    // Top UI bar
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    this.ctx.fillRect(0, 0, this.width, 60)
    
    // Add border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(0, 0, this.width, 60)
    
    // Draw UI elements
    this.drawScore()
    this.drawHealthBar()
    this.drawEnergyBar()
    this.drawComboDisplay()
    this.drawWaveInfo()
    this.drawFPS()
    
    this.ctx.restore()
  }

  private drawScore() {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 24px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`Score: ${this.score.toLocaleString()}`, 20, 35)
  }

  private drawHealthBar() {
    const barWidth = 200
    const barHeight = 20
    const x = this.width - barWidth - 20
    const y = 20
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    this.ctx.fillRect(x, y, barWidth, barHeight)
    
    // Health bar
    const healthPercent = this.player.health / this.player.maxHealth
    const gradient = this.ctx.createLinearGradient(x, y, x + barWidth, y)
    
    if (healthPercent > 0.6) {
      gradient.addColorStop(0, '#10b981')
      gradient.addColorStop(1, '#34d399')
    } else if (healthPercent > 0.3) {
      gradient.addColorStop(0, '#f59e0b')
      gradient.addColorStop(1, '#fbbf24')
    } else {
      gradient.addColorStop(0, '#ef4444')
      gradient.addColorStop(1, '#f87171')
    }
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight)
    
    // Shield bar
    if (this.player.shield > 0) {
      const shieldPercent = this.player.shield / this.player.maxShield
      this.ctx.fillStyle = 'rgba(59, 130, 246, 0.8)'
      this.ctx.fillRect(x, y - 5, barWidth * shieldPercent, 5)
    }
    
    // Border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x, y, barWidth, barHeight)
  }

  private drawEnergyBar() {
    const barWidth = 150
    const barHeight = 15
    const x = this.width - barWidth - 20
    const y = 50
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    this.ctx.fillRect(x, y, barWidth, barHeight)
    
    // Energy bar
    const energyPercent = this.player.energy / this.player.maxEnergy
    const gradient = this.ctx.createLinearGradient(x, y, x + barWidth, y)
    gradient.addColorStop(0, '#8b5cf6')
    gradient.addColorStop(1, '#a78bfa')
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(x, y, barWidth * energyPercent, barHeight)
    
    // Border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x, y, barWidth, barHeight)
  }

  private drawComboDisplay() {
    if (this.combo > 0) {
      const x = this.width / 2
      const y = 100
      
      this.ctx.fillStyle = `rgba(255, 215, 0, ${this.comboTime / this.maxComboTime})`
      this.ctx.font = 'bold 32px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(`${this.combo}x COMBO!`, x, y)
      
      // Glow effect
      this.ctx.shadowColor = '#ffd700'
      this.ctx.shadowBlur = 20
      this.ctx.fillText(`${this.combo}x COMBO!`, x, y)
      this.ctx.shadowBlur = 0
    }
  }

  private drawWaveInfo() {
    const x = 20
    const y = 60
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '16px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`Wave ${this.waveNumber}`, x, y)
    this.ctx.fillText(`Enemies: ${this.waveEnemiesKilled}/${this.waveEnemiesTotal}`, x, y + 20)
  }

  private drawFPS() {
    const x = this.width - 100
    const y = 60
    
    this.ctx.fillStyle = this.fps >= 55 ? '#10b981' : this.fps >= 30 ? '#f59e0b' : '#ef4444'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'right'
    this.ctx.fillText(`FPS: ${this.fps}`, x, y)
  }

  private drawPowerUps() {
    this.powerUps.forEach(powerUp => {
      if (!powerUp.active) return
      
      this.ctx.save()
      this.ctx.translate(powerUp.x, powerUp.y)
      this.ctx.rotate(powerUp.rotation)
      this.ctx.scale(powerUp.scale, powerUp.scale)
      this.ctx.globalAlpha = powerUp.alpha
      
      // Glow effect
      this.ctx.shadowColor = powerUp.glowColor
      this.ctx.shadowBlur = 15
      
      // Draw power-up icon
      this.ctx.font = `${powerUp.width}px Arial`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillStyle = powerUp.glowColor
      this.ctx.fillText(this.getPowerUpEmoji(powerUp.type), 0, 0)
      
      this.ctx.restore()
    })
  }

  private drawProjectiles() {
    this.projectiles.forEach(projectile => {
      if (!projectile.active) return
      
      this.ctx.save()
      this.ctx.translate(projectile.x, projectile.y)
      this.ctx.rotate(projectile.rotation)
      this.ctx.globalAlpha = projectile.alpha
      
      // Glow effect
      this.ctx.shadowColor = projectile.glowColor
      this.ctx.shadowBlur = 10
      
      // Draw projectile
      this.ctx.fillStyle = projectile.glowColor
      this.ctx.beginPath()
      this.ctx.arc(0, 0, projectile.width / 2, 0, Math.PI * 2)
      this.ctx.fill()
      
      // Draw trail
      if (projectile.trail.length > 1) {
        this.ctx.strokeStyle = projectile.glowColor
        this.ctx.lineWidth = 2
        this.ctx.globalAlpha = 0.5
        this.ctx.beginPath()
        this.ctx.moveTo(projectile.trail[0].x - projectile.x, projectile.trail[0].y - projectile.y)
        for (let i = 1; i < projectile.trail.length; i++) {
          this.ctx.lineTo(projectile.trail[i].x - projectile.x, projectile.trail[i].y - projectile.y)
        }
        this.ctx.stroke()
      }
      
      this.ctx.restore()
    })
  }

  private getPowerUpEmoji(type: string): string {
    const emojis = {
      health: '❤️',
      shield: '🛡️',
      energy: '⚡',
      speed: '💨',
      damage: '💥',
      multishot: '🎯',
      freeze: '❄️',
      invulnerability: '✨'
    }
    return emojis[type as keyof typeof emojis] || '❓'
  }

  private spawnPowerUp(x: number, y: number) {
    const types = ['health', 'shield', 'energy', 'speed', 'damage', 'multishot', 'freeze', 'invulnerability'] as const
    const rarities = ['common', 'rare', 'epic', 'legendary'] as const
    const rarityWeights = [50, 30, 15, 5]
    
    const type = types[Math.floor(Math.random() * types.length)]
    const rarity = this.weightedRandom(rarities, rarityWeights)
    
    const powerUp: PowerUp = {
      x: x + (Math.random() - 0.5) * 100,
      y: y + (Math.random() - 0.5) * 100,
      width: 30,
      height: 30,
      vx: 0,
      vy: 0,
      active: true,
      rotation: 0,
      scale: 1,
      alpha: 1,
      zIndex: 5,
      id: `powerup_${Date.now()}`,
      createdAt: Date.now(),
      type: type as PowerUp['type'],
      value: this.getPowerUpValue(type, rarity),
      duration: this.getPowerUpDuration(type, rarity),
      rarity: rarity as PowerUp['rarity'],
      glowColor: this.getRarityColor(rarity),
      pulseScale: 0.2,
      rotationSpeed: 0.02
    }
    
    this.powerUps.push(powerUp)
  }

  private weightedRandom<T>(items: readonly T[], weights: readonly number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return items[i]
      }
    }
    
    return items[items.length - 1]
  }

  private getPowerUpValue(type: string, rarity: string): number {
    const baseValues = {
      health: 25,
      shield: 20,
      energy: 30,
      speed: 1.5,
      damage: 2,
      multishot: 3,
      freeze: 2000,
      invulnerability: 3000
    }
    
    const rarityMultipliers = {
      common: 1,
      rare: 1.5,
      epic: 2,
      legendary: 3
    }
    
    return baseValues[type as keyof typeof baseValues] * rarityMultipliers[rarity as keyof typeof rarityMultipliers]
  }

  private getPowerUpDuration(type: string, rarity: string): number {
    const baseDurations = {
      health: 0,
      shield: 10000,
      energy: 0,
      speed: 8000,
      damage: 10000,
      multishot: 15000,
      freeze: 0,
      invulnerability: 0
    }
    
    const rarityMultipliers = {
      common: 1,
      rare: 1.2,
      epic: 1.5,
      legendary: 2
    }
    
    return baseDurations[type as keyof typeof baseDurations] * rarityMultipliers[rarity as keyof typeof rarityMultipliers]
  }

  private getRarityColor(rarity: string): string {
    const colors = {
      common: '#10b981',
      rare: '#3b82f6',
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    }
    return colors[rarity as keyof typeof colors] || '#ffffff'
  }

  private pickupPowerUp(powerUp: PowerUp) {
    this.playSound('powerup', 0.3)
    
    // Emit pickup particles
    if (this.particleSystem) {
      this.particleSystem.emitSparkle(powerUp.x, powerUp.y, 10, powerUp.glowColor)
    }
    
    switch (powerUp.type) {
      case 'health':
        this.player.health = Math.min(this.player.maxHealth, this.player.health + powerUp.value)
        break
      case 'shield':
        this.player.shield = Math.min(this.player.maxShield, this.player.shield + powerUp.value)
        break
      case 'energy':
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + powerUp.value)
        break
      case 'speed':
        // Apply speed boost temporarily
        this.player.speed *= powerUp.value
        setTimeout(() => {
          this.player.speed /= powerUp.value
        }, powerUp.duration)
        break
      case 'damage':
        // Apply damage boost temporarily
        // This would need to be implemented in the bomb system
        break
      case 'multishot':
        // Apply multishot temporarily
        // This would need to be implemented in the bomb system
        break
      case 'freeze':
        // Freeze all enemies
        this.enemies.forEach(enemy => {
          enemy.aiState = 'stunned'
          setTimeout(() => {
            enemy.aiState = 'chase'
          }, powerUp.value)
        })
        break
      case 'invulnerability':
        this.player.invulnerabilityTime = powerUp.value
        break
    }
  }

  private drawGrid() {
    this.ctx.strokeStyle = "rgba(139, 92, 246, 0.1)"
    this.ctx.lineWidth = 1

    const gridSize = 50
    for (let x = 0; x <= this.width; x += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.height)
      this.ctx.stroke()
    }

    for (let y = 0; y <= this.height; y += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.width, y)
      this.ctx.stroke()
    }
  }

  drawPlayer() {
    // Animated player rendering with sprite support (premium, subtle visuals)
    const isMobile = window.innerWidth <= 768
    const baseSize = Math.max(this.player.width, isMobile ? 56 : 44)

  // Smoothed bobbing using low-pass for a gentler, premium motion
  const targetBob = Math.sin(this.gameTime * 0.0045) * 3.5
  // store on player to persist between frames (create if missing)
  const pAny = this.player as any
  if (pAny._bob === undefined) pAny._bob = 0
  pAny._bob += (targetBob - pAny._bob) * 0.12
  const bob = pAny._bob

  // Smoothed tilt based on vx with clamped range, lerped for smooth transitions
  const targetTilt = Math.max(-0.25, Math.min(0.25, (this.player.vx || 0) / 600))
  if (pAny._tilt === undefined) pAny._tilt = 0
  pAny._tilt += (targetTilt - pAny._tilt) * 0.14
  const tilt = pAny._tilt

    // Draw a subtle bloom/rim behind the character for a premium look
    const bloomRadius = baseSize * 0.9
    const bloomX = this.player.x
    const bloomY = this.player.y + bob
    const grad = this.ctx.createRadialGradient(bloomX, bloomY, 0, bloomX, bloomY, bloomRadius)
    grad.addColorStop(0, 'rgba(139,92,246,0.18)')
    grad.addColorStop(0.5, 'rgba(139,92,246,0.07)')
    grad.addColorStop(1, 'rgba(139,92,246,0)')
    this.ctx.save()
    this.ctx.globalCompositeOperation = 'lighter'
    this.ctx.fillStyle = grad
    this.ctx.beginPath()
    this.ctx.arc(bloomX, bloomY, bloomRadius, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.restore()

    // Draw trail afterimages (short and soft)
    for (let i = 0; i < this.playerTrail.length; i++) {
      const t = this.playerTrail[i]
      const frac = i / Math.max(1, this.playerTrail.length - 1)
      const trailScale = 1 - frac * 0.25
      const alpha = t.alpha * (1 - frac) * 0.9

      this.ctx.save()
      this.ctx.globalAlpha = alpha
      this.ctx.translate(t.x, t.y + bob * (1 - frac) * 0.6)
      this.ctx.rotate(tilt * (1 - frac) * 0.6)

      // Use a soft shadow tint instead of a hard white shadow
      this.ctx.shadowColor = 'rgba(139,92,246,0.35)'
      this.ctx.shadowBlur = 8

      if (this.playerImageLoaded && this.playerImage) {
        const w = baseSize * trailScale
        const h = (this.playerImage.height / this.playerImage.width) * w
        this.ctx.drawImage(this.playerImage, -w / 2, -h / 2, w, h)
      } else {
        this.ctx.font = `${baseSize * trailScale}px Arial`
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillStyle = `rgba(255,255,255,${alpha})`
        this.ctx.fillText(this.player.emoji, 0, 0)
      }

      this.ctx.restore()
    }

    // Main player draw with refined rim light
    this.ctx.save()
    this.ctx.globalAlpha = this.player.alpha
    this.ctx.translate(this.player.x, this.player.y + bob)
    this.ctx.rotate(tilt)

    // Subtle rim/backlight using two-step shadow: colored rim + soft edge
    this.ctx.shadowColor = 'rgba(255,255,255,0.06)'
    this.ctx.shadowBlur = isMobile ? 10 : 6

    // draw image or emoji
    if (this.playerImageLoaded && this.playerImage) {
      const w = baseSize * (this.player.scale || 1)
      const h = (this.playerImage.height / this.playerImage.width) * w
      // Slight tint behind for separation
      this.ctx.save()
      this.ctx.globalAlpha = 0.08
      this.ctx.fillStyle = '#000'
      this.ctx.beginPath()
      this.ctx.ellipse(0, h * 0.18, w * 0.55, h * 0.25, 0, 0, Math.PI * 2)
      this.ctx.fill()
      this.ctx.restore()

      this.ctx.drawImage(this.playerImage, -w / 2, -h / 2, w, h)
    } else {
      this.ctx.font = `${baseSize}px Arial`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillStyle = '#fff'
      this.ctx.fillText(this.player.emoji, 0, 0)
    }

    this.ctx.shadowBlur = 0
    this.ctx.restore()

    // Health bar above player
    const barWidth = isMobile ? 60 : 40
    const barHeight = isMobile ? 8 : 6
    const barX = this.player.x - barWidth / 2
    const barY = this.player.y - this.player.height / 2 - (isMobile ? 25 : 15)

    // Background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    this.ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2)

    // Health gradient
    const healthGradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth, barY)
    const healthPercent = this.player.health / this.player.maxHealth

    if (healthPercent > 0.6) {
      healthGradient.addColorStop(0, '#10b981')
      healthGradient.addColorStop(1, '#34d399')
    } else if (healthPercent > 0.3) {
      healthGradient.addColorStop(0, '#f59e0b')
      healthGradient.addColorStop(1, '#fbbf24')
    } else {
      healthGradient.addColorStop(0, '#ef4444')
      healthGradient.addColorStop(1, '#f87171')
    }

    this.ctx.fillStyle = healthGradient
    this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight)
    
    // Draw shield rings (overlayed on player)
    this.drawShieldRings()
  }

  // Draw shield rings around player with glow/pulse when active
  drawShieldRings() {
    if (!this.player.shieldRings || this.player.shieldRings.length === 0) return
    const time = Date.now()
    const centerX = this.player.x
    const centerY = this.player.y
    this.player.shieldRings.forEach((ring, i) => {
      const active = ring.active
      const radius = ring.radius || 80
      const opacity = Math.max(0.08, ring.opacity || 0)
      const pulse = active ? 1 + Math.sin(time * 0.004 + i) * 0.06 : 1

      // Glow layer
      this.ctx.save()
      this.ctx.globalCompositeOperation = 'lighter'
      this.ctx.globalAlpha = opacity * (active ? 0.9 : 0.3)
      this.ctx.lineWidth = 6 * (active ? 1.2 : 0.8)
      const glowGrad = this.ctx.createRadialGradient(centerX, centerY, radius * 0.6, centerX, centerY, radius * 1.6)
      glowGrad.addColorStop(0, `rgba(59,130,246,${0.35 * (active ? 1 : 0.4)})`)
      glowGrad.addColorStop(1, 'rgba(59,130,246,0)')
      this.ctx.strokeStyle = glowGrad
      this.ctx.beginPath()
      this.ctx.arc(centerX, centerY, radius * pulse, 0, Math.PI * 2)
      this.ctx.stroke()
      this.ctx.restore()

      // Ring outline
      this.ctx.save()
      this.ctx.globalAlpha = opacity * (active ? 1 : 0.4)
      this.ctx.lineWidth = 3
      this.ctx.strokeStyle = `rgba(96,165,250,${0.9 * (active ? 1 : 0.25)})`
      this.ctx.beginPath()
      this.ctx.arc(centerX, centerY, radius * pulse, 0, Math.PI * 2)
      this.ctx.stroke()
      this.ctx.restore()
    })
  }

  private drawEnemies() {
    this.enemies.forEach((enemy) => {
      if (!enemy.active) return

      if (enemy.type === "boss") {
        this.ctx.shadowColor = "#ef4444"
        this.ctx.shadowBlur = 20
      } else if (enemy.type === "ninja") {
        this.ctx.shadowColor = "#6366f1"
        this.ctx.shadowBlur = 10
      } else {
        this.ctx.shadowColor = "#ec4899"
        this.ctx.shadowBlur = 8
      }
      this.ctx.font = `${enemy.width}px Arial`
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"
      this.ctx.fillText(enemy.emoji, enemy.x, enemy.y)
      this.ctx.shadowBlur = 0

      if (enemy.health > 1) {
        const barWidth = enemy.width
        const barHeight = 4
        const barX = enemy.x - barWidth / 2
        const barY = enemy.y - enemy.height / 2 - 12

        this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
        this.ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2)

        const maxHealth =
          enemy.type === "boss"
            ? 5 + Math.floor(this.level / 2)
            : enemy.type === "tank"
              ? 3 + Math.floor(this.level / 3)
              : 2
        const healthPercent = enemy.health / maxHealth

        const healthGradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth, barY)
        healthGradient.addColorStop(0, "#ef4444")
        healthGradient.addColorStop(1, "#f87171")

        this.ctx.fillStyle = healthGradient
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight)
      }
    })
  }

  drawBombs() {
    this.bombs.forEach((bomb) => {
      if (!bomb.active) return

      const pulseScale = 1 + Math.sin(Date.now() * 0.01) * 0.06

      // If bomb has decorative visual properties, draw a glossy orb
      if ((bomb as any).shape === 'orb' || (bomb as any).gradient) {
        const gradColors = (bomb as any).gradient || ['#FFD580', '#FF6B6B']
        const r = (bomb.width / 2) * pulseScale

        // radial gradient for glossy look
        const g = this.ctx.createRadialGradient(bomb.x - r * 0.3, bomb.y - r * 0.4, r * 0.1, bomb.x, bomb.y, r)
        g.addColorStop(0, gradColors[0])
        g.addColorStop(0.6, gradColors[1] || gradColors[0])
        g.addColorStop(1, 'rgba(0,0,0,0.05)')

        this.ctx.save()
        this.ctx.globalAlpha = bomb.alpha
        this.ctx.shadowColor = (bomb as any).color || '#FFB86B'
        this.ctx.shadowBlur = 18 * (bomb.glowIntensity || 1)
        this.ctx.beginPath()
        this.ctx.fillStyle = g
        this.ctx.arc(bomb.x, bomb.y, r, 0, Math.PI * 2)
        this.ctx.fill()

        // specular highlight
        this.ctx.globalCompositeOperation = 'lighter'
        const hg = this.ctx.createRadialGradient(bomb.x - r * 0.25, bomb.y - r * 0.35, 0, bomb.x - r * 0.25, bomb.y - r * 0.35, r * 0.7)
        hg.addColorStop(0, 'rgba(255,255,255,0.9)')
        hg.addColorStop(1, 'rgba(255,255,255,0)')
        this.ctx.fillStyle = hg
        this.ctx.beginPath()
        this.ctx.arc(bomb.x - r * 0.25, bomb.y - r * 0.35, r * 0.7, 0, Math.PI * 2)
        this.ctx.fill()

        this.ctx.globalCompositeOperation = 'source-over'
        this.ctx.restore()
      } else {
        this.ctx.font = `${bomb.width * pulseScale}px Arial`
        this.ctx.textAlign = "center"
        this.ctx.textBaseline = "middle"
        this.ctx.fillText(bomb.emoji, bomb.x, bomb.y)
      }
    })
  }

  drawExplosions() {
    this.explosions.forEach((explosion) => {
      if (!explosion.active) return
      const alpha = Math.max(0, Math.min(1, explosion.timer / explosion.maxTimer))
      const progress = 1 - alpha

      // Draw decorative expanding ring if present
      if ((explosion as any).ring) {
        try {
          const ring = (explosion as any).ring
          const r = ring.maxRadius * progress
          this.ctx.save()
          this.ctx.globalAlpha = Math.max(0, 0.9 - progress)
          this.ctx.strokeStyle = ring.color || '#FFD580'
          this.ctx.lineWidth = (ring.strokeWidth || 4) * (1 - progress * 0.6)
          this.ctx.beginPath()
          this.ctx.arc(explosion.x, explosion.y, r, 0, Math.PI * 2)
          this.ctx.stroke()
          this.ctx.restore()
        } catch (e) {}
      }

      // Glow + emoji core
      const scale = 1 + progress * 0.8
      this.ctx.globalAlpha = Math.max(0.9, 1 - progress * 0.8)
      this.ctx.shadowColor = '#ffd580'
      this.ctx.shadowBlur = 36 * (1 + progress)

      this.ctx.font = `${(explosion.width / 2) * scale}px Arial`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(explosion.emoji, explosion.x, explosion.y)

      this.ctx.shadowBlur = 0
      this.ctx.globalAlpha = 1
    })
  }

  drawParticles() {
    this.particles.forEach((particle) => {
      if (!particle.active) return

      const alpha = particle.life / particle.maxLife
      this.ctx.globalAlpha = alpha

      this.ctx.save()
      this.ctx.translate(particle.x, particle.y)
      this.ctx.rotate(particle.rotation)

      // Use additive blending for sparkles for a premium visual
      if (particle.emoji === '✨') {
        this.ctx.globalCompositeOperation = 'lighter'
        this.ctx.fillStyle = `rgba(255,255,255,${Math.min(1, alpha * 1.2)})`
        this.ctx.shadowColor = 'rgba(255, 240, 200, 0.9)'
        this.ctx.shadowBlur = 12
        this.ctx.font = `${particle.width}px Arial`
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(particle.emoji, 0, 0)
        this.ctx.shadowBlur = 0
        this.ctx.globalCompositeOperation = 'source-over'
      } else if (!particle.emoji) {
        // Render non-emoji shards as small colored shapes (rotated rectangles)
        const w = particle.width || 8
        const h = particle.height || (particle.size || 8)
        // Prefer gradient if provided
        if (particle.gradient && particle.gradient.length >= 2) {
          const g = this.ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2)
          const stops = particle.gradient.length
          particle.gradient.forEach((c: string, idx: number) => {
            g.addColorStop(idx / Math.max(1, stops - 1), c)
          })
          this.ctx.fillStyle = g
        } else {
          this.ctx.fillStyle = particle.color || '#fff'
        }

        this.ctx.beginPath()
        this.ctx.moveTo(-w / 2, -h / 2)
        this.ctx.lineTo(w / 2, -h / 2)
        this.ctx.lineTo(w / 2, h / 2)
        this.ctx.lineTo(-w / 2, h / 2)
        this.ctx.closePath()
        this.ctx.fill()
        // subtle stroke for depth
        this.ctx.lineWidth = Math.max(0.5, Math.min(2, (w + h) * 0.02))
        this.ctx.strokeStyle = 'rgba(0,0,0,0.08)'
        this.ctx.stroke()
      } else {
        this.ctx.font = `${particle.width}px Arial`
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(particle.emoji, 0, 0)
      }

      this.ctx.restore()
      this.ctx.globalAlpha = 1
    })
  }

  drawUI() {
    const gradient = this.ctx.createLinearGradient(0, 0, 200, 0)
    gradient.addColorStop(0, "rgba(139, 92, 246, 0.9)")
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.9)")

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(5, 5, 200, 100)

    this.ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
    this.ctx.fillRect(5, 5, 200, 100)

    this.ctx.fillStyle = "#ffffff"
    this.ctx.font = "bold 18px Arial"
    this.ctx.textAlign = "left"
    this.ctx.textBaseline = "top"
    this.ctx.fillText(`💎 ${this.score}`, 15, 15)
    this.ctx.fillText(`🎯 Level ${this.level}`, 15, 35)
    this.ctx.fillText(`❤️ ${this.player.health}`, 15, 55)

    if (this.player.bombCooldown > 0) {
      this.ctx.fillStyle = "#fbbf24"
      this.ctx.fillText("🔄 Reloading...", 15, 75)
    }
  }

  drawPauseOverlay() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    this.ctx.fillRect(0, 0, this.width, this.height)

    this.ctx.fillStyle = "#ffffff"
    this.ctx.font = "48px Arial"
    this.ctx.textAlign = "center"
    this.ctx.textBaseline = "middle"
    this.ctx.fillText("PAUSED", this.width / 2, this.height / 2)
  }

  setupEventListeners() {
    // Keyboard events
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.code)
      if (e.code === "Space") {
        e.preventDefault()
        this.throwBomb()
      }
    })

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code)
    })

    // Mouse events
    this.canvas.addEventListener("mousemove", (e) => {
      // Store raw client coordinates (viewport CSS pixels). Conversion to
      // canvas/world coordinates happens in throwBomb so it's consistent.
      this.mousePos = {
        x: e.clientX,
        y: e.clientY,
      }
    })

    this.canvas.addEventListener("click", (e) => {
      if (this.isRunning && !this.isPaused) {
        this.throwBomb({ x: e.clientX, y: e.clientY })
      }
    })

    // Touch events
    // Use non-passive listeners to allow preventDefault() and to ensure
    // touch coordinates are stored as raw client coordinates.
    this.canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault()
        const touch = e.touches[0]
        this.touchPos = {
          x: touch.clientX,
          y: touch.clientY,
        }
      },
      { passive: false } as AddEventListenerOptions
    )

    this.canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault()
        const touch = e.touches[0]
        this.touchPos = {
          x: touch.clientX,
          y: touch.clientY,
        }
      },
      { passive: false } as AddEventListenerOptions
    )

    this.canvas.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault()
        if (this.isRunning && !this.isPaused) {
          // Use changedTouches to obtain the final touch position
          const touch = (e.changedTouches && e.changedTouches[0]) || null
          if (touch) {
            this.throwBomb({ x: touch.clientX, y: touch.clientY })
          } else {
            this.throwBomb()
          }
        }
        this.touchPos = null
      },
      { passive: false } as AddEventListenerOptions
    )
  }

  // Activate shield rings if enough energy
  activateShield() {
    // Idempotent activation: if already active, refresh duration and return
    if (!this.player.shieldRings || this.player.shieldRings.length === 0) {
      this.player.shieldRings = [
        { radius: 60, rotation: 0, speed: 0.02, opacity: 0, segments: 12, active: false },
        { radius: 85, rotation: 0.5, speed: 0.03, opacity: 0, segments: 16, active: false },
        { radius: 110, rotation: 1, speed: 0.04, opacity: 0, segments: 20, active: false }
      ];
    }

    // If not enough energy, do nothing
    if (this.player.energy < this.player.shieldActivationCost) return

    const wasActive = this.player.shieldRings.some(r => r.active)

    // Deduct energy once per activation (if not already active)
    if (!wasActive) {
      this.player.energy = Math.max(0, this.player.energy - this.player.shieldActivationCost)
    }

    // Activate / refresh rings
    this.player.shieldRings = this.player.shieldRings.map((ring, index) => ({
      ...ring,
      active: true,
      opacity: 1,
      speed: 0.02 + (index * 0.01),
      radius: 60 + (index * 25),
    }));

    this.player.shieldActivationTime = Date.now()
    try { console.debug('GameEngine.activateShield: activated/refreshed rings', this.player.shieldRings); } catch (e) {}
    this.playSound('shield')

    // Start periodic shield projectiles if not already started
    if (!this.shieldProjectileInterval) {
      // use window.setInterval and store numeric id so we can clear it later
      this.shieldProjectileInterval = window.setInterval(() => {
        // only spawn projectiles while shield rings are active
        if (!this.player.shieldRings.some(r => r.active)) return
        const projectileCount = 6
        for (let i = 0; i < projectileCount; i++) {
          const angle = (i / projectileCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2
          this.projectiles.push({
            x: this.player.x + Math.cos(angle) * 50,
            y: this.player.y + Math.sin(angle) * 50,
            width: 12,
            height: 12,
            vx: Math.cos(angle) * 260,
            vy: Math.sin(angle) * 260,
            active: true,
            rotation: angle,
            scale: 1,
            alpha: 1,
            zIndex: 6,
            id: `shield_projectile_${Date.now()}_${Math.random()}`,
            createdAt: Date.now(),
            damage: 12,
            speed: 260,
            homing: false,
            piercing: true,
            trail: [],
            glowColor: '#3B82F6'
          })
        }
      }, 1400) as unknown as number
    }
  }

  // Update shield rings (timing, rotation, deactivation)
  updateShieldRings(deltaTime: number) {
    if (!this.player.shieldRings.some(ring => ring.active)) return;
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.player.shieldActivationTime;
    if (elapsedTime >= this.player.shieldDuration) {
      // Deactivate shield rings
      this.player.shieldRings = this.player.shieldRings.map(ring => ({
        ...ring,
        active: false,
        opacity: 0
      }));
      this.player.shieldActivationTime = 0;
      this.playSound("shield_off");
      // Clear periodic shield projectile spawner if running
      try {
        if (this.shieldProjectileInterval) {
          clearInterval(this.shieldProjectileInterval as any)
          this.shieldProjectileInterval = null
        }
      } catch (e) {}
    } else {
      // Rotate and fade shield rings
      this.player.shieldRings = this.player.shieldRings.map((ring, index) => ({
        ...ring,
        rotation: ring.rotation + ring.speed,
        opacity: Math.min(1, 1 - (elapsedTime / this.player.shieldDuration))
      }));
    }
  }
}
