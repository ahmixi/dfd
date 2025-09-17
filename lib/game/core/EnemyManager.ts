import { Enemy, Player } from './entities'
import { ParticleSystem } from './ParticleSystem'

export class EnemyManager {
  private enemies: Enemy[] = []
  private spawnTimer = 0
  private waveTimer = 0
  private currentWave = 1
  private enemiesRemaining = 0

  constructor(
    private ctx: CanvasRenderingContext2D,
    private particles: ParticleSystem,
    private width: number,
    private height: number
  ) {}

  update(deltaTime: number, player: Player) {
    // Update spawn timers
    this.spawnTimer -= deltaTime
    this.waveTimer -= deltaTime

    // Spawn new enemies if needed
    if (this.spawnTimer <= 0 && this.enemiesRemaining > 0) {
      this.spawnEnemy()
      this.spawnTimer = this.getSpawnDelay()
      this.enemiesRemaining--
    }

    // Update existing enemies
    this.enemies.forEach(enemy => {
      if (!enemy.active) return

      // Update AI state
      this.updateEnemyAI(enemy, player, deltaTime)

      // Update position
      enemy.x += enemy.vx * deltaTime
      enemy.y += enemy.vy * deltaTime

      // Keep in bounds
      enemy.x = Math.max(enemy.width/2, Math.min(this.width - enemy.width/2, enemy.x))
      enemy.y = Math.max(enemy.height/2, Math.min(this.height - enemy.height/2, enemy.y))

      // Add particle trail if enabled
      if (enemy.particleTrail && Math.random() < 0.1) {
        this.particles.addTrail(enemy, {
          color: enemy.glowColor,
          life: 500,
          size: 3
        })
      }
    })

    // Remove dead enemies
    this.enemies = this.enemies.filter(e => e.active)
  }

  private updateEnemyAI(enemy: Enemy, player: Player, deltaTime: number) {
    // Update AI timer
    enemy.aiTimer -= deltaTime
    if (enemy.aiTimer <= 0) {
      this.changeEnemyState(enemy, player)
      enemy.aiTimer = Math.random() * 2000 + 1000
    }

    // Update behavior based on state
    switch (enemy.aiState) {
      case 'patrol':
        this.updatePatrolBehavior(enemy)
        break
      case 'chase':
        this.updateChaseBehavior(enemy, player)
        break
      case 'attack':
        this.updateAttackBehavior(enemy, player)
        break
      case 'flee':
        this.updateFleeBehavior(enemy, player)
        break
      case 'stunned':
        enemy.vx *= 0.95
        enemy.vy *= 0.95
        break
    }
  }

  private changeEnemyState(enemy: Enemy, player: Player) {
    const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y)

    if (enemy.aiState === 'stunned') return

