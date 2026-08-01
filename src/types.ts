export interface AssetInfo {
  id: string;
  name: string;
  fileName: string;
  category: 'player' | 'platforms' | 'powerups' | 'monsters' | 'ui';
  description: string;
  width: number;
  height: number;
  url: string;
}

export interface SpriteAtlasFrame {
  frame: { x: number; y: number; w: number; h: number };
}

export interface SpriteAtlas {
  frames: Record<string, SpriteAtlasFrame>;
  meta: {
    app: string;
    version: string;
    image: string;
    size: { w: number; h: number };
  };
}
