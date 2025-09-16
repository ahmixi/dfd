export class WebGLRenderer {
  private gl: WebGLRenderingContext
  private canvas: HTMLCanvasElement
  private shaderProgram: WebGLProgram | null = null
  private vertexBuffer: WebGLBuffer | null = null
  private textureBuffer: WebGLBuffer | null = null
  private textures: Map<string, WebGLTexture> = new Map()
  
  // Shader sources
  private vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    attribute vec4 a_color;
    
    uniform vec2 u_resolution;
    uniform vec2 u_camera;
    uniform float u_zoom;
    
    varying vec2 v_texCoord;
    varying vec4 v_color;
    
    void main() {
      vec2 position = (a_position - u_camera) * u_zoom;
      vec2 clipSpace = ((position / u_resolution) * 2.0) - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      
      v_texCoord = a_texCoord;
      v_color = a_color;
    }
  `
  
  private fragmentShaderSource = `
    precision mediump float;
    
    uniform sampler2D u_texture;
    uniform float u_time;
    uniform vec2 u_resolution;
    
    varying vec2 v_texCoord;
    varying vec4 v_color;
    
    void main() {
      vec4 texColor = texture2D(u_texture, v_texCoord);
      vec4 finalColor = texColor * v_color;
      
      // Add glow effect
      float glow = sin(u_time * 0.01) * 0.1 + 0.9;
      finalColor.rgb *= glow;
      
      gl_FragColor = finalColor;
    }
  `
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      throw new Error('WebGL not supported')
    }
    this.gl = gl as WebGLRenderingContext
    this.init()
  }
  
  private init() {
    this.createShaderProgram()
    this.createBuffers()
    this.setupWebGL()
  }
  
  private createShaderProgram() {
    const gl = this.gl!
    
    const vertexShader = this.createShader(gl.VERTEX_SHADER, this.vertexShaderSource)
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource)
    
    if (!vertexShader || !fragmentShader) return

    this.shaderProgram = gl.createProgram()
    if (!this.shaderProgram) return

    gl.attachShader(this.shaderProgram, vertexShader)
    gl.attachShader(this.shaderProgram, fragmentShader)
    gl.linkProgram(this.shaderProgram)

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      console.error('Shader program failed to link:', gl.getProgramInfoLog(this.shaderProgram))
    }
  }
  
  private createShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl!
    const shader = gl.createShader(type)
    if (!shader) return null

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }

    return shader
  }
  
  private createBuffers() {
    const gl = this.gl!
    
    // Create vertex buffer for quads
    this.vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    
    // Create texture coordinate buffer
    this.textureBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer)
    
    const texCoords = new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      1.0, 1.0
    ])
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)
  }
  
  private setupWebGL() {
    const gl = this.gl!
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.DEPTH_TEST)
  }
  
  createTexture(name: string, width: number, height: number): WebGLTexture | null {
    const gl = this.gl!
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    
    // Create a simple colored texture
    const pixels = new Uint8Array(width * height * 4)
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 255     // R
      pixels[i + 1] = 255 // G
      pixels[i + 2] = 255 // B
      pixels[i + 3] = 255 // A
    }
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    
    this.textures.set(name, texture)
    return texture
  }
  
  render(objects: any[], camera: any, time: number) {
    const gl = this.gl!
    if (!this.shaderProgram) return
    
    gl.useProgram(this.shaderProgram)
    
    // Set uniforms
    const resolutionLocation = gl.getUniformLocation(this.shaderProgram, 'u_resolution')
    const cameraLocation = gl.getUniformLocation(this.shaderProgram, 'u_camera')
    const zoomLocation = gl.getUniformLocation(this.shaderProgram, 'u_zoom')
    const timeLocation = gl.getUniformLocation(this.shaderProgram, 'u_time')
    
    gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height)
    gl.uniform2f(cameraLocation, camera.x, camera.y)
    gl.uniform1f(zoomLocation, camera.zoom)
    gl.uniform1f(timeLocation, time)
    
    // Render objects
    this.renderObjects(objects)
  }
  
  private renderObjects(objects: any[]) {
    const gl = this.gl!
    
    for (const obj of objects) {
      if (!obj.active) continue
      
      // Set up vertex data for quad
      const x = obj.x - obj.width / 2
      const y = obj.y - obj.height / 2
      const w = obj.width
      const h = obj.height
      
      const vertices = new Float32Array([
        x, y,
        x + w, y,
        x, y + h,
        x, y + h,
        x + w, y,
        x + w, y + h
      ])
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW)
      
      // Set up attributes
      const positionLocation = gl.getAttribLocation(this.shaderProgram!, 'a_position')
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
      
      const texCoordLocation = gl.getAttribLocation(this.shaderProgram!, 'a_texCoord')
      gl.enableVertexAttribArray(texCoordLocation)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer)
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)
      
      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
  }
  
  resize(width: number, height: number) {
    this.canvas.width = width
    this.canvas.height = height
    this.gl!.viewport(0, 0, width, height)
  }
  
  dispose() {
    const gl = this.gl!
    if (this.shaderProgram) {
      gl.deleteProgram(this.shaderProgram)
    }
    if (this.vertexBuffer) {
      gl.deleteBuffer(this.vertexBuffer)
    }
    if (this.textureBuffer) {
      gl.deleteBuffer(this.textureBuffer)
    }
    this.textures.forEach(texture => gl.deleteTexture(texture))
  }
}
