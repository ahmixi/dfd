"use client";

import { useEffect, useRef, useState, useMemo } from "react";

// Preload character images
const characterImages: Record<string, HTMLImageElement> = {};

// Load images on client side only
if (typeof window !== 'undefined') {
  ['charcter.png', 'charcter2.png', 'cheerful starter.png', 'salutingmaster.png'].forEach((img) => {
    const image = new Image();
    image.src = `/` + img;
    characterImages[img] = image;
  });
}
import { useGameStore } from "@/lib/game-store";

// --- Types ---
type GamePhase = "menu" | "playing" | "gameOver" | "tutorial";

interface GameState {
  phase: GamePhase;
  score: number;
  highScore: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  combo: number;
  distance: number;
}

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  velX: number;
  velY: number;
}

interface PlayerState extends Entity {
  grounded: boolean;
  invulnerable: number;
  coyoteTime: number;
  abilities: Map<string, { cooldown: number; active: boolean; energyCost: number }>;
  lastGroundedTime: number;
}

interface Obstacle extends Entity {
  type: "spike" | "laser" | "drone";
  damage: number;
  pattern?: { type: "sine" | "chase"; speed: number; amplitude: number; phase: number };
  passed: boolean;
}

interface Collectible extends Entity {
  type: "health" | "energy" | "score" | "power";
  value: number;
  collected: boolean;
}

