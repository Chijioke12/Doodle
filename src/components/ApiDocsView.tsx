import React, { useState } from 'react';
import { AssetInfo } from '../types';
import { Code2, Copy, Check, Terminal, FileJson } from 'lucide-react';

interface Props {
  assets: AssetInfo[];
}

export const ApiDocsView: React.FC<Props> = ({ assets }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const htmlSnippet = `<img src="${origin}/api/assets/doodle_left.png" alt="Doodler" />`;

  const jsFetchSnippet = `// Load image from backend Node Canvas endpoint
const img = new Image();
img.src = '${origin}/api/assets/doodle_left.png';
img.onload = () => {
  ctx.drawImage(img, 100, 100);
};`;

  const spriteSheetSnippet = `// Load packed sprite sheet and atlas
const response = await fetch('${origin}/api/assets/spritesheet.json');
const atlas = await response.json();

const spriteSheetImg = new Image();
spriteSheetImg.src = '${origin}/api/assets/spritesheet.png';
spriteSheetImg.onload = () => {
  const frame = atlas.frames['doodle_left'].frame;
  ctx.drawImage(
    spriteSheetImg,
    frame.x, frame.y, frame.w, frame.h, // Source UV
    100, 100, frame.w, frame.h          // Target Canvas
  );
};`;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-600" />
          Backend Node Canvas API Integration
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Every asset is generated directly on demand via backend Node.js <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">@napi-rs/canvas</code> with crisp transparency, proper HTTP caching headers, and PNG encoding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HTML & Image Tag Integration */}
        <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-xs">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 font-mono">
              <Code2 className="w-4 h-4 text-emerald-400" /> HTML Image Usage
            </span>
            <button
              onClick={() => copyToClipboard(htmlSnippet, 'html')}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              {copiedCode === 'html' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto">{htmlSnippet}</pre>
        </div>

        {/* HTML5 Canvas JS Code */}
        <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-xs">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 font-mono">
              <Code2 className="w-4 h-4 text-emerald-400" /> Canvas Draw Image
            </span>
            <button
              onClick={() => copyToClipboard(jsFetchSnippet, 'js')}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              {copiedCode === 'js' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto">{jsFetchSnippet}</pre>
        </div>

        {/* Sprite Sheet UV Coordinates Code */}
        <div className="lg:col-span-2 bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-xs">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 font-mono">
              <Code2 className="w-4 h-4 text-emerald-400" /> Sprite Sheet UV Rendering
            </span>
            <button
              onClick={() => copyToClipboard(spriteSheetSnippet, 'sheet')}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              {copiedCode === 'sheet' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-amber-200 overflow-x-auto leading-relaxed">{spriteSheetSnippet}</pre>
        </div>
      </div>

      {/* Live JSON Response Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 font-semibold text-slate-800 text-sm flex items-center gap-2">
            <FileJson className="w-4 h-4 text-emerald-600" />
            Asset Catalog Endpoint (<code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">/api/assets</code>)
          </div>
          <div className="p-4 bg-slate-900 text-slate-200 font-mono text-xs overflow-y-auto flex-1">
            <pre>{JSON.stringify({ game: 'Doodle Jump', version: '1.0', totalAssets: assets.length, assets: assets.slice(0, 2) }, null, 2)}</pre>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 font-semibold text-slate-800 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-emerald-600" />
              Compiled Base64 JSON Asset Pack (<code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">/api/assets/base64.json</code>)
            </span>
            <a
              href="/api/assets/base64.json"
              target="_blank"
              rel="noreferrer"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded-md transition-colors"
            >
              Open JSON
            </a>
          </div>
          <div className="p-4 bg-slate-900 text-slate-200 font-mono text-xs overflow-y-auto flex-1">
            <pre>{JSON.stringify({
              game: 'Doodle Jump',
              version: '1.0',
              generatedAt: new Date().toISOString(),
              totalAssets: assets.length,
              assets: {
                doodle_left: {
                  id: 'doodle_left',
                  name: 'Doodler Facing Left',
                  category: 'doodler',
                  dimensions: { width: 80, height: 80 },
                  mimeType: 'image/png',
                  dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHe...',
                }
              },
              spritesheet: {
                mimeType: 'image/png',
                dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABAAAAAMACAYAAADg0b0s...',
              }
            }, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
