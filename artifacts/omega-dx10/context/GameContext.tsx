import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  CHARACTERS, EVOLUTIONS, ALTERNATE_EVOLUTIONS, FORM_CHANGES, FUSIONS, GAME_MAPS, expToNextLevel, tamerExpToNextLevel, CODEX_ORDER,
  EquipSlot, TamerGender, EQUIP_SLOTS_ORDER, DEFAULT_INVENTORY,
  CRAFT_RECIPES, CraftRecipe,
  SACRIFICE_DROPS, ROOKIE_OF, SACRIFICE_SCAN_OVERRIDES, SACRIFICE_SCAN_PCT,
  PRE_ROOKIE_STAGE_RARITIES,
  EquipItem, GameMap,
} from '@/constants/gameData';
import { loadCustomCharacters, getCharacter, loadCharacterOverrides, getFarmEvolutionTarget, getRandomHatchTarget } from '@/constants/extendedCharacters';
import { loadCustomItems, getCustomEquipmentItems } from '@/constants/extendedItems';
import { loadCustomMaps, getCustomGameMaps } from '@/constants/extendedMaps';

export interface SacrificeResult {
  droppedItem: string | null;
  scanGained: { characterId: string; amount: number } | null;
}

export interface MailReward {
  bits?: number;
  items?: string[];
  digimon?: string[];
  digimonWithLevel?: { characterId: string; level: number }[];
  pieces?: Record<string, number>;
}

export interface MailMessage {
  id: string;
  title: string;
  body: string;
  reward?: MailReward;
  rewardClaimed: boolean;
  isRead: boolean;
  createdAt: number;
  unlocksAtTamerLevel?: number;
}

export interface OwnedCharacter {
  ownedId: string;
  characterId: string;
  level: number;
  exp: number;
}

type EquippedItems = Record<EquipSlot, string | null>;

const defaultEquipped: EquippedItems = {
  blusa: null, calca: null, sapato: null,
  brasao: null, digivice: null, pulseira: null, oculos: null,
};

const DEFAULT_MESSAGES: MailMessage[] = [
  {
    id: 'welcome_v1',
    title: 'Bem-vindo ao OMEGA DX10!',
    body: 'Olá, Tamer! Sua jornada pelo Mundo Digital começa agora. Aqui você receberá recompensas especiais do administrador. Boa sorte em suas batalhas!',
    reward: { bits: 500 },
    rewardClaimed: false,
    isRead: false,
    createdAt: 1716000000000,
  },
  {
    id: 'guilmon_gift_v1',
    title: 'Presente de Nível 5 — Guilmon!',
    body: 'Parabéns por atingir o Tamer Rank 5! Como recompensa especial, você recebe o Guilmon — um dinossauro do tipo Vírus com chamas poderosas e uma linha evolutiva incrível. Boa sorte nas batalhas!',
    reward: { digimon: ['guilmon'] },
    rewardClaimed: false,
    isRead: false,
    createdAt: 1716000001000,
    unlocksAtTamerLevel: 5,
  },
  {
    id: 'agumon_saver_gift_v1',
    title: 'Presente de Nível 10 — Agumon (Saber)!',
    body: 'Incrível, Tamer Rank 10! Você provou seu valor no Mundo Digital. Como reconhecimento especial, você recebe o Agumon (Saber) — a versão aprimorada do clássico Agumon do Tamer Masaru. Com seu tipo Vacina e golpes poderosos, ele será um parceiro formidável nas masmorras avançadas!',
    reward: { digimon: ['agumonSaver'] },
    rewardClaimed: false,
    isRead: false,
    createdAt: 1716000002000,
    unlocksAtTamerLevel: 10,
  },
  {
    id: 'angel_batch_gift_v2',
    title: 'Reforço Angelical — Pacote Especial!',
    body: 'Um pacote de reforço foi enviado para o seu Digivice! Você recebeu 1× Angemon, 1× Devimon e 20× Bateria Azul. Use as baterias para turbinar o nível dos seus Digimons na tela de status. Boa sorte, Tamer!',
    reward: {
      digimon: ['angemon', 'devimon'],
      pieces: { piece_battery_blue: 20 },
    },
    rewardClaimed: false,
    isRead: false,
    createdAt: 1748100000000,
  },
];

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export interface GachaReward {
  characterId: string;
  raridade: 'Comum' | 'Especial' | 'Raro';
  nome?: string;
  tipo?: 'DIGIMON' | 'ITEM' | 'FRAGMENTO';
}

export interface GachaPoolEntry {
  id: string;
  nome: string;
  tipo: 'DIGIMON' | 'ITEM' | 'FRAGMENTO';
  characterId?: string;
  raridade: 'Comum' | 'Especial' | 'Raro';
}

interface GameState {
  playerName: string;
  gender: TamerGender;
  tamerId: string | null;
  isOnboarded: boolean;
  isAdmin: boolean;
  collection: OwnedCharacter[];
  clearedStages: Record<string, boolean>;
  selectedOwnedId: string | null;
  team: string[];
  scanProgress: Record<string, number>;
  inventory: string[];
  equippedItems: EquippedItems;
  pieces: Record<string, number>;
  bits: number;
  gemas: number;
  gachaContadorPity: number;
  ultimoTiroGratis: string | null;
  tamerExp: number;
  tamerLevel: number;
  messages: MailMessage[];
  lastDailyDate: string;
  farmSlots: string[];
  farmLastClaim: number;
  farmEntryTimes: Record<string, number>;
}

