import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Shield, Zap } from 'lucide-react';

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'green' | 'blue' | 'brown' | 'white';
  vx?: number;
  broken?: boolean;
  item?: 'spring' | 'jetpack' | 'propeller' | 'shoes' | null;
}

interface Monster {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'purple' | 'red' | 'flying';
  vx: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const GameDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});

  // Preload asset images from backend API
  useEffect(() => {
    const assetsToLoad = [
      'doodle_left', 'doodle_right', 'doodle_shooting', 'doodle_pissed',
      'doodle_propeller_1', 'doodle_jetpack_1', 'doodle_spring_shoes',
      'platform_green', 'platform_blue', 'platform_white', 'brown_platform_1', 'brown_platform_2',
      'spring_compressed', 'spring_full', 'propeller_hat', 'jetpack', 'spring_shoes',
      'monster_purple', 'monster_red', 'green_flying_monster_1', 'black_hole', 'projectile',
      'bg_notebook', 'top_bar', 'game_over_overlay', 'play_again_button'
    ];

    const imgs: Record<string, HTMLImageElement> = {};
    let loadedCount = 0;

    assetsToLoad.forEach((id) => {
      const img = new Image();
      img.src = `/api/assets/${id}.png`;
      img.onload = () => {
        imgs[id] = img;
        loadedCount++;
        if (loadedCount === assetsToLoad.length) {
          setLoadedImages(imgs);
        }
      };
    });
  }, []);

  // Game Engine State
  const gameStateRef = useRef({
    player: {
      x: 180,
      y: 400,
      w: 60,
      h: 60,
      vx: 0,
      vy: -12,
      facingRight: true,
      isShooting: false,
      powerup: null as 'propeller' | 'jetpack' | 'shoes' | null,
      powerupTimer: 0,
    },
    platforms: [] as Platform[],
    monsters: [] as Monster[],
    bullets: [] as Bullet[],
    keys: { left: false, right: false, up: false },
    cameraY: 0,
    score: 0,
  });

  const startGame = () => {
    const initialPlatforms: Platform[] = [
      { x: 150, y: 520, w: 100, h: 28, type: 'green' },
      { x: 50, y: 420, w: 100, h: 28, type: 'green', item: 'spring' },
      { x: 250, y: 320, w: 100, h: 28, type: 'blue', vx: 2 },
      { x: 120, y: 220, w: 100, h: 28, type: 'brown' },
      { x: 280, y: 120, w: 100, h: 28, type: 'green', item: 'jetpack' },
      { x: 80, y: 20, w: 100, h: 28, type: 'white' },
    ];

    gameStateRef.current = {
      player: {
        x: 170,
        y: 450,
        w: 60,
        h: 60,
        vx: 0,
        vy: -14,
        facingRight: true,
        isShooting: false,
        powerup: null,
        powerupTimer: 0,
      },
      platforms: initialPlatforms,
      monsters: [],
      bullets: [],
      keys: { left: false, right: false, up: false },
      cameraY: 0,
      score: 0,
    };

    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') gameStateRef.current.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') gameStateRef.current.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
        gameStateRef.current.keys.up = true;
        shootBullet();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') gameStateRef.current.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') gameStateRef.current.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') gameStateRef.current.keys.up = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const shootBullet = () => {
    const p = gameStateRef.current.player;
    p.isShooting = true;
    setTimeout(() => { p.isShooting = false; }, 200);
    gameStateRef.current.bullets.push({
      x: p.x + p.w / 2,
      y: p.y,
      vx: 0,
      vy: -16,
    });
  };

  // Game Loop
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const state = gameStateRef.current;
      const p = state.player;

      // Player Movement
      if (state.keys.left) {
        p.vx = -6;
        p.facingRight = false;
      } else if (state.keys.right) {
        p.vx = 6;
        p.facingRight = true;
      } else {
        p.vx *= 0.85;
      }

      p.x += p.vx;

      // Screen Wrap
      if (p.x < -30) p.x = 370;
      if (p.x > 370) p.x = -30;

      // Powerup Flight physics
      if (p.powerup) {
        p.powerupTimer--;
        p.vy = p.powerup === 'jetpack' ? -18 : -14;
        if (p.powerupTimer <= 0) p.powerup = null;
      } else {
        // Standard Gravity
        p.vy += 0.45;
      }

      p.y += p.vy;

      // Camera Scrolling
      if (p.y < 260) {
        const diff = 260 - p.y;
        p.y = 260;
        state.score += Math.floor(diff);
        setScore(state.score);

        // Move platforms down
        state.platforms.forEach((plat) => {
          plat.y += diff;
        });
        state.monsters.forEach((m) => {
          m.y += diff;
        });

        // Spawn new higher platforms
        while (state.platforms.length < 8) {
          const highestY = Math.min(...state.platforms.map((pl) => pl.y));
          const newY = highestY - (60 + Math.random() * 50);
          const types: Platform['type'][] = ['green', 'green', 'green', 'blue', 'brown', 'white'];
          const chosenType = types[Math.floor(Math.random() * types.length)];

          let item: Platform['item'] = null;
          const rand = Math.random();
          if (rand < 0.12) item = 'spring';
          else if (rand < 0.16) item = 'jetpack';
          else if (rand < 0.20) item = 'propeller';

          state.platforms.push({
            x: Math.random() * 280,
            y: newY,
            w: 100,
            h: 28,
            type: chosenType,
            vx: chosenType === 'blue' ? (Math.random() > 0.5 ? 2 : -2) : 0,
            item,
          });

          // Occasional Monster
          if (Math.random() < 0.25) {
            state.monsters.push({
              x: Math.random() * 260,
              y: newY - 60,
              w: 70,
              h: 60,
              type: Math.random() > 0.5 ? 'purple' : 'flying',
              vx: 1.5,
            });
          }
        }
      }

      // Platform Bouncing Collision (only falling)
      if (p.vy > 0 && !p.powerup) {
        state.platforms.forEach((plat) => {
          if (
            !plat.broken &&
            p.x + p.w * 0.7 > plat.x &&
            p.x + p.w * 0.3 < plat.x + plat.w &&
            p.y + p.h >= plat.y &&
            p.y + p.h <= plat.y + 16
          ) {
            if (plat.type === 'brown') {
              plat.broken = true;
            } else {
              p.vy = -13; // Jump bounce

              if (plat.type === 'white') {
                plat.broken = true;
              }

              // Powerup Item pickup
              if (plat.item === 'spring') {
                p.vy = -20; // High spring bounce
              } else if (plat.item === 'jetpack') {
                p.powerup = 'jetpack';
                p.powerupTimer = 180;
              } else if (plat.item === 'propeller') {
                p.powerup = 'propeller';
                p.powerupTimer = 140;
              }
            }
          }
        });
      }

      // Moving platforms update
      state.platforms.forEach((plat) => {
        if (plat.vx) {
          plat.x += plat.vx;
          if (plat.x < 0 || plat.x + plat.w > 380) plat.vx *= -1;
        }
      });

      // Bullets update
      state.bullets.forEach((b) => {
        b.y += b.vy;
      });
      state.bullets = state.bullets.filter((b) => b.y > -20);

      // Bullet vs Monster Collision
      state.bullets.forEach((b) => {
        state.monsters.forEach((m, mIdx) => {
          if (b.x >= m.x && b.x <= m.x + m.w && b.y >= m.y && b.y <= m.y + m.h) {
            state.monsters.splice(mIdx, 1);
            state.score += 200;
          }
        });
      });

      // Monster Collisions
      if (!p.powerup) {
        state.monsters.forEach((m) => {
          if (
            p.x + p.w > m.x + 10 &&
            p.x < m.x + m.w - 10 &&
            p.y + p.h > m.y + 10 &&
            p.y < m.y + m.h - 10
          ) {
            // Player lands on monster top -> squish monster!
            if (p.vy > 0 && p.y + p.h < m.y + 25) {
              p.vy = -14;
              state.monsters = state.monsters.filter((mon) => mon !== m);
            } else {
              // Hit monster -> Game Over!
              endGame();
            }
          }
        });
      }

      // Fall off bottom -> Game Over
      if (p.y > 620) {
        endGame();
      }

      // CLEANUP OFFSCREEN PLATFORMS
      state.platforms = state.platforms.filter((plat) => plat.y < 650);

      // RENDER CANVAS
      ctx.clearRect(0, 0, 380, 600);

      // 1. Draw Notebook Background Image
      if (loadedImages['bg_notebook']) {
        ctx.drawImage(loadedImages['bg_notebook'], 0, 0, 380, 600);
      } else {
        ctx.fillStyle = '#f7f6ed';
        ctx.fillRect(0, 0, 380, 600);
      }

      // 2. Draw Platforms
      state.platforms.forEach((plat) => {
        if (plat.broken) return;

        let imgKey = 'platform_green';
        if (plat.type === 'blue') imgKey = 'platform_blue';
        if (plat.type === 'white') imgKey = 'platform_white';
        if (plat.type === 'brown') imgKey = 'brown_platform_1';

        if (loadedImages[imgKey]) {
          ctx.drawImage(loadedImages[imgKey], plat.x, plat.y, plat.w, plat.h);
        }

        // Draw items on platform
        if (plat.item) {
          let itemKey = 'spring_compressed';
          if (plat.item === 'jetpack') itemKey = 'jetpack';
          if (plat.item === 'propeller') itemKey = 'propeller_hat';

          if (loadedImages[itemKey]) {
            ctx.drawImage(loadedImages[itemKey], plat.x + plat.w / 2 - 15, plat.y - 25, 30, 28);
          }
        }
      });

      // 3. Draw Monsters
      state.monsters.forEach((m) => {
        const key = m.type === 'purple' ? 'monster_purple' : 'green_flying_monster_1';
        if (loadedImages[key]) {
          ctx.drawImage(loadedImages[key], m.x, m.y, m.w, m.h);
        }
      });

      // 4. Draw Nose Pellet Bullets
      state.bullets.forEach((b) => {
        if (loadedImages['projectile']) {
          ctx.drawImage(loadedImages['projectile'], b.x - 8, b.y - 8, 16, 16);
        }
      });

      // 5. Draw Player (The Doodler)
      let playerImgKey = p.facingRight ? 'doodle_right' : 'doodle_left';
      if (p.isShooting) playerImgKey = 'doodle_shooting';
      if (p.powerup === 'jetpack') playerImgKey = 'doodle_jetpack_1';
      if (p.powerup === 'propeller') playerImgKey = 'doodle_propeller_1';

      if (loadedImages[playerImgKey]) {
        ctx.drawImage(loadedImages[playerImgKey], p.x, p.y, p.w, p.h);
      }

      // 6. Draw HUD Top Bar
      if (loadedImages['top_bar']) {
        ctx.drawImage(loadedImages['top_bar'], 0, 0, 380, 50);
      }

      ctx.fillStyle = '#212121';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`SCORE: ${state.score}`, 15, 32);

      animId = requestAnimationFrame(loop);
    };

    const endGame = () => {
      setGameOver(true);
      setIsPlaying(false);
      setHighScore((prev) => Math.max(prev, gameStateRef.current.score));
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 max-w-xl mx-auto">
      {/* Game Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs w-full flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Playable Doodle Jump Engine
          </h2>
          <p className="text-xs text-slate-500">
            Powered purely by the server-side Node Canvas generated images.
          </p>
        </div>

        <button
          onClick={() => setMuted(!muted)}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Game Canvas Container */}
      <div className="relative border-4 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-white">
        <canvas ref={canvasRef} width={380} height={600} className="block" />

        {/* Start Overlay */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <h3 className="text-3xl font-extrabold tracking-wide drop-shadow-md">DOODLE JUMP</h3>
            <p className="text-sm text-slate-200 mt-2 max-w-xs">
              Use <kbd className="px-1.5 py-0.5 bg-white/20 rounded font-mono">←</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-white/20 rounded font-mono">→</kbd> to move and{' '}
              <kbd className="px-1.5 py-0.5 bg-white/20 rounded font-mono">Space</kbd> to shoot!
            </p>

            <button
              onClick={startGame}
              className="mt-6 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" /> PLAY NOW
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            {loadedImages['game_over_overlay'] ? (
              <img src="/api/assets/game_over_overlay.png" alt="Game Over" className="w-64 mb-4 drop-shadow-lg" />
            ) : (
              <h3 className="text-4xl font-extrabold text-red-500 mb-2">GAME OVER</h3>
            )}

            <div className="bg-white/10 p-4 rounded-xl border border-white/20 my-2 w-64 text-slate-100">
              <div className="text-sm font-medium">FINAL SCORE</div>
              <div className="text-3xl font-extrabold font-mono text-amber-300">{score}</div>
              <div className="text-xs text-slate-300 mt-2">BEST SCORE: {highScore}</div>
            </div>

            <button
              onClick={startGame}
              className="mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-base shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Controls Bar for Mobile/Touch */}
      <div className="flex items-center gap-3 w-full max-w-sm">
        <button
          onMouseDown={() => (gameStateRef.current.keys.left = true)}
          onMouseUp={() => (gameStateRef.current.keys.left = false)}
          onTouchStart={() => (gameStateRef.current.keys.left = true)}
          onTouchEnd={() => (gameStateRef.current.keys.left = false)}
          className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold active:bg-slate-900 select-none text-center shadow-xs"
        >
          ← LEFT
        </button>
        <button
          onClick={shootBullet}
          className="px-5 py-3 bg-red-600 text-white rounded-xl font-bold active:bg-red-700 select-none text-center shadow-xs"
        >
          SHOOT
        </button>
        <button
          onMouseDown={() => (gameStateRef.current.keys.right = true)}
          onMouseUp={() => (gameStateRef.current.keys.right = false)}
          onTouchStart={() => (gameStateRef.current.keys.right = true)}
          onTouchEnd={() => (gameStateRef.current.keys.right = false)}
          className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold active:bg-slate-900 select-none text-center shadow-xs"
        >
          RIGHT →
        </button>
      </div>
    </div>
  );
};
