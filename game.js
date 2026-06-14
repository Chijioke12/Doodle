import { keys, setupControls } from './controls.js';

// --- Engine & State ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let state = 'MENU'; // MENU, PLAYING, GAMEOVER
let score = 0;
let cameraY = 0;
let powerupMode = false;
let powerupTimer = 0;

// Connect controls to game start
setupControls(() => {
  if (state === 'GAMEOVER' || state === 'MENU') {
    startGame();
  }
});
document.getElementById('startBtn').addEventListener('click', startGame);

// --- Assets ---
const images = {};
const sfx = {};

function loadImg(name, src) {
  const img = new Image();
  img.src = src;
  images[name] = img;
}

function loadSfx(name, src) {
  sfx[name] = new Audio(src);
}

function playSfx(name) {
  if(sfx[name] && sfx[name].readyState >= 2) {
    sfx[name].currentTime = 0;
    sfx[name].play().catch(()=>{});
  }
}

// Reverting to use user's uploaded original assets.
loadImg('bg', '/assets/cosmic-blueprint-grid.svg');
loadImg('player', '/assets/idle-fall.svg');
loadImg('playerJump', '/assets/jump-extension.svg');
loadImg('playerShoot', '/assets/shoot-projectile.svg');
loadImg('playerDefeat', '/assets/defeat-dizzy.svg');
loadImg('playerJetpack', '/assets/equipped-jetpack-.svg');
loadImg('playerPropeller', '/assets/equipped-propeller-.svg');

loadImg('platform', '/assets/standard-platform.svg');
loadImg('movingPlatform', '/assets/moving-platform.svg');
loadImg('fragilePlatform', '/assets/fragile-platform.svg');
loadImg('brokenPlatform', '/assets/broken-fragments.svg');
loadImg('cloudPlatform', '/assets/disappearing-cloud.svg');

loadImg('alien', '/assets/alien-monster.svg');
loadImg('alienDefeated', '/assets/monster-defeated-.svg');
loadImg('ufo', '/assets/ufo-abductor.svg');
loadImg('blackHole', '/assets/black-hole.svg');

loadImg('projectile', '/assets/plasma-projectile.svg');

loadImg('spring', '/assets/spring-coiled-.svg');
loadImg('springSprung', '/assets/spring-sprung-.svg');
loadImg('trampoline', '/assets/trampoline-idle-.svg');
loadImg('trampolineImpact', '/assets/trampoline-impact-.svg');

loadImg('propellerPower', '/assets/propeller-idle-.svg');
loadImg('jetpackPower', '/assets/jetpack-idle-.svg');

loadSfx('jump', '/sfx/jump.wav');
loadSfx('break', '/sfx/platform_break.wav');
loadSfx('spring', '/sfx/spring.wav');
loadSfx('shoot', '/sfx/shoot.wav');
loadSfx('defeat', '/sfx/defeat.wav');
loadSfx('powerup', '/sfx/powerup.wav');
loadSfx('monster_defeat', '/sfx/monster_defeat.wav');

// --- Game Objects ---
let player = {
  x: WIDTH/2, y: HEIGHT/2,
  w: 24, h: 24,
  vx: 0, vy: 0,
  speed: 3.5,
  gravity: 0.2,
  jumpForce: -6
};

let platforms = [];
let enemies = [];
let projectiles = [];
let powerups = [];
let particles = [];

let lastShotTime = 0;
let shootModeTimer = 0;

