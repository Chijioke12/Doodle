import React, { useEffect, useState } from 'react';
import { SpriteAtlas } from '../types';
import { Download, FileCode, Layers, Info } from 'lucide-react';

export const SpriteSheetView: React.FC = () => {
  const [atlas, setAtlas] = useState<SpriteAtlas | null>(null);
  const [hoveredFrameKey, setHoveredFrameKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/assets/spritesheet.json')
      .then((res) => res.json())
      .then((data) => {
        setAtlas(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load sprite sheet atlas', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Packed Sprite Sheet & Atlas
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Consolidated dynamic PNG sprite sheet generated via backend Node Canvas with automated UV frame coordinates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/assets/spritesheet.json"
            download="spritesheet.json"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileCode className="w-4 h-4" /> Download JSON Atlas
          </a>
          <a
            href="/api/assets/spritesheet.png"
            download="spritesheet.png"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Download Sprite Sheet
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Sprite Sheet Canvas View */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 font-semibold text-slate-800 text-sm flex items-center justify-between">
            <span>Sprite Sheet Image Preview</span>
            {atlas?.meta?.size && (
              <span className="text-xs font-mono text-slate-500">
                {atlas.meta.size.w} × {atlas.meta.size.h} px
              </span>
            )}
          </div>

          <div className="p-6 bg-[#f7f6ed] bg-[radial-gradient(#e0ecf8_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center min-h-[350px] overflow-auto">
            {loading ? (
              <div className="text-slate-500 text-sm animate-pulse">Generating backend sprite sheet...</div>
            ) : (
              <div className="relative inline-block border-2 border-slate-800/20 rounded-lg shadow-md overflow-hidden bg-white/40">
                <img
                  src="/api/assets/spritesheet.png"
                  alt="Packed Doodle Jump Sprite Sheet"
                  className="max-w-full h-auto block"
                />

                {/* Frame Overlays */}
                {atlas?.frames &&
                  Object.entries(atlas.frames).map(([key, itemVal]) => {
                    const item = itemVal as { frame: { x: number; y: number; w: number; h: number } };
                    const isHovered = hoveredFrameKey === key;
                    const { x, y, w, h } = item.frame;
                    return (
                      <div
                        key={key}
                        onMouseEnter={() => setHoveredFrameKey(key)}
                        onMouseLeave={() => setHoveredFrameKey(null)}
                        className={`absolute cursor-pointer transition-all ${
                          isHovered
                            ? 'border-2 border-emerald-500 bg-emerald-500/20 z-10 scale-105'
                            : 'border border-slate-400/30 hover:border-emerald-400 hover:bg-emerald-400/10'
                        }`}
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          width: `${w}px`,
                          height: `${h}px`,
                        }}
                        title={`${key}: ${w}x${h} @ (${x}, ${y})`}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Frame Atlas Data List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-100 font-semibold text-slate-800 text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600" />
            Sprite Frame Coordinates
          </div>

          <div className="p-3 overflow-y-auto divide-y divide-slate-100 flex-1 font-mono text-xs">
            {atlas?.frames &&
              Object.entries(atlas.frames).map(([key, itemVal]) => {
                const item = itemVal as { frame: { x: number; y: number; w: number; h: number } };
                const isHovered = hoveredFrameKey === key;
                return (
                  <div
                    key={key}
                    onMouseEnter={() => setHoveredFrameKey(key)}
                    onMouseLeave={() => setHoveredFrameKey(null)}
                    className={`p-2.5 rounded-lg transition-colors cursor-pointer ${
                      isHovered ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 text-xs truncate">{key}</div>
                    <div className="text-[11px] text-slate-500 mt-1 grid grid-cols-2 gap-1">
                      <span>x: {item.frame.x}px</span>
                      <span>y: {item.frame.y}px</span>
                      <span>w: {item.frame.w}px</span>
                      <span>h: {item.frame.h}px</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