interface GameContextValue extends GameState {
  isLoaded: boolean;
  selectedCharacter: OwnedCharacter | null;
  customEquipItems: EquipItem[];
  customGameMaps: (GameMap & { backgroundImageUri?: string })[];
  completeOnboarding: (name: string, gender: TamerGender, tamerId: string) => void;
  addToCollection: (characterId: string) => void;
  gainExp: (ownedId: string, amount: number) => void;
  clearStage: (mapId: string, stageIndex: number) => void;
  setSelectedCharacter: (ownedId: string) => void;
  setPlayerName: (name: string) => void;
  isStageCleared: (mapId: string, stageIndex: number) => boolean;
  isMapUnlocked: (mapId: string) => boolean;
  gainScan: (characterId: string, amount: number) => void;
  createFromScan: (characterId: string) => void;
  evolveDigimon: (ownedId: string, alternate?: boolean, sacrificeOwnedId?: string) => void;
  changeFormDigimon: (ownedId: string) => void;
  fuseDigimon: (keepOwnedId: string, sacrificeOwnedId: string) => boolean;
  sacrificeDigimon: (ownedId: string) => SacrificeResult;
  totalPlayerLevel: number;
  setGender: (g: TamerGender) => void;
  equipItem: (slot: EquipSlot, itemId: string) => void;
  unequipItem: (slot: EquipSlot) => void;
  totalEquipBonus: () => Partial<Record<string, number>>;
  gainPiece: (pieceId: string, amount?: number) => void;
  craftItem: (recipe: CraftRecipe) => boolean;
  gainBits: (amount: number) => void;
  gainTamerExp: (amount: number) => void;
  gainGemas: (amount: number) => void;
  addToInventory: (itemId: string) => void;
  unreadMailCount: number;
  readMessage: (id: string) => void;
  claimReward: (id: string) => void;
  useXpItem: (ownedId: string, batteryId: string, qty: number) => void;
  setTeam: (ownedIds: string[]) => void;
  loadFromCloud: (apiUrl: string) => Promise<void>;
  refreshCustomData: (apiUrl: string) => Promise<void>;
  isDailyDungeonAvailable: boolean;
  claimDailyDungeon: () => void;
  setFarmSlots: (slots: string[], resetTime?: boolean) => void;
  processFarmEvolutions: () => void;
  realizarTiroGacha: (quantidade: 1 | 10) => { mensagem: string; recompensas: GachaReward[]; custoGemas: number } | null;
  isTiroGratisDisponivel: boolean;
  gachaAdminPool: GachaPoolEntry[] | null;
  setGachaAdminPool: (pool: GachaPoolEntry[] | null) => void;
  resetGame: () => Promise<void>;
  customCharsRevision: number;
}

const STORAGE_KEY = 'omega_dx10_save_v3';

const defaultState: GameState = {
  playerName: '',
  gender: 'M',
  tamerId: null,
  isOnboarded: false,
  isAdmin: false,
  collection: [{ ownedId: 'owned_agumon_0', characterId: 'agumon', level: 1, exp: 0 }],
  clearedStages: {},
  selectedOwnedId: 'owned_agumon_0',
  team: [],
  scanProgress: {},
  inventory: DEFAULT_INVENTORY,
  equippedItems: defaultEquipped,
  pieces: {},
  bits: 0,
  gemas: 1000,
  gachaContadorPity: 0,
  ultimoTiroGratis: null,
  tamerExp: 0,
  tamerLevel: 1,
  messages: DEFAULT_MESSAGES,
  lastDailyDate: '',
  farmSlots: [],
  farmLastClaim: Date.now(),
  farmEntryTimes: {},
};

