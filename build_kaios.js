import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import babel from '@babel/core';
import { execSync } from 'child_process';
import esbuild from 'esbuild';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const SFX_DIR = path.join(DIST_DIR, 'sfx');

async function build() {
  try {
    console.log('Cleaning dist directory...');
    await fs.remove(DIST_DIR);
    await fs.ensureDir(ASSETS_DIR);
    await fs.ensureDir(SFX_DIR);

    console.log('Repairing source SVG dimensions (for KaiOS compatibility)...');
    const originalAssetsDir = path.join(__dirname, 'assets');
    const sourceFiles = await fs.readdir(originalAssetsDir);
    for (const file of sourceFiles) {
      if (file.endsWith('.svg')) {
        const filePath = path.join(originalAssetsDir, file);
        let content = await fs.readFile(filePath, 'utf8');
        const firstTagMatch = content.match(/<svg([^>]+)>/);
        if (firstTagMatch) {
          let tagAttrs = firstTagMatch[1];
          const vbMatch = tagAttrs.match(/viewBox\s*=\s*["']([^"']+)["']/);
          if (vbMatch) {
            const parts = vbMatch[1].trim().split(/\s+/).map(Number);
            if (parts.length === 4) {
              const w = parts[2];
              const h = parts[3];
              tagAttrs = tagAttrs.replace(/\bwidth\s*=\s*["'][^"']*["']/g, '');
              tagAttrs = tagAttrs.replace(/\bheight\s*=\s*["'][^"']*["']/g, '');
              tagAttrs = tagAttrs.replace(/\s+/g, ' ').trim();
              const newTag = `<svg width="${w}" height="${h}" ${tagAttrs}>`;
              content = content.replace(firstTagMatch[0], newTag);
              await fs.writeFile(filePath, content, 'utf8');
            }
          }
        }
      }
    }

    console.log('Copying visual assets...');
    await fs.copy(originalAssetsDir, ASSETS_DIR);

    console.log('Processing Audio (WAV -> OGG/MP3)...');
    const originalSfxDir = path.join(__dirname, 'sfx');
    const wavFiles = (await fs.readdir(originalSfxDir)).filter(f => f.endsWith('.wav'));
    
    // Check if FFmpeg is installed
    let hasFfmpeg = false;
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
      hasFfmpeg = true;
    } catch (e) {
      console.warn('\n⚠️  FFmpeg not found in PATH.');
      console.warn('  Audio will remain as .wav instead of being converted to .ogg.');
      console.warn('  For full KaiOS compatibility, install FFmpeg on your system.\n');
    }

    const convertedFiles = [];
    for (const wav of wavFiles) {
      const input = path.join(originalSfxDir, wav);
      let success = false;
      const targetOgg = wav.replace('.wav', '.ogg');
      const outputOgg = path.join(SFX_DIR, targetOgg);
      
      if (hasFfmpeg) {
        const commands = [
          `ffmpeg -i "${input}" -acodec libvorbis "${outputOgg}" -y`,
          `ffmpeg -i "${input}" -acodec vorbis "${outputOgg}" -y`,
          `ffmpeg -i "${input}" -c:a libopus "${outputOgg}" -y`,
          `ffmpeg -i "${input}" -c:a opus "${outputOgg}" -y`,
          `ffmpeg -i "${input}" "${outputOgg}" -y`
        ];

        for (const cmd of commands) {
          try {
            execSync(cmd, { stdio: 'ignore' });
            success = true;
            break;
          } catch (e) {}
        }
      }

      if (success) {
        console.log(`  ✅ Converted ${wav} -> ${targetOgg}`);
        convertedFiles.push({ original: wav, target: targetOgg });
      } else {
        // Try fallback to MP3
        let mp3Success = false;
        const targetMp3 = wav.replace('.wav', '.mp3');
        const outputMp3 = path.join(SFX_DIR, targetMp3);
        if (hasFfmpeg) {
          const mp3Commands = [
            `ffmpeg -i "${input}" -acodec libmp3lame "${outputMp3}" -y`,
            `ffmpeg -i "${input}" "${outputMp3}" -y`
          ];
          for (const cmd of mp3Commands) {
            try {
              execSync(cmd, { stdio: 'ignore' });
              mp3Success = true;
              break;
            } catch (e) {}
          }
        }

        if (mp3Success) {
          console.log(`  ✅ Converted ${wav} -> ${targetMp3} (MP3 fallback)`);
          convertedFiles.push({ original: wav, target: targetMp3 });
        } else {
          console.log(`  ⚠️ Copying original WAV for ${wav}`);
          await fs.copy(input, path.join(SFX_DIR, wav));
        }
      }
    }

    console.log('Bundling JavaScript...');
    await esbuild.build({
      entryPoints: [path.join(__dirname, 'game.js')],
      bundle: true,
      outfile: path.join(DIST_DIR, 'game.bundle.js'),
      format: 'iife' // IIFE for traditional script loading without ES modules
    });

    console.log('Transpiling JS for KaiOS (Firefox 48)...');
    let mainJs = await fs.readFile(path.join(DIST_DIR, 'game.bundle.js'), 'utf8');
    
    // Switch the .wav references to .ogg if conversion happened
    for (const item of convertedFiles) {
      const regex = new RegExp(item.original, 'g');
      mainJs = mainJs.replace(regex, item.target);
    }

    const babelResult = babel.transformSync(mainJs, {
      presets: [
        ['@babel/preset-env', {
          targets: { firefox: '48' }
        }]
      ]
    });
    
    await fs.writeFile(path.join(DIST_DIR, 'game.js'), babelResult.code);
    await fs.remove(path.join(DIST_DIR, 'game.bundle.js')); // Cleanup intermediate file

    console.log('Copying CSS...');
    await fs.copy(path.join(__dirname, 'style.css'), path.join(DIST_DIR, 'style.css'));
    await fs.copy(path.join(__dirname, 'controls.css'), path.join(DIST_DIR, 'controls.css'));

    console.log('Generating KaiOS icons (56x56 & 112x112)...');
    const iconSvg = path.join(__dirname, 'assets', 'alien-monster.svg');
    let iconGenerated = false;

    // Attempt 1: sharp
    try {
      const sharp = require('sharp');
      const circleSvgMask56 = Buffer.from('<svg><circle cx="28" cy="28" r="28" /></svg>');
      await sharp(iconSvg)
        .resize(56, 56)
        .composite([{ input: circleSvgMask56, blend: 'dest-in' }])
        .png()
        .toFile(path.join(ASSETS_DIR, 'icon-56.png'));

      const circleSvgMask112 = Buffer.from('<svg><circle cx="56" cy="56" r="56" /></svg>');
      await sharp(iconSvg)
        .resize(112, 112)
        .composite([{ input: circleSvgMask112, blend: 'dest-in' }])
        .png()
        .toFile(path.join(ASSETS_DIR, 'icon-112.png'));
      
      iconGenerated = true;
      console.log('  ✅ Icons generated using sharp.');
    } catch (e) {
      console.warn('\\n⚠️  Sharp icon generation failed or not available.');
    }

    // Attempt 2: ImageMagick
    if (!iconGenerated) {
      try {
        console.log('  Attempting to generate icons using ImageMagick...');
        execSync(`magick "${iconSvg}" -background none -resize 56x56 -gravity center -extent 56x56 \\( +clone -alpha extract -draw "fill black polygon 0,0 0,56 56,56 56,0 fill white circle 28,28 28,0" \\) -alpha off -compose CopyOpacity -composite "${path.join(ASSETS_DIR, 'icon-56.png')}"`, { stdio: 'ignore' });
        execSync(`magick "${iconSvg}" -background none -resize 112x112 -gravity center -extent 112x112 \\( +clone -alpha extract -draw "fill black polygon 0,0 0,112 112,112 112,0 fill white circle 56,56 56,0" \\) -alpha off -compose CopyOpacity -composite "${path.join(ASSETS_DIR, 'icon-112.png')}"`, { stdio: 'ignore' });
        iconGenerated = true;
        console.log('  ✅ Icons generated using ImageMagick.');
      } catch (e) {
        console.warn('  ⚠️ ImageMagick not found or failed.');
      }
    }

    // Attempt 3: Fallback (copy SVG as .png)
    if (!iconGenerated) {
      console.warn('  ⚠️ Will copy the SVG as the icon instead (fallback).');
      await fs.copy(iconSvg, path.join(ASSETS_DIR, 'icon-56.png'));
      await fs.copy(iconSvg, path.join(ASSETS_DIR, 'icon-112.png'));
    }

    console.log('Preparing index.html...');
    let indexHtml = await fs.readFile(path.join(__dirname, 'index.html'), 'utf8');
    // Remove the type="module" to allow our bundled IIFE to run perfectly in legacy Firefox environments
    indexHtml = indexHtml.replace(/type="module"/g, '');
    // Remove virtual DPAD since KaiOS uses hardware keys
    indexHtml = indexHtml.replace(/<link rel="stylesheet" href="controls\.css">\s*/, '');
    indexHtml = indexHtml.replace(/<div class="controls" id="dpadControls">[\s\S]*?<\/div>\s*<\/div>/, '');
    await fs.writeFile(path.join(DIST_DIR, 'index.html'), indexHtml);

    console.log('Updating manifest.webapp...');
    const manifest = await fs.readJson(path.join(__dirname, 'manifest.webapp'));
    manifest.icons = {
      "56": "/assets/icon-56.png",
      "112": "/assets/icon-112.png"
    };
    await fs.writeJson(path.join(DIST_DIR, 'manifest.webapp'), manifest, { spaces: 2 });

    console.log('Creating application.zip...');
    await createZip(DIST_DIR, path.join(__dirname, 'application.zip'));

    console.log('Creating OmniSD package...');
    const OMNISD_DIR = path.join(__dirname, 'omnisd_package');
    await fs.ensureDir(OMNISD_DIR);
    await fs.move(path.join(__dirname, 'application.zip'), path.join(OMNISD_DIR, 'application.zip'));
    
    const cleanName = manifest.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const metadata = {
      version: 1,
      manifestURL: `app://${cleanName}.local/manifest.webapp`
    };
    await fs.writeJson(path.join(OMNISD_DIR, 'metadata.json'), metadata, { spaces: 2 });
    await fs.writeFile(path.join(OMNISD_DIR, 'update.webapp'), '');

    await createZip(OMNISD_DIR, path.join(__dirname, 'platformer-omnisd.zip'));
    await fs.remove(OMNISD_DIR);

    console.log('\n✅ Build completed successfully!');
    console.log('➡️ Final OmniSD package ready: platformer-omnisd.zip\n');
  } catch (err) {
    console.error('\n❌ Build failed:', err);
    process.exit(1);
  }
}

function createZip(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const createArchiver = archiver.create || archiver;
    const archive = typeof createArchiver === 'function' ? createArchiver('zip', { zlib: { level: 9 } }) : new archiver.ZipArchive({ zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

build();