function createPlatform(y) {
  let r = Math.random();
  let type = 'normal';
  let asset = 'platform';
  let w = 60, h = 15;
  
  let canHaveMoving = score > 150;
  let canHaveFragile = score > 300;
  let canHaveCloud = score > 500;
  let canHaveEnemies = score > 200;
  let canHaveUfo = score > 400;
  let canHaveJetpack = score > 350;
  let canHavePropeller = score > 100;
  let canHaveTrampoline = score > 120;
  let canHaveSpring = score > 40;
  
  if (canHaveCloud && r > 0.85) { type = 'cloud'; asset = 'cloudPlatform'; }
  else if (canHaveFragile && r > 0.70) { type = 'fragile'; asset = 'fragilePlatform'; }
  else if (canHaveMoving && r > 0.50) { type = 'moving'; asset = 'movingPlatform'; }
  
  let p = {
    x: Math.random() * (WIDTH - w),
    y: y,
    w: w, h: h,
    type: type,
    asset: asset,
    vx: type === 'moving' ? (Math.random() > 0.5 ? 1.5 : -1.5) : 0,
    broken: false,
    hasSpring: false,
    hasTrampoline: false
  };
  
  // Spawn items
  if (type === 'normal') {
      let itemR = Math.random();
      if (canHaveJetpack && itemR > 0.95) {
          powerups.push({ x: p.x + p.w/2 - 10, y: p.y - 20, w: 20, h: 20, type: 'jetpack', asset: 'jetpackPower' });
      } else if (canHavePropeller && itemR > 0.90) {
          powerups.push({ x: p.x + p.w/2 - 10, y: p.y - 20, w: 20, h: 20, type: 'propeller', asset: 'propellerPower' });
      } else if (canHaveSpring && itemR > 0.80) {
          p.hasSpring = true;
      } else if (canHaveTrampoline && itemR > 0.70) {
          p.hasTrampoline = true;
      }
  }
  
  // Spawn Enemies
  if (canHaveEnemies && type === 'normal' && !p.hasSpring && !p.hasTrampoline && Math.random() > 0.85) {
    let eType = (canHaveUfo && Math.random() > 0.5) ? 'ufo' : 'alien';
    enemies.push({
      x: p.x + p.w/2 - 15,
      y: p.y - 30,
      w: 30, h: 30,
      vx: Math.random() > 0.5 ? 1 : -1,
      dead: false,
      type: eType,
      asset: eType
    });
  }
  
  return p;
}

function startGame() {
  state = 'PLAYING';
  score = 0;
  cameraY = 0;
  powerupMode = false;
  powerupTimer = 0;
  platforms = [];
  enemies = [];
  projectiles = [];
  powerups = [];
  particles = [];
  shootModeTimer = 0;
  
  player.x = WIDTH / 2 - 15;
  player.y = HEIGHT / 2;
  player.vx = 0;
  player.vy = 0;
  
  // Base platform
  platforms.push({ x: WIDTH/2 - 30, y: HEIGHT - 20, w: 60, h: 15, type: 'normal', asset: 'platform', vx: 0, broken: false, hasSpring: false, hasTrampoline: false });
  
  for(let i=0; i<12; i++) {
    platforms.push(createPlatform(HEIGHT - 80 - i * 50));
  }
  
  document.getElementById('gameOverScreen').classList.remove('visible');
}

function gameOver() {
  if (state === 'GAMEOVER') return;
  state = 'GAMEOVER';
  playSfx('defeat');
  document.getElementById('finalScore').innerText = Math.floor(score);
  document.getElementById('gameOverScreen').classList.add('visible');
}

function spawnParticles(x, y, color) {
  for(let i=0; i<8; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 1.0,
      color: color
    });
  }
}

