import React, { useState } from 'react';
import { AssetInfo } from '../types';
import { X, Download, Copy, Check, ExternalLink } from 'lucide-react';

interface Props {
  asset: AssetInfo | null;
  onClose: () => void;
}

export const AssetModal: React.FC<Props> = ({ asset, onClose }) => {
  if (!asset) return null;

  const [copied, setCopied] = useState(false);
  const [bg, setBg] = useState<'notebook' | 'checker' | 'dark'>('notebook');

  const copyUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}${asset.url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBgStyle = () => {
    if (bg === 'notebook') return 'bg-[#f7f6ed] bg-[radial-gradient(#e0ecf8_1px,transparent_1px)] [background-size:16px_16px]';
    if (bg === 'checker') return 'bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] bg-slate-100';
    return 'bg-slate-900 border-slate-800';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">{asset.name}</h3>
            <p className="text-xs text-slate-500 font-mono">{asset.fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Large Visual Display */}
        <div className={`p-8 flex items-center justify-center min-h-[220px] transition-colors relative ${getBgStyle()}`}>
          <img src={asset.url} alt={asset.name} className="max-h-56 max-w-full object-contain drop-shadow-md" />

          {/* Background Toggle Pill */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/80 backdrop-blur-xs p-1 rounded-lg text-xs font-medium text-slate-700 shadow-xs border border-slate-200">
            <button
              onClick={() => setBg('notebook')}
              className={`px-2 py-0.5 rounded ${bg === 'notebook' ? 'bg-emerald-600 text-white' : ''}`}
            >
              Paper
            </button>
            <button
              onClick={() => setBg('checker')}
              className={`px-2 py-0.5 rounded ${bg === 'checker' ? 'bg-emerald-600 text-white' : ''}`}
            >
              Grid
            </button>
            <button
              onClick={() => setBg('dark')}
              className={`px-2 py-0.5 rounded ${bg === 'dark' ? 'bg-emerald-600 text-white' : ''}`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Metadata Details */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">{asset.description}</p>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div><span className="text-slate-400">Width:</span> {asset.width}px</div>
            <div><span className="text-slate-400">Height:</span> {asset.height}px</div>
            <div><span className="text-slate-400">Category:</span> {asset.category}</div>
            <div><span className="text-slate-400">Format:</span> PNG (Transparency)</div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={copyUrl}
              className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied URL!' : 'Copy API URL'}
            </button>

            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              title="Open raw PNG in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <a
              href={asset.url}
              download={asset.fileName}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" /> Download PNG
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
