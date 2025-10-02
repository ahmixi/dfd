import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/game-store";

export default function AngryQubeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setCurrentScreen, user, characters } = useGameStore();
  const character = characters.find((c) => c.id === user.selectedCharacter);
  // If no character, don't render the game — keep this check to avoid runtime errors
  if (!character) return <div className="text-white p-8">No character selected.</div>;

  // Local UI state (menu / playing / gameOver). Your game code can replace this if you
  // prefer to manage its own UI/state. We keep a small wrapper to integrate with the
  // surrounding platform safely.
  const [gameState, setGameState] = useState({
    phase: "menu" as "menu" | "playing" | "gameOver",
    score: 0,
    coins: 0,
    highScore: 0,
  });

  // mobile UX: detect portrait/mobile and allow an optional rotated mode
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [rotatedMode, setRotatedMode] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/.test(navigator.userAgent || '');
      setIsMobile(mobile);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // A ref to hold whatever API your game returns (for cleanup). The init function below
  // should return a cleanup function or an object with a `destroy()` method.
  const gameApiRef = useRef<any>(null);

  useEffect(() => {
    // If we're in playing phase, initialize the game implementation with the canvas
    // and the currently selected character. When the phase changes away from playing
    // or the component unmounts, we call the cleanup returned by the initializer.
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cleanup: (() => void) | undefined;

    if (gameState.phase === "playing") {
      // initializeAngryQube is the insertion point for your G-code / game engine.
      // Replace the body of that function below with your game implementation.
      const api = initializeAngryQube(canvas, character, {
        onScore: (s: number) => setGameState((p) => ({ ...p, score: s })),
        onCoins: (c: number) => setGameState((p) => ({ ...p, coins: c })),
        onGameOver: (finalScore: number) => setGameState((p) => ({ ...p, phase: "gameOver", score: finalScore })),
      });
      gameApiRef.current = api;

      // Support both function cleanup or object with destroy()
      if (typeof api === "function") cleanup = api as () => void;
      else if (api && typeof api.destroy === "function") cleanup = () => api.destroy();
    }

    return () => {
      if (cleanup) cleanup();
      gameApiRef.current = null;
    };
    // Re-run when phase or selected character changes to let the engine reinitialize
  }, [gameState.phase, character]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-black"
      // when rotatedMode is enabled we swap CSS size and rotate the container so users on portrait devices
      style={rotatedMode && typeof window !== 'undefined' ? { width: `${window.innerHeight}px`, height: `${window.innerWidth}px`, transform: 'rotate(90deg)', transformOrigin: 'center' } : undefined}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none pointer-events-none z-0" />

      {/* Menu */}
      {gameState.phase === "menu" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-orange-400 to-amber-400">
            ANGRY QUBE
          </div>
          <div className="text-white/80 mt-2">The Geometric Revolution</div>
          <div className="mt-8 flex items-center gap-2 text-white/90">
            {/* show character preview coming from the shop */}
            {character.emoji || "⬜"}
            <span className="text-sm">Ready</span>
          </div>
          <button
            className="mt-8 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold hover:brightness-110"
            onClick={() => setGameState((prev) => ({ ...prev, phase: "playing" }))}
          >
            Start Game
          </button>
        </div>
      )}

      {/* Exit button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => {
            // make sure to clean up the running game before leaving
            if (gameApiRef.current) {
              const api = gameApiRef.current;
              if (typeof api === "function") api();
              else if (api && typeof api.destroy === "function") api.destroy();
            }
            setCurrentScreen("dashboard");
          }}
          className="px-3 py-2 rounded-md bg-white/10 text-white border border-white/20 hover:bg-white/20"
        >
          Exit
        </button>
      </div>

      {/* HUD */}
      {gameState.phase === "playing" && (
        <>
          <div className="absolute top-4 left-4 space-y-2 z-10">
            <div className="bg-black/90 border-2 border-white rounded-lg px-4 py-2">
              <div className="text-xs text-white/70">SCORE</div>
              <div className="text-2xl font-bold text-white">{gameState.score}</div>
            </div>
            <div className="bg-black/90 border-2 border-yellow-400 rounded-lg px-4 py-2">
              <div className="text-xs text-yellow-400/70">COINS</div>
              <div className="text-xl font-bold text-yellow-400">{gameState.coins ?? 0}</div>
            </div>
          </div>

          {/** detection bar **/}
          {/** We keep this minimal: read detection from the running game when exposed **/}
          <div className="absolute top-4 right-4 z-10">
            {/* placeholder for detection; animator kept inside canvas */}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-10">
            <div className="bg-blue-500/90 border-2 border-blue-300 px-4 py-2 rounded-full text-white font-bold animate-pulse">HIDDEN</div>
            <div className="bg-red-500/90 border-2 border-red-300 px-4 py-2 rounded-full text-white font-bold animate-pulse">SPOTTED!</div>
          </div>

          {/* Controls: left cluster and right cluster to avoid overlap */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-3 z-50">
            <div className="flex gap-3">
              <button
                onMouseDown={() => gameApiRef.current?.pressLeft?.(true)}
                onMouseUp={() => gameApiRef.current?.pressLeft?.(false)}
                onTouchStart={() => gameApiRef.current?.pressLeft?.(true)}
                onTouchEnd={() => gameApiRef.current?.pressLeft?.(false)}
                className="w-14 h-14 bg-white/12 border border-white/20 rounded-lg font-bold text-white active:bg-white/30 transition-colors"
                aria-label="left"
              >
                ←
              </button>
              <button
                onMouseDown={() => gameApiRef.current?.pressRight?.(true)}
                onMouseUp={() => gameApiRef.current?.pressRight?.(false)}
                onTouchStart={() => gameApiRef.current?.pressRight?.(true)}
                onTouchEnd={() => gameApiRef.current?.pressRight?.(false)}
                className="w-14 h-14 bg-white/12 border border-white/20 rounded-lg font-bold text-white active:bg-white/30 transition-colors"
                aria-label="right"
              >
                →
              </button>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-50">
            <button
              onClick={() => gameApiRef.current?.jump?.()}
              className="w-20 h-20 bg-white/18 border-2 border-white rounded-xl font-bold text-white active:bg-white/40 transition-colors"
              aria-label="jump"
            >
              JUMP
            </button>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => gameApiRef.current?.activateBoost?.()}
                className="w-12 h-12 bg-yellow-400/90 border border-yellow-300 rounded-lg font-bold text-black active:brightness-95 transition-colors"
                aria-label="boost"
              >
                ⚡
              </button>
              <button
                onClick={() => gameApiRef.current?.attemptTakedown?.()}
                className="w-12 h-12 bg-indigo-600/90 border border-indigo-400 rounded-lg font-bold text-white active:brightness-95 transition-colors"
                aria-label="stealth"
              >
                ✦
              </button>
            </div>
          </div>
        </>
      )}

      {/* Game Over */}
      {gameState.phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="bg-white/10 border-2 border-white rounded-2xl p-8 text-center space-y-6 max-w-md">
            <h2 className="text-5xl font-black text-red-500">DETECTED</h2>

            <div className="space-y-2 text-white">
              <div className="flex justify-between text-xl">
                <span>Score:</span>
                <span className="font-bold">{gameState.score}</span>
              </div>
              <div className="flex justify-between text-xl">
                <span>Coins:</span>
                <span className="font-bold text-yellow-400">—</span>
              </div>
              <div className="flex justify-between text-xl">
                <span>Distance:</span>
                <span className="font-bold">—m</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setGameState({ ...gameState, phase: "menu" })} className="flex-1 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg transition-colors">MENU</button>
              <button onClick={() => setGameState({ ...gameState, phase: "playing" })} className="flex-1 px-6 py-3 bg-white hover:bg-white/90 text-black font-bold rounded-lg transition-colors">RETRY</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile rotate suggestion */}
      {isMobile && isPortrait && gameState.phase === 'playing' && !rotatedMode && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-black/80 text-white rounded-xl p-6 text-center max-w-sm">
            <div className="text-lg font-bold mb-2">Rotate for best experience</div>
            <div className="text-sm text-white/80 mb-4">This game plays best in landscape. Rotate your device or enable rotated mode below.</div>
            <div className="flex gap-2 justify-center">
              <button className="px-4 py-2 rounded bg-white text-black" onClick={() => setRotatedMode(true)}>Enable rotated mode</button>
              <button className="px-4 py-2 rounded border border-white" onClick={() => { /* we'll let user rotate physically */ }}>I'll rotate</button>
            </div>
            <div className="mt-3 text-xs text-white/60">You can disable rotated mode anytime from this prompt.</div>
          </div>
        </div>
      )}

    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  INSERTION POINT: replace this function body with your G-code / game init   */
/*  - Your function will be called with (canvas, character, hooks)
   - hooks.onScore(number) -- call to update the wrapper UI
   - hooks.onGameOver(number) -- call when game ends
  - Return either a cleanup function: () => void
    OR an object with a destroy() method: { destroy: () => void }
  Example stub below is safe and does nothing harmful.                            */
