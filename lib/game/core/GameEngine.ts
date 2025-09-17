import { WebGLRenderer } from './WebGLRenderer';
import { ParticleSystem } from './ParticleSystem';
import { PowerUpManager } from './PowerUpManager';
import { AudioManager } from './AudioManager';
import * as THREE from 'three';
import adService from '../../ad-service';

export interface GameConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export class GameEngine {
  private renderer: WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private clock: THREE.Clock;
  private particleSystem: ParticleSystem;
  private powerUpManager: PowerUpManager;
  private audioManager: AudioManager;
  private isRunning: boolean;
  private lastTime: number;

  // Runner gameplay state
  private lanesX: number[] = [-2, 0, 2];
  private player: { mesh: THREE.Mesh; laneIndex: number; vy: number; sliding: boolean; speed: number; alive: boolean; isInvulnerable?: boolean; shieldRing?: THREE.Mesh } | null = null;
  private laneTargetX = 0;
  private ground: THREE.Mesh | null = null;
  private obstacles: THREE.Mesh[] = [];
  private coins: THREE.Mesh[] = [];
  private spawnTimer = 0;
  private coinTimer = 0;
  private score = 0;
  private distance = 0;
  private coinsCollected = 0;
  private onScore?: (s: number) => void;
  private onDistance?: (d: number) => void;
  private onCoins?: (c: number) => void;
  private onGameOver?: () => void;

  // Camera FX
  private camRoll = 0;
  private camRollTarget = 0;
  private camZoom = 1;
  private camZoomTarget = 1;

  constructor(config: GameConfig) {
    this.renderer = new WebGLRenderer(config.canvas);
    this.scene = this.renderer.getScene();
    this.camera = this.renderer.getCamera();
    this.clock = new THREE.Clock();
    this.particleSystem = new ParticleSystem(this.scene);
    this.powerUpManager = new PowerUpManager(this.scene);
    this.audioManager = new AudioManager();
    this.isRunning = false;
    this.lastTime = 0;

    this.init(config);
  }

