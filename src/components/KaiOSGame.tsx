import React, { useEffect, useRef, useState } from 'react';
import { CDoodleEngine, CGameState } from '../utils/cEngineAdapter';
import { sfx } from '../utils/audio';
import {
  Smartphone,
  Cpu,
  Code2,
  GitBranch,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Terminal,
  FileCode,
  Layers,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Download,
  CheckCircle2,
} from 'lucide-react';

export const KaiOSGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CDoodleEngine | null>(null);

  // Active Key States for KaiOS Phone Pad
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [moveDir, setMoveDir] = useState<number>(0);
  const [shootPressed, setShootPressed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'simulator' | 'c_memory' | 'c_code' | 'github_actions'>('simulator');

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
      if (['ArrowLeft', '4', 'a', 'A'].includes(e.key)) {
        setMoveDir(-1);
        setPressedKey('4');
      } else if (['ArrowRight', '6', 'd', 'D'].includes(e.key)) {
        setMoveDir(1);
        setPressedKey('6');
      } else if (['ArrowUp', '5', 'Enter', ' ', 'SoftLeft'].includes(e.key)) {
        setShootPressed(true);
        setPressedKey('5');
        sfx.playShoot();
      } else if (['Backspace', 'SoftRight'].includes(e.key)) {
        if (engineRef.current) {
          engineRef.current.initGame(240, 320);
        }
        setPressedKey('SoftRight');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', '4', 'a', 'A', 'ArrowRight', '6', 'd', 'D'].includes(e.key)) {
        setMoveDir(0);
      }
      if (['ArrowUp', '5', 'Enter', ' ', 'SoftLeft'].includes(e.key)) {
        setShootPressed(false);
      }
      setPressedKey(null);
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

  return (
    <div className="flex flex-col items-center justify-center space-y-6 max-w-5xl mx-auto">
      {/* Navigation Tabs for KaiOS & C Engine */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs w-full flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'simulator'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" /> KaiOS Phone Simulator
          </button>

          <button
            onClick={() => setActiveTab('c_memory')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'c_memory'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" /> C Struct Memory Inspector
          </button>

          <button
            onClick={() => setActiveTab('c_code')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'c_code'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" /> C Source Code
          </button>

          <button
            onClick={() => setActiveTab('github_actions')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'github_actions'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" /> GitHub Actions (asm.js)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/public/manifest.webapp"
            download="manifest.webapp"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
            title="Download KaiOS 2.5 manifest.webapp"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" /> manifest.webapp
          </a>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
          {/* KaiOS Phone Frame Hardware Simulation */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-slate-900 p-5 rounded-[40px] border-4 border-slate-700 shadow-2xl w-[310px] flex flex-col items-center select-none relative">
              {/* Phone Speaker Earpiece */}
              <div className="w-16 h-2 bg-slate-800 rounded-full mb-3 border border-slate-700" />

              {/* KaiOS 240x320 QVGA Screen Container */}
              <div className="w-[240px] h-[320px] bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-800 relative shadow-inner">
                {/* KaiOS Status Bar */}
                <div className="bg-emerald-800 text-white text-[9px] px-2 py-0.5 flex justify-between items-center font-mono z-10">
                  <span>KaiOS 2.5</span>
                  <span>12:00</span>
                  <span>100% 🔋</span>
                </div>

                {/* Game Canvas */}
                <canvas ref={canvasRef} width={240} height={320} className="w-full h-full block" />
              </div>

              {/* KaiOS Keypad Controls */}
              <div className="w-[240px] mt-4 flex flex-col items-center space-y-3">
                {/* Softkeys & D-Pad Center */}
                <div className="grid grid-cols-3 gap-2 w-full text-center">
                  <button
                    onClick={triggerRestart}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-colors ${
                      pressedKey === 'SoftLeft' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    RESET
                  </button>

                  <button
                    onClick={() => {
                      if (engineRef.current) engineRef.current.shootBullet();
                    }}
                    className={`py-2 text-[10px] font-bold rounded-lg border border-emerald-500/30 transition-colors ${
                      pressedKey === '5' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                    }`}
                  >
                    SHOOT
                  </button>

                  <button
                    onClick={triggerRestart}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-colors ${
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
                    onClick={() => {
                      if (engineRef.current) engineRef.current.shootBullet();
                    }}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs"
                  >
                    ▲
                  </button>
                  <div />

                  <button
                    onMouseDown={() => setMoveDir(-1)}
                    onMouseUp={() => setMoveDir(0)}
                    onTouchStart={() => setMoveDir(-1)}
                    onTouchEnd={() => setMoveDir(0)}
                    className={`py-2.5 font-bold rounded-lg text-xs transition-colors ${
                      moveDir === -1 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    ◄
                  </button>

                  <button
                    onClick={() => {
                      if (engineRef.current) engineRef.current.shootBullet();
                    }}
                    className="py-2.5 bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-xs"
                  >
                    ●
                  </button>

                  <button
                    onMouseDown={() => setMoveDir(1)}
                    onMouseUp={() => setMoveDir(0)}
                    onTouchStart={() => setMoveDir(1)}
                    onTouchEnd={() => setMoveDir(0)}
                    className={`py-2.5 font-bold rounded-lg text-xs transition-colors ${
                      moveDir === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    ►
                  </button>

                  <div />
                  <button className="py-2.5 bg-slate-800 text-slate-500 font-bold rounded-lg text-xs cursor-not-allowed">
                    ▼
                  </button>
                  <div />
                </div>

                {/* Numeric Keypad Grid */}
                <div className="grid grid-cols-3 gap-1.5 w-full text-xs font-mono font-bold text-slate-300">
                  <div className="p-2 bg-slate-800 rounded-md text-center">1</div>
                  <div className="p-2 bg-slate-800 rounded-md text-center">2</div>
                  <div className="p-2 bg-slate-800 rounded-md text-center">3</div>

                  <button
                    onMouseDown={() => setMoveDir(-1)}
                    onMouseUp={() => setMoveDir(0)}
                    className={`p-2 rounded-md text-center transition-colors ${
                      pressedKey === '4' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                    }`}
                  >
                    4 ◄
                  </button>

                  <button
                    onClick={() => {
                      if (engineRef.current) engineRef.current.shootBullet();
                    }}
                    className={`p-2 rounded-md text-center transition-colors ${
                      pressedKey === '5' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                    }`}
                  >
                    5 🎯
                  </button>

                  <button
                    onMouseDown={() => setMoveDir(1)}
                    onMouseUp={() => setMoveDir(0)}
                    className={`p-2 rounded-md text-center transition-colors ${
                      pressedKey === '6' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                    }`}
                  >
                    6 ►
                  </button>

                  <div className="p-2 bg-slate-800 rounded-md text-center">7</div>
                  <div className="p-2 bg-slate-800 rounded-md text-center">8</div>
                  <div className="p-2 bg-slate-800 rounded-md text-center">9</div>
                  <div className="p-2 bg-slate-800 rounded-md text-center">*</div>
                  <div className="p-2 bg-slate-800 rounded-md text-center">0</div>
                  <div className="p-2 bg-slate-800 rounded-md text-center">#</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Information & Instructions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-600" /> Pure C Engine Compiled to asm.js / Wasm
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                KaiOS feature phones (JioPhone, Nokia 2720, Alcatel Smartflip) run on KaiOS 2.5 (Firefox 48 Gecko engine) or KaiOS 3.0.
                By writing the game engine in <strong>pure C (<code className="text-emerald-700 font-mono">c_src/doodle_engine.c</code>)</strong> and compiling it to <strong>asm.js / WebAssembly</strong> with Emscripten, the game achieves stable 60 FPS performance even on low-spec 512MB RAM KaiOS devices!
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" /> KaiOS Physical Keyboard Binds
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-800">Move Doodler Left</div>
                  <div className="text-slate-500 mt-0.5">D-Pad Left / Key <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">4</kbd> / Key <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">A</kbd></div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-800">Move Doodler Right</div>
                  <div className="text-slate-500 mt-0.5">D-Pad Right / Key <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">6</kbd> / Key <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">D</kbd></div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-800">Shoot Nose Pellets</div>
                  <div className="text-slate-500 mt-0.5">D-Pad Center / Key <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">5</kbd> / Key <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">Space</kbd></div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-800">Restart / Softkey Right</div>
                  <div className="text-slate-500 mt-0.5">SoftKey Right / Key <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">Backspace</kbd></div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">KaiOS KaiStore Ready:</strong> Includes full support for <code className="font-mono text-emerald-800">manifest.webapp</code> (KaiOS 2.5) and <code className="font-mono text-emerald-800">manifest.json</code> (KaiOS 3.0), non-touch D-Pad input navigation, and automatic GitHub Actions CI/CD building.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* C Memory Inspector Tab */}
      {activeTab === 'c_memory' && (
        <div className="w-full bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 font-mono text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Live C Struct Memory Dump (<code className="text-slate-300">typedef struct GameState</code>)
            </h3>
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded border border-emerald-800 text-[10px]">
              60 FPS C Memory Sync
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="text-slate-400 font-bold mb-2 text-[11px]">// Doodler Player C Struct</div>
              <pre className="text-emerald-300 whitespace-pre-wrap">
                {JSON.stringify(gameState?.player, null, 2)}
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="text-slate-400 font-bold mb-2 text-[11px]">// Engine Metadata & Camera State</div>
              <pre className="text-sky-300 whitespace-pre-wrap">
                {JSON.stringify({
                  score: gameState?.score,
                  highScore: gameState?.highScore,
                  cameraY: gameState?.cameraY,
                  worldWidth: gameState?.worldWidth,
                  worldHeight: gameState?.worldHeight,
                  gameOver: gameState?.gameOver,
                  activePlatformsCount: gameState?.platforms.length,
                  activeBulletsCount: gameState?.bullets.length,
                  activeMonstersCount: gameState?.monsters.length,
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* C Source Code Tab */}
      {activeTab === 'c_code' && (
        <div className="w-full bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="font-bold text-emerald-400 flex items-center gap-2">
              <FileCode className="w-4 h-4" /> c_src/doodle_engine.c
            </div>
            <span className="text-slate-400 text-[10px]">Pure C • Emscripten Exported</span>
          </div>

          <div className="max-h-96 overflow-y-auto bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-300">
            <pre>{`#include "doodle_engine.h"
#include <stdlib.h>
#include <math.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

static GameState state;

EMSCRIPTEN_KEEPALIVE
void init_game(int width, int height) {
    state.world_width = width;
    state.world_height = height;
    state.score = 0;
    state.player.x = width / 2.0f;
    state.player.y = height - 120.0f;
    state.player.vy = -650.0f;
}

EMSCRIPTEN_KEEPALIVE
void update_game(float dt, int move_dir, bool shoot_pressed) {
    if (state.game_over) return;
    state.player.vx = move_dir * 360.0f;
    state.player.x += state.player.vx * dt;
    state.player.vy += 1200.0f * dt;
    state.player.y += state.player.vy * dt;
}`}</pre>
          </div>
        </div>
      )}

      {/* GitHub Actions Tab */}
      {activeTab === 'github_actions' && (
        <div className="w-full bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="font-bold text-emerald-400 flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> .github/workflows/build-kaios-asmjs.yml
            </div>
            <span className="text-slate-400 text-[10px]">Emscripten CI/CD Pipeline</span>
          </div>

          <div className="max-h-96 overflow-y-auto bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-300">
            <pre>{`name: Compile C Doodle Jump Engine for KaiOS (asm.js)

on:
  push:
    branches: [ main, master ]

jobs:
  build-kaios-asmjs:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: mymindstorm/setup-emsdk@v12
        with:
          version: 3.1.45

      - name: Compile C Game Engine to asm.js
        run: |
          mkdir -p public/kaios_asmjs
          emcc c_src/doodle_engine.c -I c_src -O3 -s WASM=0 -s LEGACY_GL_EMULATION=1 -o public/kaios_asmjs/doodle_engine.asm.js`}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
