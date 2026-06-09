import { Character, CHARACTERS, EVOLUTIONS, ALTERNATE_EVOLUTIONS } from './gameData';
import CHARACTER_IMAGES from './characterImages';

interface CustomCharacterEntry extends Character {
  dbId: number;
  scannable: boolean;
  imageScale: number;
  imageApiUrl?: string;
}

interface OverrideEntry {
  name?: string; attribute?: string; rarity?: string; element?: string;
  hp?: number; mp?: number; atk?: number; def?: number; spt?: number; spd?: number;
  description?: string; attackName?: string; attackElement?: string;
  spiritName?: string; spiritElement?: string;
  imageScale?: number; scannable?: boolean; overrideImageUrl?: string;
}

let _customChars: Record<string, CustomCharacterEntry> = {};
let _overrides: Record<string, OverrideEntry> = {};
let _apiUrl = '';
let _baseCharImageUrls: Record<string, string> = {};
// farmEvoMap: fromCharId → targetCharId  (for BABY/TRAINING pre-rookie chain)
let _farmEvoMap: Record<string, string> = {};
// element → list of BABY char IDs (for random egg hatching; only babies with a training target)
let _elementBabyMap: Record<string, string[]> = {};
// Track base char IDs that were registered as evolution targets by custom processing
let _registeredBaseCharKeys: Set<string> = new Set();

export interface CustomDigimonRaw {
  id: string; dbId: number; name: string; attribute: string; rarity: string; element: string;
  baseStats: { hp: number; mp: number; atk: number; def: number; spt: number; spd: number; apt: number };
  description: string; attackName?: string; attackElement?: string;
  spiritName?: string; spiritElement?: string;
  isBaseForm: boolean; evolvesFromId?: string; requiredLevel?: number;
  requiredItem?: string; requiredSacrificeCharacter?: string;
  isFusion: boolean; fusionPartner?: string;
  scannable: boolean; hasImage: boolean; imageMimeType?: string; imageScale: number; imageUpdatedAt?: number;
}

// Build a name→id lookup for base CHARACTERS (computed once per module load)
function buildBaseNameMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [id, char] of Object.entries(CHARACTERS)) {
    map[char.name.toLowerCase()] = id;
  }
  return map;
}
const BASE_NAME_MAP = buildBaseNameMap();

// Normalized name → VG image lookup: strips non-alphanumeric chars and lowercases
// so "BlackWarGreymon" → "blackwargreymon" matches key "blackWarGreymon"
const _normKey = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const _IMAGE_BY_NORM: Record<string, any> = (() => {
  const map: Record<string, any> = {};
  for (const [key, val] of Object.entries(CHARACTER_IMAGES as Record<string, any>)) {
    map[_normKey(key)] = val;
  }
  return map;
})();

