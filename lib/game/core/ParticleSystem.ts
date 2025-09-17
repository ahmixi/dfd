import * as THREE from 'three';

export interface ParticleOptions {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: string;
  size: number;
  life: number;
  decay: number;
}

export class ParticleSystem {
  private particles: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private lifetimes: Float32Array;
  private maxParticles: number;
  private particleCount: number;

  constructor(scene: THREE.Scene, maxParticles: number = 1000) {
    this.maxParticles = maxParticles;
    this.particleCount = 0;
    
    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.sizes = new Float32Array(maxParticles);
    this.lifetimes = new Float32Array(maxParticles);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    scene.add(this.particles);
  }

  addParticle(options: ParticleOptions) {
    if (this.particleCount >= this.maxParticles) return;

    const index = this.particleCount * 3;
    
    // Position
    this.positions[index] = options.position.x;
    this.positions[index + 1] = options.position.y;
    this.positions[index + 2] = options.position.z;

    // Color
    const color = new THREE.Color(options.color);
    this.colors[index] = color.r;
    this.colors[index + 1] = color.g;
    this.colors[index + 2] = color.b;

    // Size and lifetime
    this.sizes[this.particleCount] = options.size;
    this.lifetimes[this.particleCount] = options.life;

    this.particleCount++;
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  update(deltaTime: number) {
    for (let i = 0; i < this.particleCount; i++) {
      this.lifetimes[i] -= deltaTime;
      if (this.lifetimes[i] <= 0) {
        // Remove particle by swapping with last particle
        const lastIndex = (this.particleCount - 1) * 3;
        const currentIndex = i * 3;

        // Swap positions
        this.positions[currentIndex] = this.positions[lastIndex];
        this.positions[currentIndex + 1] = this.positions[lastIndex + 1];
        this.positions[currentIndex + 2] = this.positions[lastIndex + 2];

        // Swap colors
        this.colors[currentIndex] = this.colors[lastIndex];
        this.colors[currentIndex + 1] = this.colors[lastIndex + 1];
        this.colors[currentIndex + 2] = this.colors[lastIndex + 2];

        // Swap size and lifetime
        this.sizes[i] = this.sizes[this.particleCount - 1];
        this.lifetimes[i] = this.lifetimes[this.particleCount - 1];

        this.particleCount--;
        i--; // Check the swapped particle in next iteration
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  clear() {
    this.particleCount = 0;
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  // Add a trail particle for a game object
  addTrail(gameObject: { x: number; y: number; z?: number }, options: Partial<ParticleOptions> = {}) {
    this.addParticle({
      position: new THREE.Vector3(gameObject.x, gameObject.y, gameObject.z ?? 0),
      velocity: new THREE.Vector3(0, 0, 0),
      color: options.color || '#ffffff',
      size: options.size || 2,
      life: options.life || 500,
      decay: options.decay || 1
    });
  }

  // Add an explosion effect at a position
  addExplosion(x: number, y: number, options: Partial<ParticleOptions> = {}) {
    const count = options.decay || 10;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      this.addParticle({
        position: new THREE.Vector3(x, y, 0),
        velocity: new THREE.Vector3(Math.cos(angle) * 2, Math.sin(angle) * 2, 0),
        color: options.color || '#ff4444',
        size: options.size || 4,
        life: options.life || 500,
        decay: options.decay || 1
      });
    }
  }
}
