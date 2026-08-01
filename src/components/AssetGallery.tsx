import React, { useState } from 'react';
import { AssetInfo } from '../types';
import { Download, Copy, Check, Eye, Grid, List, Sparkles } from 'lucide-react';

interface Props {
  assets: AssetInfo[];
  onSelectAsset: (asset: AssetInfo) => void;
}

export const AssetGallery: React.FC<Props> = ({ assets, onSelectAsset }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewBg, setPreviewBg] = useState<'notebook' | 'checker' | 'light' | 'dark'>('notebook');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Assets' },
    { id: 'player', label: 'Player & Costumes' },
    { id: 'platforms', label: 'Platforms' },
    { id: 'powerups', label: 'Powerups & Items' },
    { id: 'monsters', label: 'Monsters & Hazards' },
    { id: 'ui', label: 'UI & Environment' },
  ];

  const filtered = selectedCategory === 'all'
    ? assets
    : assets.filter((a) => a.category === selectedCategory);

  const copyUrl = (url: string, id: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getBgClass = () => {
    switch (previewBg) {
      case 'notebook': return 'bg-[#f7f6ed] bg-[radial-gradient(#e0ecf8_1px,transparent_1px)] [background-size:16px_16px]';
      case 'checker': return 'bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] bg-slate-100';
      case 'dark': return 'bg-slate-900 border-slate-800';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-black/10">
                {cat.id === 'all' ? assets.length : assets.filter(a => a.category === cat.id).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Background Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
            <span className="px-2 text-slate-400">Bg:</span>
            <button
              onClick={() => setPreviewBg('notebook')}
              className={`px-2 py-1 rounded ${previewBg === 'notebook' ? 'bg-white shadow-xs text-slate-900 font-semibold' : ''}`}
            >
              Notebook
            </button>
            <button
              onClick={() => setPreviewBg('checker')}
              className={`px-2 py-1 rounded ${previewBg === 'checker' ? 'bg-white shadow-xs text-slate-900 font-semibold' : ''}`}
            >
              Grid
            </button>
            <button
              onClick={() => setPreviewBg('dark')}
              className={`px-2 py-1 rounded ${previewBg === 'dark' ? 'bg-slate-800 text-white font-semibold' : ''}`}
            >
              Dark
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Asset Canvas Image Container */}
              <div
                className={`relative h-44 flex items-center justify-center p-4 border-b border-slate-100 transition-colors ${getBgClass()}`}
              >
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="max-h-32 max-w-full object-contain transition-transform group-hover:scale-110 drop-shadow-sm"
                  loading="lazy"
                />
                <button
                  onClick={() => onSelectAsset(asset)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-lg shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Inspect Asset"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white rounded">
                  {asset.width}x{asset.height}
                </span>
              </div>

              {/* Asset Info & Actions */}
              <div className="p-3 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm truncate" title={asset.name}>
                    {asset.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono truncate">{asset.fileName}</p>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">{asset.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => copyUrl(asset.url, asset.id)}
                    className="flex-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors border border-slate-200"
                  >
                    {copiedId === asset.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <a
                    href={asset.url}
                    download={asset.fileName}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 transition-colors"
                    title="Download PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="p-3">Preview</th>
                  <th className="p-3">Asset Name</th>
                  <th className="p-3">File Name</th>
                  <th className="p-3">Dimensions</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className={`w-14 h-14 rounded-lg flex items-center justify-center p-1 border ${getBgClass()}`}>
                        <img src={asset.url} alt={asset.name} className="max-h-12 max-w-12 object-contain" />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{asset.name}</div>
                      <div className="text-xs text-slate-400">{asset.description}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{asset.fileName}</td>
                    <td className="p-3 font-mono">{asset.width} × {asset.height} px</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                        {asset.category}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectAsset(asset)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                        <a
                          href={asset.url}
                          download={asset.fileName}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
