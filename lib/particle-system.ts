export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  alpha: number
  rotation: number
  rotationSpeed: number
  scale: number
  gravity: number
  friction: number
  glow: boolean
  trail: { x: number; y: number; time: number }[]
  active: boolean
  gradient?: string[]
  blendMode?: 'source-over' | 'screen' | 'add' | 'multiply'
  shape?: 'circle' | 'square' | 'diamond' | 'star'
  oscillation?: {
    amplitude: number
    frequency: number
    offset: number
  }
}

export class ParticleSystem {
  private particles: Particle[] = []
  private maxParticles = 1000
  private objectPool: Particle[] = []
  
  constructor(maxParticles = 1000) {
    this.maxParticles = maxParticles
    this.initializePool()
  }
  
  private initializePool() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.objectPool.push(this.createEmptyParticle())
    }
  }

  createExplosion(x: number, y: number, radius: number, color: string) {
    const particleCount = Math.floor(radius * 2);
    for (let i = 0; i < particleCount; i++) {
      const particle = this.getPooledParticle();
      if (!particle) continue;

      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 4;
      
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = 30 + Math.random() * 20;
      particle.maxLife = particle.life;
      particle.size = 3 + Math.random() * 3;
      particle.color = color;
      particle.alpha = 1;
      particle.rotation = angle;
      particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
      particle.scale = 1;
      particle.gravity = 0.1;
      particle.friction = 0.98;
      particle.glow = true;
      particle.active = true;
      particle.gradient = [color, 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)'];
      particle.blendMode = 'screen';
    }
  }

  createEnergyBeam(startX: number, startY: number, endX: number, endY: number) {
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const particleCount = Math.floor(distance / 5);
    const angle = Math.atan2(endY - startY, endX - startX);

    for (let i = 0; i < particleCount; i++) {
      const particle = this.getPooledParticle();
      if (!particle) continue;

      const progress = i / particleCount;
      const spread = Math.random() * 10 - 5;
      
      particle.x = startX + (endX - startX) * progress + Math.cos(angle + Math.PI/2) * spread;
      particle.y = startY + (endY - startY) * progress + Math.sin(angle + Math.PI/2) * spread;
      particle.vx = (Math.random() - 0.5) * 2;
      particle.vy = (Math.random() - 0.5) * 2;
      particle.life = 20;
      particle.maxLife = 20;
      particle.size = 3;
      particle.color = '#00ff88';
      particle.alpha = 1;
      particle.rotation = angle;
      particle.rotationSpeed = 0;
      particle.scale = 1;
      particle.gravity = 0;
      particle.friction = 0.95;
      particle.glow = true;
      particle.active = true;
      particle.blendMode = 'add';
      particle.shape = 'star';
    }
  }
  
  private createEmptyParticle(): Particle {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0, size: 0,
      color: '#ffffff', alpha: 1,
      rotation: 0, rotationSpeed: 0,
      scale: 1, gravity: 0, friction: 0.98,
      glow: false, trail: [], active: false,
      gradient: [],
      blendMode: 'source-over',
      shape: 'circle',
      oscillation: { amplitude: 0, frequency: 0, offset: 0 }
    }
  }

  createShieldEffect(x: number, y: number, radius: number, segments: number) {
    const angleStep = (Math.PI * 2) / segments;
    for (let i = 0; i < segments; i++) {
      const angle = i * angleStep;
      const particle = this.getPooledParticle();
      if (!particle) continue;

      particle.x = x + Math.cos(angle) * radius;
      particle.y = y + Math.sin(angle) * radius;
      particle.vx = Math.cos(angle) * 2;
      particle.vy = Math.sin(angle) * 2;
      particle.life = 60;
      particle.maxLife = 60;
      particle.size = 8;
      particle.color = '#ffd700';
      particle.alpha = 1;
      particle.rotation = angle;
      particle.rotationSpeed = 0.1;
      particle.scale = 1;
      particle.gravity = 0;
      particle.friction = 0.98;
      particle.glow = true;
      particle.active = true;
      particle.gradient = ['#ffd700', '#ffaa00', 'rgba(255,215,0,0)'];
      particle.blendMode = 'screen';
      particle.shape = 'diamond';
      particle.oscillation = {
        amplitude: 5,
        frequency: 0.1,
        offset: Math.random() * Math.PI * 2
      };
    }
  }
  
  private getPooledParticle(): Particle | null {
    for (const particle of this.objectPool) {
      if (!particle.active) {
        return particle
      }
    }
    return null
  }
  
  emitExplosion(x: number, y: number, count: number = 20, color: string = '#ff6b6b') {
    for (let i = 0; i < count; i++) {
      const particle = this.getPooledParticle()
      if (!particle) break
      
      const angle = (Math.PI * 2 * i) / count
      const speed = 50 + Math.random() * 100
      
      particle.x = x
      particle.y = y
      particle.vx = Math.cos(angle) * speed
      particle.vy = Math.sin(angle) * speed
      particle.life = 1000 + Math.random() * 1000
      particle.maxLife = particle.life
      particle.size = 2 + Math.random() * 4
      particle.color = color
      particle.alpha = 1
      particle.rotation = Math.random() * Math.PI * 2
      particle.rotationSpeed = (Math.random() - 0.5) * 0.2
      particle.scale = 1
      particle.gravity = 0.1
      particle.friction = 0.98
      particle.glow = true
      particle.trail = []
      particle.active = true
      
      this.particles.push(particle)
    }
  }
  
  emitTrail(x: number, y: number, vx: number, vy: number, color: string = '#4ecdc4') {
    const particle = this.getPooledParticle()
    if (!particle) return
    
    particle.x = x
    particle.y = y
    particle.vx = vx * 0.3
    particle.vy = vy * 0.3
    particle.life = 500 + Math.random() * 300
    particle.maxLife = particle.life
    particle.size = 1 + Math.random() * 2
    particle.color = color
    particle.alpha = 0.8
    particle.rotation = Math.random() * Math.PI * 2
    particle.rotationSpeed = (Math.random() - 0.5) * 0.1
    particle.scale = 1
    particle.gravity = 0.05
    particle.friction = 0.95
    particle.glow = false
    particle.trail = []
    particle.active = true
    
    this.particles.push(particle)
  }
  
  emitSparkle(x: number, y: number, count: number = 5, color: string = '#ffd700') {
    for (let i = 0; i < count; i++) {
      const particle = this.getPooledParticle()
      if (!particle) break
      
      const angle = Math.random() * Math.PI * 2
      const speed = 20 + Math.random() * 40
      
      particle.x = x + (Math.random() - 0.5) * 20
      particle.y = y + (Math.random() - 0.5) * 20
      particle.vx = Math.cos(angle) * speed
      particle.vy = Math.sin(angle) * speed
      particle.life = 300 + Math.random() * 200
      particle.maxLife = particle.life
      particle.size = 1 + Math.random() * 2
      particle.color = color
      particle.alpha = 1
      particle.rotation = Math.random() * Math.PI * 2
      particle.rotationSpeed = (Math.random() - 0.5) * 0.3
      particle.scale = 1
      particle.gravity = 0.02
      particle.friction = 0.99
      particle.glow = true
      particle.trail = []
      particle.active = true
      
      this.particles.push(particle)
    }
  }
  
  emitSmoke(x: number, y: number, count: number = 8, color: string = '#666666') {
    for (let i = 0; i < count; i++) {
      const particle = this.getPooledParticle()
      if (!particle) break
      
      const angle = Math.random() * Math.PI * 2
      const speed = 10 + Math.random() * 20
      
      particle.x = x + (Math.random() - 0.5) * 10
      particle.y = y + (Math.random() - 0.5) * 10
      particle.vx = Math.cos(angle) * speed
      particle.vy = Math.sin(angle) * speed - 20
      particle.life = 2000 + Math.random() * 1000
      particle.maxLife = particle.life
      particle.size = 3 + Math.random() * 5
      particle.color = color
      particle.alpha = 0.6
      particle.rotation = Math.random() * Math.PI * 2
      particle.rotationSpeed = (Math.random() - 0.5) * 0.05
      particle.scale = 1
      particle.gravity = -0.02
      particle.friction = 0.99
      particle.glow = false
      particle.trail = []
      particle.active = true
      
      this.particles.push(particle)
    }
  }
  
  update(deltaTime: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      if (!particle.active) continue
      
      // Update position
      particle.x += particle.vx * (deltaTime / 1000)
      particle.y += particle.vy * (deltaTime / 1000)
      
      // Apply gravity
      particle.vy += particle.gravity * (deltaTime / 1000)
      
      // Apply friction
      particle.vx *= particle.friction
      particle.vy *= particle.friction
      
      // Update rotation
      particle.rotation += particle.rotationSpeed * (deltaTime / 1000)
      
      // Update life
      particle.life -= deltaTime
      
      // Update alpha based on life
      particle.alpha = particle.life / particle.maxLife
      
      // Update scale (shrink over time)
      particle.scale = particle.alpha
      
      // Add to trail
      particle.trail.push({
        x: particle.x,
        y: particle.y,
        time: particle.life
      })
      
      // Limit trail length
      if (particle.trail.length > 10) {
        particle.trail.shift()
      }
      
      // Remove dead particles
      if (particle.life <= 0) {
        particle.active = false
        this.particles.splice(i, 1)
      }
    }
  }
  
  render(ctx: CanvasRenderingContext2D) {
    ctx.save()
    
    for (const particle of this.particles) {
      if (!particle.active) continue
      
      ctx.save()
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.rotation)
      ctx.scale(particle.scale, particle.scale)
      ctx.globalAlpha = particle.alpha
      
      // Draw glow effect
      if (particle.glow) {
        ctx.shadowColor = particle.color
        ctx.shadowBlur = 10
      }
      
      // Draw particle
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2)
      ctx.fill()
      
      // Draw trail
      if (particle.trail.length > 1) {
        ctx.strokeStyle = particle.color
        ctx.lineWidth = 1
        ctx.globalAlpha = particle.alpha * 0.5
        ctx.beginPath()
        ctx.moveTo(particle.trail[0].x - particle.x, particle.trail[0].y - particle.y)
        for (let i = 1; i < particle.trail.length; i++) {
          ctx.lineTo(particle.trail[i].x - particle.x, particle.trail[i].y - particle.y)
        }
        ctx.stroke()
      }
      
      ctx.restore()
    }
    
    ctx.restore()
  }
  
  clear() {
    this.particles.forEach(particle => {
      particle.active = false
    })
    this.particles = []
  }
  
  getParticleCount(): number {
    return this.particles.filter(p => p.active).length
  }
}