  private async init(config: GameConfig) {
    // Set up scene
    this.setupLighting();
    this.setupEnvironment();
    this.setupRunnerWorld();
    await this.loadAssets();

    // Initialize game systems
    this.setupEventListeners();
    this.resize(config.width, config.height);
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  private setupEnvironment() {
    // Sky key light and rim
    const hemi = new THREE.HemisphereLight(0x6a9cff, 0x0a0a14, 0.6);
    this.scene.add(hemi);
  }

  private setupRunnerWorld() {
    // Ground strip
    const g = new THREE.PlaneGeometry(20, 200, 1, 1);
    const m = new THREE.MeshStandardMaterial({ color: 0x1a1f35, roughness: 1, metalness: 0 });
    this.ground = new THREE.Mesh(g, m);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.z = -40;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Lane markers
    const laneMat = new THREE.MeshStandardMaterial({ color: 0x394b7b, emissive: new THREE.Color(0x111622), emissiveIntensity: 0.3 });
    for (let x of this.lanesX) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 200), laneMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, 0.001, -40);
      this.scene.add(stripe);
    }

    // Player (stylized emoji disc)
    const playerGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 32);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0x332200, roughness: 0.4 });
    const mesh = new THREE.Mesh(playerGeo, playerMat);
    mesh.castShadow = true;
    mesh.position.set(this.lanesX[1], 0.6, 0);
    this.scene.add(mesh);
    this.player = { mesh, laneIndex: 1, vy: 0, sliding: false, speed: 8, alive: true };
    this.laneTargetX = this.lanesX[1];

    // Camera rig
    (this.camera as THREE.PerspectiveCamera).position.set(0, 3.2, 8);
    (this.camera as THREE.PerspectiveCamera).lookAt(0, 1.0, 0);
  }

  private async loadAssets() {
    // Load textures, models, sounds
    await Promise.all([
      this.audioManager.loadSound('jump', '/sounds/jump.mp3'),
      this.audioManager.loadSound('collect', '/sounds/collect.mp3'),
      this.audioManager.loadSound('powerup', '/sounds/powerup.mp3'),
      this.audioManager.loadMusic('/music/background.mp3')
    ]);
  }

  private setupEventListeners() {
    window.addEventListener('resize', () => {
      this.resize(window.innerWidth, window.innerHeight);
    });

    // Add other event listeners for game controls
  }

  public start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.audioManager.startMusic();
      this.animate();
    }
  }

  public pause() {
    this.isRunning = false;
    this.audioManager.stopMusic();
  }

  /**
   * Pause the game in preparation for showing an ad. Use this when a
   * rewarded/interstitial ad will be shown while gameplay is active.
   */
  public pauseForAd() {
    // Save running state, stop simulation and audio, disable inputs externally
    this.pause();
  }

  /**
   * Resume the game after an ad. Optionally apply a short grace period
   * before resuming intensive physics or spawns if necessary.
   */
  public resumeFromAd(graceMs: number = 500) {
    // Slight delay to give player time to re-orient
    setTimeout(() => this.resume(), graceMs);
  }

  public resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.audioManager.startMusic();
      this.animate();
    }
  }

  public stop() {
    this.isRunning = false;
    this.audioManager.stopMusic();
    // Clean up game state
  }

  private animate() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(() => this.animate());
  }

  private update(deltaTime: number) {
    // Update game logic
    const p = this.player;
    if (!p || !p.alive) return;

    // Shield visual effects
    if (p.isInvulnerable) {
      // Add shield rings
      if (!p.shieldRing) {
        const ringGeo = new THREE.TorusGeometry(0.8, 0.08, 16, 32);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x0099ff, emissive: 0x0099ff, emissiveIntensity: 0.7 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(0, 0, 0);
        p.mesh.add(ring);
        p.shieldRing = ring;
      }
      // Animate ring rotation and scale for energy effect
      p.shieldRing.rotation.x += deltaTime * 2;
      p.shieldRing.rotation.y += deltaTime * 2.5;
      p.shieldRing.scale.set(1 + Math.sin(performance.now() * 0.01) * 0.08, 1 + Math.sin(performance.now() * 0.01) * 0.08, 1 + Math.sin(performance.now() * 0.01) * 0.08);
      // Shake effect
      p.mesh.position.x += (Math.random() - 0.5) * 0.04;
      p.mesh.position.y += (Math.random() - 0.5) * 0.04;
    } else {
      // Remove shield ring if exists
      if (p.shieldRing) {
        p.mesh.remove(p.shieldRing);
        p.shieldRing.geometry.dispose();
        if (Array.isArray(p.shieldRing.material)) {
          p.shieldRing.material.forEach(mat => mat.dispose());
        } else {
          p.shieldRing.material.dispose();
        }
        p.shieldRing = undefined;
      }
    }

    // Spawn coins
    this.coinTimer -= deltaTime;
    if (this.coinTimer <= 0) {
      this.coinTimer = 0.6 + Math.random() * 0.6;
      const lane = Math.floor(Math.random() * this.lanesX.length);
      const coin = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.12, 12, 24), new THREE.MeshStandardMaterial({ color: 0xf9d85e, emissive: 0x322400 }));
      coin.position.set(this.lanesX[lane], 0.8, -26);
      coin.castShadow = true;
      this.scene.add(coin);
      this.coins.push(coin);
    }

    // Move objects forward
    const forward = p.speed * deltaTime;
    for (const obs of this.obstacles) obs.position.z += forward;
    for (const c of this.coins) { c.position.z += forward; c.rotation.y += deltaTime * 2; }

    // Cleanup
    this.obstacles = this.obstacles.filter(o => {
      if (o.position.z > 8) { this.scene.remove(o); return false };
      return true;
    });
    this.coins = this.coins.filter(c => {
      if (c.position.z > 8) { this.scene.remove(c); return false };
      return true;
    });

    // Player vertical physics
    p.vy -= 18 * deltaTime; // gravity
    p.mesh.position.y = Math.max(0.6, p.mesh.position.y + p.vy * deltaTime);
    if (p.mesh.position.y <= 0.6 && p.vy < 0) p.vy = 0;

    // Smooth lane movement
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    p.mesh.position.x = lerp(p.mesh.position.x, this.laneTargetX, 0.2);

    // Subtle bob by speed
    p.mesh.position.y += Math.sin(performance.now() * 0.01) * 0.002 * (p.speed * 0.2);

    // Distance & difficulty
    this.distance += forward;
    this.onDistance?.(this.distance);
    if (Math.floor(this.distance) % 120 === 0) p.speed = Math.min(14, p.speed + 0.1);

    // Collisions (AABB simplified)
    const playerBox = new THREE.Box3().setFromObject(p.mesh);
    for (const o of this.obstacles) {
      const box = new THREE.Box3().setFromObject(o);
      if (playerBox.intersectsBox(box)) {
        // If player is invulnerable (shield active), ignore obstacle collision
        if (p.isInvulnerable) {
          // Optionally play shield sound or effect here
          continue;
        }
        p.alive = false;
        this.audioManager.play('powerup');
        this.onGameOver?.();
        break;
      }
    }
    for (const c of this.coins) {
      const box = new THREE.Box3().setFromObject(c);
      if (playerBox.intersectsBox(box)) {
        this.scene.remove(c);
        this.coins = this.coins.filter(x => x !== c);
        this.score += 10;
        this.onScore?.(this.score);
        this.coinsCollected += 1;
        this.onCoins?.(this.coinsCollected);
        this.audioManager.play('collect');
      }
    }

    // Camera follow with slight lag
    const cam = this.camera as THREE.PerspectiveCamera;
    // roll/zoom easing
    this.camRoll += (this.camRollTarget - this.camRoll) * 0.12;
    this.camZoom += (this.camZoomTarget - this.camZoom) * 0.08;
    // decay zoom back to 1
    this.camZoomTarget += (1 - this.camZoomTarget) * 0.04;
    cam.position.x += (p.mesh.position.x * 0.4 - cam.position.x) * 0.1;
    cam.position.z = 8 - (this.camZoom - 1) * 2.5;
    cam.rotation.z = this.camRoll;
    cam.lookAt(p.mesh.position.x, 1.0, 0);

    // Particles & powerups
    this.particleSystem.update(deltaTime);
    this.powerUpManager.update(deltaTime, { x: p.mesh.position.x, y: p.mesh.position.y });
  }

  private render() {
    this.renderer.render();
  }

  public resize(width: number, height: number) {
    this.renderer.resize(width, height);
  }

  // Public API for input
  public jump() {
    if (!this.player || !this.player.alive) return;
    if (this.player.vy === 0 && this.player.mesh.position.y <= 0.6 + 0.001) {
      this.player.vy = 7.6;
      this.audioManager.play('jump');
      this.camZoomTarget = 1.06;
    }
  }

  public slide(start: boolean) {
    if (!this.player || !this.player.alive) return;
    this.player.sliding = start;
    this.player.mesh.scale.y = start ? 0.6 : 1;
    this.camZoomTarget = start ? 0.98 : 1.02;
  }

  public moveLane(dir: -1 | 1) {
    if (!this.player || !this.player.alive) return;
    const next = Math.min(2, Math.max(0, this.player.laneIndex + dir));
    this.player.laneIndex = next;
    this.laneTargetX = this.lanesX[next];
    // Tilt camera slightly with lane
    const normalized = next - 1; // -1,0,1
    this.camRollTarget = normalized * 0.08;
  }

  public setScoreListener(cb: (s: number) => void) { this.onScore = cb }
  public setDistanceListener(cb: (d: number) => void) { this.onDistance = cb }
  public setCoinsListener(cb: (c: number) => void) { this.onCoins = cb }
  public setGameOverListener(cb: () => void) { this.onGameOver = cb }

  public reset() {
    // Clean scene objects
    for (const o of this.obstacles) this.scene.remove(o);
    for (const c of this.coins) this.scene.remove(c);
    this.obstacles = [];
    this.coins = [];
    this.spawnTimer = 0;
    this.coinTimer = 0;
    this.score = 0;
    this.distance = 0;
    this.coinsCollected = 0;
    // Reset player
    if (this.player) {
      this.player.mesh.position.set(this.lanesX[1], 0.6, 0);
      this.player.mesh.scale.set(1, 1, 1);
      this.player.laneIndex = 1;
      this.player.vy = 0;
      this.player.sliding = false;
      this.player.speed = 8;
      this.player.alive = true;
    }
    // Reset camera fx
    this.camRoll = this.camRollTarget = 0;
    this.camZoom = this.camZoomTarget = 1;
  }

  // Getters for accessing game systems
  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.Camera {
    return this.camera;
  }

  public getParticleSystem(): ParticleSystem {
    return this.particleSystem;
  }

  public getPowerUpManager(): PowerUpManager {
    return this.powerUpManager;
  }

  public getAudioManager(): AudioManager {
    return this.audioManager;
  }
}
