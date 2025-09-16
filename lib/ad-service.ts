// Lightweight ad service wrapper: provides a stable interface for showing ads
// and emitting lifecycle events. This is a stub for integration with real SDKs
// (AdMob, Google IMA, GAM, or mediation) and is safe to call from the game code.


export type AdResult = 'completed' | 'skipped' | 'failed';

export interface AdPlacement {
  id: string;
  type: 'rewarded' | 'interstitial' | 'banner';
  cooldownSec?: number;
  sessionLimit?: number;
}

type EventHandler = (...args: any[]) => void;

class AdService {
  private placements: Map<string, AdPlacement> = new Map();
  private lastShownAt: Map<string, number> = new Map();
  private sessionCounts: Map<string, number> = new Map();
  private listeners: Map<string, EventHandler[]> = new Map();

  constructor() {}

  registerPlacement(p: AdPlacement) {
    this.placements.set(p.id, p);
  }

  async load(placementId: string): Promise<void> {
    // Simulate network load delay
    await new Promise(r => setTimeout(r, 200));
    this.emit('ad_loaded', placementId);
  }

  /**
   * Show a simulated ad. This placeholder implements cooldown and session caps
   * and emits lifecycle events: ad_request, ad_shown, ad_completed, ad_failed.
   */
  async show(placementId: string): Promise<AdResult> {
    const placement = this.placements.get(placementId);
    this.emit('ad_request', placementId);
    if (!placement) {
      this.emit('ad_failed', placementId, 'no_placement');
      return 'failed';
    }

    // Cooldown enforcement
    const last = this.lastShownAt.get(placementId) || 0;
    const now = Date.now();
    if (placement.cooldownSec && now - last < placement.cooldownSec * 1000) {
      this.emit('ad_failed', placementId, 'cooldown');
      return 'failed';
    }

    // Session cap enforcement
    const count = this.sessionCounts.get(placementId) || 0;
    if (placement.sessionLimit && count >= placement.sessionLimit) {
      this.emit('ad_failed', placementId, 'session_limit');
      return 'failed';
    }

    this.emit('ad_shown', placementId);
    // Simulate ad playback time
    await new Promise(r => setTimeout(r, 1400));

    // Randomize outcome for realism (mostly completed)
    const rand = Math.random();
    let result: AdResult = 'completed';
    if (rand < 0.05) result = 'failed';
    else if (rand < 0.18) result = 'skipped';

    if (result === 'completed') {
      this.lastShownAt.set(placementId, Date.now());
      this.sessionCounts.set(placementId, count + 1);
      this.emit('ad_completed', placementId);
    } else if (result === 'skipped') {
      this.emit('ad_skipped', placementId);
    } else {
      this.emit('ad_failed', placementId, 'playback_error');
    }

    return result;
  }

  on(event: string, handler: EventHandler) {
    const arr = this.listeners.get(event) || [];
    arr.push(handler);
    this.listeners.set(event, arr);
  }

  off(event: string, handler: EventHandler) {
    const arr = this.listeners.get(event) || [];
    this.listeners.set(event, arr.filter(h => h !== handler));
  }

  private emit(event: string, ...args: any[]) {
    const arr = this.listeners.get(event) || [];
    for (const h of arr) h(...args);
  }
}

export const adService = new AdService();

export default adService;