// --- Main Component ---
export default function NexusRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const gameRef = useRef<{
    player: PlayerState | null;
    obstacles: Obstacle[];
    collectibles: Collectible[];
    effects: {
    particles: Array<{
      x: number;
      y: number;
      velX: number;
      velY: number;
      size: number;
      color: string;
      lifetime: number;
      type: 'trail' | 'impact' | 'collect' | 'jump';
    }>;
    trails: Array<{
      points: Array<{ x: number; y: number }>;
      width: number;
      color: string;
      lifetime: number;
    }>;
    screenShake: { intensity: number; duration: number };
  };
  }>({ player: null, obstacles: [], collectibles: [], effects: { particles: [], trails: [], screenShake: { intensity: 0, duration: 0 } } });

  const { setCurrentScreen, user, characters, updateGameStats } = useGameStore();
  const character = characters.find((c) => c.id === user.selectedCharacter);
  // If no character, don't render the game
  if (!character) return <div className="text-white p-8">No character selected.</div>;
  const characterSafe = character!;

  // --- Character Stats ---
  const characterStats = useMemo(
    () => ({
      health: 100 + characterSafe.stats.health * 20,
      speed: 6 + characterSafe.stats.speed * 0.5,
      energy: 100 + (characterSafe.stats.energy ?? 0) * 10,
      luck: characterSafe.stats.luck * 0.05,
      abilities: characterSafe.abilities.map((ability) => ({ name: ability, energyCost: 20, cooldown: 60 })),
    }),
    [characterSafe]
  );

  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>(() => ({
    phase: "menu",
    score: 0,
    highScore: 0,
    health: characterStats.health,
    maxHealth: characterStats.health,
    energy: characterStats.energy,
    maxEnergy: characterStats.energy,
    combo: 0,
    distance: 0,
  }));

  // Always update health/energy when character changes
  useEffect(() => {
    setGameState((prev) => ({
      ...prev,
      health: characterStats.health,
      maxHealth: characterStats.health,
      energy: characterStats.energy,
      maxEnergy: characterStats.energy,
    }));
  }, [characterStats.health, characterStats.energy]);

  // --- Player Init ---
  const initPlayer = (): PlayerState => {
    const abilities = new Map();
    characterStats.abilities.forEach((ability) => {
      abilities.set(ability.name, { cooldown: 0, active: false, energyCost: ability.energyCost });
    });
    return {
      x: 100,
      y: 0,
      width: 60,
      height: 60,
      velX: 0,
      velY: 0,
      grounded: true,
      invulnerable: 0,
      abilities,
      coyoteTime: 0,
      lastGroundedTime: 0
    };
  };

  // Ensure player is always present when playing
  useEffect(() => {
    if (gameState.phase === "playing" && !gameRef.current.player) {
      gameRef.current.player = initPlayer();
    }
  }, [gameState.phase]);

  // --- Game Loop ---
  useEffect(() => {
    let lastTime = 0;
    const game = gameRef.current;
    function loop(time: number) {
      if (lastTime === 0) lastTime = time;
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      if (gameState.phase === "playing" && game.player) {
        updateGame(delta);
        drawGame();
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    if (gameState.phase === "playing") {
      rafRef.current = requestAnimationFrame(loop);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line
  }, [gameState.phase]);

  // --- Game Update Logic ---
  function updateGame(delta: number) {
    const game = gameRef.current;
    if (!game.player) return;
    const player = game.player;
    // Physics constants
    const GRAVITY = 1200;
    const MAX_FALL_SPEED = 800;
    const GROUND_FRICTION = 0.92;
    const AIR_RESISTANCE = 0.99;

    // Apply gravity with terminal velocity
    player.velY = Math.min(player.velY + GRAVITY * delta, MAX_FALL_SPEED);
    
    // Apply friction and air resistance
    player.velX *= player.grounded ? GROUND_FRICTION : AIR_RESISTANCE;
    
    // Update position with smooth interpolation
    player.x += player.velX * delta;
    player.y += player.velY * delta;
    
    // Ground collision and coyote time
    const wasGrounded = player.grounded;
    if (player.y > 400) {
      player.y = 400;
      player.velY = 0;
      player.grounded = true;
      if (!wasGrounded) {
        addLandingEffect(game.effects, player);
      }
    } else {
      player.grounded = false;
      if (wasGrounded) {
        player.lastGroundedTime = Date.now();
      }
    }
    // Abilities
    player.abilities.forEach((state, ability) => {
      if (state.cooldown > 0) state.cooldown -= delta * 60;
      if (state.active) applyAbilityEffect(player, ability, delta);
    });
    // Obstacles
    game.obstacles = game.obstacles.filter((obs) => obs.x > -100).map((obs) => {
      obs.x -= characterStats.speed * delta * 60;
      if (obs.pattern) {
        if (obs.pattern.type === "sine") {
          obs.y += Math.sin(obs.pattern.phase) * obs.pattern.amplitude;
          obs.pattern.phase += obs.pattern.speed * delta * 60;
        }
      }
      return obs;
    });
    // Control obstacle spawning based on distance and timing
    const minGap = 120; // Minimum gap between obstacles
    const shouldSpawn = game.obstacles.length === 0 || 
                       (game.obstacles[game.obstacles.length - 1].x < 800 - minGap);
    
    if (shouldSpawn && game.obstacles.length < 3) {
      spawnObstacle();
    }
    // Collectibles
    game.collectibles = game.collectibles.filter((col) => !col.collected && col.x > -50).map((col) => {
      col.x -= characterStats.speed * delta * 60;
      return col;
    });
    if (Math.random() < 0.05 + characterStats.luck) spawnCollectible();
    // Collisions
    game.obstacles.forEach((obs) => {
      if (!obs.passed && checkCollision(player, obs)) {
        handleCollision(obs);
        obs.passed = true;
      }
    });
    game.collectibles.forEach((col) => {
      if (!col.collected && checkCollision(player, col)) handleCollection(col);
    });
    // Update state
    setGameState((prev) => ({
      ...prev,
      distance: prev.distance + characterStats.speed * delta * 2,
    }));
    // Game over
    if (gameState.health <= 0) {
      setGameState((prev) => ({
        ...prev,
        phase: "gameOver",
        highScore: Math.max(prev.highScore, prev.score),
      }));
    }
  }

  function applyAbilityEffect(player: PlayerState, ability: string, delta: number) {
    const state = player.abilities.get(ability);
    if (!state) return;
    switch (ability) {
      case "dash":
        player.velX = 15;
        player.invulnerable = 20;
        state.active = false;
        break;
      case "double-jump":
        if (!player.grounded) {
          player.velY = -12;
          state.active = false;
        }
        break;
      case "shield":
        player.invulnerable = Math.max(player.invulnerable, 30);
        break;
    }
  }

  function spawnObstacle() {
    const game = gameRef.current;
    const distance = gameState.distance;
    const difficulty = Math.min(1 + distance / 2000, 3); // More gradual difficulty increase
    
    const types: Obstacle["type"][] = ["spike", "laser", "drone"];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Base obstacle properties
    const obstacle: Obstacle = {
      type,
      x: 800,
      y: 400,
      width: type === 'laser' ? 60 : 40,
      height: type === 'spike' ? 50 : 40,
      velX: 0,
      velY: 0,
      damage: type === "laser" ? 40 : 20,
      passed: false,
    };
    
    // Pattern variations based on difficulty
    if (type === "drone") {
      const patterns = [
        { type: "sine" as const, speed: 0.05 * difficulty, amplitude: 2 * difficulty, phase: Math.random() * Math.PI * 2 },
        { type: "chase" as const, speed: 0.03 * difficulty, amplitude: 1.5 * difficulty, phase: 0 }
      ];
      obstacle.pattern = patterns[Math.floor(Math.random() * (difficulty > 3 ? 2 : 1))];
    }
    
    // Randomize vertical position for variety
    if (type !== 'spike') {
      obstacle.y = 200 + Math.random() * 200;
    }
    
    // Add visual distinction
    if (difficulty > 3) {
      obstacle.damage *= 1.5; // Increased damage at high difficulty
    }
    
    game.obstacles.push(obstacle);
  }

  function spawnCollectible() {
    const game = gameRef.current;
    const types: Collectible["type"][] = ["health", "energy", "score", "power"];
    const type = types[Math.floor(Math.random() * types.length)];
    const collectible: Collectible = {
      type,
      x: 800,
      y: 300 + Math.random() * 100,
      width: 30,
      height: 30,
      velX: 0,
      velY: 0,
      value: type === "score" ? 100 : 20,
      collected: false,
    };
    game.collectibles.push(collectible);
  }

  function checkCollision(a: Entity, b: Entity) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function addLandingEffect(effects: typeof gameRef.current.effects, player: PlayerState) {
    addParticles('impact', 
      player.x + player.width/2,
      player.y + player.height,
      8,
      '#fff'
    );
    addScreenShake(4, 0.2);
  }

  function addParticles(type: 'trail' | 'impact' | 'collect' | 'jump', x: number, y: number, count: number, color: string) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3;
      particles.push({
        x, y,
        velX: Math.cos(angle) * speed,
        velY: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color,
        lifetime: 0.5 + Math.random() * 0.5,
        type
      });
    }
    gameRef.current.effects.particles.push(...particles);
  }

  function addScreenShake(intensity: number, duration: number) {
    gameRef.current.effects.screenShake = { intensity, duration };
  }

  function handleCollision(obstacle: Obstacle) {
    const game = gameRef.current;
    if (!game.player || game.player.invulnerable > 0) return;
    setGameState((prev) => ({ ...prev, health: prev.health - obstacle.damage, combo: 0 }));
    game.player.invulnerable = 30;
    
    // Add visual effects
    addParticles('impact', game.player.x + game.player.width/2, game.player.y + game.player.height/2, 12, '#ff0080');
    addScreenShake(10, 0.3);
  }

  function handleCollection(collectible: Collectible) {
    const game = gameRef.current;
    collectible.collected = true;
    
    // Visual and gameplay effects based on type
    const effectColors = {
      health: '#4caf50',
      energy: '#00bcd4',
      score: '#feca57',
      power: '#ff4081'
    };
    
    addParticles('collect', 
      collectible.x + collectible.width/2,
      collectible.y + collectible.height/2,
      15,
      effectColors[collectible.type]);
      
    setGameState((prev) => {
      const update: Partial<GameState> = { score: prev.score + collectible.value };
      
      switch (collectible.type) {
        case "health":
          update.health = Math.min(prev.maxHealth, prev.health + collectible.value);
          addScreenShake(3, 0.2);
          break;
        case "energy":
          update.energy = Math.min(prev.maxEnergy, prev.energy + collectible.value);
          break;
        case "score":
          const comboMultiplier = Math.min(5, prev.combo + 1);
          update.score = prev.score + collectible.value * comboMultiplier;
          update.combo = prev.combo + 1;
          
          // Add floating score text
          if (game.player) {
            const scoreText = `+${(collectible.value * comboMultiplier).toLocaleString()}`;
            game.effects.trails.push({
              points: [{ x: game.player.x, y: game.player.y - 30 }],
              width: 2,
              color: '#feca57',
              lifetime: 1
            });
          }
          break;
      }
      return { ...prev, ...update };
    });
  }

  // --- Controls ---
  function handleJump() {
    const game = gameRef.current;
    if (!game.player || gameState.phase !== "playing") return;
    
    const canJump = game.player.grounded || 
                    (Date.now() - game.player.lastGroundedTime < 150); // Coyote time
    
    if (canJump) {
      game.player.velY = -600; // Stronger initial jump
      game.player.grounded = false;
      // Jump effects
      addParticles('jump', game.player.x + game.player.width/2, 
                  game.player.y + game.player.height, 8, '#fff');
      addScreenShake(3, 0.15);
    } else {
      const doubleJump = game.player.abilities.get("double-jump");
      if (doubleJump && doubleJump.cooldown <= 0 && gameState.energy >= doubleJump.energyCost) {
        game.player.velY = -500;
        doubleJump.cooldown = 60;
        setGameState((prev) => ({ ...prev, energy: prev.energy - doubleJump.energyCost }));
        // Double jump effects
        addParticles('jump', game.player.x + game.player.width/2, 
                    game.player.y + game.player.height, 12, '#0ff');
        addScreenShake(5, 0.2);
      }
    }
  }
  function handleDash() {
    const game = gameRef.current;
    if (!game.player || gameState.phase !== "playing") return;
    const dash = game.player.abilities.get("dash");
    if (dash && dash.cooldown <= 0 && gameState.energy >= dash.energyCost) {
      dash.active = true;
      dash.cooldown = 90;
      game.player.velX = 800; // Faster dash
      game.player.invulnerable = 30;
      setGameState((prev) => ({ ...prev, energy: prev.energy - dash.energyCost }));
      
      // Dash effects
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if (game.player) {
            addParticles('trail', 
              game.player.x + game.player.width/2 - i * 20, 
              game.player.y + game.player.height/2,
              6, '#0ff');
          }
        }, i * 50);
      }
      addScreenShake(7, 0.25);
    }
  }
  function startGame() {
    const game = gameRef.current;
    game.player = initPlayer();
    game.obstacles = [];
    game.collectibles = [];
    game.effects = { particles: [], trails: [], screenShake: { intensity: 0, duration: 0 } };
    setGameState((prev) => ({
      ...prev,
      phase: "playing",
      score: 0,
      combo: 0,
      distance: 0,
      health: characterStats.health,
      maxHealth: characterStats.health,
      energy: characterStats.energy,
      maxEnergy: characterStats.energy,
    }));
  }

  // --- Keyboard & Touch ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.phase !== "playing") return;
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleJump();
      }
      if (e.code === "KeyX" || e.code === "ArrowRight") {
        e.preventDefault();
        handleDash();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState.phase]);

  // --- Canvas Drawing ---
  function drawGame() {
    const canvas = canvasRef.current;
    const game = gameRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const now = Date.now();
    const deltaTime = 1/60; // Fixed delta for animations
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Parallax background layers
    for (let i = 0; i < 3; i++) {
      ctx.save();
      const speed = (i + 1) * 0.5;
      ctx.globalAlpha = 0.15 + 0.1 * i;
      for (let x = 0; x < width; x += 200) {
        ctx.beginPath();
        ctx.arc(
          (x + ((gameRef.current.player?.x ?? 0) * speed) % 200),
          200 + i * 80 + Math.sin((x + (gameRef.current.player?.x ?? 0)) / 100 + i) * 20,
          120 - i * 30,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = i === 0 ? '#0ff' : i === 1 ? '#f0f' : '#fff';
        ctx.fill();
      }
      ctx.restore();
    }

    // Obstacles
    gameRef.current.obstacles.forEach((obs) => {
      ctx.save();
      ctx.globalAlpha = 0.95;
      if (obs.type === "spike") {
        ctx.fillStyle = "#ff0080";
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.shadowColor = "#ff0080";
        ctx.shadowBlur = 16;
        ctx.fill();
      } else if (obs.type === "laser") {
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 8;
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height / 2);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height / 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#ffd700";
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 16;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      }
      ctx.restore();
    });
    // Collectibles
    gameRef.current.collectibles.forEach((col) => {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = col.type === "health" ? "#4caf50" : col.type === "energy" ? "#00bcd4" : col.type === "score" ? "#feca57" : "#ff4081";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(col.x + col.width / 2, col.y + col.height / 2, col.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Update and render particles
    game.effects.particles = game.effects.particles.filter(particle => {
      particle.x += particle.velX * deltaTime * 60;
      particle.y += particle.velY * deltaTime * 60;
      particle.lifetime -= deltaTime;
      particle.size *= 0.95;

      if (particle.lifetime > 0) {
        ctx.save();
        ctx.globalAlpha = particle.lifetime * 0.8;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = particle.size * 2;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      return particle.lifetime > 0;
    });

    // Apply screen shake
    if (game.effects.screenShake.duration > 0) {
      const { intensity, duration } = game.effects.screenShake;
      const shake = Math.sin(Date.now() / 50) * intensity * (duration / 0.3);
      ctx.translate(shake, shake);
      game.effects.screenShake.duration -= deltaTime;
    }

    // Motion trails
    if (game.player && (game.player.velX > 100 || Math.abs(game.player.velY) > 200)) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      game.effects.trails.push({
        points: [{ x: game.player.x + game.player.width/2, y: game.player.y + game.player.height/2 }],
        width: 2,
        color: game.player.invulnerable > 0 ? '#00ffff' : '#ff0080',
        lifetime: 0.5
      });
      ctx.restore();
    }

    // Player
    const player = game.player;
    if (player) {
      ctx.save();
      ctx.globalAlpha = 1;
      // Use character image if available, else fallback to emoji or circle
      let img: HTMLImageElement | undefined;
      if (characterSafe.image && characterImages[characterSafe.image]) {
        img = characterImages[characterSafe.image];
      } else if (characterImages['charcter.png']) {
        img = characterImages['charcter.png'];
      }
      if (img && img.complete) {
        // Add player glow effect
        ctx.save();
        ctx.shadowColor = player.invulnerable > 0 ? '#00ffff' : '#ff0080';
        ctx.shadowBlur = 20;
        ctx.drawImage(img, player.x, player.y, player.width, player.height);
        ctx.restore();
        
        // Add ground reflection
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.scale(1, -0.2);
        ctx.drawImage(img, player.x, -player.y - player.height * 5, player.width, player.height);
        ctx.restore();
      } else {
        ctx.fillStyle = player.invulnerable > 0 ? "#00ffff" : "#ff0080";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // --- UI ---
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />
      {/* HUD */}
      {gameState.phase !== "menu" && (
        <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-start justify-between gap-3 text-white">
          <div className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-center shadow-lg">
            <div className="text-xs/4 font-semibold opacity-80">SCORE</div>
            <div className="text-2xl font-extrabold text-cyan-300">{Math.floor(gameState.score).toLocaleString()}</div>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-center shadow-lg">
            <div className="text-xs/4 font-semibold opacity-80">BEST</div>
            <div className="text-2xl font-extrabold text-fuchsia-300">{gameState.highScore.toLocaleString()}</div>
          </div>
        </div>
      )}
      {/* Health bar */}
      {gameState.phase === "playing" && (
        <div className="absolute left-4 right-4 top-20">
          <div className="w-full h-3 rounded-full border border-white/30 bg-black/40 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 via-pink-400 to-cyan-400" style={{ width: `${Math.max(0, (gameState.health / gameState.maxHealth) * 100)}%` }} />
          </div>
        </div>
      )}
      {/* Controls */}
      {gameState.phase === "playing" && (
        <div className="absolute bottom-8 left-0 right-0 px-10 flex items-center justify-between">
          <button onClick={handleDash} className="pointer-events-auto w-16 h-16 rounded-full border-2 border-white/40 bg-white/10 backdrop-blur-lg text-white font-bold shadow-lg active:scale-95">DASH</button>
          <button onClick={handleJump} className="pointer-events-auto w-24 h-24 rounded-full border-4 border-white/50 bg-gradient-to-br from-pink-500 to-pink-400 text-white font-extrabold shadow-2xl active:scale-95">JUMP</button>
        </div>
      )}
      {/* Menu */}
      {gameState.phase === "menu" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-pink-400 to-amber-300 drop-shadow-[0_0_30px_rgba(0,255,255,0.5)]">NEXUS</div>
          <div className="text-white/80 mt-2">Revolutionary Mobile Runner</div>
          <div className="mt-8 flex items-center gap-2 text-white/90">{character.emoji || "🏃"}<span className="text-sm">Ready</span></div>
          <div className="mt-8 flex gap-3">
            <button className="px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold backdrop-blur-xl hover:bg-white/15" onClick={() => setGameState((prev) => ({ ...prev, phase: "tutorial" }))}>Neural Training</button>
            <button className="px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold backdrop-blur-xl hover:bg-white/15" onClick={startGame}>Enter Nexus</button>
          </div>
        </div>
      )}
      {/* Tutorial */}
      {gameState.phase === "tutorial" && (
        <div className="absolute inset-0 grid place-items-center bg-black/50">
          <div className="backdrop-blur-2xl bg-white/10 border border-white/15 rounded-2xl p-8 text-center max-w-lg mx-auto text-white">
            <div className="text-6xl mb-4">🏃‍♂️⚡</div>
            <h2 className="text-3xl font-semibold mb-2">NEXUS Runner</h2>
            <p className="text-white/80 mb-6">Tap JUMP to leap over obstacles. Tap DASH for speed and brief invulnerability.</p>
            <button onClick={startGame} className="px-6 py-3 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-medium shadow-lg hover:brightness-110">Start Playing</button>
          </div>
        </div>
      )}
      {/* Game Over */}
      {gameState.phase === "gameOver" && (
        <div className="absolute inset-0 grid place-items-center bg-black/60">
          <div className="backdrop-blur-2xl bg-white/10 border border-white/15 rounded-2xl p-8 text-center text-white w-[320px]">
            <div className="text-2xl font-black text-pink-400 mb-4">Connection Lost</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span>Final Score</span><span className="text-cyan-300 font-bold">{Math.floor(gameState.score).toLocaleString()}</span></div>
              <div className="flex items-center justify-between"><span>Combo</span><span className="text-amber-300 font-bold">{gameState.combo}</span></div>
              <div className="flex items-center justify-between"><span>Distance</span><span className="text-fuchsia-300 font-bold">{Math.floor(gameState.distance)}m</span></div>
              <div className="flex items-center justify-between"><span>High Score</span><span className="text-green-300 font-bold">{gameState.highScore.toLocaleString()}</span></div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setGameState((prev) => ({ ...prev, phase: "menu" }))} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15">Exit</button>
              <button onClick={startGame} className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-400 text-white font-semibold">Reconnect</button>
            </div>
          </div>
        </div>
      )}
      {/* Exit button */}
      <div className="absolute top-4 right-4">
        <button onClick={() => setCurrentScreen("dashboard")} className="px-3 py-2 rounded-md bg-white/10 text-white border border-white/20 hover:bg-white/20">Exit</button>
      </div>
    </div>
  );
}


