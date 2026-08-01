// Client-side Base64 PNG Data URL generator for Doodle Jump assets.
// Runs purely in browser using HTML5 Canvas - works 100% offline & inside KaiOS zip builds!

export interface AssetMeta {
  id: string;
  width: number;
  height: number;
}

export const ASSET_METAS: AssetMeta[] = [
  { id: 'doodle_left', width: 80, height: 80 },
  { id: 'doodle_right', width: 80, height: 80 },
  { id: 'doodle_shooting', width: 80, height: 80 },
  { id: 'doodle_pissed', width: 80, height: 80 },
  { id: 'doodle_propeller_1', width: 80, height: 95 },
  { id: 'doodle_propeller_2', width: 80, height: 95 },
  { id: 'doodle_jetpack_1', width: 90, height: 100 },
  { id: 'doodle_jetpack_2', width: 90, height: 100 },
  { id: 'doodle_spring_shoes', width: 80, height: 95 },
  { id: 'platform_green', width: 115, height: 32 },
  { id: 'platform_blue', width: 115, height: 32 },
  { id: 'platform_white', width: 115, height: 32 },
  { id: 'brown_platform_1', width: 115, height: 32 },
  { id: 'brown_platform_2', width: 115, height: 36 },
  { id: 'brown_platform_3', width: 115, height: 48 },
  { id: 'platform_red', width: 115, height: 32 },
  { id: 'spring_compressed', width: 36, height: 28 },
  { id: 'spring_full', width: 36, height: 50 },
  { id: 'trampoline', width: 50, height: 26 },
  { id: 'trampoline_down', width: 50, height: 20 },
  { id: 'propeller_hat', width: 44, height: 32 },
  { id: 'jetpack', width: 40, height: 52 },
  { id: 'spring_shoes', width: 46, height: 32 },
  { id: 'shield', width: 110, height: 110 },
  { id: 'green_flying_monster_1', width: 90, height: 70 },
  { id: 'green_flying_monster_2', width: 90, height: 70 },
  { id: 'monster_purple', width: 95, height: 80 },
  { id: 'monster_red', width: 90, height: 85 },
  { id: 'black_hole', width: 100, height: 100 },
  { id: 'ufo', width: 110, height: 110 },
  { id: 'projectile', width: 24, height: 24 },
  { id: 'bg_notebook', width: 400, height: 600 },
  { id: 'top_bar', width: 400, height: 60 },
  { id: 'pause_button', width: 40, height: 40 },
  { id: 'resume_button', width: 40, height: 40 },
  { id: 'resume_button_on', width: 40, height: 40 },
  { id: 'game_over_overlay', width: 320, height: 120 },
  { id: 'play_again_button', width: 180, height: 50 },
];

