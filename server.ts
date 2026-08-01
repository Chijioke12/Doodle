import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ASSET_CATALOG, generateAssetCanvas, generateSpriteSheet } from './src/server/canvasGenerator';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for OmniSD package download
  app.get(['/doodle jump.zip', '/doodle-jump.zip', '/api/download-omnisd'], (req, res) => {
    const zipPath = path.resolve(process.cwd(), 'doodle jump.zip');
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, 'doodle jump.zip');
    } else {
      res.status(404).json({ error: 'OmniSD package not found. Run "npm run build" to generate "doodle jump.zip".' });
    }
  });

  // API Route 1: Get asset catalog metadata
  app.get('/api/assets', (req, res) => {
    const assetsWithUrls = ASSET_CATALOG.map((asset) => ({
      ...asset,
      url: `/api/assets/${asset.id}.png`,
    }));
    res.json({
      game: 'Doodle Jump',
      version: '1.0',
      totalAssets: assetsWithUrls.length,
      assets: assetsWithUrls,
    });
  });

  // API Route 2: Get Sprite Sheet PNG
  app.get('/api/assets/spritesheet.png', (req, res) => {
    try {
      const { buffer } = generateSpriteSheet();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (err: any) {
      console.error('Error generating sprite sheet:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route 3: Get Sprite Sheet JSON Atlas
  app.get('/api/assets/spritesheet.json', (req, res) => {
    try {
      const { atlas } = generateSpriteSheet();
      res.json(atlas);
    } catch (err: any) {
      console.error('Error generating sprite sheet atlas:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route 4: Get Individual Asset Image by ID
  app.get('/api/assets/:id.png', (req, res) => {
    const { id } = req.params;
    const asset = ASSET_CATALOG.find((a) => a.id === id);

    if (!asset) {
      return res.status(404).json({ error: `Asset '${id}' not found` });
    }

    try {
      const buffer = generateAssetCanvas(id);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (err: any) {
      console.error(`Error generating image for ${id}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route 5: Get Base64 Compiled Assets JSON Pack
  const handleBase64Assets = (req: express.Request, res: express.Response) => {
    try {
      const compiledAssets: Record<string, any> = {};

      for (const asset of ASSET_CATALOG) {
        const buffer = generateAssetCanvas(asset.id);
        const base64Data = buffer.toString('base64');
        compiledAssets[asset.id] = {
          id: asset.id,
          name: asset.name,
          category: asset.category,
          dimensions: { width: asset.width, height: asset.height },
          mimeType: 'image/png',
          dataUrl: `data:image/png;base64,${base64Data}`,
        };
      }

      const { buffer: spriteBuffer, atlas } = generateSpriteSheet();

      res.setHeader('Content-Type', 'application/json');
      res.json({
        game: 'Doodle Jump',
        version: '1.0',
        generatedAt: new Date().toISOString(),
        totalAssets: ASSET_CATALOG.length,
        assets: compiledAssets,
        spritesheet: {
          mimeType: 'image/png',
          dataUrl: `data:image/png;base64,${spriteBuffer.toString('base64')}`,
          atlas,
        },
      });
    } catch (err: any) {
      console.error('Error compiling base64 assets:', err);
      res.status(500).json({ error: err.message });
    }
  };

  app.get('/api/assets/base64.json', handleBase64Assets);
  app.get('/api/assets/base64', handleBase64Assets);

  // API Route 6: Export KaiOS 2.5 OmniSD Package (.zip)
  app.get('/api/download/kaios-omnisd.zip', async (req, res) => {
    try {
      const JSZip = (await import('jszip')).default;
      const fs = await import('fs/promises');

      const appZip = new JSZip();

      // Read manifest.webapp
      let manifestWebapp = '';
      try {
        manifestWebapp = await fs.readFile(path.join(process.cwd(), 'public/manifest.webapp'), 'utf-8');
      } catch {
        manifestWebapp = JSON.stringify({
          name: "Doodle Jump KaiOS",
          description: "Doodle Jump for KaiOS 2.5 with Phaser 3.24.1 & C asm.js Engine",
          version: "1.0.0",
          launch_path: "/index.html",
          type: "web"
        }, null, 2);
      }
      appZip.file('manifest.webapp', manifestWebapp);

      // Read Phaser 3.24.1 lib file
      try {
        const phaserBuf = await fs.readFile(path.join(process.cwd(), 'public/lib/phaser-3.24.1.min.js'));
        appZip.file('lib/phaser-3.24.1.min.js', phaserBuf);
      } catch (e) {
        console.warn('Phaser file missing for zip:', e);
      }

      // Read C Engine asm.js files
      const asmjsDir = path.join(process.cwd(), 'public/kaios_asmjs');
      try {
        const files = await fs.readdir(asmjsDir);
        for (const file of files) {
          const content = await fs.readFile(path.join(asmjsDir, file));
          appZip.file(`kaios_asmjs/${file}`, content);
        }
      } catch (e) {
        console.warn('asmjs files read error:', e);
      }

      const appZipBuffer = await appZip.generateAsync({ type: 'nodebuffer' });

      // Outer OmniSD container
      const outerZip = new JSZip();
      outerZip.file('application.zip', appZipBuffer);
      outerZip.file('update.webapp', '');
      outerZip.file('metadata.json', JSON.stringify({
        version: 1,
        manifestURL: 'app://doodle_jump_c_engine/manifest.webapp'
      }, null, 2));

      const finalBuffer = await outerZip.generateAsync({ type: 'nodebuffer' });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="doodle_jump_kaios_omnisd.zip"');
      res.send(finalBuffer);
    } catch (err: any) {
      console.error('Error creating OmniSD zip package:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
