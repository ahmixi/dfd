export interface PowerUp {
  id: string;
  name: string;
  description: string;
  duration: number;
  cooldown: number;
  icon: string;
  type: 'active' | 'passive';
  effects: {
    speed?: number;
    jumpHeight?: number;
    shield?: boolean;
    multiplier?: number;
    invulnerability?: boolean;
  };
}

export class PowerUpSystem {
  private activePowerUps: Map<string, { 
    powerUp: PowerUp;
    timeRemaining: number;
    cooldownRemaining: number;
  }> = new Map();

  private availablePowerUps: PowerUp[] = [
    {
      id: 'speed_burst',
      name: 'Speed Burst',
      description: 'Temporarily increases movement speed',
      duration: 5,
      cooldown: 15,
      icon: '⚡',
      type: 'active',
      effects: { speed: 1.5 }
    },
    {
      id: 'energy_shield',
      name: 'Energy Shield',
      description: 'Creates a protective barrier',
      duration: 3,
      cooldown: 20,
      icon: '🛡️',
      type: 'active',
      effects: { shield: true }
    },
    {
      id: 'score_multiplier',
      name: 'Score Multiplier',
      description: 'Doubles all points gained',
      duration: 8,
      cooldown: 25,
      icon: '✨',
      type: 'active',
      effects: { multiplier: 2 }
    },
    {
      id: 'double_jump',
      name: 'Double Jump',
      description: 'Enables an extra jump in mid-air',
      duration: -1, // Passive ability
      cooldown: 0,
      icon: '🦋',
      type: 'passive',
      effects: {}
    }
  ];

  activatePowerUp(id: string): boolean {
    const powerUp = this.availablePowerUps.find(p => p.id === id);
    if (!powerUp) return false;

    const existing = this.activePowerUps.get(id);
    if (existing && existing.cooldownRemaining > 0) return false;

    this.activePowerUps.set(id, {
      powerUp,
      timeRemaining: powerUp.duration,
      cooldownRemaining: powerUp.cooldown
    });

    return true;
  }

  update(delta: number): void {
    for (const [id, data] of this.activePowerUps) {
      if (data.timeRemaining > 0) {
        data.timeRemaining -= delta;
        if (data.timeRemaining <= 0 && data.powerUp.type === 'active') {
          data.cooldownRemaining = data.powerUp.cooldown;
        }
      }

      if (data.cooldownRemaining > 0) {
        data.cooldownRemaining -= delta;
      }
    }
  }

  getActiveEffects(): PowerUp['effects'] {
    const effects: PowerUp['effects'] = {};
    
    for (const [_, data] of this.activePowerUps) {
      if (data.timeRemaining > 0) {
        Object.entries(data.powerUp.effects).forEach(([key, value]) => {
          if (key in effects) {
            // @ts-ignore
            effects[key] = Math.max(effects[key], value);
          } else {
            // @ts-ignore
            effects[key] = value;
          }
        });
      }
    }
    
    return effects;
  }

  getPowerUpStatus(id: string) {
    return this.activePowerUps.get(id);
  }
}