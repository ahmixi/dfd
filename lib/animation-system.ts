export interface AnimationFrame {
  frameId: number;
  duration: number;
  spriteX: number;
  spriteY: number;
  width: number;
  height: number;
}

export interface Animation {
  name: string;
  frames: AnimationFrame[];
  loop: boolean;
}

export class AnimationController {
  private animations: Map<string, Animation> = new Map();
  private currentAnimation?: Animation;
  private currentFrame: number = 0;
  private frameTime: number = 0;
  private isPlaying: boolean = false;

  constructor(animations: Animation[]) {
    animations.forEach(anim => this.animations.set(anim.name, anim));
  }

  play(animationName: string, reset: boolean = false): void {
    const animation = this.animations.get(animationName);
    if (!animation) return;

    if (this.currentAnimation?.name !== animationName || reset) {
      this.currentAnimation = animation;
      this.currentFrame = 0;
      this.frameTime = 0;
      this.isPlaying = true;
    }
  }

  update(delta: number): AnimationFrame | null {
    if (!this.currentAnimation || !this.isPlaying) return null;

    this.frameTime += delta;
    const frame = this.currentAnimation.frames[this.currentFrame];
    
    if (this.frameTime >= frame.duration) {
      this.frameTime = 0;
      this.currentFrame++;

      if (this.currentFrame >= this.currentAnimation.frames.length) {
        if (this.currentAnimation.loop) {
          this.currentFrame = 0;
        } else {
          this.isPlaying = false;
          return null;
        }
      }
    }

    return this.currentAnimation.frames[this.currentFrame];
  }

  getCurrentFrame(): AnimationFrame | null {
    if (!this.currentAnimation) return null;
    return this.currentAnimation.frames[this.currentFrame];
  }

  stop(): void {
    this.isPlaying = false;
  }
}