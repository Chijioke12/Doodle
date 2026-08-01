import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { sfx } from '../utils/audio';
import {
  Smartphone,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Sparkles,
  Trophy,
  Compass,
  ArrowLeftRight,
  Zap,
} from 'lucide-react';

export const PhaserGame: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  // React State for Android / HUD controls
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('doodle_jump_high_score') || '0', 10);
  });
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [tiltAngle, setTiltAngle] = useState(0);
  const [tiltSupported, setTiltSupported] = useState(false);

  // Vibration feedback helper for Android devices
  const triggerVibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore if restricted
      }
    }
  };

  // Check Android / Mobile Orientation Sensor support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      setTiltSupported(true);
      const handleOrientation = (event: DeviceOrientationEvent) => {
        // gamma is left-to-right tilt in degrees (-90 to 90)
        if (event.gamma !== null) {
          setTiltAngle(event.gamma);
        }
      };
      window.addEventListener('deviceorientation', handleOrientation);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, []);

  useEffect(() => {
    sfx.enabled = soundEnabled;
  }, [soundEnabled]);

  // Request Gyro Permission for Android / iOS
  const requestGyroPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setTiltEnabled(true);
        }
      } catch (err) {
        console.error('Gyroscope permission denied:', err);
      }
    } else {
      setTiltEnabled(!tiltEnabled);
    }
  };

  // Fullscreen trigger for Android Chrome
  const toggleFullscreen = () => {
    if (phaserGameRef.current) {
      if (phaserGameRef.current.scale.isFullscreen) {
        phaserGameRef.current.scale.stopFullscreen();
      } else {
        phaserGameRef.current.scale.startFullscreen();
      }
    }
  };

  // Initialize Phaser 3 Game Engine
  useEffect(() => {
    if (!gameContainerRef.current) return;

    // Custom Phaser Main Game Scene
    class DoodleJumpScene extends Phaser.Scene {
      private player!: Phaser.Physics.Arcade.Sprite;
      private platforms!: Phaser.Physics.Arcade.Group;
      private monsters!: Phaser.Physics.Arcade.Group;
      private bullets!: Phaser.Physics.Arcade.Group;
      private items!: Phaser.Physics.Arcade.Group;

      private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      private keyA!: Phaser.Input.Keyboard.Key;
      private keyD!: Phaser.Input.Keyboard.Key;
      private keySpace!: Phaser.Input.Keyboard.Key;

      private currentScore: number = 0;
      private isGameOver: boolean = false;
      private powerupType: 'propeller' | 'jetpack' | 'shoes' | 'shield' | null = null;
      private powerupTimer: number = 0;
      private shieldBubble?: Phaser.GameObjects.Arc;

      // Touch controls active state
      public touchMoveLeft: boolean = false;
      public touchMoveRight: boolean = false;

      constructor() {
        super({ key: 'DoodleJumpScene' });
      }

      preload() {
        // Preload individual assets from Express Node Canvas backend
        this.load.image('doodle_left', '/api/assets/doodle_left.png');
        this.load.image('doodle_right', '/api/assets/doodle_right.png');
        this.load.image('doodle_shooting', '/api/assets/doodle_shooting.png');
        this.load.image('doodle_pissed', '/api/assets/doodle_pissed.png');
        this.load.image('doodle_propeller', '/api/assets/doodle_propeller_1.png');
        this.load.image('doodle_jetpack', '/api/assets/doodle_jetpack_1.png');
        this.load.image('doodle_spring_shoes', '/api/assets/doodle_spring_shoes.png');

        this.load.image('platform_green', '/api/assets/platform_green.png');
        this.load.image('platform_blue', '/api/assets/platform_blue.png');
        this.load.image('platform_white', '/api/assets/platform_white.png');
        this.load.image('brown_platform_1', '/api/assets/brown_platform_1.png');
        this.load.image('brown_platform_2', '/api/assets/brown_platform_2.png');

        this.load.image('spring_compressed', '/api/assets/spring_compressed.png');
        this.load.image('spring_full', '/api/assets/spring_full.png');
        this.load.image('propeller_hat', '/api/assets/propeller_hat.png');
        this.load.image('jetpack', '/api/assets/jetpack.png');
        this.load.image('spring_shoes', '/api/assets/spring_shoes.png');
        this.load.image('shield', '/api/assets/shield.png');

        this.load.image('monster_purple', '/api/assets/monster_purple.png');
        this.load.image('monster_red', '/api/assets/monster_red.png');
        this.load.image('green_flying_monster_1', '/api/assets/green_flying_monster_1.png');
        this.load.image('projectile', '/api/assets/projectile.png');
        this.load.image('bg_notebook', '/api/assets/bg_notebook.png');
      }

      create() {
        const { width, height } = this.scale;

        // Background
        this.add.image(width / 2, height / 2, 'bg_notebook').setDisplaySize(width, height);

        // Groups
        this.platforms = this.physics.add.group({ allowGravity: false, immovable: true });
        this.monsters = this.physics.add.group({ allowGravity: false, immovable: true });
        this.bullets = this.physics.add.group({ allowGravity: false });
        this.items = this.physics.add.group({ allowGravity: false, immovable: true });

        // Initial Starting Platforms
        this.createPlatform(width / 2, height - 80, 'platform_green');
        this.createPlatform(width / 2 - 100, height - 200, 'platform_green', 'spring');
        this.createPlatform(width / 2 + 100, height - 320, 'platform_blue');
        this.createPlatform(width / 2 - 80, height - 440, 'platform_green', 'propeller');
        this.createPlatform(width / 2 + 80, height - 560, 'platform_white');
        this.createPlatform(width / 2 - 40, height - 680, 'platform_green', 'jetpack');

        // Player Doodler
        this.player = this.physics.add.sprite(width / 2, height - 140, 'doodle_right');
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(false);
        this.player.body!.setSize(50, 60);

        // Initial Jump
        this.player.setVelocityY(-650);

        // Keyboard Input
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Shooting via Tap / Click
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          // If upper half tap -> shoot bullet
          if (pointer.y < height * 0.75 && !this.isGameOver) {
            this.shootBullet();
          }
        });

        // Camera Setup
        this.cameras.main.setBounds(0, -Infinity, width, Infinity);

        // Reset state
        this.currentScore = 0;
        this.isGameOver = false;
        this.powerupType = null;
        this.powerupTimer = 0;

        setGameOver(false);
        setScore(0);
        setGameStarted(true);
      }

      private createPlatform(x: number, y: number, type: string, itemType?: string) {
        const plat = this.platforms.create(x, y, type) as Phaser.Physics.Arcade.Sprite;
        plat.setData('type', type);

        if (type === 'platform_blue') {
          // Horizontal movement
          plat.setVelocityX(120);
        }

        if (itemType) {
          let itemKey = 'spring_compressed';
          if (itemType === 'propeller') itemKey = 'propeller_hat';
          if (itemType === 'jetpack') itemKey = 'jetpack';
          if (itemType === 'shoes') itemKey = 'spring_shoes';

          const item = this.items.create(x, y - 28, itemKey) as Phaser.Physics.Arcade.Sprite;
          item.setData('itemType', itemType);
          item.setData('parentPlat', plat);
        }

        return plat;
      }

      public shootBullet() {
        if (this.isGameOver || !this.player.active) return;

        sfx.playShoot();
        triggerVibrate(15);

        // Change player sprite to shooting snout
        this.player.setTexture('doodle_shooting');
        this.time.delayedCall(200, () => {
          if (!this.isGameOver && this.player.active) {
            this.player.setTexture(this.player.flipX ? 'doodle_left' : 'doodle_right');
          }
        });

        const bullet = this.bullets.create(this.player.x, this.player.y - 30, 'projectile') as Phaser.Physics.Arcade.Sprite;
        bullet.setVelocityY(-900);
      }

      update(time: number, delta: number) {
        if (this.isGameOver) return;

        const { width } = this.scale;

        // Move items attached to moving platforms
        this.items.getChildren().forEach((itemObj) => {
          const item = itemObj as Phaser.Physics.Arcade.Sprite;
          const parent = item.getData('parentPlat') as Phaser.Physics.Arcade.Sprite;
          if (parent && parent.active) {
            item.x = parent.x;
          }
        });

        // 1. Horizontal Movement (Keyboard, Touch, or Gyroscope)
        let moveVel = 0;

        if (this.cursors.left.isDown || this.keyA.isDown || this.touchMoveLeft) {
          moveVel = -380;
          this.player.setFlipX(false);
          if (!this.powerupType) this.player.setTexture('doodle_left');
        } else if (this.cursors.right.isDown || this.keyD.isDown || this.touchMoveRight) {
          moveVel = 380;
          this.player.setFlipX(true);
          if (!this.powerupType) this.player.setTexture('doodle_right');
        } else if (tiltEnabled && Math.abs(tiltAngle) > 3) {
          // Tilt tilt steering for mobile browsers
          moveVel = Math.min(Math.max(tiltAngle * 25, -450), 450);
          this.player.setFlipX(tiltAngle > 0);
          if (!this.powerupType) this.player.setTexture(tiltAngle > 0 ? 'doodle_right' : 'doodle_left');
        } else {
          moveVel = 0;
        }

        this.player.setVelocityX(moveVel);

        // Screen Wrap-Around
        if (this.player.x < -20) this.player.x = width + 20;
        if (this.player.x > width + 20) this.player.x = -20;

        // 2. Powerup Flight Mechanics
        if (this.powerupType) {
          this.powerupTimer -= delta;

          if (this.powerupType === 'jetpack') {
            this.player.setVelocityY(-800);
          } else if (this.powerupType === 'propeller') {
            this.player.setVelocityY(-650);
          }

          if (this.powerupTimer <= 0) {
            this.powerupType = null;
            this.player.setTexture('doodle_right');
          }
        }

        // 3. Platform Collisions (Landing when falling downwards)
        if (this.player.body!.velocity.y > 0 && !this.powerupType) {
          this.physics.overlap(this.player, this.platforms, (playerObj, platObj) => {
            const plat = platObj as Phaser.Physics.Arcade.Sprite;
            const p = playerObj as Phaser.Physics.Arcade.Sprite;

            // Only bounce if landing on top of platform
            if (p.y + 25 <= plat.y) {
              const type = plat.getData('type');

              if (type === 'brown_platform_1') {
                // Break platform
                sfx.playBreak();
                triggerVibrate(30);
                plat.setTexture('brown_platform_2');
                this.time.delayedCall(100, () => {
                  plat.destroy();
                });
              } else {
                // Bounce jump!
                p.setVelocityY(-650);
                sfx.playJump();
                triggerVibrate(15);

                if (type === 'platform_white') {
                  // White platform disappears after 1 jump
                  plat.destroy();
                }
              }
            }
          });

          // Item Pickups
          this.physics.overlap(this.player, this.items, (playerObj, itemObj) => {
            const item = itemObj as Phaser.Physics.Arcade.Sprite;
            const itemType = item.getData('itemType');

            if (itemType === 'spring') {
              item.setTexture('spring_full');
              this.player.setVelocityY(-1050);
              sfx.playSpring();
              triggerVibrate([20, 30]);
            } else if (itemType === 'jetpack') {
              this.powerupType = 'jetpack';
              this.powerupTimer = 2200;
              this.player.setTexture('doodle_jetpack');
              sfx.playJetpack();
              triggerVibrate([40, 50, 40]);
              item.destroy();
            } else if (itemType === 'propeller') {
              this.powerupType = 'propeller';
              this.powerupTimer = 1800;
              this.player.setTexture('doodle_propeller');
              sfx.playSpring();
              triggerVibrate([30, 40]);
              item.destroy();
            }
          });
        }

        // 4. Bullets vs Monsters
        this.physics.overlap(this.bullets, this.monsters, (bulletObj, monsterObj) => {
          bulletObj.destroy();
          monsterObj.destroy();
          sfx.playMonsterHit();
          triggerVibrate([20, 40]);
          this.currentScore += 300;
          setScore(this.currentScore);
        });

        // 5. Player vs Monsters
        if (!this.powerupType) {
          this.physics.overlap(this.player, this.monsters, (playerObj, monsterObj) => {
            const m = monsterObj as Phaser.Physics.Arcade.Sprite;

            // Jump on top of monster -> Squish monster!
            if (this.player.body!.velocity.y > 0 && this.player.y + 20 < m.y) {
              m.destroy();
              this.player.setVelocityY(-650);
              sfx.playMonsterHit();
              triggerVibrate([30, 30]);
              this.currentScore += 500;
              setScore(this.currentScore);
            } else {
              // Hit monster -> Game Over!
              this.triggerGameOver();
            }
          });
        }

        // 6. Camera Follow & Infinite Level Generation
        if (this.player.y < this.cameras.main.scrollY + 300) {
          const deltaY = this.cameras.main.scrollY + 300 - this.player.y;
          this.cameras.main.scrollY = this.player.y - 300;

          this.currentScore += Math.floor(deltaY);
          setScore(this.currentScore);

          // Spawn new platforms above
          this.spawnHigherPlatforms();
        }

        // 7. Cleanup Offscreen Elements Below Camera
        const bottomLimit = this.cameras.main.scrollY + this.scale.height + 100;

        this.platforms.getChildren().forEach((plat) => {
          if ((plat as Phaser.Physics.Arcade.Sprite).y > bottomLimit) {
            plat.destroy();
          }
        });

        this.monsters.getChildren().forEach((m) => {
          if ((m as Phaser.Physics.Arcade.Sprite).y > bottomLimit) {
            m.destroy();
          }
        });

        // 8. Falling below camera -> Game Over
        if (this.player.y > bottomLimit - 50) {
          this.triggerGameOver();
        }

        // Bounce moving platforms off edges
        this.platforms.getChildren().forEach((platObj) => {
          const plat = platObj as Phaser.Physics.Arcade.Sprite;
          if (plat.body!.velocity.x !== 0) {
            if (plat.x < 60 || plat.x > width - 60) {
              plat.setVelocityX(-plat.body!.velocity.x);
            }
          }
        });
      }

      private spawnHigherPlatforms() {
        const { width } = this.scale;
        const highestPlatformY = Math.min(
          ...this.platforms.getChildren().map((p) => (p as Phaser.Physics.Arcade.Sprite).y)
        );

        if (highestPlatformY > this.cameras.main.scrollY - 150) {
          const newY = highestPlatformY - (60 + Math.random() * 50);
          const newX = Phaser.Math.Between(60, width - 60);

          const types = ['platform_green', 'platform_green', 'platform_green', 'platform_blue', 'platform_white', 'brown_platform_1'];
          const chosenType = types[Math.floor(Math.random() * types.length)];

          let itemType: string | undefined = undefined;
          const rand = Math.random();
          if (rand < 0.1) itemType = 'spring';
          else if (rand < 0.14) itemType = 'propeller';
          else if (rand < 0.18) itemType = 'jetpack';

          this.createPlatform(newX, newY, chosenType, itemType);

          // Random Monster Spawn
          if (Math.random() < 0.18 && this.currentScore > 1000) {
            const mKey = Math.random() > 0.5 ? 'monster_purple' : 'green_flying_monster_1';
            const m = this.monsters.create(Phaser.Math.Between(80, width - 80), newY - 70, mKey) as Phaser.Physics.Arcade.Sprite;
            m.setData('type', mKey);
          }
        }
      }

      private triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.player.setTexture('doodle_pissed');
        this.player.setVelocityY(200);

        sfx.playGameOver();
        triggerVibrate([100, 50, 100]);

        setGameOver(true);

        setHighScore((prev) => {
          const newHigh = Math.max(prev, this.currentScore);
          localStorage.setItem('doodle_jump_high_score', newHigh.toString());
          return newHigh;
        });
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: 400,
      height: 640,
      audio: {
        noAudio: true,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 1200 },
          debug: false,
        },
      },
      scene: [DoodleJumpScene],
      backgroundColor: '#f7f6ed',
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    return () => {
      game.destroy(true);
    };
  }, []);

  const restartGame = () => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('DoodleJumpScene');
      if (scene) {
        scene.scene.restart();
      }
    }
  };

  const triggerShootInPhaser = () => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('DoodleJumpScene') as any;
      if (scene) {
        scene.shootBullet();
      }
    }
  };

  const setTouchMove = (left: boolean, right: boolean) => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('DoodleJumpScene') as any;
      if (scene) {
        scene.touchMoveLeft = left;
        scene.touchMoveRight = right;
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto">
      {/* Top HUD Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs w-full flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <Zap className="w-5 h-5 text-emerald-600" /> Phaser 3 Engine
            </h2>
            <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-semibold">
              Android Optimized
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Arcade Physics • Gyroscope Tilt • Touch Controls • Haptics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tiltSupported && (
            <button
              onClick={requestGyroPermission}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                tiltEnabled
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Toggle Gyroscope / Motion Tilt Steering"
            >
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Tilt</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            title="Full Screen Mode"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Score Display Bar */}
      <div className="w-full bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between font-mono border border-slate-800 shadow-xs">
        <div>
          <div className="text-[10px] text-slate-400">SCORE</div>
          <div className="text-2xl font-bold text-emerald-400">{score}</div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
            <Trophy className="w-3 h-3 text-amber-400" /> BEST HIGH SCORE
          </div>
          <div className="text-lg font-bold text-amber-300">{highScore}</div>
        </div>
      </div>

      {/* Phaser Canvas Mount Container */}
      <div className="relative border-4 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-white w-full max-w-[400px] aspect-[400/640]">
        <div ref={gameContainerRef} className="w-full h-full" />

        {/* Game Over Screen Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <img src="/api/assets/game_over_overlay.png" alt="Game Over" className="w-64 mb-4 drop-shadow-xl" />

            <div className="bg-white/10 p-4 rounded-xl border border-white/20 my-2 w-64 text-slate-100">
              <div className="text-xs font-medium text-slate-300">FINAL SCORE</div>
              <div className="text-3xl font-extrabold font-mono text-emerald-400 my-1">{score}</div>
              <div className="text-xs text-amber-300 font-semibold">HIGH SCORE: {highScore}</div>
            </div>

            <button
              onClick={restartGame}
              className="mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-base shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" /> PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* On-Screen Android Touch Controls */}
      <div className="w-full max-w-[400px] bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-md flex items-center justify-between gap-2">
        {/* Left Arrow Touch Zone */}
        <button
          onMouseDown={() => setTouchMove(true, false)}
          onMouseUp={() => setTouchMove(false, false)}
          onTouchStart={(e) => { e.preventDefault(); setTouchMove(true, false); }}
          onTouchEnd={(e) => { e.preventDefault(); setTouchMove(false, false); }}
          className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-lg active:bg-emerald-600 select-none text-center shadow-xs cursor-pointer active:scale-95 transition-transform"
        >
          ← LEFT
        </button>

        {/* Shoot Button */}
        <button
          onClick={triggerShootInPhaser}
          onTouchStart={(e) => { e.preventDefault(); triggerShootInPhaser(); }}
          className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-extrabold text-sm active:bg-red-800 select-none text-center shadow-xs cursor-pointer active:scale-95 transition-transform"
        >
          PELLET
        </button>

        {/* Right Arrow Touch Zone */}
        <button
          onMouseDown={() => setTouchMove(false, true)}
          onMouseUp={() => setTouchMove(false, false)}
          onTouchStart={(e) => { e.preventDefault(); setTouchMove(false, true); }}
          onTouchEnd={(e) => { e.preventDefault(); setTouchMove(false, false); }}
          className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-lg active:bg-emerald-600 select-none text-center shadow-xs cursor-pointer active:scale-95 transition-transform"
        >
          RIGHT →
        </button>
      </div>

      {/* Android Browser Guidance Card */}
      <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-emerald-600" /> Android Browser Tips:
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-600">
          <li><strong>Gyroscope Steering:</strong> Tap <em>"Tilt"</em> to steer the Doodler by tilting your phone!</li>
          <li><strong>Touch Zones:</strong> Tap the Left / Right touch buttons or anywhere on the upper screen to shoot nose pellets.</li>
          <li><strong>Fullscreen:</strong> Tap the expand icon in the top right for a native Android full-screen experience.</li>
        </ul>
      </div>
    </div>
  );
};
