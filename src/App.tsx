import React, { useState, useEffect } from 'react';
import { KaiOSGame } from './components/KaiOSGame';

export default function App() {
  const [pureMode, setPureMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const search = new URLSearchParams(window.location.search);
    return (
      search.has('pure') ||
      search.get('mode') === 'game' ||
      window.innerWidth <= 320 ||
      navigator.userAgent.includes('KAIOS') ||
      navigator.userAgent.includes('KaiOS') ||
      window.location.protocol === 'app:'
    );
  });

  useEffect(() => {
    if (pureMode) {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
      document.body.style.backgroundColor = '#020617';
    } else {
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
      document.body.style.backgroundColor = '';
    }
  }, [pureMode]);

  if (pureMode) {
    return (
      <KaiOSGame pureMode={true} onTogglePureMode={() => setPureMode(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md font-extrabold text-xl">
              K2
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight flex items-center gap-2">
                Doodle Jump KaiOS 2.5 Edition
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Phaser 3.24.1 + asm.js C Engine
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Firefox 48 Gecko compatible • Hardware Keypad D-Pad • OmniSD & WebIDE Package
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPureMode(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Remove wrapper UI and display only the core game on screen"
            >
              🎮 Core Game Only
            </button>
            <a
              href="/doodle jump.zip"
              download="doodle jump.zip"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
              title="Download OmniSD Package (doodle jump.zip)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              OmniSD Package (.zip)
            </a>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">
              KaiOS 2.5 Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <KaiOSGame pureMode={false} onTogglePureMode={() => setPureMode(true)} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>Built for KaiOS 2.5 (Gecko 48) & KaiOS 3.0 • Phaser v3.24.1 (`/public/lib/phaser-3.24.1.min.js`) & Pure C asm.js Engine</p>
      </footer>
    </div>
  );
}
