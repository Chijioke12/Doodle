import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ASSET_CATALOG, generateAssetCanvas, generateSpriteSheet } from './src/server/canvasGenerator';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