function drawDoodlerBase(ctx: CanvasRenderingContext2D, x: number, y: number, facingRight: boolean, isShooting = false, isDizzy = false) {
  ctx.save();
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#2b2b2b';
  ctx.fillStyle = '#8bc34a';

  const dir = facingRight ? 1 : -1;

  // 4 Stubby Legs
  ctx.fillStyle = '#7cb342';
  for (let i = 0; i < 4; i++) {
    const lx = x + (i - 1.5) * 11;
    const ly = y + 26;
    ctx.beginPath();
    ctx.ellipse(lx, ly, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Oval Body
  ctx.fillStyle = '#8bc34a';
  ctx.beginPath();
  ctx.ellipse(x, y, 24, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout / Nose
  ctx.beginPath();
  if (isShooting) {
    ctx.moveTo(x - 8, y - 20);
    ctx.quadraticCurveTo(x - 10, y - 42, x - 2, y - 42);
    ctx.lineTo(x + 2, y - 42);
    ctx.quadraticCurveTo(x + 10, y - 42, x + 8, y - 20);
  } else {
    const noseX = x + dir * 22;
    ctx.moveTo(x + dir * 12, y - 6);
    ctx.quadraticCurveTo(noseX + dir * 18, y - 4, noseX + dir * 18, y + 4);
    ctx.quadraticCurveTo(noseX + dir * 18, y + 12, x + dir * 12, y + 10);
  }
  ctx.fillStyle = '#8bc34a';
  ctx.fill();
  ctx.stroke();

  // Eyes
  const eyeY = y - 14;
  if (isDizzy) {
    for (const eyeX of [x - 10, x + 10]) {
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(eyeX - 4, eyeY - 4);
      ctx.lineTo(eyeX + 4, eyeY + 4);
      ctx.moveTo(eyeX + 4, eyeY - 4);
      ctx.lineTo(eyeX - 4, eyeY + 4);
      ctx.strokeStyle = '#d32f2f';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else if (isShooting) {
    for (const eyeX of [x - 10, x + 10]) {
      ctx.beginPath();
      ctx.arc(eyeX, eyeY - 2, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(eyeX, eyeY - 4, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#212121';
      ctx.fill();
    }
  } else {
    const eyeOffset1 = facingRight ? -4 : -14;
    const eyeOffset2 = facingRight ? 10 : 0;
    
    ctx.beginPath();
    ctx.arc(x + eyeOffset1, eyeY, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + eyeOffset1 + dir * 2, eyeY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#212121';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + eyeOffset2, eyeY, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + eyeOffset2 + dir * 2, eyeY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#212121';
    ctx.fill();
  }

  ctx.restore();
}

function renderAssetToCanvas(ctx: CanvasRenderingContext2D, assetId: string, meta: AssetMeta) {
  switch (assetId) {
    case 'doodle_left':
      drawDoodlerBase(ctx, 40, 42, false);
      break;

    case 'doodle_right':
      drawDoodlerBase(ctx, 40, 42, true);
      break;

    case 'doodle_shooting':
      drawDoodlerBase(ctx, 40, 48, true, true);
      break;

    case 'doodle_pissed':
      drawDoodlerBase(ctx, 40, 42, false, false, true);
      break;

    case 'doodle_propeller_1':
    case 'doodle_propeller_2': {
      drawDoodlerBase(ctx, 40, 52, true);
      ctx.save();
      ctx.fillStyle = '#fbc02d';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#2b2b2b';
      ctx.beginPath();
      ctx.arc(40, 28, 12, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(40, 16);
      ctx.lineTo(40, 8);
      ctx.stroke();
      ctx.fillStyle = '#e53935';
      if (assetId === 'doodle_propeller_1') {
        ctx.beginPath();
        ctx.ellipse(30, 8, 10, 3, -0.2, 0, Math.PI * 2);
        ctx.ellipse(50, 8, 10, 3, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(40, 8, 14, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'doodle_jetpack_1':
    case 'doodle_jetpack_2': {
      ctx.save();
      ctx.fillStyle = '#9e9e9e';
      ctx.strokeStyle = '#212121';
      ctx.lineWidth = 2.5;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(14, 30, 14, 32, 6);
        ctx.roundRect(26, 30, 14, 32, 6);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(14, 30, 14, 32);
        ctx.strokeRect(14, 30, 14, 32);
        ctx.fillRect(26, 30, 14, 32);
        ctx.strokeRect(26, 30, 14, 32);
      }
      ctx.fillStyle = '#d32f2f';
      ctx.beginPath();
      ctx.arc(21, 30, 7, Math.PI, 0);
      ctx.arc(33, 30, 7, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = assetId === 'doodle_jetpack_1' ? '#ff9800' : '#ff5722';
      const flameLen = assetId === 'doodle_jetpack_1' ? 24 : 32;
      ctx.beginPath();
      ctx.moveTo(16, 62);
      ctx.lineTo(21, 62 + flameLen);
      ctx.lineTo(26, 62);
      ctx.moveTo(28, 62);
      ctx.lineTo(33, 62 + flameLen);
      ctx.lineTo(38, 62);
      ctx.fill();
      ctx.restore();

      drawDoodlerBase(ctx, 52, 45, true);
      break;
    }

    case 'doodle_spring_shoes': {
      drawDoodlerBase(ctx, 40, 38, true);
      ctx.save();
      ctx.strokeStyle = '#424242';
      ctx.lineWidth = 3;
      for (const sx of [25, 55]) {
        ctx.beginPath();
        ctx.moveTo(sx - 8, 64);
        ctx.lineTo(sx + 8, 64);
        ctx.lineTo(sx - 6, 70);
        ctx.lineTo(sx + 6, 76);
        ctx.lineTo(sx - 8, 82);
        ctx.lineTo(sx + 8, 82);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'platform_green': {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1b5e20';
      ctx.fillStyle = '#7cb342';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(4, 4, 107, 24, 12); else ctx.rect(4, 4, 107, 24);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#558b2f';
      ctx.lineWidth = 2;
      for (let i = 15; i < 100; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i, 8);
        ctx.lineTo(i + 4, 18);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'platform_blue': {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0d47a1';
      ctx.fillStyle = '#29b6f6';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(4, 4, 107, 24, 12); else ctx.rect(4, 4, 107, 24);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(25, 16); ctx.lineTo(15, 16); ctx.lineTo(19, 12); ctx.moveTo(15, 16); ctx.lineTo(19, 20);
      ctx.moveTo(90, 16); ctx.lineTo(100, 16); ctx.lineTo(96, 12); ctx.moveTo(100, 16); ctx.lineTo(96, 20);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'platform_white': {
      ctx.save();
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#78909c';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(4, 4, 107, 24, 12); else ctx.rect(4, 4, 107, 24);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#b0bec5';
      ctx.beginPath();
      ctx.arc(35, 12, 8, 0, Math.PI * 2);
      ctx.arc(58, 10, 10, 0, Math.PI * 2);
      ctx.arc(80, 12, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'brown_platform_1':
    case 'brown_platform_2':
    case 'brown_platform_3': {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#3e2723';
      ctx.fillStyle = '#8d6e63';

      if (assetId === 'brown_platform_1') {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(4, 4, 107, 24, 12); else ctx.rect(4, 4, 107, 24);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#271510';
        ctx.beginPath();
        ctx.moveTo(50, 4); ctx.lineTo(54, 12); ctx.lineTo(51, 18); ctx.lineTo(56, 28);
        ctx.stroke();
      } else if (assetId === 'brown_platform_2') {
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(4, 4, 50, 24, 8);
          ctx.roundRect(61, 8, 50, 24, 8);
        } else {
          ctx.rect(4, 4, 50, 24);
          ctx.rect(61, 8, 50, 24);
        }
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(6, 6, 40, 20, 6);
          ctx.roundRect(50, 16, 25, 20, 4);
          ctx.roundRect(80, 24, 30, 18, 5);
        } else {
          ctx.rect(6, 6, 40, 20);
          ctx.rect(50, 16, 25, 20);
          ctx.rect(80, 24, 30, 18);
        }
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'platform_red': {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#b71c1c';
      ctx.fillStyle = '#ef5350';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(4, 4, 107, 24, 12); else ctx.rect(4, 4, 107, 24);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ffcdd2';
      ctx.lineWidth = 3;
      for (let i = 16; i < 100; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 6);
        ctx.lineTo(i - 8, 26);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'spring_compressed': {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#37474f';
      ctx.fillStyle = '#b0bec5';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(4, 22, 28, 5, 2); else ctx.rect(4, 22, 28, 5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, 22); ctx.lineTo(28, 18); ctx.lineTo(8, 14); ctx.lineTo(28, 10); ctx.lineTo(8, 6);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'spring_full': {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#37474f';
      ctx.fillStyle = '#b0bec5';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(4, 44, 28, 5, 2); else ctx.rect(4, 44, 28, 5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, 44); ctx.lineTo(28, 36); ctx.lineTo(8, 28); ctx.lineTo(28, 20); ctx.lineTo(8, 12); ctx.lineTo(28, 4);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'trampoline':
    case 'trampoline_down': {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#212121';
      ctx.fillStyle = '#e53935';
      const pressed = assetId === 'trampoline_down';
      const topY = pressed ? 12 : 6;
      ctx.beginPath();
      ctx.moveTo(4, 8);
      ctx.quadraticCurveTo(25, topY + 10, 46, 8);
      ctx.lineTo(46, topY + 6);
      ctx.quadraticCurveTo(25, topY + 14, 4, topY + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, topY + 8); ctx.lineTo(4, 24);
      ctx.moveTo(42, topY + 8); ctx.lineTo(46, 24);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'propeller_hat': {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2b2b2b';
      ctx.fillStyle = '#fbc02d';
      ctx.beginPath();
      ctx.arc(22, 24, 14, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(22, 10); ctx.lineTo(22, 4);
      ctx.stroke();
      ctx.fillStyle = '#e53935';
      ctx.beginPath();
      ctx.ellipse(22, 4, 16, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'jetpack': {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#212121';
      ctx.fillStyle = '#b0bec5';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(6, 12, 12, 34, 5);
        ctx.roundRect(22, 12, 12, 34, 5);
      } else {
        ctx.rect(6, 12, 12, 34);
        ctx.rect(22, 12, 12, 34);
      }
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e53935';
      ctx.beginPath();
      ctx.arc(12, 12, 6, Math.PI, 0);
      ctx.arc(28, 12, 6, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'projectile': {
      ctx.save();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#e65100'; ctx.fillStyle = '#ff9800';
      ctx.beginPath(); ctx.arc(12, 12, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      break;
    }

    case 'monster_purple': {
      ctx.save();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#311b92';
      ctx.fillStyle = '#7e57c2';
      ctx.beginPath();
      ctx.ellipse(47, 42, 36, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath(); ctx.arc(47, 34, 14, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(47, 34, 6, 0, Math.PI * 2); ctx.fillStyle = '#d50000'; ctx.fill();
      ctx.beginPath(); ctx.arc(47, 54, 12, 0, Math.PI); ctx.stroke();
      ctx.restore();
      break;
    }

    case 'bg_notebook': {
      ctx.save();
      ctx.fillStyle = '#f7f6ed';
      ctx.fillRect(0, 0, 400, 600);
      ctx.strokeStyle = '#e0ecf8';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 400; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
      }
      for (let y = 0; y <= 600; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(400, y); ctx.stroke();
      }
      ctx.strokeStyle = '#ffcdd2'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(40, 600); ctx.stroke();
      ctx.restore();
      break;
    }

    default:
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(0, 0, meta.width, meta.height);
      break;
  }
}

const base64Cache: Record<string, string> = {};

export function getAssetCanvas(assetId: string): HTMLCanvasElement | null {
  const meta = ASSET_METAS.find((a) => a.id === assetId) || { id: assetId, width: 80, height: 80 };

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = meta.width;
    canvas.height = meta.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      renderAssetToCanvas(ctx, assetId, meta);
      return canvas;
    }
  }

  return null;
}

export function getAssetDataUrl(assetId: string): string {
  if (base64Cache[assetId]) {
    return base64Cache[assetId];
  }

  const meta = ASSET_METAS.find((a) => a.id === assetId) || { id: assetId, width: 80, height: 80 };

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = meta.width;
    canvas.height = meta.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      renderAssetToCanvas(ctx, assetId, meta);
      const dataUrl = canvas.toDataURL('image/png');
      base64Cache[assetId] = dataUrl;
      return dataUrl;
    }
  }

  return '';
}

// Pre-populate cache for all core assets
export function preloadAllBase64Assets(): Record<string, string> {
  for (const meta of ASSET_METAS) {
    getAssetDataUrl(meta.id);
  }
  return base64Cache;
}
