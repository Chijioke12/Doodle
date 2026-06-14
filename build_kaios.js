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

    console.log('Copying visual assets...');
    await fs.copy(path.join(__dirname, 'assets'), ASSETS_DIR);

    console.log('Processing Audio (WAV -> OGG)...');
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

    for (const wav of wavFiles) {
      const input = path.join(originalSfxDir, wav);
      
      if (hasFfmpeg) {
        const output = path.join(SFX_DIR, wav.replace('.wav', '.ogg'));
        console.log(`  Converting ${wav} -> ${path.basename(output)}`);
        execSync(`ffmpeg -i "${input}" -acodec libvorbis "${output}" -y`, { stdio: 'ignore' });
      } else {
        console.log(`  Copying ${wav} without conversion...`);
        await fs.copy(input, path.join(SFX_DIR, wav));
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
    if (hasFfmpeg) {
      mainJs = mainJs.replace(/\.wav/g, '.ogg');
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

    console.log('Generating KaiOS icons (56x56 & 112x112) using sharp...');
    const iconSvg = path.join(__dirname, 'assets', 'alien-monster.svg');
    const sharp = require('sharp');

    try {
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
    } catch (e) {
      console.warn('\\n⚠️  Sharp icon generation failed.');
      console.warn('  Will copy the SVG as the icon instead.');
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