export function loadCustomCharacters(chars: CustomDigimonRaw[], apiUrl: string) {
  _apiUrl = apiUrl;
  _customChars = {};
  _farmEvoMap = {};
  _elementBabyMap = {};
  _baseCharImageUrls = {};

  for (const c of chars) {
    if (!c.name) continue; // skip entries with null/undefined name (bad DB data)
    // If a base char with the same name exists, capture its API image then skip
    const baseId = BASE_NAME_MAP[c.name.toLowerCase()];
    if (baseId) {
      if (c.hasImage) {
        _baseCharImageUrls[baseId] = `${apiUrl}/digimons/custom/${c.dbId}/image?v=${c.imageUpdatedAt ?? 0}`;
      }
      continue;
    }

    _customChars[c.id] = {
      id: c.id, dbId: c.dbId, name: c.name,
      attribute: c.attribute as Character['attribute'],
      rarity: c.rarity as Character['rarity'],
      element: c.element as Character['element'],
      baseStats: c.baseStats, description: c.description,
      attackName: c.attackName, attackElement: c.attackElement as Character['attackElement'],
      spiritName: c.spiritName, spiritElement: c.spiritElement as Character['spiritElement'],
      scannable: c.scannable, imageScale: c.imageScale ?? 0.8,
      imageApiUrl: c.hasImage ? `${apiUrl}/digimons/custom/${c.dbId}/image?v=${c.imageUpdatedAt ?? 0}` : undefined,
    };

  }

  // Build farm evolution map: BABY→TRAINING, TRAINING→ROOKIE
  const PRE_CHAIN = new Set(['BABY', 'TRAINING', 'COMMON']);
  for (const c of chars) {
    if (c.evolvesFromId && PRE_CHAIN.has(c.rarity)) {
      const fromChar = chars.find((x) => x.id === c.evolvesFromId);
      if (fromChar && ['BABY', 'TRAINING'].includes(fromChar.rarity)) {
        _farmEvoMap[c.evolvesFromId] = c.id;
      }
    }
  }

  // Build element → baby pool for egg hatching.
  // Only babies that have a TRAINING target in _farmEvoMap are valid hatch candidates.
  for (const c of chars) {
    if (c.rarity === 'BABY' && _farmEvoMap[c.id]) {
      if (!_elementBabyMap[c.element]) _elementBabyMap[c.element] = [];
      _elementBabyMap[c.element].push(c.id);
    }
  }

  // Clear previous custom evolution registrations before re-registering
  for (const key of Object.keys(EVOLUTIONS)) {
    if (key.startsWith('custom_')) delete (EVOLUTIONS as Record<string, unknown>)[key];
  }
  for (const key of Object.keys(ALTERNATE_EVOLUTIONS)) {
    if (key.startsWith('custom_')) delete (ALTERNATE_EVOLUTIONS as Record<string, unknown>)[key];
  }
  // Also clear base char keys that were registered by a previous custom run
  for (const key of _registeredBaseCharKeys) {
    delete (EVOLUTIONS as Record<string, unknown>)[key];
    delete (ALTERNATE_EVOLUTIONS as Record<string, unknown>)[key];
  }
  _registeredBaseCharKeys = new Set();

  // Register custom evolutions into EVOLUTIONS / ALTERNATE_EVOLUTIONS maps
  const SKIP_RARITIES = new Set(['EGG', 'BABY', 'TRAINING']);
  for (const c of chars) {
    if (!c.evolvesFromId || SKIP_RARITIES.has(c.rarity)) continue;

    // Resolve the actual target ID: if this custom char's name matches a base char, use the base char's ID
    const targetId = (c.name ? BASE_NAME_MAP[c.name.toLowerCase()] : undefined) ?? c.id;

    // Resolve the fromId: if evolvesFromId is a custom char whose name matches a base char, use the base ID
    let fromId = c.evolvesFromId;
    if (fromId.startsWith('custom_')) {
      const fromChar = chars.find((x) => x.id === fromId);
      if (fromChar) {
        const fromBaseId = fromChar.name ? BASE_NAME_MAP[fromChar.name.toLowerCase()] : undefined;
        if (fromBaseId) {
          fromId = fromBaseId;
          _registeredBaseCharKeys.add(fromBaseId);
        }
      }
    }

    const hasSacrifice = !!c.requiredSacrificeCharacter;
    if (!hasSacrifice && !EVOLUTIONS[fromId]) {
      EVOLUTIONS[fromId] = {
        evolvesTo: targetId,
        requiredLevel: c.requiredLevel ?? 1,
        label: c.name,
        requiredItem: c.requiredItem,
      };
      if (!fromId.startsWith('custom_')) _registeredBaseCharKeys.add(fromId);
    } else if (!ALTERNATE_EVOLUTIONS[fromId]) {
      ALTERNATE_EVOLUTIONS[fromId] = {
        evolvesTo: targetId,
        requiredLevel: c.requiredLevel ?? 1,
        label: c.name,
        requiredItem: c.requiredItem,
        requiredSacrificeCharacter: c.requiredSacrificeCharacter,
      };
      if (!fromId.startsWith('custom_')) _registeredBaseCharKeys.add(fromId);
    }
  }
}

export function getFarmEvolutionTarget(fromCharId: string): string | null {
  return _farmEvoMap[fromCharId] ?? null;
}

// Returns a random BABY of the given element.
// NULL element (Digitama Especial / Nulo) picks from ALL babies across all elements.
export function getRandomHatchTarget(element: string): string | null {
  if (element === 'NULL') {
    const all = Object.values(_elementBabyMap).flat();
    if (all.length > 0) return all[Math.floor(Math.random() * all.length)];
    return null;
  }
  const babies = _elementBabyMap[element];
  if (babies && babies.length > 0) {
    return babies[Math.floor(Math.random() * babies.length)];
  }
  return null;
}