export const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(defaultState);
  const stateRef = useRef<GameState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [customEquipItems, setCustomEquipItems] = useState<EquipItem[]>([]);
  const [customGameMaps, setCustomGameMaps] = useState<(GameMap & { backgroundImageUri?: string })[]>([]);
  const [gachaAdminPool, setGachaAdminPool] = useState<GachaPoolEntry[] | null>(null);
  const gachaAdminPoolRef = useRef<GachaPoolEntry[] | null>(null);
  const [customCharsRevision, setCustomCharsRevision] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<GameState & { playerName?: string; _savedAt?: number }>;
          const hadPreviousSave = !!parsed.playerName && parsed.playerName !== '';
          const savedMessages: MailMessage[] = parsed.messages ?? [];
          const savedIds = new Set(savedMessages.map((m) => m.id));
          const merged = [
            ...DEFAULT_MESSAGES.filter((m) => !savedIds.has(m.id)),
            ...savedMessages,
          ].sort((a, b) => b.createdAt - a.createdAt);
          setState({
            ...defaultState,
            ...parsed,
            scanProgress: parsed.scanProgress ?? {},
            gender: parsed.gender ?? 'M',
            inventory: parsed.inventory ?? DEFAULT_INVENTORY,
            equippedItems: { ...defaultEquipped, ...(parsed.equippedItems ?? {}) },
            pieces: parsed.pieces ?? {},
            bits: parsed.bits ?? 0,
            tamerExp: parsed.tamerExp ?? 0,
            tamerLevel: parsed.tamerLevel ?? 1,
            tamerId: parsed.tamerId ?? null,
            isOnboarded: parsed.isOnboarded ?? hadPreviousSave,
            team: parsed.team ?? [],
            messages: merged,
            farmSlots: parsed.farmSlots ?? [],
            farmLastClaim: parsed.farmLastClaim ?? Date.now(),
            farmEntryTimes: (parsed as any).farmEntryTimes ?? {},
            gemas: (parsed as any).gemas ?? 1000,
            gachaContadorPity: (parsed as any).gachaContadorPity ?? 0,
            ultimoTiroGratis: (parsed as any).ultimoTiroGratis ?? null,
          });
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    gachaAdminPoolRef.current = gachaAdminPool;
  }, [gachaAdminPool]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, _savedAt: Date.now() }));
  }, [state, loaded]);


  const addToCollection = useCallback((characterId: string) => {
    setState((prev) => {
      if (prev.collection.some((c) => c.characterId === characterId)) return prev;
      const limit = prev.isAdmin ? 5000 : 500;
      if (prev.collection.length >= limit) return prev;
      const ownedId = `owned_${characterId}_${Date.now()}`;
      const newChar: OwnedCharacter = { ownedId, characterId, level: 1, exp: 0 };
      return { ...prev, collection: [...prev.collection, newChar] };
    });
  }, []);

  const gainExp = useCallback((ownedId: string, amount: number) => {
    setState((prev) => {
      const updated = prev.collection.map((c) => {
        if (c.ownedId !== ownedId) return c;
        let { exp, level } = c;
        if (level >= 100) return { ...c, level: 100, exp: 0 };
        exp += amount;
        while (level < 100 && exp >= expToNextLevel(level)) {
          exp -= expToNextLevel(level);
          level += 1;
        }
        if (level >= 100) { level = 100; exp = 0; }
        return { ...c, exp, level };
      });
      return { ...prev, collection: updated };
    });
  }, []);

  const clearStage = useCallback((mapId: string, stageIndex: number) => {
    const key = `${mapId}-${stageIndex}`;
    setState((prev) => {
      if (prev.clearedStages[key]) return prev;
      const clearedStages = { ...prev.clearedStages, [key]: true };
      return { ...prev, clearedStages };
    });
  }, []);

  const gainScan = useCallback((characterId: string, amount: number) => {
    setState((prev) => {
      const current = prev.scanProgress[characterId] ?? 0;
      if (current >= 100) return prev;
      const next = Math.min(100, current + amount);
      return { ...prev, scanProgress: { ...prev.scanProgress, [characterId]: next } };
    });
  }, []);

  const createFromScan = useCallback((characterId: string) => {
    setState((prev) => {
      const scan = prev.scanProgress[characterId] ?? 0;
      if (scan < 100) return prev;
      if (prev.collection.some((c) => c.characterId === characterId)) return prev;
      const limit = prev.isAdmin ? 5000 : 500;
      if (prev.collection.length >= limit) return prev;
      const ownedId = `owned_${characterId}_${Date.now()}`;
      return {
        ...prev,
        collection: [...prev.collection, { ownedId, characterId, level: 1, exp: 0 }],
      };
    });
  }, []);

  const evolveDigimon = useCallback((ownedId: string, alternate?: boolean, sacrificeOwnedId?: string) => {
    setState((prev) => {
      const target = prev.collection.find((c) => c.ownedId === ownedId);
      if (!target) return prev;
      if (alternate) {
        const evo = ALTERNATE_EVOLUTIONS[target.characterId];
        if (!evo || target.level < evo.requiredLevel) return prev;
        if (evo.requiredItem && (prev.pieces[evo.requiredItem] ?? 0) <= 0) return prev;
        const sacrificeCharId = evo.requiredSacrificeCharacter;
        if (sacrificeCharId) {
          const sacrificeOwned = sacrificeOwnedId
            ? prev.collection.find((c) => c.ownedId === sacrificeOwnedId && c.characterId === sacrificeCharId)
            : prev.collection.find((c) => c.ownedId !== ownedId && c.characterId === sacrificeCharId);
          if (!sacrificeOwned) return prev;
        }
        let newCollection = prev.collection.map((c) =>
          c.ownedId === ownedId ? { ...c, characterId: evo.evolvesTo, level: 1, exp: 0 } : c
        );
        if (sacrificeCharId) {
          const resolvedId = sacrificeOwnedId ?? newCollection.find(
            (c) => c.ownedId !== ownedId && c.characterId === sacrificeCharId
          )?.ownedId;
          if (resolvedId) {
            newCollection = newCollection.filter((c) => c.ownedId !== resolvedId);
          }
        }
        const newPieces = evo.requiredItem
          ? { ...prev.pieces, [evo.requiredItem]: (prev.pieces[evo.requiredItem] ?? 0) - 1 }
          : prev.pieces;
        return { ...prev, collection: newCollection, pieces: newPieces };
      } else {
        const evo = EVOLUTIONS[target.characterId];
        if (!evo || target.level < evo.requiredLevel) return prev;
        if (evo.requiredItem && (prev.pieces[evo.requiredItem] ?? 0) <= 0) return prev;
        const newCollection = prev.collection.map((c) =>
          c.ownedId === ownedId ? { ...c, characterId: evo.evolvesTo, level: 1, exp: 0 } : c
        );
        const newPieces = evo.requiredItem
          ? { ...prev.pieces, [evo.requiredItem]: (prev.pieces[evo.requiredItem] ?? 0) - 1 }
          : prev.pieces;
        return { ...prev, collection: newCollection, pieces: newPieces };
      }
    });
  }, []);

  const changeFormDigimon = useCallback((ownedId: string) => {
    setState((prev) => {
      const target = prev.collection.find((c) => c.ownedId === ownedId);
      if (!target) return prev;
      const toFormId = FORM_CHANGES[target.characterId];
      if (!toFormId) return prev;
      const newCollection = prev.collection.map((c) =>
        c.ownedId === ownedId ? { ...c, characterId: toFormId } : c
      );
      return { ...prev, collection: newCollection };
    });
  }, []);

  const fuseDigimon = useCallback((keepOwnedId: string, sacrificeOwnedId: string): boolean => {
    let success = false;
    setState((prev) => {
      const keep = prev.collection.find((c) => c.ownedId === keepOwnedId);
      const sacrifice = prev.collection.find((c) => c.ownedId === sacrificeOwnedId);
      if (!keep || !sacrifice) return prev;
      const fusion = FUSIONS[keep.characterId];
      if (!fusion || fusion.partner !== sacrifice.characterId) return prev;
      if (keep.level < fusion.requiredLevel) return prev;
      success = true;
      const newSelected = prev.selectedOwnedId === sacrificeOwnedId ? keepOwnedId : prev.selectedOwnedId;
      return {
        ...prev,
        selectedOwnedId: newSelected,
        collection: prev.collection
          .filter((c) => c.ownedId !== sacrificeOwnedId)
          .map((c) => c.ownedId === keepOwnedId ? { ...c, characterId: fusion.resultId, level: 1, exp: 0 } : c),
      };
    });
    return success;
  }, []);

  const setSelectedCharacter = useCallback((ownedId: string) => {
    setState((prev) => ({ ...prev, selectedOwnedId: ownedId }));
  }, []);

  const setTeam = useCallback((ownedIds: string[]) => {
    setState((prev) => ({ ...prev, team: ownedIds.slice(0, 3) }));
  }, []);

  const setPlayerName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, playerName: name }));
  }, []);

  const setGender = useCallback((g: TamerGender) => {
    setState((prev) => ({ ...prev, gender: g }));
  }, []);

  const equipItem = useCallback((slot: EquipSlot, itemId: string) => {
    setState((prev) => ({
      ...prev,
      equippedItems: { ...prev.equippedItems, [slot]: itemId },
    }));
  }, []);

  const unequipItem = useCallback((slot: EquipSlot) => {
    setState((prev) => ({
      ...prev,
      equippedItems: { ...prev.equippedItems, [slot]: null },
    }));
  }, []);

  const completeOnboarding = useCallback((name: string, gender: TamerGender, tamerId: string) => {
    const TAMER_STARTERS: Record<string, string> = {
      tamer_tai:  'agumon',
      tamer_tk:   'patamon',
      tamer_matt: 'gabumon',
      tamer_kari: 'salamon',
      tamer_sora: 'pyomon',
      tamer_mimi: 'palmon',
    };
    const starterId = TAMER_STARTERS[tamerId];
    const ownedId   = `owned_${starterId}_0`;
    const starter   = { ownedId, characterId: starterId, level: 1, exp: 0 };
    setState((prev) => ({
      ...prev,
      playerName: name,
      gender,
      tamerId,
      isOnboarded: true,
      collection: [starter],
      selectedOwnedId: ownedId,
    }));
  }, []);

  const gainBits = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, bits: prev.bits + amount }));
  }, []);

  const gainGemas = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, gemas: prev.gemas + amount }));
  }, []);

  const realizarTiroGacha = useCallback((quantidade: 1 | 10): { mensagem: string; recompensas: GachaReward[]; custoGemas: number } | null => {
    const TAXA_RARO     = 0.01;
    const TAXA_ESPECIAL = 0.05;

    // Read current state synchronously via ref (avoids async setState timing issue)
    const prev = stateRef.current;
    const adminPool = gachaAdminPoolRef.current;

    // Build pool: use admin-configured pool if available, else fall back to curated default pool
    let pool: GachaReward[];
    if (adminPool && adminPool.length > 0) {
      pool = adminPool.map((entry) => ({
        characterId: entry.characterId ?? entry.id,
        raridade: entry.raridade,
        nome: entry.nome,
        tipo: entry.tipo,
      }));
    } else {
      pool = [
        // Comum (10 slots)
        { characterId: 'koromon',       raridade: 'Comum',    tipo: 'DIGIMON', nome: 'Koromon' },
        { characterId: 'agumon',        raridade: 'Comum',    tipo: 'DIGIMON', nome: 'Agumon' },
        { characterId: 'tsunomon',      raridade: 'Comum',    tipo: 'DIGIMON', nome: 'Tsunomon' },
        { characterId: 'gabumon',       raridade: 'Comum',    tipo: 'DIGIMON', nome: 'Gabumon' },
        { characterId: 'salamon',       raridade: 'Comum',    tipo: 'DIGIMON', nome: 'Salamon' },
        { characterId: 'blackSalamon',  raridade: 'Comum',    tipo: 'DIGIMON', nome: 'BlackSalamon' },
        { characterId: 'palmon',        raridade: 'Comum',    tipo: 'DIGIMON', nome: 'Palmon' },
        { characterId: 'pyomon',        raridade: 'Comum',    tipo: 'DIGIMON', nome: 'Pyomon' },
        { characterId: 'demiDevimon',   raridade: 'Comum',    tipo: 'DIGIMON', nome: 'DemiDevimon' },
        { characterId: 'tokomon',       raridade: 'Comum',    tipo: 'DIGIMON', nome: 'Tokomon' },
        // Especial (6 slots)
        { characterId: 'custom_356',    raridade: 'Especial', tipo: 'DIGIMON', nome: 'Dorulumon' },
        { characterId: 'magnaAngemon',  raridade: 'Especial', tipo: 'DIGIMON', nome: 'MagnaAngemon' },
        { characterId: 'angewomon',     raridade: 'Especial', tipo: 'DIGIMON', nome: 'Angewomon' },
        { characterId: 'metalGreymon',  raridade: 'Especial', tipo: 'DIGIMON', nome: 'MetalGreymon' },
        { characterId: 'wereGarurumon', raridade: 'Especial', tipo: 'DIGIMON', nome: 'WereGarurumon' },
        { characterId: 'garudamon',     raridade: 'Especial', tipo: 'DIGIMON', nome: 'Garudamon' },
        // Raro (3 slots)
        { characterId: 'permissao_real', raridade: 'Raro',   tipo: 'ITEM',    nome: '⚔️ Permição Real da Deusa' },
        { characterId: 'dorumon',        raridade: 'Raro',   tipo: 'DIGIMON', nome: 'Dorumon' },
        { characterId: 'custom_313',     raridade: 'Raro',   tipo: 'DIGIMON', nome: 'Ryudamon' },
      ];
    }

    // Guard: if pool is completely empty, abort
    if (pool.length === 0) {
      return { mensagem: 'Gacha sem pool configurado!', recompensas: [], custoGemas: 0 };
    }

    const pickFrom = (raridade: GachaReward['raridade']): GachaReward => {
      const filtered = pool.filter((p) => p.raridade === raridade);
      const src = filtered.length > 0 ? filtered : pool;
      const entry = src[Math.floor(Math.random() * src.length)];
      // Safety fallback: if entry is somehow undefined, pick first pool item
      return entry ?? pool[0];
    };

    // ── Compute cost synchronously ──
    const hoje = getTodayDateString();
    let custoGemas = 0;
    let ultimoTiroGratis = prev.ultimoTiroGratis;

    if (quantidade === 1) {
      if (prev.ultimoTiroGratis !== hoje) {
        custoGemas = 0;
        ultimoTiroGratis = hoje;
      } else {
        custoGemas = 100;
      }
    } else {
      custoGemas = 900;
    }

    if (prev.gemas < custoGemas) {
      return { mensagem: 'Gemas insuficientes!', recompensas: [], custoGemas: 0 };
    }

    // ── Roll rewards synchronously ──
    // Fixed item: Digitama Especial — always 1% chance per pull, only via percentage (never via pity)
    const DIGITAMA_ESPECIAL_ID = 'custom_1550';
    const TAXA_DIGITAMA_ESPECIAL = 0.01;

    let pity = prev.gachaContadorPity;
    const recompensas: GachaReward[] = [];

    for (let i = 0; i < quantidade; i++) {
      // 1% fixed chance for Digitama Especial (only via percentage, never via pity guarantees)
      if (Math.random() < TAXA_DIGITAMA_ESPECIAL) {
        recompensas.push({ characterId: DIGITAMA_ESPECIAL_ID, raridade: 'Raro', tipo: 'DIGIMON', nome: '✨ Digitama Especial' });
        continue;
      }

      pity += 1;

      if (pity >= 50) {
        // Guaranteed Raro at 50 pity — picks from Raro pool (excludes Digitama which is percentage-only)
        recompensas.push(pickFrom('Raro'));
        pity = 0;
        continue;
      }
      if (pity % 10 === 0) {
        recompensas.push(pickFrom('Especial'));
        continue;
      }

      const rng = Math.random();
      let raridade: GachaReward['raridade'];
      if (rng < TAXA_RARO) {
        raridade = 'Raro';
        pity = 0;
      } else if (rng < TAXA_RARO + TAXA_ESPECIAL) {
        raridade = 'Especial';
      } else {
        raridade = 'Comum';
      }
      recompensas.push(pickFrom(raridade));
    }

    // Filter out any invalid entries (should not happen, but safety net)
    const validRecompensas = recompensas.filter((r) => r && r.characterId);
    if (validRecompensas.length === 0) {
      return { mensagem: 'Erro no sorteio. Tente novamente.', recompensas: [], custoGemas: 0 };
    }

    // ── Apply state changes ──
    const base = Date.now();
    const newCollection = [...prev.collection];
    const newInventory  = [...prev.inventory];

    validRecompensas.forEach((reward, i) => {
      if (reward.tipo === 'DIGIMON' || !reward.tipo) {
        if (newCollection.length < (prev.isAdmin ? 5000 : 500)) {
          newCollection.push({ ownedId: `owned_${reward.characterId}_${base}_${i}`, characterId: reward.characterId, level: 1, exp: 0 });
        }
      } else {
        newInventory.push(reward.characterId);
      }
    });

    setState((s) => ({
      ...s,
      gemas: s.gemas - custoGemas,
      gachaContadorPity: pity,
      ultimoTiroGratis,
      collection: newCollection,
      inventory: newInventory,
    }));

    return {
      mensagem: `🎉 Sorteio concluído! ${custoGemas > 0 ? `Gastou ${custoGemas} gemas.` : 'Tiro gratuito usado!'} Pity: ${pity}/50`,
      recompensas: validRecompensas,
      custoGemas,
    };
  }, []);

  const gainTamerExp = useCallback((amount: number) => {
    setState((prev) => {
      let { tamerExp, tamerLevel } = prev;
      tamerExp += amount;
      while (tamerExp >= tamerExpToNextLevel(tamerLevel)) {
        tamerExp -= tamerExpToNextLevel(tamerLevel);
        tamerLevel += 1;
      }
      return { ...prev, tamerExp, tamerLevel };
    });
  }, []);

  const addToInventory = useCallback((itemId: string) => {
    setState((prev) => {
      if (prev.inventory.includes(itemId)) return prev;
      return { ...prev, inventory: [...prev.inventory, itemId] };
    });
  }, []);

  const readMessage = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => m.id === id ? { ...m, isRead: true } : m),
    }));
  }, []);

  const claimReward = useCallback((id: string) => {
    setState((prev) => {
      const msg = prev.messages.find((m) => m.id === id);
      if (!msg || msg.rewardClaimed) return prev;
      let newBits = prev.bits;
      let newInventory = [...prev.inventory];
      let newCollection = [...prev.collection];
      let newPieces = { ...prev.pieces };
      if (msg.reward?.bits) newBits += msg.reward.bits;
      if (msg.reward?.items) {
        for (const itemId of msg.reward.items) {
          if (!newInventory.includes(itemId)) newInventory.push(itemId);
        }
      }
      if (msg.reward?.pieces) {
        for (const [pieceId, amount] of Object.entries(msg.reward.pieces)) {
          newPieces[pieceId] = (newPieces[pieceId] ?? 0) + amount;
        }
      }
      if (msg.reward?.digimon) {
        const base = Date.now();
        msg.reward.digimon.forEach((characterId, i) => {
          if (newCollection.length < 500) {
            const ownedId = `owned_${characterId}_${base}_${i}`;
            newCollection.push({ ownedId, characterId, level: 1, exp: 0 });
          }
        });
      }
      if (msg.reward?.digimonWithLevel) {
        const base = Date.now();
        msg.reward.digimonWithLevel.forEach(({ characterId, level }, i) => {
          if (newCollection.length < 500) {
            const ownedId = `owned_${characterId}_${base}_${i}`;
            newCollection.push({ ownedId, characterId, level, exp: 0 });
          }
        });
      }
      return {
        ...prev,
        bits: newBits,
        inventory: newInventory,
        collection: newCollection,
        pieces: newPieces,
        messages: prev.messages.map((m) =>
          m.id === id ? { ...m, isRead: true, rewardClaimed: true } : m
        ),
      };
    });
  }, []);

  const useXpItem = useCallback((ownedId: string, batteryId: string, qty: number) => {
    const XP_PER_BATTERY: Record<string, number> = {
      piece_battery_green:  100,
      piece_battery_blue:   200,
      piece_battery_purple: 400,
      piece_battery_gold:   800,
    };
    const xpEach = XP_PER_BATTERY[batteryId] ?? 0;
    if (xpEach <= 0 || qty <= 0) return;
    setState((prev) => {
      const currentQty = prev.pieces[batteryId] ?? 0;
      if (currentQty < qty) return prev;
      const newPieces = { ...prev.pieces, [batteryId]: currentQty - qty };
      const totalXp = xpEach * qty;
      const idx = prev.collection.findIndex((c) => c.ownedId === ownedId);
      if (idx < 0) return { ...prev, pieces: newPieces };
      let { exp, level } = prev.collection[idx];
      exp += totalXp;
      while (level < 100 && exp >= expToNextLevel(level)) {
        exp -= expToNextLevel(level);
        level++;
      }
      if (level >= 100) { level = 100; exp = 0; }
      const newCollection = [...prev.collection];
      newCollection[idx] = { ...newCollection[idx], exp, level };
      return { ...prev, pieces: newPieces, collection: newCollection };
    });
  }, []);

  const gainPiece = useCallback((pieceId: string, amount = 1) => {
    setState((prev) => ({
      ...prev,
      pieces: { ...prev.pieces, [pieceId]: (prev.pieces[pieceId] ?? 0) + amount },
    }));
  }, []);

  const craftItem = useCallback((recipe: CraftRecipe): boolean => {
    let success = false;
    setState((prev) => {
      if (prev.inventory.includes(recipe.resultItemId)) return prev;
      if ((recipe.bitsCost ?? 0) > 0 && prev.bits < (recipe.bitsCost ?? 0)) return prev;

      const newPieces = { ...prev.pieces };

      if (recipe.pieceRequirements && recipe.pieceRequirements.length > 0) {
        for (const req of recipe.pieceRequirements) {
          if ((prev.pieces[req.pieceId] ?? 0) < req.count) return prev;
        }
        for (const req of recipe.pieceRequirements) {
          newPieces[req.pieceId] = (newPieces[req.pieceId] ?? 0) - req.count;
        }
      } else {
        const current = prev.pieces[recipe.pieceId] ?? 0;
        if (current < recipe.requiredCount) return prev;
        newPieces[recipe.pieceId] = current - recipe.requiredCount;
      }

      success = true;
      return {
        ...prev,
        pieces: newPieces,
        bits: prev.bits - (recipe.bitsCost ?? 0),
        inventory: [...prev.inventory, recipe.resultItemId],
      };
    });
    return success;
  }, []);

  const sacrificeDigimon = useCallback((ownedId: string): SacrificeResult => {
    let result: SacrificeResult = { droppedItem: null, scanGained: null };
    setState((prev) => {
      const target = prev.collection.find((c) => c.ownedId === ownedId);
      if (!target) return prev;
      const char = CHARACTERS[target.characterId];
      if (!char) return prev;
      let newPieces = { ...prev.pieces };
      let newScanProgress = { ...prev.scanProgress };
      const drops = SACRIFICE_DROPS[target.characterId];
      if (drops) {
        for (const drop of drops) {
          if (Math.random() < drop.chance) {
            newPieces[drop.itemId] = (newPieces[drop.itemId] ?? 0) + 1;
            result.droppedItem = drop.itemId;
          }
        }
      }
      const override = SACRIFICE_SCAN_OVERRIDES[target.characterId];
      if (override) {
        const gain = Math.round(override.percent * 100);
        newScanProgress[override.characterId] = Math.min(100, (newScanProgress[override.characterId] ?? 0) + gain);
        result.scanGained = { characterId: override.characterId, amount: gain };
      } else {
        const rookieId = ROOKIE_OF[target.characterId];
        if (rookieId) {
          const pct = SACRIFICE_SCAN_PCT[char.rarity] ?? 0;
          if (pct > 0) {
            const gain = Math.round(pct * 100);
            newScanProgress[rookieId] = Math.min(100, (newScanProgress[rookieId] ?? 0) + gain);
            result.scanGained = { characterId: rookieId, amount: gain };
          }
        }
      }
      return {
        ...prev,
        pieces: newPieces,
        scanProgress: newScanProgress,
        collection: prev.collection.filter((c) => c.ownedId !== ownedId),
        team: prev.team.filter((id) => id !== ownedId),
        selectedOwnedId: prev.selectedOwnedId === ownedId ? null : prev.selectedOwnedId,
      };
    });
    return result;
  }, []);

  const claimDailyDungeon = useCallback(() => {
    setState((prev) => ({ ...prev, lastDailyDate: getTodayDateString() }));
  }, []);

  const setFarmSlots = useCallback((slots: string[], resetTime = false) => {
    setState((prev) => {
      const now = Date.now();
      const newEntryTimes = { ...prev.farmEntryTimes };
      for (const ownedId of slots) {
        if (!prev.farmSlots.includes(ownedId)) {
          newEntryTimes[ownedId] = now;
        }
      }
      for (const ownedId of prev.farmSlots) {
        if (!slots.includes(ownedId)) {
          delete newEntryTimes[ownedId];
        }
      }
      return {
        ...prev,
        farmSlots: slots,
        farmLastClaim: resetTime ? now : prev.farmLastClaim,
        farmEntryTimes: newEntryTimes,
      };
    });
  }, []);

  const processFarmEvolutions = useCallback(() => {
    setState((prev) => {
      let collection = [...prev.collection];
      let farmSlots = [...prev.farmSlots];
      let farmEntryTimes = { ...prev.farmEntryTimes };
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      let changed = false;

      for (const ownedId of [...farmSlots]) {
        const owned = collection.find((c) => c.ownedId === ownedId);
        if (!owned) continue;
        const char = getCharacter(owned.characterId);
        if (!char) continue;
        const rarity = char.rarity as string;
        if (!PRE_ROOKIE_STAGE_RARITIES.has(rarity as any)) continue;

        const entryTime = farmEntryTimes[ownedId] ?? now;
        const elapsed = now - entryTime;

        if ((rarity === 'EGG' || rarity === 'BABY') && elapsed >= ONE_DAY) {
          const target = rarity === 'EGG'
            ? getRandomHatchTarget(char.element)
            : getFarmEvolutionTarget(owned.characterId);
          if (target) {
            collection = collection.map((c) =>
              c.ownedId === ownedId ? { ...c, characterId: target, level: 1, exp: 0 } : c
            );
            farmEntryTimes[ownedId] = now;
            changed = true;
          }
        } else if (rarity === 'TRAINING' && owned.level >= 5) {
          const target = getFarmEvolutionTarget(owned.characterId);
          if (target) {
            collection = collection.map((c) =>
              c.ownedId === ownedId ? { ...c, characterId: target, level: 1, exp: 0 } : c
            );
            farmSlots = farmSlots.filter((id) => id !== ownedId);
            delete farmEntryTimes[ownedId];
            changed = true;
          }
        }
      }

      if (!changed) return prev;
      return { ...prev, collection, farmSlots, farmEntryTimes };
    });
  }, []);

  const isDailyDungeonAvailable = state.lastDailyDate !== getTodayDateString();

  const isStageCleared = useCallback(
    (mapId: string, stageIndex: number) => {
      return !!state.clearedStages[`${mapId}-${stageIndex}`];
    },
    [state.clearedStages],
  );

  const isMapUnlocked = useCallback(
    (mapId: string) => {
      const map = GAME_MAPS.find((m) => m.id === mapId);
      if (!map) return false;
      if (map.requiredTamerLevel) {
        if (state.tamerLevel < map.requiredTamerLevel) return false;
      }
      if (!map.requiredMapCleared) return true;
      const required = GAME_MAPS.find((m) => m.id === map.requiredMapCleared);
      if (!required) return false;
      return required.stages.every((s) => state.clearedStages[`${map.requiredMapCleared}-${s.index}`]);
    },
    [state.clearedStages, state.collection],
  );

  const totalEquipBonus = useCallback((): Partial<Record<string, number>> => {
    const { EQUIPMENT_ITEMS } = require('@/constants/gameData');
    const result: Record<string, number> = {};
    EQUIP_SLOTS_ORDER.forEach((slot) => {
      const itemId = state.equippedItems[slot];
      if (!itemId) return;
      const item = EQUIPMENT_ITEMS.find((i: { id: string }) => i.id === itemId);
      if (!item) return;
      Object.entries(item.bonuses as Record<string, number>).forEach(([k, v]) => {
        result[k] = (result[k] ?? 0) + (v as number);
      });
    });
    return result;
  }, [state.equippedItems]);

  const totalPlayerLevel = state.tamerLevel;
  const unreadMailCount = state.messages.filter(
    (m) => !m.isRead && (!m.unlocksAtTamerLevel || state.tamerLevel >= m.unlocksAtTamerLevel)
  ).length;

  const selectedCharacter = state.collection.find((c) => c.ownedId === state.selectedOwnedId) ?? null;

  const loadFromCloud = useCallback(async (apiUrl: string) => {
    try {
      const token = await AsyncStorage.getItem('omega_dx10_auth_token');
      if (!token) return;
      fetch(`${apiUrl}/digimons/custom`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data?.digimons) { loadCustomCharacters(data.digimons, apiUrl); setCustomCharsRevision((v) => v + 1); } })
        .catch(() => {});
      fetch(`${apiUrl}/overrides`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data?.overrides) { loadCharacterOverrides(data.overrides, apiUrl); setCustomCharsRevision((v) => v + 1); } })
        .catch(() => {});
      fetch(`${apiUrl}/items`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data?.items) { loadCustomItems(data.items, apiUrl); setCustomEquipItems(getCustomEquipmentItems()); } })
        .catch(() => {});
      fetch(`${apiUrl}/maps`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data?.maps) { loadCustomMaps(data.maps, apiUrl); setCustomGameMaps(getCustomGameMaps()); } })
        .catch(() => {});
      const res = await fetch(`${apiUrl}/saves`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const payload = await res.json() as { saveData: Partial<GameState & { playerName?: string; _savedAt?: number }>; isAdmin?: boolean; isDede?: boolean; updatedAt?: string };
      const { saveData, isAdmin, isDede, updatedAt } = payload;
      if (!saveData) return;

      // Compare timestamps: if local save is newer, keep local but still merge new server messages
      const localRaw = await AsyncStorage.getItem(STORAGE_KEY);
      if (localRaw) {
        try {
          const localData = JSON.parse(localRaw) as { _savedAt?: number; isOnboarded?: boolean };
          const localSavedAt = localData._savedAt ?? 0;
          // Use _savedAt embedded in saveData (reflects actual player save time).
          // Admin injections update DB updatedAt but do NOT change _savedAt in saveData,
          // so this prevents admin mail from triggering a full server-side overwrite.
          const serverSavedAt = (saveData as any)._savedAt as number | undefined;
          const serverUpdatedAt = serverSavedAt ?? (updatedAt ? new Date(updatedAt).getTime() : 0);
          // If local has meaningful data and is newer than server, keep local state
          // but still merge any new messages the admin may have sent
          if (localData.isOnboarded && localSavedAt > serverUpdatedAt + 5000) {
            const serverMessages: MailMessage[] = (saveData.messages ?? []) as MailMessage[];
            const serverTamerLevel = (saveData as any).tamerLevel as number | undefined;
            const serverGemas = (saveData as any).gemas as number | undefined;
            setState((prev) => {
              let updated = { ...prev };
              // Always take the higher tamerLevel (server can boost via seed/admin)
              if (serverTamerLevel && serverTamerLevel > prev.tamerLevel) {
                updated = { ...updated, tamerLevel: serverTamerLevel };
              }
              // Always take the higher gemas (admin may have added gems directly)
              if (serverGemas !== undefined && serverGemas > prev.gemas) {
                updated = { ...updated, gemas: serverGemas };
              }
              if (serverMessages.length > 0) {
                const localIds = new Set(prev.messages.map((m) => m.id));
                const newFromServer = serverMessages.filter((m) => !localIds.has(m.id));
                if (newFromServer.length > 0) {
                  updated = { ...updated, messages: [...newFromServer, ...prev.messages].sort((a, b) => b.createdAt - a.createdAt) };
                }
              }
              return updated;
            });
            return;
          }
        } catch {}
      }

      const parsed = saveData;
      const hadPreviousSave = !!parsed.playerName && parsed.playerName !== '';
      const savedMessages: MailMessage[] = parsed.messages ?? [];
      const savedIds = new Set(savedMessages.map((m) => m.id));
      const merged = [
        ...DEFAULT_MESSAGES.filter((m) => !savedIds.has(m.id)),
        ...savedMessages,
      ].sort((a, b) => b.createdAt - a.createdAt);
      const collection: OwnedCharacter[] = parsed.collection ?? [];
      const newState: GameState = {
        ...defaultState,
        ...parsed,
        collection,
        scanProgress: parsed.scanProgress ?? {},
        gender: parsed.gender ?? 'M',
        inventory: parsed.inventory ?? DEFAULT_INVENTORY,
        equippedItems: { ...defaultEquipped, ...(parsed.equippedItems ?? {}) },
        pieces: parsed.pieces ?? {},
        bits: parsed.bits ?? 0,
        tamerExp: parsed.tamerExp ?? 0,
        tamerLevel: parsed.tamerLevel ?? 1,
        tamerId: parsed.tamerId ?? null,
        isOnboarded: parsed.isOnboarded ?? hadPreviousSave,
        team: parsed.team ?? [],
        messages: merged,
        lastDailyDate: parsed.lastDailyDate ?? '',
        isAdmin: isDede ?? isAdmin ?? false,
        farmSlots: parsed.farmSlots ?? [],
        farmLastClaim: parsed.farmLastClaim ?? Date.now(),
        farmEntryTimes: (parsed as any).farmEntryTimes ?? {},
        gemas: (parsed as any).gemas ?? 1000,
        gachaContadorPity: (parsed as any).gachaContadorPity ?? 0,
        ultimoTiroGratis: (parsed as any).ultimoTiroGratis ?? null,
      };
      setState(newState);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...newState, _savedAt: Date.now() }));
    } catch {}
  }, []);

  const resetGame = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
  }, []);

  return (
    <GameContext.Provider
      value={{
        ...state,
        selectedCharacter,
        customEquipItems,
        customGameMaps,
        addToCollection,
        gainExp,
        clearStage,
        setSelectedCharacter,
        setPlayerName,
        isStageCleared,
        isMapUnlocked,
        gainScan,
        createFromScan,
        evolveDigimon,
        changeFormDigimon,
        fuseDigimon,
        sacrificeDigimon,
        totalPlayerLevel,
        setGender,
        equipItem,
        unequipItem,
        totalEquipBonus,
        gainPiece,
        craftItem,
        gainBits,
        gainTamerExp,
        gainGemas,
        addToInventory,
        isLoaded: loaded,
        completeOnboarding,
        unreadMailCount,
        readMessage,
        claimReward,
        useXpItem,
        setTeam,
        loadFromCloud,
        refreshCustomData: loadFromCloud,
        isDailyDungeonAvailable,
        claimDailyDungeon,
        setFarmSlots,
        processFarmEvolutions,
        realizarTiroGacha,
        isTiroGratisDisponivel: state.ultimoTiroGratis !== getTodayDateString(),
        gachaAdminPool,
        setGachaAdminPool,
        resetGame,
        customCharsRevision,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