// --- Update Loop ---
function update() {
  if (state !== 'PLAYING') {
     if (state === 'GAMEOVER') {
         player.y += 5; // fall offscreen
     }
     return;
  }

  // Player Movement
  if (keys['ArrowLeft'] || keys['4']) player.vx = -player.speed;
  else if (keys['ArrowRight'] || keys['6']) player.vx = player.speed;
  else player.vx = 0;

  player.x += player.vx;
  
  if (!powerupMode) {
      player.vy += player.gravity;
  } else {
      player.vy = -8; // fly up faster
      powerupTimer--;
      if (powerupTimer <= 0) {
          powerupMode = false;
          player.vy = player.jumpForce;
      }
  }
  
  player.y += player.vy;

  // Screen wrap
  if (player.x + player.w < 0) player.x = WIDTH;
  if (player.x > WIDTH) player.x = -player.w;

  // Shooting
  if (shootModeTimer > 0) shootModeTimer--;
  if ((keys['Enter'] || keys['5']) && Date.now() - lastShotTime > 300) {
    projectiles.push({ x: player.x + player.w/2 - 6, y: player.y, w: 12, h: 12, vy: -8 });
    playSfx('shoot');
    lastShotTime = Date.now();
    shootModeTimer = 15; // frames to show shoot graphic
  }

  // Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let pr = projectiles[i];
    pr.y += pr.vy;
    if (pr.y < cameraY - 50) projectiles.splice(i, 1);
    else {
      // Check collision with enemies (larger hit radius for projectiles)
      for (let j = enemies.length - 1; j >= 0; j--) {
        let e = enemies[j];
        if (!e.dead && pr.x + pr.w > e.x && pr.x < e.x + e.w && pr.y + pr.h > e.y && pr.y < e.y + e.h) {
          e.dead = true;
          e.asset = 'alienDefeated';
          e.vy = 5; // fall down gently
          projectiles.splice(i, 1);
          spawnParticles(e.x + e.w/2, e.y + e.h/2, '#FBBF24');
          playSfx('monster_defeat');
          score += 50;
          break;
        }
      }
    }
  }

  // Powerups Collision
  for (let i = powerups.length - 1; i >= 0; i--) {
      let p = powerups[i];
      if (player.x + player.w > p.x && player.x < p.x + p.w && player.y + player.h > p.y && player.y < p.y + p.h) {
          powerupMode = true;
          powerupTimer = p.type === 'jetpack' ? 120 : 60;
          playSfx('powerup');
          powerups.splice(i, 1);
      }
  }

  // Platforms & Collisions
  for (let p of platforms) {
    if (p.type === 'moving') {
      p.x += p.vx;
      if (p.x < 0 || p.x + p.w > WIDTH) p.vx *= -1;
    }
    
    // Player falling & hitting top of platform
    if (!p.broken && player.vy > 0 && !powerupMode) {
      let oldBottom = player.y + player.h - player.vy;
      if (player.x + player.w > p.x + 4 && player.x < p.x + p.w - 4 &&
          player.y + player.h >= p.y && oldBottom <= p.y + 12) { // small tolerance
        
        if (p.type === 'fragile') {
          p.broken = true;
          p.asset = 'brokenPlatform';
          player.vy = player.jumpForce;
          playSfx('break');
        } else if (p.type === 'cloud') {
          p.broken = true;
          p.asset = ''; // hides it
          player.vy = player.jumpForce;
          playSfx('jump');
        } else {
          if (p.hasSpring && player.x + player.w > p.x + p.w/2 - 10 && player.x < p.x + p.w/2 + 10) {
            player.vy = player.jumpForce * 1.5;
            p.hasSpring = 'sprung'; // use sprung asset
            playSfx('spring');
          } else if (p.hasTrampoline && player.x + player.w > p.x + p.w/2 - 10 && player.x < p.x + p.w/2 + 10) {
             player.vy = player.jumpForce * 1.8;
            p.hasTrampoline = 'sprung';
            playSfx('spring');
          } else {
            player.vy = player.jumpForce;
            playSfx('jump');
          }
        }
      }
    }
  }

  // Enemies
  for (let e of enemies) {
    if (!e.dead) {
      e.x += e.vx;
      if (e.x < 0 || e.x + e.w > WIDTH) e.vx *= -1;
      
      // Player hitting enemy safely
      if (!powerupMode && player.x + player.w > e.x + 5 && player.x < e.x + e.w - 5 &&
          player.y + player.h > e.y + 5 && player.y < e.y + e.h - 5) {
        
        if (player.vy > 0 && player.y + player.h < e.y + e.h/2) {
          // Bounced on enemy top
          e.dead = true;
          e.asset = 'alienDefeated';
          e.vy = 5;
          player.vy = player.jumpForce;
          playSfx('jump');
          score += 100;
          spawnParticles(e.x + e.w/2, e.y + e.h/2, '#2DD4BF');
        } else {
          gameOver();
        }
      }
    } else if (e.vy) {
        e.y += e.vy; // falling defeated enemy
    }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life -= 0.05;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Camera
  if (player.y < cameraY + HEIGHT/2) {
    let diff = cameraY + HEIGHT/2 - player.y;
    cameraY -= diff;
    score += diff / 10;
    document.getElementById('scoreDisplay').innerText = Math.floor(score);
  }

  // Recycle Level
  let lowestPlatformY = cameraY + HEIGHT + 50;
  platforms = platforms.filter(p => p.y < lowestPlatformY && p.asset !== '');
  enemies = enemies.filter(e => e.y < lowestPlatformY);
  powerups = powerups.filter(p => p.y < lowestPlatformY);
  
  while(platforms.length < 15) {
    let highestY = platforms.reduce((min, p) => p.y < min ? p.y : min, lowestPlatformY);
    platforms.push(createPlatform(highestY - 40 - Math.random() * 40));
  }

  // Die by falling
  if (player.y > cameraY + HEIGHT) {
    gameOver();
  }
}