export function loadCharacterOverrides(overrides: Array<{
  characterId: string; name?: string; attribute?: string; rarity?: string; element?: string;
  hp?: number; mp?: number; atk?: number; def?: number; spt?: number; spd?: number;
  description?: string; attackName?: string; attackElement?: string;
  spiritName?: string; spiritElement?: string;
  hasImage?: boolean; imageScale?: number; scannable?: boolean;
}>, apiUrl: string) {
  _overrides = {};
  for (const o of overrides) {
    _overrides[o.characterId] = {
      name: o.name, attribute: o.attribute, rarity: o.rarity, element: o.element,
      hp: o.hp, mp: o.mp, atk: o.atk, def: o.def, spt: o.spt, spd: o.spd,
      description: o.description, attackName: o.attackName, attackElement: o.attackElement,
      spiritName: o.spiritName, spiritElement: o.spiritElement,
      imageScale: o.imageScale, scannable: o.scannable,
      overrideImageUrl: o.hasImage ? `${apiUrl}/overrides/${o.characterId}/image` : undefined,
    };
  }
}

export function getCharacter(id: string): Character | undefined {
  const base: Character | undefined = CHARACTERS[id] ?? _customChars[id];
  if (!base) return undefined;
  const ov = _overrides[id];
  if (!ov) return base;
  return {
    ...base,
    ...(ov.name ? { name: ov.name } : {}),
    ...(ov.attribute ? { attribute: ov.attribute as Character['attribute'] } : {}),
    ...(ov.rarity ? { rarity: ov.rarity as Character['rarity'] } : {}),
    ...(ov.element ? { element: ov.element as Character['element'] } : {}),
    ...(ov.description ? { description: ov.description } : {}),
    ...(ov.attackName !== undefined ? { attackName: ov.attackName } : {}),
    ...(ov.attackElement ? { attackElement: ov.attackElement as Character['attackElement'] } : {}),
    ...(ov.spiritName !== undefined ? { spiritName: ov.spiritName } : {}),
    ...(ov.spiritElement ? { spiritElement: ov.spiritElement as Character['spiritElement'] } : {}),
    baseStats: {
      ...base.baseStats,
      ...(ov.hp !== undefined ? { hp: ov.hp } : {}),
      ...(ov.mp !== undefined ? { mp: ov.mp } : {}),
      ...(ov.atk !== undefined ? { atk: ov.atk } : {}),
      ...(ov.def !== undefined ? { def: ov.def } : {}),
      ...(ov.spt !== undefined ? { spt: ov.spt } : {}),
      ...(ov.spd !== undefined ? { spd: ov.spd } : {}),
    },
  };
}

export function getAllCharacters(): Record<string, Character> {
  const base: Record<string, Character> = {};
  for (const [id, char] of Object.entries(CHARACTERS)) {
    base[id] = getCharacter(id) ?? char;
  }
  for (const [id] of Object.entries(_customChars)) {
    base[id] = getCharacter(id) ?? _customChars[id];
  }
  return base;
}

export function getCharacterImageSource(id: string): any {
  const ov = _overrides[id];
  if (ov?.overrideImageUrl) return { uri: ov.overrideImageUrl };
  if (_baseCharImageUrls[id]) return { uri: _baseCharImageUrls[id] };
  if ((CHARACTER_IMAGES as Record<string, any>)[id]) return (CHARACTER_IMAGES as Record<string, any>)[id];
  const custom = _customChars[id];
  if (custom?.imageApiUrl) return { uri: custom.imageApiUrl };
  if (custom) {
    const img = custom.name ? _IMAGE_BY_NORM[_normKey(custom.name)] : undefined;
    if (img) return img;
  }
  return null;
}

export function getCharacterImageScale(id: string): number {
  const ov = _overrides[id];
  if (ov?.imageScale !== undefined) return ov.imageScale;
  if (_customChars[id]) return _customChars[id].imageScale ?? 0.8;
  return 0.8;
}

export function getCustomCharacters(): CustomCharacterEntry[] {
  return Object.values(_customChars);
}

export function getApiUrl(): string { return _apiUrl; }