    if (enemy.health < enemy.maxHealth * 0.3) {
      enemy.aiState = 'flee'
    } else if (distToPlayer < enemy.attackRange) {
      enemy.aiState = 'attack'
    } else if (distToPlayer < 300) {
      enemy.aiState = 'chase'
    } else {
      enemy.aiState = 'patrol'
    }
  }

  private updatePatrolBehavior(enemy: Enemy) {
    if (!enemy.targetX || !enemy.targetY) {
      enemy.targetX = Math.random() * this.width
      enemy.targetY = Math.random() * this.height
    }

    const dx = enemy.targetX - enemy.x
    const dy = enemy.targetY - enemy.y
    const dist = Math.hypot(dx, dy)

    if (dist < 10) {
      enemy.targetX = Math.random() * this.width
      enemy.targetY = Math.random() * this.height
    } else {
      enemy.vx = (dx / dist) * enemy.speed * 0.5
      enemy.vy = (dy / dist) * enemy.speed * 0.5
    }
  }

  private updateChaseBehavior(enemy: Enemy, player: Player) {
    const dx = player.x - enemy.x
    const dy = player.y - enemy.y
    const dist = Math.hypot(dx, dy)

    enemy.vx = (dx / dist) * enemy.speed
    enemy.vy = (dy / dist) * enemy.speed
  }

  private updateAttackBehavior(enemy: Enemy, player: Player) {
    enemy.attackCooldown -= 1
    if (enemy.attackCooldown <= 0) {
      const dx = player.x - enemy.x
      const dy = player.y - enemy.y
      const dist = Math.hypot(dx, dy)

      if (dist < enemy.attackRange) {
        this.attackPlayer(enemy, player)
      }
      enemy.attackCooldown = 60
    }
  }

  private updateFleeBehavior(enemy: Enemy, player: Player) {
    const dx = enemy.x - player.x
    const dy = enemy.y - player.y
    const dist = Math.hypot(dx, dy)

    enemy.vx = (dx / dist) * enemy.speed * 1.2
    enemy.vy = (dy / dist) * enemy.speed * 1.2
  }

  private attackPlayer(enemy: Enemy, player: Player) {
    if (Date.now() - player.lastDamageTime < player.invulnerabilityTime) return
    
    // Apply damage to player
    const damage = enemy.damage * (1 - player.shield / 100)
    player.health = Math.max(0, player.health - damage)
    player.lastDamageTime = Date.now()

    // Reset combo
    player.combo = 0
    player.comboMultiplier = 1

    // Visual feedback
    this.particles.addExplosion(player.x, player.y, {
      color: '#ff4444',
      size: 5,
      life: 500
    })
  }

  startWave(wave: number) {
    this.currentWave = wave
    this.enemiesRemaining = this.getWaveEnemyCount(wave)
    this.waveTimer = this.getWaveDuration(wave)
    this.spawnTimer = 0
  }

  private getWaveEnemyCount(wave: number): number {
    return Math.floor(5 + wave * 2)
  }

  private getWaveDuration(wave: number): number {
    return 30000 + wave * 5000
  }

  private getSpawnDelay(): number {
    return Math.max(300, 2000 - this.currentWave * 100)
  }

  private spawnEnemy() {
    const side = Math.floor(Math.random() * 4)
    let x, y

    switch (side) {
      case 0: // Top
        x = Math.random() * this.width
        y = -50
        break
      case 1: // Right
        x = this.width + 50
        y = Math.random() * this.height
        break
      case 2: // Bottom
        x = Math.random() * this.width
        y = this.height + 50
        break
      default: // Left
        x = -50
        y = Math.random() * this.height
        break
    }

    const enemy = this.createEnemy(x, y)
    this.enemies.push(enemy)
  }

  private createEnemy(x: number, y: number): Enemy {
    const types: Enemy['type'][] = ['basic', 'fast', 'tank']
    if (this.currentWave >= 3) types.push('ninja')
    if (this.currentWave >= 5) types.push('elite')
    if (this.currentWave % 5 === 0) types.push('mini_boss')
    if (this.currentWave % 10 === 0) types.push('boss')

    const type = types[Math.floor(Math.random() * types.length)]
    const stats = this.getEnemyStats(type)

    // Ensure all required properties are set
    return {
      x,
      y,
      width: stats.width ?? 40,
      height: stats.height ?? 40,
      vx: stats.vx ?? 0,
      vy: stats.vy ?? 0,
      rotation: stats.rotation ?? 0,
      scale: stats.scale ?? 1,
      alpha: stats.alpha ?? 1,
      zIndex: stats.zIndex ?? 2,
      attackCooldown: stats.attackCooldown ?? 60,
      emoji: stats.emoji ?? '👾',
      health: stats.health ?? 30,
      maxHealth: stats.maxHealth ?? 30,
      speed: stats.speed ?? 2,
      attackRange: stats.attackRange ?? 50,
      damage: stats.damage ?? 10,
      experienceValue: stats.experienceValue ?? 10,
      dropChance: stats.dropChance ?? 0.1,
      specialAbilities: stats.specialAbilities ?? [],
      glowColor: stats.glowColor ?? '#ff44ff',
      particleTrail: stats.particleTrail ?? false,
      type,
      active: true,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      aiState: 'chase',
      aiTimer: 1000,
      targetX: x,
      targetY: y
    }
  }

  private getEnemyStats(type: Enemy['type']): Partial<Enemy> {
    const baseStats = {
      width: 40,
      height: 40,
      vx: 0,
      vy: 0,
      rotation: 0,
      scale: 1,
      alpha: 1,
      zIndex: 2,
      attackCooldown: 60
    }

    switch (type) {
      case 'basic':
        return {
          ...baseStats,
          emoji: '👾',
          health: 30,
          maxHealth: 30,
          speed: 2,
          attackRange: 50,
          damage: 10,
          experienceValue: 10,
          dropChance: 0.1,
          specialAbilities: [],
          glowColor: '#ff44ff',
          particleTrail: false
        }
      case 'fast':
        return {
          ...baseStats,
          emoji: '💨',
          health: 20,
          maxHealth: 20,
          speed: 4,
          attackRange: 40,
          damage: 5,
          experienceValue: 15,
          dropChance: 0.15,
          specialAbilities: ['dash'],
          glowColor: '#44ff44',
          particleTrail: true
        }
      case 'tank':
        return {
          ...baseStats,
          emoji: '🛡️',
          health: 100,
          maxHealth: 100,
          speed: 1,
          attackRange: 60,
          damage: 20,
          experienceValue: 30,
          dropChance: 0.2,
          specialAbilities: ['shield'],
          glowColor: '#4444ff',
          particleTrail: false,
          scale: 1.5
        }
      // Add more enemy types as needed
      default:
        return baseStats
    }
  }

  render() {
    this.enemies.forEach(enemy => {
      if (!enemy.active) return

      this.ctx.save()
      this.ctx.translate(enemy.x, enemy.y)
      this.ctx.rotate(enemy.rotation)
      this.ctx.scale(enemy.scale, enemy.scale)

      // Draw enemy
      this.ctx.font = '32px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(enemy.emoji, 0, 0)

      // Draw health bar
      const healthWidth = 40
      const healthHeight = 4
      const healthX = -healthWidth / 2
      const healthY = -25

      this.ctx.fillStyle = '#ff4444'
      this.ctx.fillRect(healthX, healthY, healthWidth, healthHeight)

      this.ctx.fillStyle = '#44ff44'
      this.ctx.fillRect(
        healthX,
        healthY,
        (enemy.health / enemy.maxHealth) * healthWidth,
        healthHeight
      )

      this.ctx.restore()
    })
  }

  clear() {
    this.enemies = []
    this.spawnTimer = 0
    this.waveTimer = 0
    this.currentWave = 1
    this.enemiesRemaining = 0
  }

  getActiveEnemies(): Enemy[] {
    return this.enemies.filter(e => e.active)
  }

  getRemainingEnemies(): number {
    return this.enemiesRemaining + this.enemies.length
  }

  isWaveComplete(): boolean {
    return this.enemiesRemaining === 0 && this.enemies.length === 0
  }
}