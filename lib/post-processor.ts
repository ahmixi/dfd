export interface PostProcessEffect {
  name: string
  enabled: boolean
  intensity: number
  params: Record<string, any>
}

export class PostProcessor {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private effects: Map<string, PostProcessEffect> = new Map()
  private time = 0
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.initializeEffects()
  }
  
  private initializeEffects() {
    this.effects.set('bloom', {
      name: 'Bloom',
      enabled: true,
      intensity: 0.3,
      params: { threshold: 0.8, blurRadius: 10 }
    })
    
    this.effects.set('chromaticAberration', {
      name: 'Chromatic Aberration',
      enabled: false,
      intensity: 0.1,
      params: { offset: 2 }
    })
    
    this.effects.set('vignette', {
      name: 'Vignette',
      enabled: true,
      intensity: 0.4,
      params: { radius: 0.8, softness: 0.3 }
    })
    
    this.effects.set('scanlines', {
      name: 'Scanlines',
      enabled: false,
      intensity: 0.2,
      params: { count: 200, speed: 1 }
    })
    
    this.effects.set('noise', {
      name: 'Noise',
      enabled: false,
      intensity: 0.1,
      params: { grain: 0.5 }
    })
  }
  
  process(imageData: ImageData): ImageData {
    this.time += 16
    
    let processedData = imageData
    
    // Apply effects in order
    if (this.effects.get('bloom')?.enabled) {
      processedData = this.applyBloom(processedData)
    }
    
    if (this.effects.get('chromaticAberration')?.enabled) {
      processedData = this.applyChromaticAberration(processedData)
    }
    
    if (this.effects.get('vignette')?.enabled) {
      processedData = this.applyVignette(processedData)
    }
    
    if (this.effects.get('scanlines')?.enabled) {
      processedData = this.applyScanlines(processedData)
    }
    
    if (this.effects.get('noise')?.enabled) {
      processedData = this.applyNoise(processedData)
    }
    
    return processedData
  }
  
  private applyBloom(imageData: ImageData): ImageData {
    const effect = this.effects.get('bloom')!
    const data = new Uint8ClampedArray(imageData.data)
    const width = imageData.width
    const height = imageData.height
    const threshold = effect.params.threshold
    const blurRadius = effect.params.blurRadius
    
    // Extract bright areas
    const brightData = new Uint8ClampedArray(data.length)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const brightness = (r + g + b) / 3 / 255
      
      if (brightness > threshold) {
        brightData[i] = r
        brightData[i + 1] = g
        brightData[i + 2] = b
        brightData[i + 3] = data[i + 3]
      }
    }
    
    // Apply blur to bright areas
    const blurredData = this.gaussianBlur(brightData, width, height, blurRadius)
    
    // Combine original with blurred bright areas
    const result = new Uint8ClampedArray(data.length)
    for (let i = 0; i < data.length; i += 4) {
      result[i] = Math.min(255, data[i] + blurredData[i] * effect.intensity)
      result[i + 1] = Math.min(255, data[i + 1] + blurredData[i + 1] * effect.intensity)
      result[i + 2] = Math.min(255, data[i + 2] + blurredData[i + 2] * effect.intensity)
      result[i + 3] = data[i + 3]
    }
    
    return new ImageData(result, width, height)
  }
  
  private applyChromaticAberration(imageData: ImageData): ImageData {
    const effect = this.effects.get('chromaticAberration')!
    const data = new Uint8ClampedArray(imageData.data)
    const width = imageData.width
    const height = imageData.height
    const offset = effect.params.offset * effect.intensity
    
    const result = new Uint8ClampedArray(data.length)
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        
        // Red channel offset
        const rX = Math.max(0, Math.min(width - 1, x + offset))
        const rI = (y * width + rX) * 4
        
        // Blue channel offset
        const bX = Math.max(0, Math.min(width - 1, x - offset))
        const bI = (y * width + bX) * 4
        
        result[i] = data[rI]     // Red
        result[i + 1] = data[i + 1] // Green (no offset)
        result[i + 2] = data[bI + 2] // Blue
        result[i + 3] = data[i + 3] // Alpha
      }
    }
    
    return new ImageData(result, width, height)
  }
  
  private applyVignette(imageData: ImageData): ImageData {
    const effect = this.effects.get('vignette')!
    const data = new Uint8ClampedArray(imageData.data)
    const width = imageData.width
    const height = imageData.height
    const radius = effect.params.radius
    const softness = effect.params.softness
    
    const result = new Uint8ClampedArray(data.length)
    const centerX = width / 2
    const centerY = height / 2
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        const normalizedDistance = distance / maxDistance
        
        let vignette = 1
        if (normalizedDistance > radius) {
          vignette = Math.max(0, 1 - (normalizedDistance - radius) / softness)
        }
        
        result[i] = data[i] * vignette
        result[i + 1] = data[i + 1] * vignette
        result[i + 2] = data[i + 2] * vignette
        result[i + 3] = data[i + 3]
      }
    }
    
    return new ImageData(result, width, height)
  }
  
  private applyScanlines(imageData: ImageData): ImageData {
    const effect = this.effects.get('scanlines')!
    const data = new Uint8ClampedArray(imageData.data)
    const width = imageData.width
    const height = imageData.height
    const count = effect.params.count
    const speed = effect.params.speed
    
    const result = new Uint8ClampedArray(data.length)
    const scanlineHeight = height / count
    const offset = (this.time * speed) % scanlineHeight
    
    for (let y = 0; y < height; y++) {
      const scanlinePhase = ((y + offset) % scanlineHeight) / scanlineHeight
      const scanlineIntensity = Math.sin(scanlinePhase * Math.PI) * effect.intensity
      
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const darken = 1 - scanlineIntensity
        
        result[i] = data[i] * darken
        result[i + 1] = data[i + 1] * darken
        result[i + 2] = data[i + 2] * darken
        result[i + 3] = data[i + 3]
      }
    }
    
    return new ImageData(result, width, height)
  }
  
  private applyNoise(imageData: ImageData): ImageData {
    const effect = this.effects.get('noise')!
    const data = new Uint8ClampedArray(imageData.data)
    const width = imageData.width
    const height = imageData.height
    const grain = effect.params.grain
    
    const result = new Uint8ClampedArray(data.length)
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * grain * effect.intensity
      
      result[i] = Math.max(0, Math.min(255, data[i] + noise * 255))
      result[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise * 255))
      result[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 255))
      result[i + 3] = data[i + 3]
    }
    
    return new ImageData(result, width, height)
  }
  
  private gaussianBlur(data: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
    const result = new Uint8ClampedArray(data.length)
    const sigma = radius / 3
    const kernelSize = Math.ceil(radius * 2) + 1
    const kernel = this.createGaussianKernel(kernelSize, sigma)
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0, weight = 0
        
        for (let kx = 0; kx < kernelSize; kx++) {
          const px = Math.max(0, Math.min(width - 1, x + kx - Math.floor(kernelSize / 2)))
          const i = (y * width + px) * 4
          const w = kernel[kx]
          
          r += data[i] * w
          g += data[i + 1] * w
          b += data[i + 2] * w
          a += data[i + 3] * w
          weight += w
        }
        
        const i = (y * width + x) * 4
        result[i] = r / weight
        result[i + 1] = g / weight
        result[i + 2] = b / weight
        result[i + 3] = a / weight
      }
    }
    
    return result
  }
  
  private createGaussianKernel(size: number, sigma: number): number[] {
    const kernel = new Array(size)
    const center = Math.floor(size / 2)
    let sum = 0
    
    for (let i = 0; i < size; i++) {
      const x = i - center
      kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma))
      sum += kernel[i]
    }
    
    // Normalize
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum
    }
    
    return kernel
  }
  
  setEffect(name: string, enabled: boolean) {
    const effect = this.effects.get(name)
    if (effect) {
      effect.enabled = enabled
    }
  }
  
  setEffectIntensity(name: string, intensity: number) {
    const effect = this.effects.get(name)
    if (effect) {
      effect.intensity = Math.max(0, Math.min(1, intensity))
    }
  }
  
  getEffects(): PostProcessEffect[] {
    return Array.from(this.effects.values())
  }
}
