import { ParticleSystem, ParticleOptions } from './ParticleSystem';
import adService, { AdResult } from '../../ad-service';
import * as THREE from 'three';

export interface PowerUpEffect {
  name: string;
  duration: number;
  multiplier: number;
  particleColor: string;
  emoji: string;
  apply: (player: any) => void;
  remove: (player: any) => void;
}

export class PowerUpManager {
  private activePowerUps: Map<string, { effect: PowerUpEffect; endTime: number }>;
  private particleSystem: ParticleSystem;
  private availablePowerUps: PowerUpEffect[] = [];

  constructor(scene: THREE.Scene) {
    this.activePowerUps = new Map();
    this.particleSystem = new ParticleSystem(scene);
    this.initializePowerUps();
  }

  private initializePowerUps() {
    this.availablePowerUps = [
      {
        name: 'Speed Boost',
        duration: 5000,
        multiplier: 1.5,
        particleColor: '#00ff00',
        emoji: '⚡',
        apply: (player) => {
          player.speed *= 1.5;
          this.createPowerUpParticles(player.position, '#00ff00');
        },
        remove: (player) => {
          player.speed /= 1.5;
        }
      },
      {
        name: 'Shield',
        duration: 8000,
        multiplier: 1,
        particleColor: '#0099ff',
        emoji: '🛡️',
        apply: (player) => {
          player.isInvulnerable = true;
          this.createPowerUpParticles(player.position, '#0099ff');
        },
        remove: (player) => {
          player.isInvulnerable = false;
        }
      },
      {
        name: 'Coin Magnet',
        duration: 10000,
        multiplier: 1.2,
        particleColor: '#ffff00',
        emoji: '🧲',
        apply: (player) => {
          player.coinMagnetRange = 100;
          this.createPowerUpParticles(player.position, '#ffff00');
        },
        remove: (player) => {
          player.coinMagnetRange = 0;
        }
      },
      {
        name: 'Score Multiplier',
        duration: 7000,
        multiplier: 2,
        particleColor: '#ff00ff',
        emoji: '✨',
        apply: (player) => {
          player.scoreMultiplier *= 2;
          this.createPowerUpParticles(player.position, '#ff00ff');
        },
        remove: (player) => {
          player.scoreMultiplier /= 2;
        }
      }
    ];
  }

  public getPowerUp(name: string): PowerUpEffect | undefined {
    return this.availablePowerUps.find(p => p.name === name);
  }

  public activatePowerUp(powerUp: PowerUpEffect, player: any) {
    // Remove existing power-up of the same type
    if (this.activePowerUps.has(powerUp.name)) {
      const existing = this.activePowerUps.get(powerUp.name);
      if (existing) {
        existing.effect.remove(player);
      }
    }

    // Apply new power-up
    powerUp.apply(player);
    this.activePowerUps.set(powerUp.name, {
      effect: powerUp,
      endTime: Date.now() + powerUp.duration
    });
  }

  private createPowerUpParticles(position: THREE.Vector3, color: string) {
    for (let i = 0; i < 20; i++) {
      const particleOptions: ParticleOptions = {
        position: position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ),
        color: color,
        size: Math.random() * 0.5 + 0.5,
        life: Math.random() * 1000 + 1000,
        decay: 0.95
      };
      this.particleSystem.addParticle(particleOptions);
    }
  }

  public update(deltaTime: number, player: any) {
    const currentTime = Date.now();
    
    // Update active power-ups
    this.activePowerUps.forEach((powerUpInfo, name) => {
      if (currentTime >= powerUpInfo.endTime) {
        powerUpInfo.effect.remove(player);
        this.activePowerUps.delete(name);
      }
    });

    // Update particle effects
    this.particleSystem.update(deltaTime);
  }

  /**
   * Grant a reward coming from an ad. This is the central entrypoint for
   * applying ad-granted power-ups (shield, character trial, coins, etc).
   * It is intentionally permissive; validation (server-side) can be added.
   */
  public async grantReward(rewardKey: string, player: any): Promise<boolean> {
    // Common reward mapping
    if (rewardKey === 'shield') {
      const shield = this.getPowerUp('Shield');
      if (shield) {
        this.activatePowerUp(shield, player);
        return true;
      }
    }

    if (rewardKey.startsWith('coins:')) {
      const parts = rewardKey.split(':');
      const amount = parseInt(parts[1] || '0', 10);
      if (!isNaN(amount)) {
        // give coins directly on player object if supported
        if (typeof player.addCoins === 'function') {
          player.addCoins(amount);
        } else if (typeof player.coins === 'number') {
          player.coins += amount;
        }
        return true;
      }
    }

    if (rewardKey.startsWith('character_trial:')) {
      // For trials, tag the player with a temporary unlocked character key.
      const parts = rewardKey.split(':');
      const charId = parts[1];
      if (charId) {
        // store a simple timestamped trial on player (game should respect it)
        player.trials = player.trials || {};
        player.trials[charId] = Date.now() + (5 * 60 * 1000); // 5 minutes
        return true;
      }
    }

    return false;
  }

  public getActivePowerUps(): Map<string, { effect: PowerUpEffect; endTime: number }> {
    return this.activePowerUps;
  }

  public clearAllPowerUps(player: any) {
    this.activePowerUps.forEach(powerUpInfo => {
      powerUpInfo.effect.remove(player);
    });
    this.activePowerUps.clear();
    this.particleSystem.clear();
  }
}
