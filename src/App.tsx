import React, { useEffect, useState } from 'react';
import { AssetInfo } from './types';
import { AssetGallery } from './components/AssetGallery';
import { SpriteSheetView } from './components/SpriteSheetView';
import { PhaserGame } from './components/PhaserGame';
import { KaiOSGame } from './components/KaiOSGame';
import { GameDemo } from './components/GameDemo';
import { ApiDocsView } from './components/ApiDocsView';
import { AssetModal } from './components/AssetModal';
import {
  Layers,
  Gamepad2,
  Code2,
  Image as ImageIcon,
  Sparkles,
  Download,
  Server,
  Zap,
  FileJson,
} from 'lucide-react';

export default function App() {
  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'phaser' | 'kaios' | 'gallery' | 'spritesheet' | 'game' | 'docs'>('kaios');
  const [selectedAsset, setSelectedAsset] = useState<AssetInfo | null>(null);

  useEffect(() => {
    fetch('/api/assets')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.assets) {
          setAssets(data.assets);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch backend canvas asset catalog', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md font-extrabold text-xl">
              DJ
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight flex items-center gap-2">
                Doodle Jump Phaser 3 Engine
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Node.js Canvas + Phaser
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Full Phaser 3 game with Android browser touch & gyroscope motion support.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/assets/base64.json"
              download="doodle_jump_assets_base64.json"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              title="Download compiled Base64 JSON asset pack"
            >
              <FileJson className="w-3.5 h-3.5" /> Base64 JSON Pack
            </a>

            <a
              href="/api/assets/spritesheet.png"
              download="doodle_jump_spritesheet.png"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Full Sprite Sheet
            </a>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-600 font-mono">
              <Server className="w-3.5 h-3.5 text-emerald-600" />
              <span>Express API Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('kaios')}
            className={`py-3 px-4 font-semibold text-xs md:text-sm border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'kaios'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-600" /> KaiOS & C Engine (asm.js)
          </button>

          <button
            onClick={() => setActiveTab('phaser')}
            className={`py-3 px-4 font-semibold text-xs md:text-sm border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'phaser'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-600" /> Phaser 3 Game (Android)
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-3 px-4 font-semibold text-xs md:text-sm border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'gallery'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Asset Catalog ({assets.length})
          </button>

          <button
            onClick={() => setActiveTab('spritesheet')}
            className={`py-3 px-4 font-semibold text-xs md:text-sm border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'spritesheet'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" /> Sprite Sheet & Atlas
          </button>

          <button
            onClick={() => setActiveTab('game')}
            className={`py-3 px-4 font-semibold text-xs md:text-sm border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'game'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gamepad2 className="w-4 h-4" /> Lightweight Demo
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`py-3 px-4 font-semibold text-xs md:text-sm border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'docs'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" /> API & Code Integration
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
            <Sparkles className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Generating backend Node Canvas graphics...</p>
          </div>
        ) : (
          <>
            {activeTab === 'kaios' && <KaiOSGame />}
            {activeTab === 'phaser' && <PhaserGame />}
            {activeTab === 'gallery' && (
              <AssetGallery assets={assets} onSelectAsset={(asset) => setSelectedAsset(asset)} />
            )}
            {activeTab === 'spritesheet' && <SpriteSheetView />}
            {activeTab === 'game' && <GameDemo />}
            {activeTab === 'docs' && <ApiDocsView assets={assets} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>Powered by Phaser 3, Node.js Express & <code className="font-mono text-emerald-700">@napi-rs/canvas</code> • Doodle Jump Classic Theme</p>
      </footer>

      {/* Asset Inspector Modal */}
      <AssetModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
    </div>
  );
}
