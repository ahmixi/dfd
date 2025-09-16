export class AudioManager {
  private sounds: Map<string, HTMLAudioElement>;
  private music: HTMLAudioElement | null;
  private isMuted: boolean;
  private volume: number;

  constructor() {
    this.sounds = new Map();
    this.music = null;
    this.isMuted = false;
    this.volume = 1.0;
  }

  public async loadSound(id: string, url: string): Promise<void> {
    const audio = new Audio(url);
    audio.volume = this.volume;
    this.sounds.set(id, audio);
    return new Promise((resolve) => {
      audio.oncanplaythrough = () => resolve();
    });
  }

  public async loadMusic(url: string): Promise<void> {
    this.music = new Audio(url);
    this.music.loop = true;
    this.music.volume = this.volume;
    return new Promise((resolve) => {
      if (this.music) {
        this.music.oncanplaythrough = () => resolve();
      }
    });
  }

  public playSound(id: string) {
    if (this.isMuted) return;
    const sound = this.sounds.get(id);
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  }

  public playSoundWithVariation(id: string, pitchVariation: number = 0.1) {
    if (this.isMuted) return;
    const sound = this.sounds.get(id);
    if (sound) {
      const clone = sound.cloneNode() as HTMLAudioElement;
      clone.playbackRate = 1 + (Math.random() * 2 - 1) * pitchVariation;
      clone.volume = this.volume;
      clone.play();
    }
  }

  // Backwards-compatible alias used in older code: `audioManager.play('id')`
  public play(id: string) {
    this.playSoundWithVariation(id);
  }

  public startMusic() {
    if (this.isMuted || !this.music) return;
    this.music.play();
  }

  public stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
  }

  public setMasterVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => sound.volume = this.volume);
    if (this.music) {
      this.music.volume = this.volume;
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}
