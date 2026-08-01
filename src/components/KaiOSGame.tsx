import React, { useEffect, useRef, useState } from 'react';
import { CDoodleEngine, CGameState } from '../utils/cEngineAdapter';
import { sfx } from '../utils/audio';
import { getAssetCanvas, ASSET_METAS } from '../utils/proceduralAssetDataUrl';
import {
  Smartphone,
  RotateCcw,
  Volume2,
  VolumeX,
  FileCode,
  Download,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react';

interface KaiOSGameProps {
  pureMode?: boolean;
  onTogglePureMode?: () => void;
}

export const KaiOSGame: React.FC<KaiOSGameProps> = ({ pureMode = false, onTogglePureMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CDoodleEngine | null>(null);

  // Active Key States for KaiOS Phone Pad
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [moveDir, setMoveDir] = useState<number>(0);
  const [shootPressed, setShootPressed] = useState<boolean>(false);
  const [engineType, setEngineType] = useState<'phaser324' | 'c_asmjs'>('phaser324');

  // Input refs for real-time game loop access without closure staleness
  const moveDirRef = useRef<number>(0);
  const activeSceneRef = useRef<any>(null);

  // Phaser 3.24.1 Container Ref
  const phaserContainerRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<any>(null);

  // Interactive control handlers for phone simulator buttons & keyboard
  const handleStartMoveLeft = () => {
    moveDirRef.current = -1;
    setMoveDir(-1);
    setPressedKey('4');
  };

  const handleStartMoveRight = () => {
    moveDirRef.current = 1;
    setMoveDir(1);
    setPressedKey('6');
  };

  const handleStopMove = () => {
    moveDirRef.current = 0;
    setMoveDir(0);
    setPressedKey(null);
  };

  const handleShoot = () => {
    setShootPressed(true);
    setPressedKey('5');
    setTimeout(() => {
      setShootPressed(false);
      setPressedKey(null);
    }, 150);

    if (activeSceneRef.current) {
      if (activeSceneRef.current.isGameOver) {
        activeSceneRef.current.scene.restart();
      } else {
        activeSceneRef.current.shootPellet();
      }
    }
    if (engineRef.current) {
      engineRef.current.shootBullet();
    }
  };

  const handleRestart = () => {
    setPressedKey('SoftRight');
    setTimeout(() => setPressedKey(null), 150);

    if (activeSceneRef.current) {
      activeSceneRef.current.scene.restart();
    }
    if (engineRef.current) {
      engineRef.current.initGame(240, 320);
    }
  };

  const handleToggleSound = () => {
    setPressedKey('*');
    setTimeout(() => setPressedKey(null), 150);
    sfx.toggleSound();
    setSoundEnabled(sfx.isEnabled());
  };

  // Initialize C Engine
  useEffect(() => {
    if (engineType !== 'c_asmjs') return;

    const engine = new CDoodleEngine(240, 320);
    engineRef.current = engine;
    setGameState(engine.getState());

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      if (engineRef.current && canvasRef.current) {
        // Update C Engine Physics
        engineRef.current.updateGame(dt, moveDir, shootPressed);
        const state = engineRef.current.getState();
        setGameState({ ...state });

        // Draw Frame to KaiOS 240x320 Canvas
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          renderKaiOSFrame(ctx, state);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [moveDir, shootPressed, engineType]);

  // Initialize Phaser 3.24.1 Game on KaiOS 240x320 Viewport
  useEffect(() => {
    if (engineType !== 'phaser324') return;

    let isMounted = true;

    const loadPhaserScript = () => {
      return new Promise<void>((resolve, reject) => {
        if ((window as any).Phaser) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = '/lib/phaser-3.24.1.min.js';
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.body.appendChild(script);
      });
    };

    loadPhaserScript().then(() => {
      if (!isMounted || !phaserContainerRef.current) return;

      const Phaser = (window as any).Phaser;
      if (!Phaser) return;

      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
      }

      class KaiOSDoodleScene extends Phaser.Scene {
        private player: any;
        private platforms: any;
        private bullets: any;
        private score: number = 0;
        private scoreText: any;
        private isGameOver: boolean = false;
        private gameOverText: any;
        private keys: any = {};

        constructor() {
          super({ key: 'KaiOSDoodleScene' });
        }

        preload() {
          // Register all KaiOS game textures directly from HTML canvas elements (no data URL loader warnings)
          ASSET_METAS.forEach((meta) => {
            if (!this.textures.exists(meta.id)) {
              const canvas = getAssetCanvas(meta.id);
              if (canvas) {
                this.textures.addCanvas(meta.id, canvas);
              }
            }
          });
        }

        create() {
          activeSceneRef.current = this;
          this.cameras.main.setBackgroundColor('#f7f6ed');

          // Add Notebook lines
          const graphics = this.add.graphics();
          graphics.lineStyle(1, 0xe0f2fe, 1);
          for (let y = 0; y < 320; y += 16) {
            graphics.lineBetween(0, y, 240, y);
          }

          // Platforms Group
          this.platforms = this.physics.add.staticGroup();

          // Base starting platform
          const basePlat = this.platforms.create(120, 300, 'platform_green');
          basePlat.setDisplaySize(48, 12).refreshBody();

          for (let i = 0; i < 7; i++) {
            const px = Phaser.Math.Between(30, 210);
            const py = 300 - i * 42;
            const p = this.platforms.create(px, py, i % 2 === 0 ? 'platform_green' : 'platform_blue');
            p.setDisplaySize(48, 12).refreshBody();
          }

          // Doodler Player
          this.player = this.physics.add.sprite(120, 240, 'doodle_right');
          this.player.setDisplaySize(32, 32);
          this.player.setBounce(0);
          this.player.setCollideWorldBounds(false);
          this.player.body.setGravityY(700);

          // Bullets
          this.bullets = this.physics.add.group();

          // Collisions - One-way platform jump-through physics
          this.physics.add.collider(
            this.player,
            this.platforms,
            (playerObj: any, platformObj: any) => {
              if (playerObj.body.touching.down) {
                playerObj.setVelocityY(-460);
                sfx.playJump();
              }
            },
            (playerObj: any, platformObj: any) => {
              // Only collide if player is falling downward and player feet are at/above platform top
              return playerObj.body.velocity.y > 0 && playerObj.body.bottom <= platformObj.body.top + 14;
            }
          );

          // HUD
          this.scoreText = this.add.text(8, 4, 'SCORE: 0', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#0f172a',
            fontStyle: 'bold',
          });

          // KaiOS Keyboard Listeners
          this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
            if (['ArrowLeft', '4', 'a', 'A'].includes(event.key)) {
              this.keys.left = true;
            } else if (['ArrowRight', '6', 'd', 'D'].includes(event.key)) {
              this.keys.right = true;
            } else if (['ArrowUp', '5', 'Enter', ' '].includes(event.key)) {
              this.shootPellet();
            } else if (['Backspace', 'SoftRight'].includes(event.key)) {
              if (this.isGameOver) this.scene.restart();
            }
          });

          this.input.keyboard.on('keyup', (event: KeyboardEvent) => {
            if (['ArrowLeft', '4', 'a', 'A'].includes(event.key)) {
              this.keys.left = false;
            } else if (['ArrowRight', '6', 'd', 'D'].includes(event.key)) {
              this.keys.right = false;
            }
          });
        }

        shootPellet() {
          if (this.isGameOver) return;
          const bullet = this.add.circle(this.player.x, this.player.y - 12, 4, 0xef4444);
          this.physics.add.existing(bullet);
          (bullet.body as any).setVelocityY(-600);
          this.bullets.add(bullet);
          sfx.playShoot();
        }

        update() {
          if (this.isGameOver) return;

          // Horizontal movement
          if (this.keys.left || moveDirRef.current === -1) {
            this.player.setVelocityX(-220);
            this.player.setTexture('doodle_left');
          } else if (this.keys.right || moveDirRef.current === 1) {
            this.player.setVelocityX(220);
            this.player.setTexture('doodle_right');
          } else {
            this.player.setVelocityX(0);
          }

          // Screen Wrap
          if (this.player.x < 0) this.player.x = 240;
          else if (this.player.x > 240) this.player.x = 0;

          // Camera Scroll up
          if (this.player.y < 160) {
            const diff = 160 - this.player.y;
            this.player.y = 160;
            this.score += Math.floor(diff);
            this.scoreText.setText(`SCORE: ${this.score}`);

            this.platforms.getChildren().forEach((p: any) => {
              p.y += diff;
              p.refreshBody();
              if (p.y > 340) {
                p.y = 10;
                p.x = Phaser.Math.Between(30, 210);
                p.refreshBody();
              }
            });
          }

          // Fall off bottom -> Game Over
          if (this.player.y > 340) {
            this.isGameOver = true;
            this.add.rectangle(120, 160, 240, 80, 0x000000, 0.8);
            this.add.text(120, 140, 'GAME OVER!', {
              fontSize: '16px',
              color: '#ef4444',
              fontStyle: 'bold',
            }).setOrigin(0.5);
            this.add.text(120, 165, 'Press 5 / SoftRight to Restart', {
              fontSize: '10px',
              color: '#ffffff',
            }).setOrigin(0.5);
          }
        }
      }

      const config = {
        type: Phaser.WEBGL, // WebGL renderer
        width: 240,
        height: 320,
        parent: phaserContainerRef.current,
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false,
          },
        },
        scene: [KaiOSDoodleScene],
      };

      phaserGameRef.current = new Phaser.Game(config);
    }).catch((err) => {
      console.error('Failed to load Phaser 3.24.1 min script:', err);
    });

    return () => {
      isMounted = false;
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [engineType]);

  // HUD & Engine Inspector state
  const [gameState, setGameState] = useState<CGameState | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize Engine
  useEffect(() => {
    const engine = new CDoodleEngine(240, 320);
    engineRef.current = engine;
    setGameState(engine.getState());

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      if (engineRef.current && canvasRef.current) {
        // Update C Engine Physics
        engineRef.current.updateGame(dt, moveDir, shootPressed);
        const state = engineRef.current.getState();
        setGameState({ ...state });

        // Draw Frame to KaiOS 240x320 Canvas
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          renderKaiOSFrame(ctx, state);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [moveDir, shootPressed]);

  // Handle Hardware Key Listeners for KaiOS D-Pad & Keypad
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', '4', 'a', 'A', '1', '7'].includes(e.key)) {
        handleStartMoveLeft();
      } else if (['ArrowRight', '6', 'd', 'D', '3', '9'].includes(e.key)) {
        handleStartMoveRight();
      } else if (['ArrowUp', '5', 'Enter', ' ', 'SoftLeft', '2', '8', '#'].includes(e.key)) {
        handleShoot();
      } else if (['Backspace', 'SoftRight', '0'].includes(e.key)) {
        handleRestart();
      } else if (e.key === '*') {
        handleToggleSound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', '4', 'a', 'A', '1', '7', 'ArrowRight', '6', 'd', 'D', '3', '9'].includes(e.key)) {
        handleStopMove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Canvas Render Engine for KaiOS Screen
  const renderKaiOSFrame = (ctx: CanvasRenderingContext2D, state: CGameState) => {
    const { worldWidth, worldHeight, cameraY, player, platforms, items, monsters, bullets } = state;

    // Clear Screen (Notebook Background)
    ctx.fillStyle = '#f7f6ed';
    ctx.fillRect(0, 0, worldWidth, worldHeight);

    // Blue Grid Lines (KaiOS Grid aesthetic)
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1;
    for (let y = 0; y < worldHeight; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(worldWidth, y);
      ctx.stroke();
    }

    ctx.save();
    // Apply Camera Offset
    ctx.translate(0, -cameraY);

    // Render Platforms
    for (const p of platforms) {
      if (!p.active || p.broken) continue;

      if (p.type === 0) ctx.fillStyle = '#10b981'; // Green
      else if (p.type === 1) ctx.fillStyle = '#0284c7'; // Blue moving
      else if (p.type === 2) ctx.fillStyle = '#94a3b8'; // White
      else if (p.type === 3) ctx.fillStyle = '#b45309'; // Brown

      ctx.fillRect(p.x - 22, p.y - 6, 44, 12);
      ctx.strokeStyle = '#0f172a';
      ctx.strokeRect(p.x - 22, p.y - 6, 44, 12);
    }

    // Render Items
    for (const item of items) {
      if (!item.active) continue;
      if (item.type === 1) {
        // Spring
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(item.x - 6, item.y - 10, 12, 10);
      } else if (item.type === 2) {
        // Propeller
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(item.x - 8, item.y - 8, 16, 8);
      } else if (item.type === 3) {
        // Jetpack
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(item.x - 6, item.y - 12, 12, 14);
      }
    }

    // Render Monsters
    for (const m of monsters) {
      if (!m.active) continue;
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(m.x, m.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3b0764';
      ctx.stroke();
    }

    // Render Bullets
    ctx.fillStyle = '#ef4444';
    for (const b of bullets) {
      if (!b.active) continue;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Doodler Player
    ctx.fillStyle = player.isDead ? '#ef4444' : '#84cc16';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a2e05';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Snout
    const snoutX = player.x + (player.facing > 0 ? 12 : -12);
    ctx.fillRect(snoutX - 4, player.y - 4, 10, 8);

    // Powerup visual hat
    if (player.powerupType === 2) {
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(player.x - 10, player.y - 20, 20, 5);
    } else if (player.powerupType === 3) {
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(player.x - 6, player.y - 12, 12, 18);
    }

    ctx.restore();

    // HUD Top Score Bar (KaiOS Style)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, worldWidth, 22);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`SCORE: ${state.score}`, 8, 15);
    ctx.fillText(`HIGH: ${state.highScore}`, worldWidth - 75, 15);

    // Game Over Banner
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, worldHeight / 2 - 40, worldWidth, 80);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER!', worldWidth / 2, worldHeight / 2 - 10);

      ctx.fillStyle = '#ffffff';
      ctx.font = '11px sans-serif';
      ctx.fillText('Press SoftRight / 5 to Restart', worldWidth / 2, worldHeight / 2 + 15);
      ctx.textAlign = 'left';
    }
  };

  const triggerRestart = () => {
    if (engineRef.current) {
      engineRef.current.initGame(240, 320);
    }
  };

  if (pureMode) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-0 m-0 overflow-hidden select-none z-50">
        <div className="w-[240px] h-[320px] bg-slate-100 overflow-hidden relative shadow-2xl">
          <div ref={phaserContainerRef} className="w-[240px] h-[320px] overflow-hidden" />
        </div>
        {onTogglePureMode && (
          <button
            onClick={onTogglePureMode}
            className="absolute top-2 right-2 z-50 bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px] border border-slate-700 opacity-20 hover:opacity-100 transition-opacity cursor-pointer"
            title="Exit Pure Mode"
          >
            Show Desktop UI
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 max-w-5xl mx-auto">
      {/* Main View Area - Direct KaiOS Phone Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
        {/* KaiOS Phone Frame Hardware Simulation */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-slate-900 p-5 rounded-[40px] border-4 border-slate-700 shadow-2xl w-[310px] flex flex-col items-center select-none relative">
              {/* Phone Speaker Earpiece */}
              <div className="w-16 h-2 bg-slate-800 rounded-full mb-3 border border-slate-700" />

              {/* KaiOS 240x320 QVGA Screen Container */}
              <div className="w-[240px] h-[320px] bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-800 relative shadow-inner">
                {/* Game Container running Phaser 3.24.1 */}
                <div ref={phaserContainerRef} className="w-[240px] h-[320px] overflow-hidden" />
              </div>

              {/* KaiOS Keypad Controls */}
              <div className="w-[240px] mt-4 flex flex-col items-center space-y-3">
                {/* Softkeys & D-Pad Center */}
                <div className="grid grid-cols-3 gap-2 w-full text-center">
                  <button
                    onClick={handleRestart}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === 'SoftLeft' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    RESET
                  </button>

                  <button
                    onClick={handleShoot}
                    className={`py-2 text-[10px] font-bold rounded-lg border border-emerald-500/30 transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === '5' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                    }`}
                  >
                    SHOOT
                  </button>

                  <button
                    onClick={handleRestart}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === 'SoftRight' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    SELECT
                  </button>
                </div>

                {/* D-Pad Navigator Cross */}
                <div className="grid grid-cols-3 gap-1.5 w-36">
                  <div />
                  <button
                    onClick={handleShoot}
                    className={`py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs cursor-pointer active:scale-95 ${
                      pressedKey === '2' ? 'bg-emerald-500 text-white' : ''
                    }`}
                  >
                    ▲
                  </button>
                  <div />

                  <button
                    onMouseDown={handleStartMoveLeft}
                    onMouseUp={handleStopMove}
                    onMouseLeave={handleStopMove}
                    onTouchStart={handleStartMoveLeft}
                    onTouchEnd={handleStopMove}
                    className={`py-2.5 font-bold rounded-lg text-xs transition-colors cursor-pointer active:scale-95 ${
                      moveDir === -1 ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    ◄
                  </button>

                  <button
                    onClick={handleShoot}
                    className={`py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer active:scale-95 ${
                      pressedKey === '5' ? 'bg-emerald-400 text-slate-900' : ''
                    }`}
                  >
                    ●
                  </button>

                  <button
                    onMouseDown={handleStartMoveRight}
                    onMouseUp={handleStopMove}
                    onMouseLeave={handleStopMove}
                    onTouchStart={handleStartMoveRight}
                    onTouchEnd={handleStopMove}
                    className={`py-2.5 font-bold rounded-lg text-xs transition-colors cursor-pointer active:scale-95 ${
                      moveDir === 1 ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    ►
                  </button>

                  <div />
                  <button
                    onClick={handleShoot}
                    className={`py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs cursor-pointer active:scale-95 ${
                      pressedKey === '8' ? 'bg-emerald-500 text-white' : ''
                    }`}
                  >
                    ▼
                  </button>
                  <div />
                </div>

                {/* Numeric Keypad Grid */}
                <div className="grid grid-cols-3 gap-1.5 w-full text-xs font-mono font-bold text-slate-300">
                  <button
                    onMouseDown={handleStartMoveLeft}
                    onMouseUp={handleStopMove}
                    onMouseLeave={handleStopMove}
                    onTouchStart={handleStartMoveLeft}
                    onTouchEnd={handleStopMove}
                    className={`p-2 rounded-md text-center transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === '1' || pressedKey === '4' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    1 ◄
                  </button>

                  <button
                    onClick={handleShoot}
                    className={`p-2 rounded-md text-center transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === '2' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                    }`}
                  >
                    2 ▲
                  </button>

                  <button
                    onMouseDown={handleStartMoveRight}
                    onMouseUp={handleStopMove}
                    onMouseLeave={handleStopMove}
                    onTouchStart={handleStartMoveRight}
                    onTouchEnd={handleStopMove}
                    className={`p-2 rounded-md text-center transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === '3' || pressedKey === '6' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    3 ►
                  </button>

                  <button
                    onMouseDown={handleStartMoveLeft}
                    onMouseUp={handleStopMove}
                    onMouseLeave={handleStopMove}
                    onTouchStart={handleStartMoveLeft}
                    onTouchEnd={handleStopMove}
                    className={`p-2 rounded-md text-center transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === '4' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                    }`}
                  >
                    4 ◄
                  </button>

                  <button
                    onClick={handleShoot}
                    className={`p-2 rounded-md text-center transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === '5' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                    }`}
                  >
                    5 🎯
                  </button>

                  <button
                    onMouseDown={handleStartMoveRight}
                    onMouseUp={handleStopMove}
                    onMouseLeave={handleStopMove}
                    onTouchStart={handleStartMoveRight}
                    onTouchEnd={handleStopMove}
                    className={`p-2 rounded-md text-center transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === '6' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                    }`}
                  >
                    6 ►
                  </button>

                  <button
                    onMouseDown={handleStartMoveLeft}
                    onMouseUp={handleStopMove}
                    onMouseLeave={handleStopMove}
                    onTouchStart={handleStartMoveLeft}
                    onTouchEnd={handleStopMove}
                    className={`p-2 rounded-md text-center transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === '7' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    7 ◄
                  </button>

                  <button
                    onClick={handleShoot}
                    className={`p-2 rounded-md text-center transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === '8' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    8 ▼
                  </button>

                  <button
                    onMouseDown={handleStartMoveRight}
                    onMouseUp={handleStopMove}
                    onMouseLeave={handleStopMove}
                    onTouchStart={handleStartMoveRight}
                    onTouchEnd={handleStopMove}
                    className={`p-2 rounded-md text-center transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === '9' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    9 ►
                  </button>

                  <button
                    onClick={handleToggleSound}
                    className={`p-2 rounded-md text-center transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === '*' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                    }`}
                    title="Toggle Audio Effects"
                  >
                    * {soundEnabled ? '🔊' : '🔇'}
                  </button>

                  <button
                    onClick={handleRestart}
                    className={`p-2 rounded-md text-center transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === '0' || pressedKey === 'SoftRight' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-sky-400'
                    }`}
                    title="Reset / Restart Game"
                  >
                    0 🔄
                  </button>

                  <button
                    onClick={handleShoot}
                    className={`p-2 rounded-md text-center transition-colors cursor-pointer active:scale-95 ${
                      pressedKey === '#' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                    }`}
                    title="Shoot Nose Pellet"
                  >
                    # 🎯
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Key Binds & KaiOS 2.5 Quick Specs */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" /> KaiOS 2.5 Physical Keypad Controls
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-800">Move Doodler Left</div>
                  <div className="text-slate-500 mt-0.5">D-Pad Left / Key <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">4</kbd> / <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">A</kbd></div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-800">Move Doodler Right</div>
                  <div className="text-slate-500 mt-0.5">D-Pad Right / Key <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">6</kbd> / <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">D</kbd></div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-800">Shoot Nose Pellets</div>
                  <div className="text-slate-500 mt-0.5">D-Pad Center / Key <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">5</kbd> / <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">Space</kbd></div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-800">Restart Game</div>
                  <div className="text-slate-500 mt-0.5">SoftKey Right / Key <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">Backspace</kbd></div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">KaiOS 2.5 Hardware Compatibility:</strong> Running on Phaser v3.24.1 WebGL renderer (`/public/lib/phaser-3.24.1.min.js`) powered by C asm.js physics simulation engine. Configured specifically for 240x320 QVGA screens and Firefox 48 Gecko engine.
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};
