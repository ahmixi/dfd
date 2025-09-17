export interface ScreenShake {
  duration: number
  intensity: number
  decay: number
  currentTime: number
  offsetX: number
  offsetY: number
  active: boolean
}

export class ScreenShakeManager {
  private shake: ScreenShake = {
    duration: 0,
    intensity: 0,
    decay: 0,
    currentTime: 0,
    offsetX: 0,
    offsetY: 0,
    active: false
  }

  trigger(intensity: number = 20, duration: number = 500) {
    this.shake = {
      duration,
      intensity,
      decay: intensity / duration,
      currentTime: 0,
      offsetX: 0,
      offsetY: 0,
      active: true
    }
  }

  update(deltaTime: number) {
    if (!this.shake.active) return { x: 0, y: 0 }

    this.shake.currentTime += deltaTime

    if (this.shake.currentTime >= this.shake.duration) {
      this.shake.active = false
      return { x: 0, y: 0 }
    }

    // Calculate current intensity based on decay
    const currentIntensity = this.shake.intensity * 
      (1 - (this.shake.currentTime / this.shake.duration))

    // Generate random offsets using a smooth noise function
    this.shake.offsetX = (Math.random() * 2 - 1) * currentIntensity
    this.shake.offsetY = (Math.random() * 2 - 1) * currentIntensity

    return {
      x: this.shake.offsetX,
      y: this.shake.offsetY
    }
  }

  isActive() {
    return this.shake.active
  }

  reset() {
    this.shake.active = false
    this.shake.offsetX = 0
    this.shake.offsetY = 0
  }
}

// Singleton instance
export const screenShake = new ScreenShakeManager()