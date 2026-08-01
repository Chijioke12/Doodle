// JS / asm.js Memory Adapter for C Doodle Jump Engine
// Recreates C struct memory layout & simulation matching c_src/doodle_engine.c

export interface CPlatform {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: number; // 0: green, 1: blue, 2: white, 3: brown
  active: boolean;
  broken: boolean;
}

export interface CItem {
  x: number;
  y: number;
  type: number; // 1: spring, 2: propeller, 3: jetpack
  platformIdx: number;
  active: boolean;
}

export interface CMonster {
  x: number;
  y: number;
  vx: number;
  type: number;
  active: boolean;
}

export interface CBullet {
  x: number;
  y: number;
  vy: number;
  active: boolean;
}

export interface CDoodler {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number; // -1: left, 1: right
  powerupType: number; // 0: none, 2: propeller, 3: jetpack
  powerupTimer: number;
  isShooting: boolean;
  isDead: boolean;
}

export interface CGameState {
  player: CDoodler;
  platforms: CPlatform[];
  items: CItem[];
  monsters: CMonster[];
  bullets: CBullet[];
  score: number;
  highScore: number;
  cameraY: number;
  worldWidth: number;
  worldHeight: number;
  gameOver: boolean;
}

export class CDoodleEngine {
  private state: CGameState;

  constructor(width: number = 240, height: number = 320) {
    this.state = {
      player: {
        x: width / 2,
        y: height - 80,
        vx: 0,
        vy: -550,
        facing: 1,
        powerupType: 0,
        powerupTimer: 0,
        isShooting: false,
        isDead: false,
      },
      platforms: [],
      items: [],
      monsters: [],
      bullets: [],
      score: 0,
      highScore: parseInt(localStorage.getItem('kaios_doodle_high') || '0', 10),
      cameraY: 0,
      worldWidth: width,
      worldHeight: height,
      gameOver: false,
    };

    this.initGame(width, height);
  }

  public initGame(width: number, height: number) {
    this.state.worldWidth = width;
    this.state.worldHeight = height;
    this.state.score = 0;
    this.state.cameraY = 0;
    this.state.gameOver = false;

    this.state.player = {
      x: width / 2,
      y: height - 80,
      vx: 0,
      vy: -550,
      facing: 1,
      powerupType: 0,
      powerupTimer: 0,
      isShooting: false,
      isDead: false,
    };

    // Initialize C platform array (240x320 KaiOS screen scale)
    this.state.platforms = [
      { x: width / 2, y: height - 40, vx: 0, vy: 0, type: 0, active: true, broken: false },
      { x: width / 2 - 50, y: height - 110, vx: 0, vy: 0, type: 0, active: true, broken: false },
      { x: width / 2 + 50, y: height - 180, vx: 60, vy: 0, type: 1, active: true, broken: false },
      { x: width / 2 - 40, y: height - 250, vx: 0, vy: 0, type: 0, active: true, broken: false },
      { x: width / 2 + 40, y: height - 320, vx: 0, vy: 0, type: 2, active: true, broken: false },
    ];

    this.state.items = [
      { x: width / 2 - 50, y: height - 125, type: 1, platformIdx: 1, active: true },
    ];

    this.state.monsters = [];
    this.state.bullets = [];
  }

  public shootBullet() {
    if (this.state.gameOver) return;
    this.state.player.isShooting = true;

    this.state.bullets.push({
      x: this.state.player.x,
      y: this.state.player.y - 18,
      vy: -750,
      active: true,
    });

    setTimeout(() => {
      this.state.player.isShooting = false;
    }, 150);
  }