// --- Draw Loop ---
function draw() {
  ctx.fillStyle = '#0B0B1A';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Background (Static)
  if (images.bg && images.bg.complete && images.bg.naturalHeight !== 0) {
    ctx.drawImage(images.bg, 0, 0, WIDTH, HEIGHT);
  }
  
  ctx.save();
  ctx.translate(0, -cameraY);

  // Defs utility
  function drawAssetOrDefault(x, y, w, h, imgName, fallbackColor) {
    if (!imgName) return; // invisible thing
    let img = images[imgName];
    if (img && img.complete && img.naturalHeight !== 0) {
      ctx.drawImage(img, x, y, w, h);
    } else {
      ctx.fillStyle = fallbackColor;
      ctx.fillRect(x, y, w, h);
    }
  }

  // Platforms
  for (let p of platforms) {
    let platDrawW = p.w * 1.2;
    let platDrawH = p.h * 2.0;
    let platDrawX = p.x - p.w * 0.1;
    let platDrawY = p.y - p.h * 0.5;

    drawAssetOrDefault(platDrawX, platDrawY, platDrawW, platDrawH, p.asset, p.broken ? '#4B5563' : '#10B981');
    
    if (p.hasSpring && !p.broken) {
       drawAssetOrDefault(p.x + p.w/2 - 10, p.y - 15, 20, 15, p.hasSpring === 'sprung' ? 'springSprung' : 'spring', '#22C55E');
    }
    if (p.hasTrampoline && !p.broken) {
       drawAssetOrDefault(p.x + p.w/2 - 15, p.y - 10, 30, 10, p.hasTrampoline === 'sprung' ? 'trampolineImpact' : 'trampoline', '#3B82F6');
    }
  }

  // Powerups
  for (let p of powerups) {
    drawAssetOrDefault(p.x, p.y, p.w, p.h, p.asset, '#F59E0B');
  }

  // Enemies
  for (let e of enemies) {
    let eDrawW = e.w * 1.4;
    let eDrawH = e.h * 1.4;
    let eDrawX = e.x - (eDrawW - e.w) / 2;
    let eDrawY = e.y - (eDrawH - e.h) / 2;
    drawAssetOrDefault(eDrawX, eDrawY, eDrawW, eDrawH, e.asset, '#EF4444');
  }

  // Projectiles
  for (let pr of projectiles) {
    drawAssetOrDefault(pr.x, pr.y, pr.w, pr.h, 'projectile', '#FBBF24');
  }

  // Player
  let playerImgName = 'player';
  if (state === 'GAMEOVER') playerImgName = 'playerDefeat';
  else if (powerupMode) {
      playerImgName = powerupTimer > 60 ? 'playerJetpack' : 'playerPropeller';
  } else if (shootModeTimer > 0) {
      playerImgName = 'playerShoot';
  } else if (player.vy < 0) {
      playerImgName = 'playerJump';
  }
  
  let pDrawW = player.w * 1.6;
  let pDrawH = player.h * 1.6;
  let pDrawX = player.x - (pDrawW - player.w) / 2;
  let pDrawY = player.y - (pDrawH - player.h) * 0.7; // align to bottom logic bound
  
  drawAssetOrDefault(pDrawX, pDrawY, pDrawW, pDrawH, playerImgName, '#2DD4BF');

  // Particles
  for (let p of particles) {
    ctx.globalAlpha = p.life < 0 ? 0 : p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1.0;

  ctx.restore();
}

let lastTime = 0;
let accumulator = 0;
const step = 1000 / 60;

function loop(time) {
  requestAnimationFrame(loop);
  
  if (!lastTime) lastTime = time;
  let dt = time - lastTime;
  if (dt > 100) dt = 100;
  lastTime = time;

  accumulator += dt;
  while (accumulator >= step) {
    update();
    accumulator -= step;
  }
  
  draw();
}

// Start
startGame();
requestAnimationFrame(loop);