function initializeAngryQube(
  canvas: HTMLCanvasElement,
  character: any,
  hooks: { onScore?: (n: number) => void; onCoins?: (n: number) => void; onGameOver?: (n: number) => void }
): (() => void) | { destroy: () => void } | null {
  // Converted ShadowCube game (non-React) — runs on the provided canvas.
  // Uses `character` for player visuals and calls hooks.onScore / hooks.onGameOver.

  if (!canvas) return null;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const C = ctx;

  const keys = { left: false, right: false, up: false, down: false } as any;
  let rafId: number | null = null;
  let lastTime = 0;
  let prevGrounded = false;
  let lastVelX = 0;
  let shakeTime = 0;
  let shakeDuration = 0;
  let shakeIntensity = 0;
  let enemyIdCounter = 1;

  const game: any = {
    player: null,
    enemies: [],
    projectiles: [],
    boosts: [],
    platforms: [],
    shadows: [],
    coins: [],
    particles: [],
    trails: [],            // player afterimage / motion trail
    debris: [],            // settled debris (cached small shapes)
    spikes: [],            // spike hazards
    banners: [],           // HUD banners queue
    camera: { x: 0, y: 0 },
    level: 1,
  };

  const stats: any = { score: 0, coins: 0, distance: 0, deaths: 0, boostCharge: 0, boostThreshold: 8 };
  // Tuning constants for quick adjustments
  const TUNING = {
    trailThreshold: 80,
    trailMax: 12,
    camLerpPerSecond: 6.5,
    debrisLimit: 600,
    spikeTelegraphDuration: 0.8,
    spikeActiveDuration: 0.9,
    spikeCooldown: 3.0,
    spikeTriggerDistance: 160,
    spikeDamage: 1,
    bannerLife: 1.6,
    // physics / jump tuning
    gravity: 1200,
    jumpVelocity: -560,
    doubleJumpVelocity: -440,
    coyoteTime: 0.12, // seconds after leaving ground when jump still allowed
    jumpBufferTime: 0.12,
  };
  // preload character image if provided (normalize relative paths)
  let charImage: HTMLImageElement | null = null;
  if (character?.image) {
    charImage = new Image();
    try {
      const imageUrl = String(character.image || "");
      if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) charImage.src = imageUrl;
      else charImage.src = "/" + imageUrl;
    } catch (e) {
      charImage.src = String(character.image);
    }
  }

  function initGame() {
  // size player relative to viewport for mobile-first UX; use smaller dimension and scale up slightly
  const vmin = Math.min(window.innerWidth, window.innerHeight);
  const playerSize = Math.max(36, Math.min(140, Math.floor(vmin * 0.10))); // 10% of smaller viewport dimension, clamped

    game.player = {
      x: 100,
      y: 300,
      width: playerSize,
      height: playerSize,
      velX: 0,
      velY: 0,
      grounded: false,
      inShadow: false,
      detected: false,
      detectionLevel: 0,
      canMove: true,
      jumpCount: 0,
      maxJumps: 2,
      life: 5,
      maxLife: 5,
      shakeTime: 0,
      shakeIntensity: 0,
      speedMultiplier: 1,
      boostActive: false,
      boostTimer: 0,
      coyoteTimer: 0,
      jumpBuffer: 0,
      faceRotation: 0,
    };

    game.enemies = [];
    game.platforms = [];
    game.shadows = [];
    game.coins = [];
  game.particles = [];
  game.trails = [];
  game.debris = [];
    game.camera = { x: 0, y: 0 };

    generateLevel();
    // initialize audio after level generation
    setupAudio();
  }

  // Simple AudioManager using WebAudio with file fallback support and small pool
  const audioCtxRef: { ctx?: AudioContext } = {};
  const audioBuffers: Record<string, AudioBuffer[] > = {};
  const audioPool: any[] = [];

  function resumeAudioIfNeeded() {
    if (!audioCtxRef.ctx) {
      try {
        audioCtxRef.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        // audio not available
      }
    }
    if (audioCtxRef.ctx && audioCtxRef.ctx.state === 'suspended') audioCtxRef.ctx.resume().catch(() => {});
  }

  // Map your sfx names to actual filenames found in the project's public/ folder
  const SFX_MAP: Record<string, string[]> = {
    jump: ['character jump'],
    land: ['player land'],
    coin: ['coin pickup.wav'],
    boost_pick: ['boost pickup.wav'],
    boost_activate: ['boost activate.wav'],
    enemy_shoot: ['enemy shoot.wav'],
    projectile_hit: ['projectile hit.wav'],
    enemy_hit: ['enemy hit.wav'],
    enemy_death: ['enemy death.wav','enemy death feel.wav'],
    player_hit: ['enemy hit.wav','mac-quack.mp3'],
    player_death: ['enemy death feel.wav','enemy death.wav'],
    alert: ['mac-quack.mp3'],
    stealth_takedown: ['enemy death feel.wav'],
    ui_click: ['mac-quack.mp3']
  };

  async function fetchArrayBuffer(path: string) {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch (e) {
      return null;
    }
  }

  async function loadBufferForKey(key: string) {
    if (!audioCtxRef.ctx) resumeAudioIfNeeded();
    const ctx = audioCtxRef.ctx;
    if (!ctx) return;
    const candidates = SFX_MAP[key] || [];
    audioBuffers[key] = audioBuffers[key] || [];
    for (const name of candidates) {
      // try to fetch from web root (public/) and URL-encode the filename to support spaces
      const path = '/' + encodeURIComponent(name);
      const ab = await fetchArrayBuffer(path);
      if (!ab) continue;
      try {
        const buf = await ctx.decodeAudioData(ab.slice(0));
        audioBuffers[key].push(buf);
      } catch (e) {
        // decode failed, continue
      }
    }
  }

  async function setupAudio() {
    resumeAudioIfNeeded();
    const keys = Object.keys(SFX_MAP);
    // preload only essential sounds first for fast startup
    const essentials = ['jump','coin','enemy_shoot','player_hit','enemy_death','ui_click'];
    await Promise.all(essentials.map(k => loadBufferForKey(k)));
    // non-blocking load for the rest
    keys.filter(k => !essentials.includes(k)).forEach(k => loadBufferForKey(k));
  }

  // Offscreen cache for debris rendering
  let debrisCanvas: HTMLCanvasElement | null = null;
  let debrisCtx: CanvasRenderingContext2D | null = null;
  let debrisDirty = true;
  let lastDebrisCamX = -99999, lastDebrisCamY = -99999;

  function markDebrisDirty() { debrisDirty = true; }

  function showBanner(text: string, color = '#ffffff') {
    game.banners = game.banners || [];
    game.banners.push({ text, color, life: TUNING.bannerLife, maxLife: TUNING.bannerLife, y: 12, alpha: 0 });
    // keep small queue
    if (game.banners.length > 4) game.banners.shift();
  }

  function playSfx(name: string, opts?: { vol?: number, pan?: number, pitch?: number }) {
    try {
      resumeAudioIfNeeded();
      const ctx = audioCtxRef.ctx; if (!ctx) return;
      const poolNode = ctx.createGain();
      poolNode.gain.value = typeof opts?.vol === 'number' ? opts!.vol! : 1;
      let srcBuf: AudioBuffer | null = null;
      const arr = audioBuffers[name];
      if (arr && arr.length) srcBuf = arr[Math.floor(Math.random() * arr.length)];
      if (!srcBuf) return; // not loaded
      const src = ctx.createBufferSource();
      src.buffer = srcBuf;
      if (opts?.pitch) src.playbackRate.value = opts.pitch;
      const panner = ctx.createStereoPanner();
      panner.pan.value = typeof opts?.pan === 'number' ? opts!.pan! : 0;
      src.connect(poolNode).connect(panner).connect(ctx.destination);
      src.start(0);
      // cleanup
      src.onended = () => { try { src.disconnect(); poolNode.disconnect(); panner.disconnect(); } catch (e) {} };
    } catch (e) {
      // ignore audio errors
    }
  }

  function generateLevel() {
    // Procedural initial seeding: start a stretch of ground and a few platform chunks
    game.platforms = [];
    game.shadows = [];
    game.coins = [];
    game.boosts = [];
    game.spikes = [];
    game.enemies = [];
    // starting x
    game.nextSpawnX = 0;
    // spawn initial 4000px of level
    while (game.nextSpawnX < 4000) spawnChunk(game.nextSpawnX);
  }

  function getFurthestPlatformX() {
    let maxX = 0;
    for (const p of game.platforms) maxX = Math.max(maxX, p.x + (p.width || 0));
    return maxX;
  }

  function spawnChunk(startX: number) {
    // spawn a chunk that may include ground, gaps, platforms, coins, spikes, enemies
    const groundHeight = 460;
    // randomize next width
    const chunkWidth = 300 + Math.floor(Math.random() * 700);
    // ground piece
    game.platforms.push({ x: startX, y: groundHeight, width: chunkWidth, height: 60, type: 'ground' });
    // shadow under ground
    game.shadows.push({ x: startX, y: groundHeight + 20, width: chunkWidth, height: 120, alpha: 0.75 });

    // maybe some elevated platforms on this chunk
    const platCount = Math.random() < 0.6 ? 1 + Math.floor(Math.random() * 2) : 0;
    for (let i = 0; i < platCount; i++) {
      const pw = 100 + Math.floor(Math.random() * 160);
      const px = startX + 40 + Math.random() * Math.max(1, chunkWidth - 120 - pw);
      const py = 300 - Math.floor(Math.random() * 120);
      game.platforms.push({ x: px, y: py, width: pw, height: 20, type: 'platform' });
      game.shadows.push({ x: px, y: py + 20, width: pw, height: 120, alpha: 0.7 });
      // spawn coins on platform
      if (Math.random() > 0.3) {
        const coinCount = 1 + Math.floor(Math.random() * 2);
        for (let c = 0; c < coinCount; c++) game.coins.push({ x: px + 12 + Math.random() * (pw - 24), y: py - 28 - Math.random() * 20, width: 18, height: 18, collected: false, pulse: Math.random() * Math.PI * 2 });
      }
      // chance of spike on platform edge
      if (Math.random() > 0.7) {
        const sx = px + 8 + Math.random() * Math.max(8, pw - 16);
        const sy = py - 14;
        game.spikes.push({ x: sx, y: sy, width: 14, height: 14, telegraphTimer: 0, active: false, cooldown: 0 });
      }
      // chance to place enemy
      if (Math.random() > 0.65) {
        const roll = Math.random();
        let kind: any = 'ranged';
        if (roll < 0.2) kind = 'melee';
        else if (roll < 0.5) kind = 'ranged';
        else if (roll < 0.8) kind = 'seeker';
        else kind = 'drone';
        game.enemies.push({ id: enemyIdCounter++, x: px + pw/2, y: py - 40, width: 40, height: 40, velX: 60, baseSpeed: 60, chaseSpeed: 220, patrol: { start: px - 80, end: px + pw + 80 }, lightAngle: 0, lightDistance: 240, lightCone: 0.9, state: 'patrol', detectionTimer: 0, alertTimer: 0, throwCooldown: Math.random()*2, flash:0, wanderTimer: Math.random()*2, targetX: px + pw/2, scanCenter:0, scanPhase: Math.random()*Math.PI*2, scanSpeed: 1, scanRange: 0.9, scanDir: Math.random()>0.5?1:-1, beamPulsePhase: Math.random()*Math.PI*2, beamPulseSpeed: 1.8, dynamicCone:0.9, beamAlpha:0.35, blinkTimer:2+Math.random()*4, blinkState:0, blinkDuration:0, baseCone:0.9, kind: kind, health: 2 + Math.floor(Math.random()*2), meleeCooldown:0, meleeRange:48, meleeDamage: kind==='melee'?2:1, projectileSpeed: kind==='drone'?520:420, accuracy:0.85, canDescend: kind==='seeker', velY:0, grounded:true });
      }
    }

    // sometimes put spikes directly on the ground piece in short clusters near middle
    if (Math.random() > 0.5) {
      const clusterCount = 2 + Math.floor(Math.random()*3);
      const start = startX + 40 + Math.random() * Math.max(1, chunkWidth - 120 - clusterCount*20);
      for (let s = 0; s < clusterCount; s++) {
        const sx = start + s * 24;
        game.spikes.push({ x: sx, y: groundHeight - 14, width: 14, height: 14, telegraphTimer: 0, active: false, cooldown: 0 });
      }
    }

    // small chance to spawn a boost
    if (Math.random() > 0.92) game.boosts.push({ x: startX + 60 + Math.random()*(chunkWidth-120), y: 300 - Math.random()*80, width: 24, height: 24, collected: false, type: 'boost' });

    game.nextSpawnX = startX + chunkWidth + 40;
  }

  function checkPlatformCollision(player: any, platform: any) {
    return player.x + player.width > platform.x && player.x < platform.x + platform.width && player.y + player.height > platform.y && player.y < platform.y + platform.height;
  }

  function checkCollision(a: any, b: any) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  // Simple occlusion test: sample points along the line and check platform intersection
  function isOccluded(ex: number, ey: number, tx: number, ty: number) {
    const dx = tx - ex; const dy = ty - ey;
    const dist = Math.hypot(dx, dy) || 1;
    const steps = Math.min(18, Math.max(4, Math.floor(dist / 60)));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const sx = ex + dx * t;
      const sy = ey + dy * t;
      for (const plat of game.platforms) {
        if (sx > plat.x && sx < plat.x + plat.width && sy > plat.y && sy < plat.y + plat.height) return true;
      }
    }
    return false;
  }

  // find platform under a point (centerX) within vertical tolerance
  function findPlatformUnder(x: number, y: number, tol = 6) {
    for (const plat of game.platforms) {
      if (x > plat.x && x < plat.x + plat.width && Math.abs(y - plat.y) <= tol) return plat;
    }
    return null;
  }

  function killPlayer() {
    const p = game.player;
    if (!p) return;

    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      game.particles.push({ x: p.x + p.width / 2, y: p.y + p.height / 2, vx: Math.cos(angle) * 150, vy: Math.sin(angle) * 150, size: 4, color: "#ff0080", life: 1 });
    }

    stats.deaths += 1;
  try { playSfx('player_death', { vol: 1.0 }); } catch (e) {}
  // Notify host that the game is over
    if (hooks?.onGameOver) hooks.onGameOver(stats.score);
  }

  function handleJump() {
    const p = game.player;
    if (!p) return;
    // use jump buffering so player input just before landing still triggers a jump
    p.jumpBuffer = TUNING.jumpBufferTime || 0.12;
  }

  function updateGame(delta: number) {
    // accumulate a simple global time for subtle animations
    game.time = (game.time || 0) + delta;
    const p = game.player;
    if (!p) return;

  const GRAVITY = TUNING.gravity || 1400;
  const MOVE_SPEED = 220;

    if (p.canMove) {
      const effectiveMove = MOVE_SPEED * (p.speedMultiplier || 1);
      if (keys.left) p.velX = -effectiveMove;
      else if (keys.right) p.velX = effectiveMove;
      else p.velX *= 0.85;
    }

  p.velY += GRAVITY * delta;
    p.x += p.velX * delta;
    p.y += p.velY * delta;

    p.grounded = false;
    game.platforms.forEach((platform: any) => {
      if (checkPlatformCollision(p, platform)) {
          if (p.velY > 0 && p.y + p.height - p.velY * delta <= platform.y + 5) {
          p.y = platform.y - p.height;
          p.velY = 0;
          p.grounded = true;
          p.jumpCount = 0;
          p.coyoteTimer = TUNING.coyoteTime || 0.12;
        }
      }
    });

    p.inShadow = false;
    game.shadows.forEach((shadow: any) => {
      if (p.x + p.width > shadow.x && p.x < shadow.x + shadow.width && p.y + p.height > shadow.y && p.y < shadow.y + shadow.height) p.inShadow = true;
    });

    p.detected = false;
    game.enemies.forEach((enemy: any) => {
      // smarter movement: predictive intercept + smooth acceleration when alerted
      if (enemy.state === "alert") {
        // player's center
        const px = p.x + p.width / 2;
        const py = p.y + p.height / 2;
        const dxE = px - enemy.x;
        const dyE = py - enemy.y;
        const dist = Math.max(1, Math.hypot(dxE, dyE));

        // lead slightly based on player's horizontal velocity
        const leadFactor = Math.min(0.7, Math.abs(p.velX) / 400);
        const targetX = px + p.velX * leadFactor * Math.min(1, dist / 600);

        // aggression scales with detection level
        const aggression = 1 + Math.min(1.2, (p.detectionLevel || 0) / 80);
        const desiredSpeed = (enemy.chaseSpeed || enemy.baseSpeed || 180) * aggression;

        // desired horizontal velocity toward targetX
        const desiredVelX = Math.sign(targetX - enemy.x) * desiredSpeed;
        const accel = 6; // smoothing factor
        enemy.velX += (desiredVelX - enemy.velX) * Math.min(1, accel * delta);

        // move enemy
        enemy.x += enemy.velX * delta;

        // rotate light toward player
        enemy.lightAngle = Math.atan2(dyE, dxE);
      } else {
        // patrol behavior
        enemy.x += enemy.velX * delta;
        if (enemy.x <= enemy.patrol.start) { enemy.x = enemy.patrol.start; enemy.velX = Math.abs(enemy.baseSpeed || enemy.velX); enemy.lightAngle = 0; }
        else if (enemy.x >= enemy.patrol.end) { enemy.x = enemy.patrol.end; enemy.velX = -(Math.abs(enemy.baseSpeed || enemy.velX)); enemy.lightAngle = Math.PI; }
        if (enemy.state === "patrol") {
          // orient scan center roughly in the patrol movement direction
          enemy.scanCenter = Math.atan2(0, Math.sign(enemy.velX || 1));
          // advance scan phase and set a swinging lightAngle to emulate a torch
          enemy.scanPhase += delta * (enemy.scanSpeed || 1) * (enemy.scanDir || 1);
          const scanAmp = enemy.scanRange || 0.9;
          enemy.lightAngle = enemy.scanCenter + Math.sin(enemy.scanPhase) * scanAmp;
        }
      }

      const dx = p.x + p.width / 2 - enemy.x;
      const dy = p.y + p.height / 2 - enemy.y;
      const distToPlayer = Math.hypot(dx, dy);
      const angleToPlayer = Math.atan2(dy, dx);

      let angleDiff = Math.abs(angleToPlayer - enemy.lightAngle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

      // occlusion-aware beam detection with core/fringe
      const ex = enemy.x; const ey = enemy.y;
      const pxC = p.x + p.width / 2; const pyC = p.y + p.height / 2;
      const occluded = isOccluded(ex, ey, pxC, pyC);
      const coreAngle = (enemy.lightCone || 0.9) * 0.5; // narrower core
      const inCore = angleDiff < coreAngle;
      const inFringe = angleDiff < (enemy.lightCone || 0.9);
      if (!p.inShadow && !occluded && distToPlayer < enemy.lightDistance && (inCore || inFringe)) {
        // core detection: fast; fringe detection: slow build
        const build = inCore ? 80 : 22;
        p.detected = true;
        enemy.detectionTimer += delta;
        if (enemy.detectionTimer > 0.3 || inCore) {
          // enter alert state and assign simple roles to nearby enemies
          enemy.state = "alert"; enemy.alertTimer = Math.max(enemy.alertTimer || 0, 2.5);
          try { if (!enemy._lastAlert || (game.time || 0) - enemy._lastAlert > 0.8) { playSfx('alert', { vol: 0.9, pan: Math.max(-1, Math.min(1, (enemy.x - (game.camera?.x||0) - 200) / 600)) }); enemy._lastAlert = (game.time || 0); } } catch (e) {}
          // choose role probabilistically
          if (!enemy.role) enemy.role = Math.random() > 0.6 ? 'flanker' : 'suppressor';
          // if flanker, pick a flank target to left or right edge of patrol area
          if (enemy.role === 'flanker') {
            const dir = Math.random() > 0.5 ? -1 : 1;
            const edgeX = dir < 0 ? (enemy.patrol?.start ?? enemy.x - 120) : (enemy.patrol?.end ?? enemy.x + 120);
            enemy.flankTargetX = edgeX + dir * 40 + (Math.random()-0.5)*60;
          }
        }
        p.detectionLevel = Math.min(100, p.detectionLevel + delta * build);
        // if very close, handle melee lethality only for melee types; others prefer ranged engagement
        if (distToPlayer < 60) {
          if (enemy.kind === 'melee') {
            // quick dash / melee
            killPlayer();
            if (hooks?.onGameOver) hooks.onGameOver(stats.score);
          } else {
            // non-melee enemies will try to shoot; only allow a very small chance of instant kill at point-blank
            if (distToPlayer < 28 && Math.random() < 0.2) {
              killPlayer();
              if (hooks?.onGameOver) hooks.onGameOver(stats.score);
            }
          }
        }
        if (p.detectionLevel >= 100) {
          killPlayer();
          if (hooks?.onGameOver) hooks.onGameOver(stats.score);
        }
      } else {
        enemy.detectionTimer = Math.max(0, enemy.detectionTimer - delta * 2);
        p.detectionLevel = Math.max(0, p.detectionLevel - delta * 30);
      }

      // stealth takedown: if player presses attempt (or key) while behind and undetected
      // we'll handle attempts via api.attemptTakedown() which sets a flag on player
      if (p.attemptTakedown) {
        p.attemptTakedown = false;
        // behind check: angle between enemy facing and player should be > 120deg (i.e., behind)
        const facing = enemy.lightAngle;
        let behindAngle = Math.abs(Math.atan2(pyC - ey, pxC - ex) - facing);
        if (behindAngle > Math.PI) behindAngle = Math.PI * 2 - behindAngle;
        const isBehind = behindAngle > (Math.PI * 2 * 0.33);
        if (!p.detected && isBehind && distToPlayer < 50) {
          // successful takedown: remove enemy and reward
          const idx = game.enemies.indexOf(enemy);
          if (idx >= 0) {
            game.enemies.splice(idx, 1);
            try { playSfx('stealth_takedown', { vol: 0.95 }); } catch (e) {}
            stats.score += 800; stats.coins += 1;
            if (hooks?.onCoins) hooks.onCoins(stats.coins);
              try { showBanner('TAKEDOWN!', '#88ff88'); } catch (e) {}
            for (let i = 0; i < 18; i++) game.particles.push({ x: enemy.x, y: enemy.y, vx: (Math.random()-0.5)*300, vy: (Math.random()-0.5)*200, size: 3+Math.random()*3, color: '#88ff88', life: 0.9 });
          }
        }
      }

      // wandering behavior when not alert: pick a random target occasionally
      enemy.wanderTimer = (enemy.wanderTimer || 0) - delta;
      if (enemy.state !== 'alert' && enemy.wanderTimer <= 0) {
        enemy.wanderTimer = 1.5 + Math.random() * 3.0;
        const rangeStart = enemy.patrol?.start ?? (enemy.x - 200);
        const rangeEnd = enemy.patrol?.end ?? (enemy.x + 200);
        enemy.targetX = rangeStart + Math.random() * Math.max(1, (rangeEnd - rangeStart));
        enemy.velX = Math.sign(enemy.targetX - enemy.x) * (enemy.baseSpeed || 60);
      }

      // beam & blink updates
      enemy.beamPulsePhase = (enemy.beamPulsePhase || 0) + (enemy.beamPulseSpeed || 1) * delta;
      const pulse = 0.7 + Math.sin(enemy.beamPulsePhase) * 0.25;
      // dynamic cone: open wider when alerted or when scanning a far empty area, close when looking near/under platforms
      const lookDist = Math.hypot(pxC - ex, pyC - ey);
      const platformBelow = game.platforms.some((plat: any) => ex > plat.x && ex < plat.x + plat.width && plat.y > ey && plat.y < ey + 300);
      // close cone if scanning near platforms, open if nothing below
      enemy.dynamicCone = enemy.baseCone * (platformBelow ? 0.7 : 1.15);
      // beam alpha base (before open/close)
      const baseAlpha = enemy.state === 'alert' ? 0.55 : 0.25 * pulse;
      enemy.beamAlpha = baseAlpha;
      // blink logic
      enemy.blinkTimer = (enemy.blinkTimer || 3) - delta;
      if (enemy.blinkTimer <= 0) {
        enemy.blinkDuration = 0.08 + Math.random() * 0.18;
        enemy.blinkState = 1; // closing
        enemy.blinkTimer = 2 + Math.random() * 4;
      }
      if (enemy.blinkState === 1) {
        enemy.blinkDuration -= delta;
        if (enemy.blinkDuration <= 0) enemy.blinkState = 0;
      }

      // Determine desired beam open state: beam should be off when blinking or looking significantly up
      const isLookingUp = Math.sin(enemy.lightAngle) < -0.35; // threshold for 'looking up'
      const desiredOpen = !(enemy.blinkState === 1 || isLookingUp);
      // initialize beamOpen if missing
      if (typeof enemy.beamOpen !== 'number') enemy.beamOpen = desiredOpen ? 1 : 0;
      // smoothly interpolate beamOpen
      const openSpeed = 4.0; // seconds to lerp (higher = slower)
      enemy.beamOpen += ( (desiredOpen ? 1 : 0) - enemy.beamOpen ) * Math.min(1, openSpeed * delta);
      // clamp
      enemy.beamOpen = Math.max(0, Math.min(1, enemy.beamOpen));

      if (enemy.state === "alert") {
        // simple enemy physics for flanking: gravity and jumping, with drones hovering in air
        if (enemy.kind === 'drone') {
          // drones hover toward player's Y position smoothly
          const desiredY = p.y + (Math.random() - 0.5) * 40;
          enemy.y += (desiredY - enemy.y) * Math.min(1, 3 * delta);
          enemy.velY = 0;
          enemy.grounded = false;
        } else {
          enemy.velY = enemy.velY || 0;
          enemy.velY += 1200 * delta;
          enemy.y += enemy.velY * delta;
          // ground detection for enemy
          enemy.grounded = false;
          for (const plat of game.platforms) {
            if (enemy.x + enemy.width > plat.x && enemy.x < plat.x + plat.width && enemy.y + enemy.height > plat.y && enemy.y < plat.y + plat.height) {
              if (enemy.velY >= 0 && enemy.y + enemy.height - enemy.velY*delta <= plat.y + 6) {
                enemy.y = plat.y - enemy.height; enemy.velY = 0; enemy.grounded = true; break;
              }
            }
          }
        }
        // spawn a few dust sparks behind the enemy while chasing
        if (Math.random() < 0.15) {
          game.particles.push({ x: enemy.x + (Math.random() - 0.5) * 10, y: enemy.y + enemy.height, vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 30, size: 2 + Math.random() * 3, color: '#ff6666', life: 0.4 });
        }
        // throwing/firing logic: only non-melee kinds spawn projectiles
        if (enemy.kind !== 'melee') {
          enemy.throwCooldown -= delta;
          if (enemy.throwCooldown <= 0) {
            const maxActive = enemy.kind === 'drone' ? 2 : 1;
            const activeByThis = game.projectiles.filter((pp: any) => pp.ownerId === enemy.id).length;
            if (activeByThis < maxActive) {
              // per-kind cooldowns
              if (enemy.kind === 'drone') enemy.throwCooldown = 0.6 + Math.random() * 0.8;
              else if (enemy.kind === 'seeker') enemy.throwCooldown = 1.6 + Math.random() * 1.4;
              else enemy.throwCooldown = 1.0 + Math.random() * 1.6;

              const px = p.x + p.width / 2;
              const py = p.y + p.height / 2 - 8;
              const ex = enemy.x + enemy.width / 2;
              const ey = enemy.y + enemy.height / 2;
              const dx = px - ex;
              const dy = py - ey;
              const dist = Math.hypot(dx, dy) || 1;
              // apply accuracy-based spread
              const spread = (1 - (enemy.accuracy || 0.8)) * 0.3 * dist;
              const ang = Math.atan2(dy, dx) + (Math.random() - 0.5) * (spread / Math.max(1, dist));
              const speed = enemy.projectileSpeed || 420;
              const vx = Math.cos(ang) * speed;
              const vy = Math.sin(ang) * speed;
              game.projectiles.push({ x: ex, y: ey, vx, vy, size: 6, life: 4, owner: 'enemy', ownerId: enemy.id, damage: enemy.meleeDamage || 1, type: 'bullet' });
              try { playSfx('enemy_shoot', { vol: 0.9, pan: Math.max(-1, Math.min(1, (enemy.x - (game.camera?.x||0) - 200) / 600)) }); } catch (e) {}
              for (let m = 0; m < 6; m++) game.particles.push({ x: ex + (Math.random()-0.5)*6, y: ey + (Math.random()-0.5)*6, vx: Math.sign(vx) * (80 + Math.random()*120), vy: (Math.random()-0.5)*40, size: 2 + Math.random()*3, color: '#ffd880', life: 0.25 });
              enemy.flash = 0.35;
              game.particles.push({ x: enemy.x, y: enemy.y - 8, vx: 0, vy: -30, size: 6, color: '#ffdd00', life: 0.45 });
              game.enemies.forEach((ally: any) => {
                if (ally.id !== enemy.id) {
                  const dxA = ally.x - enemy.x;
                  const dyA = ally.y - enemy.y;
                  if (Math.hypot(dxA, dyA) < 360) {
                    ally.state = 'alert';
                    ally.alertTimer = Math.max(ally.alertTimer || 0, 1.5 + Math.random() * 2.0);
                  }
                }
              });
            } else {
              enemy.throwCooldown = 0.3;
            }
          }
        }

        // decay flash effect
        enemy.flash = Math.max(0, (enemy.flash || 0) - delta);
        // flanker movement: move toward flankTargetX if present
        if (enemy.role === 'flanker' && typeof enemy.flankTargetX === 'number') {
          const towards = Math.sign(enemy.flankTargetX - enemy.x);
          enemy.velX += (towards * (enemy.chaseSpeed || enemy.baseSpeed || 180) - (enemy.velX || 0)) * Math.min(1, 6 * delta);
          // if target is higher, attempt a jump when grounded
          const plat = findPlatformUnder(enemy.flankTargetX, enemy.y + enemy.height + 6, 12);
          if (plat && plat.y < enemy.y && enemy.grounded) {
            enemy.velY = -420; enemy.grounded = false;
          }
        }

        enemy.alertTimer -= delta;
        if (enemy.alertTimer <= 0) {
          enemy.state = "patrol";
          // resume patrol with base speed in direction of patrol
          enemy.velX = Math.sign((enemy.patrol.start + enemy.patrol.end) / 2 - enemy.x) * (enemy.baseSpeed || 80);
          enemy.role = undefined; enemy.flankTargetX = undefined;
        }
      }
    });

    game.coins.forEach((coin: any) => {
      if (!coin.collected) {
        coin.pulse += delta * 6;
        if (checkCollision(p, coin)) {
          coin.collected = true;
          stats.coins += 1;
          stats.score += 100;
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            game.particles.push({ x: coin.x + 10, y: coin.y + 10, vx: Math.cos(angle) * 100, vy: Math.sin(angle) * 100, size: 3, color: "#ffd700", life: 0.6 });
          }
          if (hooks?.onScore) hooks.onScore(stats.score);
          // notify wrapper about coins count so HUD can update
          if (hooks?.onCoins) hooks.onCoins(stats.coins);
          try { playSfx('coin', { vol: 0.9, pitch: 1.0 + (Math.random() - 0.5) * 0.06 }); } catch (e) {}
          // HUD feedback
          try { showBanner('+1 COIN', '#ffd700'); } catch (e) {}
          // small chance to charge boost when collecting coin
          if (Math.random() < 0.25) {
            stats.boostCharge = Math.min(stats.boostThreshold, (stats.boostCharge || 0) + 1);
            try { playSfx('boost_pick', { vol: 0.9 }); } catch (e) {}
            try { showBanner('BOOST +1', '#88ff88'); } catch (e) {}
          }
        }
      }
    });

    // boost pickups
    game.boosts.forEach((b: any) => {
      if (!b.collected && checkCollision(p, b)) {
        b.collected = true;
        if (b.type === 'life') {
          p.life = Math.min(p.maxLife, p.life + 2);
        } else {
          stats.boostCharge = Math.min(stats.boostThreshold, (stats.boostCharge || 0) + 2);
        }
        // particles
        for (let i = 0; i < 12; i++) game.particles.push({ x: b.x + b.width/2, y: b.y + b.height/2, vx: (Math.random()-0.5)*200, vy: (Math.random()-0.5)*200, size: 3, color: '#88ff88', life: 0.8 });
        // HUD feedback
        try { showBanner(b.type === 'life' ? 'LIFE +2' : 'BOOST +2', b.type === 'life' ? '#88ff88' : '#ffd88a'); } catch (e) {}
        try { playSfx('boost_pick', { vol: 0.9 }); } catch (e) {}
      }
    });

    // emit small sparks when player moves quickly or lands
    if (Math.abs(p.velX) > 30 && Math.abs(lastVelX - p.velX) > 10) {
      // lateral movement sparks
      for (let i = 0; i < 2; i++) {
        game.particles.push({ x: p.x + p.width / 2, y: p.y + p.height - 4, vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 40 - 20, size: 2 + Math.random() * 2, color: '#ffffff', life: 0.4 });
      }
    }

    // emit subtle afterimage trail for motion (push a short-lived trail sample) with velocity for streaks
    const speed = Math.hypot(p.velX, p.velY);
    if (speed > 80 || p.boostActive) {
      game.trails.push({ x: p.x + p.width/2, y: p.y + p.height/2, vx: p.velX, vy: p.velY, life: 0.28, maxLife: 0.28, size: Math.max(6, p.width * 0.28), alpha: 0.45 });
      if (game.trails.length > 18) game.trails.shift();
    }

    // landing detection: if we just became grounded
    if (!prevGrounded && p.grounded) {
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10;
        game.particles.push({ x: p.x + p.width / 2, y: p.y + p.height, vx: Math.cos(angle) * 120, vy: Math.sin(angle) * 60 - 40, size: 3, color: '#88ccff', life: 0.6 });
      }
      try { playSfx('land', { vol: 0.95 }); } catch (e) {}
    }

    game.particles = game.particles.filter((pA: any) => { pA.x += pA.vx * delta; pA.y += pA.vy * delta; pA.vy += 600 * delta; pA.life -= delta; return pA.life > 0; });

    // debris settling: long-lived small particles convert to static debris when their velocity and life are low
    for (let i = game.particles.length - 1; i >= 0; i--) {
      const pa = game.particles[i];
      if (pa.life < 0.35 && Math.abs(pa.vx) < 10 && Math.abs(pa.vy) < 20) {
        // settle into debris (small static piece)
        game.debris.push({ x: pa.x + (Math.random()-0.5)*2, y: pa.y + (Math.random()-0.5)*2, size: Math.max(1, Math.floor(pa.size*0.6)), color: pa.color, alpha: 0.9 });
        game.particles.splice(i, 1);
        markDebrisDirty();
      }
    }
    // limit debris count and gently fade oldest debris to keep performance
    if (game.debris.length > 600) {
      game.debris.splice(0, game.debris.length - 600);
    }

    // update movement/grounded trackers
    prevGrounded = p.grounded;
    lastVelX = p.velX;

    // decrement coyote and jump buffer timers
    p.coyoteTimer = Math.max(0, (p.coyoteTimer || 0) - delta);
    p.jumpBuffer = Math.max(0, (p.jumpBuffer || 0) - delta);
    // execute buffered jump if possible
    if ((p.jumpBuffer || 0) > 0) {
      const canJump = p.grounded || (p.coyoteTimer > 0) || (p.jumpCount < p.maxJumps);
      if (canJump) {
        if (p.grounded || p.coyoteTimer > 0) p.velY = TUNING.jumpVelocity || -560;
        else p.velY = TUNING.doubleJumpVelocity || -440;
        p.jumpCount = Math.min(p.maxJumps, p.jumpCount + 1);
        p.grounded = false; p.coyoteTimer = 0; p.jumpBuffer = 0;
        try { playSfx('jump', { vol: 0.95, pitch: 1.0 + (Math.random()-0.5)*0.06 }); } catch (e) {}
        for (let i = 0; i < 8; i++) game.particles.push({ x: p.x + Math.random() * p.width, y: p.y + p.height, vx: (Math.random() - 0.5) * 80, vy: Math.random() * 80, size: 3, color: '#ffffff', life: 0.36 });
      }
    }

    // update projectiles
    if (game.projectiles && game.projectiles.length) {
      for (let i = game.projectiles.length - 1; i >= 0; i--) {
        const pr = game.projectiles[i];
        // bullets fly straight (no gravity) if type === 'bullet'
        if (pr.type === 'bullet') {
          pr.x += pr.vx * delta;
          pr.y += pr.vy * delta;
        } else {
          pr.vy += 1200 * delta; // gravity for thrown objects
          pr.x += pr.vx * delta;
          pr.y += pr.vy * delta;
        }
        pr.life -= delta;

        // collide with platforms (simple)
        for (const plat of game.platforms) {
          if (pr.x > plat.x && pr.x < plat.x + plat.width && pr.y > plat.y && pr.y < plat.y + plat.height) {
            // spawn hit particles
            for (let k = 0; k < 8; k++) game.particles.push({ x: pr.x, y: pr.y, vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 200, size: 2 + Math.random() * 3, color: '#ffaa44', life: 0.6 });
            game.projectiles.splice(i, 1);
            break;
          }
        }

        if (!pr) continue;

  // collide with player using projectile bounding box
  const rect = { x: p.x, y: p.y, width: p.width, height: p.height };
  const prBox = { x: pr.x - (pr.size||4)/2, y: pr.y - (pr.size||4)/2, width: (pr.size||4), height: (pr.size||4) };
  const overlap = prBox.x < rect.x + rect.width && prBox.x + prBox.width > rect.x && prBox.y < rect.y + rect.height && prBox.y + prBox.height > rect.y;
  if (overlap) {
          // hit!
          for (let k = 0; k < 16; k++) game.particles.push({ x: pr.x, y: pr.y, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300, size: 3 + Math.random() * 4, color: '#ff4444', life: 0.9 });
          // reduce life
          p.life = Math.max(0, p.life - (pr.damage || 1));
          try { playSfx('player_hit', { vol: 1.0, pan: Math.max(-1, Math.min(1, (pr.x - game.camera.x - 200) / 600)) }); } catch (e) {}
    try { showBanner('-' + (pr.damage || 1) + ' HP', '#ff6666'); } catch (e) {}
          // global screen shake
          shakeDuration = 0.6; shakeTime = 0; shakeIntensity = 10;
          // player-local shake & small stun
          p.shakeTime = 0; p.shakeIntensity = 6;
          p.canMove = false;
          setTimeout(() => { if (p) p.canMove = true; }, 150);
          // remove projectile
          game.projectiles.splice(i, 1);
          // if dead
          if (p.life <= 0) { killPlayer(); if (hooks?.onGameOver) hooks.onGameOver(stats.score); }
        }

        if (pr && pr.life <= 0) {
          try { playSfx('projectile_hit', { vol: 0.9 }); } catch (e) {}
          game.projectiles.splice(i, 1);
        }
      }
    }

  // Camera is calculated in drawGame where we know the exact canvas size.
    // Procedural world extension: spawn ahead of the player so the world never empties
    try {
      const furthest = getFurthestPlatformX();
      const spawnAhead = Math.max(1200, window.innerWidth * 2);
      const playerAheadX = (p.x || 0) + spawnAhead;
      while ((game.nextSpawnX || furthest) < playerAheadX) {
        spawnChunk(game.nextSpawnX || Math.max(furthest, (game.nextSpawnX||0)));
      }
      // prune behind camera to keep arrays small
      const pruneX = Math.max(0, (p.x || 0) - Math.max(1200, window.innerWidth));
      game.platforms = game.platforms.filter((pl: any) => pl.x + (pl.width||0) > pruneX - 400);
      game.coins = game.coins.filter((c: any) => (c.x + (c.width||0)) > pruneX - 200 && !c.collected);
      game.enemies = game.enemies.filter((e: any) => (e.x + (e.width||0)) > pruneX - 600);
      game.spikes = game.spikes.filter((s: any) => (s.x + (s.width||0)) > pruneX - 200);
      game.boosts = game.boosts.filter((b: any) => (b.x + (b.width||0)) > pruneX - 200 && !b.collected);
    } catch (e) {}

    const newDistance = Math.max(stats.distance, Math.floor(p.x / 10));
    const newScore = Math.max(stats.score, Math.floor(p.x / 2));
    if (newDistance !== stats.distance || newScore !== stats.score) {
      stats.distance = newDistance; stats.score = newScore;
      if (hooks?.onScore) hooks.onScore(stats.score);
    }

    if (p.y > 600) { killPlayer(); if (hooks?.onGameOver) hooks.onGameOver(stats.score); }
    // handle boost timer decay
    if (p.boostActive) {
      p.boostTimer -= delta;
      if (p.boostTimer <= 0) {
        p.boostActive = false; p.speedMultiplier = 1; p.boostTimer = 0;
      }
    }
    // ensure boostCharge never negative
    stats.boostCharge = Math.max(0, stats.boostCharge || 0);
  }

  function drawGame() {
    const dpr = window.devicePixelRatio || 1;
  // Use the viewport size to ensure the canvas fills mobile screens correctly
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  // Also set the style size so CSS/layout and the backing store match
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
    C.setTransform(dpr, 0, 0, dpr, 0, 0);

    // apply screen shake (translate after camera transform)
    C.save();
    C.translate(-game.camera.x, -game.camera.y);
    if (shakeDuration > 0) {
      const t = Math.min(1, shakeTime / shakeDuration);
      const intensity = shakeIntensity * (1 - t);
      const sx = (Math.random() - 0.5) * intensity;
      const sy = (Math.random() - 0.5) * intensity;
      C.translate(sx, sy);
      shakeTime += 1/60;
      if (shakeTime > shakeDuration) { shakeDuration = 0; shakeTime = 0; }
    }

  C.fillStyle = "#000000";
  C.fillRect(game.camera.x, game.camera.y, width, height);

    C.fillStyle = "#ffffff";
  C.fillStyle = "#ffffff";
    C.strokeStyle = "#ffffff";
    C.lineWidth = 2;
    // draw settled debris first (ground clutter)
    // draw settled debris via offscreen cache for performance
    if (game.debris && game.debris.length) {
      try {
        const camX = Math.floor(game.camera.x);
        const camY = Math.floor(game.camera.y);
        if (!debrisCanvas) {
          debrisCanvas = document.createElement('canvas'); debrisCanvas.width = Math.max(512, Math.min(2048, canvas.width)); debrisCanvas.height = Math.max(512, Math.min(2048, canvas.height)); debrisCtx = debrisCanvas.getContext('2d'); debrisDirty = true;
        }
        if (debrisCtx && (debrisDirty || Math.abs(camX - lastDebrisCamX) > 64 || Math.abs(camY - lastDebrisCamY) > 64)) {
          debrisCtx.clearRect(0,0,debrisCanvas.width, debrisCanvas.height);
          debrisCtx.save();
          // draw debris relative to camera (we bake world positions into cache at camera=0)
          for (let d of game.debris) {
            debrisCtx.globalAlpha = d.alpha * 0.95;
            debrisCtx.fillStyle = d.color;
            debrisCtx.fillRect(Math.floor(d.x - camX + debrisCanvas.width/2 - canvas.width/2), Math.floor(d.y - camY + debrisCanvas.height/2 - canvas.height/2), d.size, d.size);
          }
          debrisCtx.restore();
          debrisDirty = false; lastDebrisCamX = camX; lastDebrisCamY = camY;
        }
        if (debrisCanvas) {
          // blit the cached debris texture at camera offset
          const sx = Math.floor(lastDebrisCamX - (debrisCanvas.width/2 - canvas.width/2));
          const sy = Math.floor(lastDebrisCamY - (debrisCanvas.height/2 - canvas.height/2));
          C.save(); C.globalAlpha = 1; C.drawImage(debrisCanvas, sx, sy); C.restore();
        }
      } catch (e) {
        // fallback: direct draw if cache fails
        C.save();
        for (let d of game.debris) { C.globalAlpha = d.alpha * 0.9; C.fillStyle = d.color; C.fillRect(Math.floor(d.x), Math.floor(d.y), d.size, d.size); }
        C.restore();
      }
    }
    game.platforms.forEach((platform: any) => C.fillRect(platform.x, platform.y, platform.width, platform.height));

    game.shadows.forEach((shadow: any) => {
      C.fillStyle = `rgba(20, 20, 40, ${shadow.alpha})`;
      C.fillRect(shadow.x, shadow.y, shadow.width, shadow.height);
      C.strokeStyle = "rgba(100, 100, 255, 0.3)";
      C.lineWidth = 2; C.setLineDash([5,5]); C.strokeRect(shadow.x, shadow.y, shadow.width, shadow.height); C.setLineDash([]);
    });

    game.coins.forEach((coin: any) => {
      if (!coin.collected) {
        C.save(); C.translate(coin.x + 10, coin.y + 10 + Math.sin(coin.pulse) * 3);
        C.shadowColor = "#ffd700"; C.shadowBlur = 15; C.fillStyle = "#ffd700"; C.beginPath(); C.arc(0,0,10,0,Math.PI*2); C.fill();
        C.fillStyle = "#ffffff"; C.beginPath(); C.arc(0,0,5,0,Math.PI*2); C.fill(); C.restore();
      }
    });

    game.enemies.forEach((enemy: any) => {
      C.save(); C.translate(enemy.x, enemy.y);
      // directional torch/beam: dynamic cone, alpha, motes, and lens flare
      try {
  const dist = enemy.lightDistance || 240;
  const baseHalf = enemy.dynamicCone || enemy.lightCone || 0.9;
  const half = (enemy.beamOpen || 0) * baseHalf;
        const ax = Math.cos(enemy.lightAngle - half) * dist;
        const ay = Math.sin(enemy.lightAngle - half) * dist;
        const bx = Math.cos(enemy.lightAngle + half) * dist;
        const by = Math.sin(enemy.lightAngle + half) * dist;

        // beam gradient and pulsing alpha
        const beamDirX = Math.cos(enemy.lightAngle) * dist;
        const beamDirY = Math.sin(enemy.lightAngle) * dist;
        const grad = C.createLinearGradient(0, 0, beamDirX, beamDirY);
        const baseColor = enemy.state === "alert" ? '255,80,60' : '255,230,160';
  const a = Math.max(0.02, Math.min(0.9, (enemy.beamAlpha || 0.25) * (enemy.beamOpen || 0)));
        grad.addColorStop(0, `rgba(${baseColor},${a * 0.9})`);
        grad.addColorStop(0.6, `rgba(${baseColor},${a * 0.42})`);
        grad.addColorStop(1, `rgba(${baseColor},0)`);

        C.save();
        C.globalCompositeOperation = 'lighter';
        C.fillStyle = grad;
        C.beginPath();
        C.moveTo(0, 0);
        C.lineTo(ax, ay);
        C.lineTo(bx, by);
        C.closePath();
        C.fill();

  // core beam (scale down further when partially open)
  const coreHalf = half * (0.45 + 0.35 * (enemy.beamOpen || 0));
        const cx = Math.cos(enemy.lightAngle - coreHalf) * dist;
        const cy = Math.sin(enemy.lightAngle - coreHalf) * dist;
        const dx = Math.cos(enemy.lightAngle + coreHalf) * dist;
        const dy = Math.sin(enemy.lightAngle + coreHalf) * dist;
        C.fillStyle = enemy.state === "alert" ? `rgba(255,80,60,${Math.min(0.9, a+0.2)})` : `rgba(255,240,180,${Math.min(0.8, a+0.18)})`;
        C.beginPath(); C.moveTo(0,0); C.lineTo(cx,cy); C.lineTo(dx,dy); C.closePath(); C.fill();

        // motes inside beam (small ephemeral specks to suggest volume) only when beam open
        if ((enemy.beamOpen || 0) > 0.12) {
          const moteCount = enemy.state === 'alert' ? 6 : 3;
          for (let m = 0; m < moteCount; m++) {
            const t = (Math.sin(enemy.beamPulsePhase + m) * 0.5 + 0.5) * 0.9 * (enemy.beamOpen || 0);
            const rx = Math.cos(enemy.lightAngle) * dist * t + (Math.random()-0.5) * 12 * (1 - enemy.beamOpen);
            const ry = Math.sin(enemy.lightAngle) * dist * t + (Math.random()-0.5) * 8 * (1 - enemy.beamOpen);
            C.globalAlpha = 0.12 * (enemy.state === 'alert' ? 1.2 : 1) * (0.5 + Math.random()*0.6) * (enemy.beamOpen || 0);
            C.fillStyle = enemy.state === 'alert' ? 'rgba(255,140,100,0.9)' : 'rgba(255,240,200,0.9)';
            C.beginPath(); C.arc(rx, ry, Math.max(0.8, 1.6 * (enemy.beamOpen || 0)) + Math.random()*1.2, 0, Math.PI*2); C.fill();
          }
        }

        // enhanced beam fringe: thin streaks and soft gradient lines to add motion
        if ((enemy.beamOpen || 0) > 0.18) {
          C.save();
          C.globalCompositeOperation = 'lighter';
          C.lineWidth = 0.8 + (enemy.state === 'alert' ? 1.4 : 0.6) * (enemy.beamOpen || 0);
          C.strokeStyle = enemy.state === 'alert' ? 'rgba(255,110,80,0.22)' : 'rgba(255,240,200,0.12)';
          for (let s = 0; s < 3; s++) {
            const jitter = (Math.random()-0.5) * 6 * (1 - enemy.beamOpen);
            C.beginPath();
            C.moveTo(0,0);
            C.lineTo(Math.cos(enemy.lightAngle) * (dist - 40 + jitter), Math.sin(enemy.lightAngle) * (dist - 20 + jitter));
            C.stroke();
          }
          C.restore();
        }

        // outline edges for readability
        C.globalAlpha = 1;
        C.strokeStyle = enemy.state === "alert" ? 'rgba(255,100,80,0.35)' : 'rgba(255,255,200,0.18)';
        C.lineWidth = 1.2; C.beginPath(); C.moveTo(0,0); C.lineTo(ax,ay); C.moveTo(0,0); C.lineTo(bx,by); C.stroke();

        // lens flare at origin (eye) to suggest specular reflection
        const flareSize = Math.max(6, 6 + (enemy.state === 'alert' ? 3 : 0));
        const flareGrad = C.createRadialGradient(0,0,0,0,0,flareSize*2);
        flareGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
        flareGrad.addColorStop(0.2, 'rgba(255,255,220,0.7)');
        flareGrad.addColorStop(1, 'rgba(255,255,220,0)');
        C.fillStyle = flareGrad;
        C.beginPath(); C.arc(0, 0, flareSize, 0, Math.PI*2); C.fill();

        C.restore();
      } catch (e) { /* safe fallback */ }
      // body
      C.fillStyle = "#ffffff"; C.beginPath(); C.arc(0,0,20,0,Math.PI*2); C.fill();
      // iris / eye
      const eyeColor = enemy.state === "alert" ? "#ff0000" : "#000000"; C.fillStyle = eyeColor; C.beginPath(); C.arc(0,0,12,0,Math.PI*2); C.fill();
      // pupil tracking
      if (game.player) {
        const dxp = game.player.x - enemy.x; const dyp = game.player.y - enemy.y; const angle = Math.atan2(dyp,dxp);
        const pupilX = Math.cos(angle)*5; const pupilY = Math.sin(angle)*5;
        C.fillStyle="#ffffff"; C.beginPath(); C.arc(pupilX,pupilY,4,0,Math.PI*2); C.fill();
        // specular highlight on pupil
        C.fillStyle = 'rgba(255,255,255,0.9)'; C.beginPath(); C.arc(pupilX - 1.5, pupilY - 1.5, 1.4, 0, Math.PI*2); C.fill();
        // eyelid: if blinking or looking upwards, draw a soft eyelid
        const isLookingUp = Math.sin(enemy.lightAngle) < -0.5; // looking up
        const blinkProgress = enemy.blinkState ? (enemy.blinkDuration > 0 ? 1 : 0) : 0;
        const closeFactor = Math.min(1, blinkProgress + (isLookingUp ? 0.6 : 0));
        if (closeFactor > 0.03) {
          C.save(); C.fillStyle = `rgba(0,0,0,${0.6 * closeFactor})`;
          C.beginPath();
          // simple eyelid rectangle across the upper eye that moves down with closeFactor
          C.rect(-12, -12, 24, 12 * closeFactor);
          C.fill(); C.restore();
        }
      }
      // enemy flash telegraph (exclamation) when firing
      if (enemy.flash && enemy.flash > 0) {
        C.save();
        C.fillStyle = `rgba(255,100,100,${Math.min(1, enemy.flash / 0.35)})`;
        C.font = 'bold 18px sans-serif';
        C.textAlign = 'center';
        C.fillText('!', 0, -28);
        C.restore();
      }
      C.restore();
    });

    // spikes: telegraph then activate
      if (game.spikes && game.spikes.length) {
        // update spike timers and handle activation / player damage
        for (const spike of game.spikes) {
          // cooldown ticks
          spike.cooldown = Math.max(0, (spike.cooldown || 0) - 1/60);
          // if on cooldown, ensure telegraph and active flags are reset
          if (spike.cooldown > 0) { spike.telegraphTimer = 0; spike.active = false; continue; }

          // if player nearby and not telegraphing yet, start telegraph
          const pcenterX = (game.player.x + game.player.width/2);
          const pcenterY = (game.player.y + game.player.height/2);
          const dx = pcenterX - spike.x;
          const dy = pcenterY - spike.y;
          const dist = Math.hypot(dx, dy);
          if (!spike.telegraphTimer && dist < TUNING.spikeTriggerDistance) {
            spike.telegraphTimer = TUNING.spikeTelegraphDuration;
            // small pre-telegraph sound
            try { if (!spike._lastAlert || (game.time || 0) - spike._lastAlert > 0.7) { playSfx('alert', { vol: 0.6 }); spike._lastAlert = (game.time || 0); } } catch (e) {}
          }

          // advance telegraph timer
          if (spike.telegraphTimer > 0) {
            spike.telegraphTimer = Math.max(0, spike.telegraphTimer - 1/60);
            if (spike.telegraphTimer === 0) {
              spike.active = true;
              spike.activeTimer = TUNING.spikeActiveDuration;
            }
          }

          if (spike.active) {
            spike.activeTimer = Math.max(0, (spike.activeTimer || TUNING.spikeActiveDuration) - 1/60);
            if (spike.activeTimer <= 0) {
              spike.active = false;
              spike.cooldown = TUNING.spikeCooldown;
            }
          }

          // if active, check collision with player
          if (spike.active && game.player) {
            const rect = { x: game.player.x, y: game.player.y, width: game.player.width, height: game.player.height };
            const spikeBox = { x: spike.x - spike.width/2, y: spike.y - spike.height/2, width: spike.width, height: spike.height };
            const overlap = spikeBox.x < rect.x + rect.width && spikeBox.x + spikeBox.width > rect.x && spikeBox.y < rect.y + rect.height && spikeBox.y + spikeBox.height > rect.y;
            if (overlap) {
              // apply damage once and push to cooldown to avoid repeated hits
              game.player.life = Math.max(0, game.player.life - TUNING.spikeDamage);
              try { playSfx('player_hit', { vol: 1.0 }); } catch (e) {}
              try { showBanner('-' + TUNING.spikeDamage + ' HP', '#ff6666'); } catch (e) {}
              spike.active = false; spike.cooldown = TUNING.spikeCooldown;
              // spawn a few particles
              for (let k = 0; k < 8; k++) game.particles.push({ x: spike.x + (Math.random()-0.5)*8, y: spike.y + (Math.random()-0.5)*8, vx: (Math.random()-0.5)*160, vy: (Math.random()-0.5)*160, size: 2+Math.random()*3, color: '#ff4444', life: 0.6 });
              // small camera shake
              shakeDuration = 0.4; shakeTime = 0; shakeIntensity = 8;
              if (game.player.life <= 0) { killPlayer(); if (hooks?.onGameOver) hooks.onGameOver(stats.score); }
            }
          }
        }

        // draw spikes (visuals)
        game.spikes.forEach((spike: any) => {
          C.save();
          // telegraph pulse when telegraphTimer > 0
          if (spike.telegraphTimer > 0) {
            const pulse = Math.min(1, (TUNING.spikeTelegraphDuration - spike.telegraphTimer) / TUNING.spikeTelegraphDuration + 0.2);
            // draw a recessed box behind the spike
            C.fillStyle = `rgba(60,60,60,${0.5 * pulse})`;
            C.fillRect(spike.x - spike.width - 12, spike.y - spike.height - 16, spike.width * 3, spike.height + 28);
            // big downward arrows to indicate telegraph
            C.fillStyle = `rgba(255,255,255,${0.9 * pulse})`;
            C.save();
            C.translate(spike.x + spike.width/2, spike.y - spike.height/2 - 6);
            C.beginPath(); C.moveTo(0, 0); C.lineTo(-12, -20); C.lineTo(12, -20); C.closePath(); C.fill();
            // draw row of smaller arrows that move downward
            const t = (game.time || 0) * 3;
            for (let a = -3; a <= 3; a++) {
              const vy = ((t + a * 0.4) % 1) * 18;
              C.globalAlpha = 0.7 * (0.6 + 0.4 * Math.sin((t + a) * 4));
              C.beginPath(); C.moveTo(a * 14, 8 + vy); C.lineTo(a * 14 - 6, 2 + vy); C.lineTo(a * 14 + 6, 2 + vy); C.closePath(); C.fill();
            }
            C.restore();
            C.globalAlpha = 0.9 * pulse;
          }
          // active spike body
          C.fillStyle = spike.active ? '#ff5555' : '#222222';
          C.beginPath();
          // draw triangle spike (sharper)
          C.moveTo(spike.x + spike.width/2, spike.y - spike.height/2 - 2);
          C.lineTo(spike.x - spike.width/2 - 2, spike.y + spike.height/2 + 2);
          C.lineTo(spike.x + spike.width/2*2 + 2, spike.y + spike.height/2 + 2);
          C.closePath(); C.fill();
          // soft highlight when active
          if (spike.active) { C.globalAlpha = 0.75; C.fillStyle = 'rgba(255,180,180,0.6)'; C.fill(); }
          C.restore();
        });
      }

    game.particles.forEach((pA: any) => {
      C.save();
      C.globalAlpha = pA.life;
      C.shadowColor = pA.color;
      C.shadowBlur = pA.size * 2;
      C.fillStyle = pA.color;
      C.beginPath();
      C.arc(pA.x, pA.y, pA.size, 0, Math.PI * 2);
      C.fill();
      C.restore();
    });

    // draw transient motion trails (afterimages) behind player
    if (game.trails && game.trails.length) {
      C.save();
      C.globalCompositeOperation = 'lighter';
      for (let i = game.trails.length - 1; i >= 0; i--) {
        const t = game.trails[i];
        const frac = 1 - (t.life / t.maxLife);
        const a = (t.alpha || 0.4) * (1 - frac);
        C.globalAlpha = a;
        C.fillStyle = `rgba(255,255,255,${a})`;
        // elongated streak: length depends on last velocity snapshot in t.vx/vy if present
        const len = Math.min(160, Math.max(18, (Math.hypot(t.vx||0, t.vy||0) * 0.08) + (t.size||12)));
        const ang = Math.atan2(t.vy||0, t.vx||0) || 0;
        C.save();
        C.translate(t.x, t.y);
        C.rotate(ang);
        const w = (t.size || 12) * (1 - frac * 0.6);
        C.beginPath();
        C.ellipse(-len/2, 0, len/2, w * 0.8, 0, 0, Math.PI*2);
        C.fill();
        C.restore();
        // decay
        t.life -= Math.min(0.05, 1/60);
      }
      // purge dead trails
      game.trails = game.trails.filter((tr: any) => tr.life > 0);
      C.restore();
    }

    // SAFE GROUND banner: show when there are spikes but all are cooling (no telegraph/active)
    try {
      const anyActive = game.spikes && game.spikes.some((s: any) => s.active || (s.telegraphTimer && s.telegraphTimer > 0));
      const anySpikes = game.spikes && game.spikes.length;
      const allCooling = anySpikes && !anyActive && game.spikes.some((s: any) => (s.cooldown || 0) > 0);
      if (anySpikes && !anyActive) {
        C.save(); C.setTransform(1,0,0,1,0,0);
        const bw = Math.min(980, Math.max(240, window.innerWidth - 40));
        const bh = 84; const bx = (window.innerWidth - bw) / 2; const by = window.innerHeight - bh - 16;
        // subtle background
        C.globalAlpha = 0.95;
        C.fillStyle = allCooling ? '#223322' : '#111111';
        C.fillRect(bx, by, bw, bh);
        // text
        C.fillStyle = allCooling ? '#88ff88' : '#ffffff';
        C.font = 'bold 48px sans-serif'; C.textAlign = 'left'; C.textBaseline = 'middle';
        C.fillText(allCooling ? 'SAFE GROUND!' : 'SPIKES AHEAD', bx + 28, by + bh / 2);
        // small icon circle
        C.beginPath(); C.fillStyle = '#ffffff'; C.arc(bx + bw - 60, by + bh/2, 28, 0, Math.PI*2); C.fill();
        C.fillStyle = '#000000'; C.font = '20px sans-serif'; C.fillText('⬛', bx + bw - 68, by + bh/2 + 2);
        C.restore();
      }
    } catch (e) { /* ignore drawing errors */ }

    // draw boosts
    if (game.boosts && game.boosts.length) {
      game.boosts.forEach((b: any) => {
        if (b.collected) return;
        C.save();
        C.fillStyle = b.type === 'life' ? '#88ff88' : '#ffd88a';
        C.beginPath();
        C.arc(b.x + b.width/2, b.y + b.height/2, Math.max(8, b.width/2), 0, Math.PI*2);
        C.fill();
        C.restore();
      });
    }

    // draw projectiles (weapon-like bullets with small trail)
    if (game.projectiles && game.projectiles.length) {
      game.projectiles.forEach((pr: any) => {
        C.save();
        // trail
        C.globalAlpha = 0.6;
        C.strokeStyle = pr.type === 'bullet' ? '#ffd080' : '#ffcc66';
        C.lineWidth = Math.max(2, pr.size * 0.4);
        C.beginPath();
        C.moveTo(pr.x - pr.vx * 0.02, pr.y - pr.vy * 0.02);
        C.lineTo(pr.x, pr.y);
        C.stroke();
        C.globalAlpha = 1;
        // bullet body
        if (pr.type === 'bullet') {
          C.fillStyle = '#ffdd66';
          C.fillRect(pr.x - pr.size/2, pr.y - pr.size/2, pr.size, pr.size);
        } else {
          C.fillStyle = '#ffcc66';
          C.beginPath(); C.arc(pr.x, pr.y, pr.size, 0, Math.PI * 2); C.fill();
        }
        C.restore();
      });
    }

    if (game.player) {
      const p = game.player;
  // compute camera anchored to bottom of current canvas size so player appears lower on screen
  // detect small screens and portrait to bias camera further down (player appears lower)
  const smallScreen = typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 680;
  const bottomAnchor = smallScreen ? 0.78 : 0.65;
  const targetCamX = Math.max(0, p.x - width * 0.35);
  const targetCamY = Math.max(0, p.y - height * bottomAnchor);
  // smooth camera (lerp) to avoid jarring movements
  const camLerp = 6.5 * (1/60); // smoothing factor per frame
  game.camera.x += (targetCamX - game.camera.x) * Math.min(1, camLerp);
  game.camera.y += (targetCamY - game.camera.y) * Math.min(1, camLerp);

      C.save();
      // per-player shake: visual wobble when recently hit
      if (p.shakeIntensity && p.shakeIntensity > 0) {
        const sx = (Math.random() - 0.5) * p.shakeIntensity;
        const sy = (Math.random() - 0.5) * p.shakeIntensity;
        C.translate(sx, sy);
        p.shakeIntensity *= 0.75;
        if (p.shakeIntensity < 0.1) p.shakeIntensity = 0;
      }
      if (p.detected) { C.shadowColor = "#ff0000"; C.shadowBlur = 20; }
      else if (p.inShadow) { C.shadowColor = "#0088ff"; C.shadowBlur = 15; }

      // If character image or emoji exists, draw that and avoid drawing the cube background box.
      const hasCharImage = Boolean(character?.image && charImage && charImage.complete);
      const hasEmoji = Boolean(!hasCharImage && character?.emoji);

      if (hasCharImage) {
        // draw a subtle shadow/outline behind the image for contrast
        C.save();
        C.fillStyle = p.inShadow ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)";
        C.fillRect(p.x - 2, p.y - 2, p.width + 4, p.height + 4);
        C.restore();
        try {
          const img = charImage as HTMLImageElement | null;
          if (img) C.drawImage(img, p.x, p.y, p.width, p.height);
        } catch (e) { /* ignore */ }
      } else if (hasEmoji) {
        // emoji: draw with big font and no box
        C.fillStyle = "white";
        C.font = `${Math.floor(p.height * 0.95)}px serif`;
        C.textAlign = "center"; C.textBaseline = "middle";
        C.fillText(character.emoji, p.x + p.width / 2, p.y + p.height / 2 + 2);
      } else {
        // fallback cube when no character available
        C.fillStyle = p.inShadow ? "#001133" : "#000000";
        C.fillRect(p.x, p.y, p.width, p.height);
        C.strokeStyle = "#ffffff"; C.lineWidth = 3; C.strokeRect(p.x, p.y, p.width, p.height);
        // eyes
        C.fillStyle = "#ffffff";
        C.beginPath(); C.arc(p.x + p.width * 0.28, p.y + p.height * 0.42, Math.max(2, p.width * 0.07), 0, Math.PI * 2);
        C.arc(p.x + p.width * 0.72, p.y + p.height * 0.42, Math.max(2, p.width * 0.07), 0, Math.PI * 2);
        C.fill();
      }

      C.restore();
    }

    // vignette / fog overlay (post world render but under UI)
    // soft radial vignette to match screenshots
    C.save();
    C.setTransform(dpr,0,0,dpr,0,0);
    const vg = C.createRadialGradient(width/2, height/2, Math.max(width,height)*0.15, width/2, height/2, Math.max(width,height)*0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.6, 'rgba(0,0,0,0.08)');
    vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    C.fillStyle = vg;
    C.fillRect(0,0,width,height);
    C.restore();

    C.restore();
  }

  // banners (HUD) - screen space draw outside camera transform
  if (game.banners && game.banners.length) {
    C.save(); C.setTransform(1,0,0,1,0,0);
    for (let i = 0; i < game.banners.length; i++) {
      const b = game.banners[i];
      // animate in/out
      b.life -= 1/60;
      if (b.life > b.maxLife - 0.18) b.alpha = Math.min(1, b.alpha + 0.12);
      else if (b.life < 0.18) b.alpha = Math.max(0, b.alpha - 0.12);
      const x = 20 + i * 0; // stacked vertically if multiple
      C.globalAlpha = b.alpha;
      C.fillStyle = 'rgba(0,0,0,0.6)';
      C.fillRect(12, b.y, 260, 42);
      C.fillStyle = b.color || '#fff'; C.font = '16px sans-serif'; C.textAlign = 'left'; C.textBaseline = 'middle';
      C.fillText(b.text, 24, b.y + 21);
      b.y += (24 - b.y) * 0.18; // slide to 24 px
    }
    // purge finished banners
    game.banners = game.banners.filter((bb: any) => bb.life > 0);
    C.restore();
  }

  // call lifebar draw after world draw so it's visible
  function drawEverything() {
    drawGame();
    drawLifeBar();
  }

  // draw HUD lifebar overlay (outside camera transform)
  function drawLifeBar() {
    const p = game.player; if (!p) return;
    // convert player's world position to screen space taking camera into account
    const dpr = window.devicePixelRatio || 1;
    const screenX = (p.x - game.camera.x) * dpr;
    const screenY = (p.y - game.camera.y) * dpr;
    const barW = Math.max(80, Math.min(220, Math.floor(p.width * 1.6)));
    const barH = Math.max(8, Math.floor(p.height * 0.22));
    const x = Math.floor(screenX + (p.width * dpr) / 2 - barW / 2);
    const y = Math.floor(screenY - 18 * dpr);
    C.save();
    C.setTransform(1,0,0,1,0,0); // screen space
    // background rounded
    C.fillStyle = 'rgba(0,0,0,0.6)';
    C.fillRect(x-3, y-3, barW+6, barH+6);
    // bar background
    C.fillStyle = '#222'; C.fillRect(x, y, barW, barH);
    const pct = Math.max(0, p.life / p.maxLife);
    C.fillStyle = '#ff4444'; C.fillRect(x, y, Math.floor(barW * pct), barH);
    C.fillStyle = '#fff'; C.font = `${Math.max(10, Math.floor(barH * 0.9))}px sans-serif`;
    C.textAlign = 'center'; C.textBaseline = 'middle';
    C.fillText(`${p.life}/${p.maxLife}`, x + barW / 2, y + barH / 2);
    C.restore();
  }

  function loop(time: number) {
    if (lastTime === 0) lastTime = time;
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    updateGame(delta);
    drawEverything();
    rafId = requestAnimationFrame(loop);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "a") { keys.left = true; e.preventDefault(); }
    if (e.key === "ArrowRight" || e.key === "d") { keys.right = true; e.preventDefault(); }
    if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") { handleJump(); e.preventDefault(); }
      if (e.key === 'e' || e.key === 'E') {
        // mark player to attempt takedown next update
        const p = game.player; if (p) p.attemptTakedown = true;
        e.preventDefault();
      }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
  }

  // Start the game
  initGame();
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  rafId = requestAnimationFrame(loop);

  // Expose a small control API so on-screen buttons can drive the game
  const api = {
    pressLeft: (down: boolean) => { keys.left = down; },
    pressRight: (down: boolean) => { keys.right = down; },
    jump: () => { handleJump(); },
    activateBoost: () => {
      const p = game.player; if (!p) return;
      if ((stats.boostCharge || 0) >= stats.boostThreshold && !p.boostActive) {
        p.boostActive = true; p.speedMultiplier = 2.6; p.boostTimer = 2.2; stats.boostCharge = 0;
        try { showBanner('BOOST!', '#ffd88a'); } catch (e) {}
        try { playSfx('boost_activate', { vol: 0.95 }); } catch (e) {}
        // visual trail particles while boosted
        const boostInt = setInterval(() => {
          if (!p || !p.boostActive) { clearInterval(boostInt); return; }
          for (let i = 0; i < 4; i++) game.particles.push({ x: p.x + p.width/2, y: p.y + p.height/2 + (Math.random()-0.5)*6, vx: -(100 + Math.random()*200), vy: (Math.random()-0.5)*40, size: 3, color: '#ffd88a', life: 0.35 });
        }, 80);
      }
    },
    attemptTakedown: () => { const p = game.player; if (p) p.attemptTakedown = true; },
    destroy: () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      C.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return api;
}