  public updateGame(dt: number, moveDir: number, shootPressed: boolean) {
    if (this.state.gameOver) return;

    if (shootPressed) {
      this.shootBullet();
    }

    const player = this.state.player;

    // 1. Horizontal Movement
    player.vx = moveDir * 280;
    if (moveDir !== 0) player.facing = moveDir;

    player.x += player.vx * dt;

    // KaiOS screen wrap-around
    if (player.x < -15) player.x = this.state.worldWidth + 15;
    if (player.x > this.state.worldWidth + 15) player.x = -15;

    // Powerup Physics
    if (player.powerupType > 0) {
      player.powerupTimer -= dt;
      if (player.powerupType === 3) player.vy = -750; // Jetpack
      if (player.powerupType === 2) player.vy = -600; // Propeller

      if (player.powerupTimer <= 0) {
        player.powerupType = 0;
      }
    } else {
      player.vy += 1000 * dt; // Gravity
    }

    player.y += player.vy * dt;

    // 2. Platform Landing
    if (player.vy > 0 && player.powerupType === 0) {
      for (const p of this.state.platforms) {
        if (!p.active || p.broken) continue;

        if (
          player.x + 15 > p.x - 22 &&
          player.x - 15 < p.x + 22 &&
          player.y + 20 >= p.y - 8 &&
          player.y + 10 <= p.y + 8
        ) {
          if (p.type === 3) {
            p.broken = true;
          } else {
            player.vy = -550;
            if (p.type === 2) p.active = false; // Disappears
          }
        }
      }

      // Items
      for (const item of this.state.items) {
        if (!item.active) continue;

        if (
          player.x + 15 > item.x - 12 &&
          player.x - 15 < item.x + 12 &&
          player.y + 20 >= item.y - 12 &&
          player.y - 20 <= item.y + 12
        ) {
          if (item.type === 1) {
            player.vy = -900; // Spring jump
          } else if (item.type === 2) {
            player.powerupType = 2;
            player.powerupTimer = 1.8;
            item.active = false;
          } else if (item.type === 3) {
            player.powerupType = 3;
            player.powerupTimer = 2.2;
            item.active = false;
          }
        }
      }
    }

    // Moving Platforms
    for (const p of this.state.platforms) {
      if (p.active && p.type === 1) {
        p.x += p.vx * dt;
        if (p.x < 30 || p.x > this.state.worldWidth - 30) p.vx = -p.vx;
      }
    }

    // 3. Bullets vs Monsters
    for (let i = this.state.bullets.length - 1; i >= 0; i--) {
      const b = this.state.bullets[i];
      if (!b.active) continue;

      b.y += b.vy * dt;
      if (b.y < this.state.cameraY - 30) {
        b.active = false;
        continue;
      }

      for (const m of this.state.monsters) {
        if (!m.active) continue;
        if (Math.abs(b.x - m.x) < 20 && Math.abs(b.y - m.y) < 20) {
          b.active = false;
          m.active = false;
          this.state.score += 300;
          break;
        }
      }
    }

    // 4. Player vs Monsters
    if (player.powerupType === 0) {
      for (const m of this.state.monsters) {
        if (!m.active) continue;

        if (Math.abs(player.x - m.x) < 18 && Math.abs(player.y - m.y) < 20) {
          if (player.vy > 0 && player.y + 10 < m.y) {
            m.active = false;
            player.vy = -550;
            this.state.score += 500;
          } else {
            this.triggerGameOver();
            return;
          }
        }
      }
    }

    // 5. Camera & Level Generator
    const threshold = this.state.cameraY + 140;
    if (player.y < threshold) {
      const deltaY = threshold - player.y;
      this.state.cameraY -= deltaY;
      this.state.score += Math.floor(deltaY);
      this.spawnHigherPlatforms();
    }

    // Fall Offscreen
    if (player.y > this.state.cameraY + this.state.worldHeight + 40) {
      this.triggerGameOver();
    }
  }

  private spawnHigherPlatforms() {
    const highestY = Math.min(...this.state.platforms.map((p) => p.y));

    if (highestY > this.state.cameraY - 100) {
      const newY = highestY - (45 + Math.random() * 40);
      const newX = 30 + Math.random() * (this.state.worldWidth - 60);

      const types = [0, 0, 0, 1, 2, 3];
      const type = types[Math.floor(Math.random() * types.length)];

      this.state.platforms.push({
        x: newX,
        y: newY,
        vx: type === 1 ? 50 : 0,
        vy: 0,
        type,
        active: true,
        broken: false,
      });

      // Item
      const rand = Math.random();
      if (rand < 0.08) {
        this.state.items.push({ x: newX, y: newY - 15, type: 1, platformIdx: 0, active: true });
      } else if (rand < 0.12) {
        this.state.items.push({ x: newX, y: newY - 15, type: 2, platformIdx: 0, active: true });
      } else if (rand < 0.15) {
        this.state.items.push({ x: newX, y: newY - 15, type: 3, platformIdx: 0, active: true });
      }

      // Monster
      if (Math.random() < 0.12 && this.state.score > 800) {
        this.state.monsters.push({
          x: 40 + Math.random() * (this.state.worldWidth - 80),
          y: newY - 45,
          vx: 0,
          type: Math.random() > 0.5 ? 1 : 2,
          active: true,
        });
      }

      // Keep array memory tight
      if (this.state.platforms.length > 40) {
        this.state.platforms = this.state.platforms.filter(
          (p) => p.y < this.state.cameraY + this.state.worldHeight + 80
        );
      }
    }
  }

  private triggerGameOver() {
    this.state.gameOver = true;
    this.state.player.isDead = true;

    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      localStorage.setItem('kaios_doodle_high', this.state.highScore.toString());
    }
  }

  public getState(): CGameState {
    return this.state;
  }
}
