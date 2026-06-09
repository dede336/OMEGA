import { GameMap, MapStage } from './gameData';

interface CustomStageRaw {
  index: number; name?: string;
  enemies: { characterId: string; level: number }[];
  expReward?: number; bitsReward?: number;
  drops?: { type: 'bits' | 'item'; itemId?: string; amount?: number; chance: number }[];
}

interface CustomMapRaw {
  id: string; dbId: number; name: string; description: string;
  type: string; isActive: boolean; bitsReward: number;
  isPermanent: boolean; expiresAt: string | null;
  stages: CustomStageRaw[]; hasImage: boolean;
}

let _customMaps: CustomMapRaw[] = [];
let _apiUrl = '';

export function loadCustomMaps(maps: CustomMapRaw[], apiUrl: string) {
  _apiUrl = apiUrl;
  const now = Date.now();
  _customMaps = maps.filter((m) => {
    if (!m.isActive) return false;
    if (!m.isPermanent && m.expiresAt && new Date(m.expiresAt).getTime() < now) return false;
    return true;
  });
}

function convertStage(s: CustomStageRaw, idx: number): MapStage {
  return {
    index: idx,
    name: s.name || `Estágio ${idx + 1}`,
    enemyCharacterId: s.enemies?.[0]?.characterId ?? 'agumon',
    enemyCharacterIds: s.enemies?.map((e) => e.characterId),
    enemyLevel: s.enemies?.[0]?.level ?? 1,
    expReward: s.expReward ?? 50,
    drops: (s.drops ?? []).map((d) => ({
      type: d.type === 'item' ? 'piece' : 'bits',
      id: d.itemId,
      amount: d.amount ?? 100,
      chance: d.chance ?? 0.5,
    })) as any,
  };
}

export function getCustomGameMaps(): (GameMap & { backgroundImageUri?: string; isPermanent?: boolean; expiresAt?: string | null })[] {
  return _customMaps.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    isDungeon: m.type === 'dungeon',
    bitsReward: m.bitsReward,
    isPermanent: m.isPermanent,
    expiresAt: m.expiresAt,
    backgroundImageUri: m.hasImage ? `${_apiUrl}/maps/${m.dbId}/image` : undefined,
    stages: (m.stages ?? []).map((s, i) => convertStage(s, i)),
  }));
}

export function getAllCustomMapsRaw(): CustomMapRaw[] {
  return _customMaps;
}
