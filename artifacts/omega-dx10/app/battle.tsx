import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Animated,
  Platform,
  ImageBackground,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  CHARACTERS,
  ATTRIBUTES,
  ELEMENTS,
  GAME_MAPS,
  EQUIPMENT_ITEMS,
  EQUIP_SLOTS_ORDER,
  getScaledStats,
  ElementId,
} from '@/constants/gameData';
import { getCharacterImageSource as _getCharImg, getCharacter } from '@/constants/extendedCharacters';
const CHARACTER_IMAGES = new Proxy({} as Record<string, any>, { get: (_t, p) => _getCharImg(String(p)) });
import ELEMENT_IMAGES from '@/constants/elementImages';
import EQUIP_ITEM_IMAGES from '@/constants/equipImages';

import {
  buildFighter,
  enemyChooseAction,
  executeTurn,
  computeDadivaDivina,
  DadivaBonus,
  BattleFighter,
  ActionType,
  EquipBonuses,
  SPIRIT_MP_COST,
} from '@/utils/battleEngine';
import { HPBar, AttributeBadge, CharacterAvatar, ELEMENT_EMOJI } from '@/components/GameComponents';
import { pixelStyle } from '@/constants/pixelStyle';

const AUTO_BATTLE_IMG = require('../assets/images/auto_battle.png');

function HitEffect({ color }: { color: string }) {
  const scale   = useRef(new Animated.Value(0.2)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale,   { toValue: 2.4, duration: 550, useNativeDriver: false }),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 80,  useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0,   duration: 470, useNativeDriver: false }),
      ]),
    ]).start();
  }, []);
  const inner = color + '55';
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', zIndex: 30 }]}>
      <Animated.View style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 4, borderColor: color, backgroundColor: inner, opacity, transform: [{ scale }] }} />
    </Animated.View>
  );
}

type Phase = 'select' | 'battle' | 'result';
type BattleLog = { text: string; color: string };
type TeamFighter = BattleFighter & { ownedId: string };
type DroppedItem = { id: string; name: string; amount: number; color: string };

const PIECE_META: Record<string, { name: string; color: string }> = {
  piece_tecido:           { name: 'Tecido Colorido',         color: '#ec4899' },
  piece_agulha:           { name: 'Agulha Média',            color: '#8b5cf6' },
  piece_linha:            { name: 'Linha Colorida',          color: '#06b6d4' },
  piece_anel_sagrado:     { name: 'Fragmento do Anel',       color: '#f59e0b' },
  piece_brasao_coragem:   { name: 'Fragmento Brasão Coragem',   color: '#ef4444' },
  piece_brasao_esperanca: { name: 'Fragmento Brasão Esperança', color: '#eab308' },
  piece_brasao_amizade:   { name: 'Fragmento Brasão Amizade',   color: '#3b82f6' },
  piece_brasao_confianca: { name: 'Fragmento Brasão Confiança', color: '#f97316' },
  piece_brasao_pureza:    { name: 'Fragmento Brasão Pureza',    color: '#22c55e' },
  piece_brasao_conhecimento: { name: 'Fragmento Brasão Conhecimento', color: '#8b5cf6' },
  piece_brasao_luz:       { name: 'Fragmento Brasão Luz',       color: '#ec4899' },
  piece_brasao_amor:      { name: 'Fragmento Brasão Amor',      color: '#ef4444' },
  piece_battery_green:    { name: 'Bateria Verde',   color: '#22c55e' },
  piece_battery_blue:     { name: 'Bateria Azul',    color: '#3b82f6' },
  piece_battery_purple:   { name: 'Bateria Roxa',    color: '#a855f7' },
  piece_battery_gold:     { name: 'Bateria Dourada', color: '#f59e0b' },
};

export default function BattleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mapId: string; stageIndex: string; auto?: string; autoCount?: string }>();
  const {
    collection,
    selectedCharacter,
    setSelectedCharacter,
    clearStage,
    isStageCleared,
    gainScan,
    equippedItems,
    gainPiece,
    gainBits,
    gainTamerExp,
    gainGemas,
    addToInventory,
    team,
    setTeam,
    claimDailyDungeon,
    tamerId,
  } = useGame();

  const TAMER_CREST_MAP: Record<string, string> = {
    tamer_tai:  'piece_brasao_coragem',
    tamer_sora: 'piece_brasao_amor',
    tamer_mimi: 'piece_brasao_pureza',
    tamer_kari: 'piece_brasao_luz',
    tamer_tk:   'piece_brasao_esperanca',
    tamer_matt: 'piece_brasao_amizade',
  };

  const { t } = useLanguage();
  const mapId = params.mapId ?? '';
  const stageIndex = Number(params.stageIndex ?? '0');
  const paramAutoMode = params.auto === '1';
  const paramAutoCount = Number(params.autoCount ?? '0');
  const map = GAME_MAPS.find((m) => m.id === mapId);
  const stage = map?.stages[stageIndex];
  const alreadyCleared = isStageCleared(mapId, stageIndex);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // ── Phase / result ─────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('select');
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<BattleLog[]>([]);
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const [dvBonusInfo, setDvBonusInfo] = useState<{ active: number; bank: number; bankCount: number } | null>(null);
  const dadivaDivinaRef = useRef<DadivaBonus>({});
  const [alphaHealModal, setAlphaHealModal] = useState(false);
  const alphaHealCtxRef = useRef<{ fighters: TeamFighter[]; alphaIdx: number } | null>(null);
  const logRef = useRef<ScrollView>(null);

  // ── Team selection ─────────────────────────────────────────────────────────
  const initialTeam = team.length > 0 ? team : (selectedCharacter ? [selectedCharacter.ownedId] : []);
  const [selectedTeam, setSelectedTeam] = useState<string[]>(initialTeam);
  const selectedTeamRef = useRef<string[]>(initialTeam);
  useEffect(() => { selectedTeamRef.current = selectedTeam; }, [selectedTeam]);
  const [slotPickerOpen, setSlotPickerOpen] = useState<number | null>(null);

  // ── Player team ────────────────────────────────────────────────────────────
  const [teamFighters, setTeamFighters] = useState<TeamFighter[]>([]);
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const teamFightersRef = useRef<TeamFighter[]>([]);
  const activeTeamIdxRef = useRef(0);
  useEffect(() => { teamFightersRef.current = teamFighters; }, [teamFighters]);
  useEffect(() => { activeTeamIdxRef.current = activeTeamIdx; }, [activeTeamIdx]);

  // ── Simultaneous enemies ───────────────────────────────────────────────────
  const [enemies, setEnemies] = useState<BattleFighter[]>([]);
  const [battleCharIds, setBattleCharIds] = useState<string[]>([]);
  const [targetIdx, setTargetIdx] = useState(0);
  const enemiesRef = useRef<BattleFighter[]>([]);
  const targetIdxRef = useRef(0);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { targetIdxRef.current = targetIdx; }, [targetIdx]);

  // ── Active player fighter (derived) ───────────────────────────────────────
  const playerFighter = teamFighters[activeTeamIdx] ?? null;

  // ── Equipped items ref (always fresh inside setTimeout closures) ───────────
  const equippedItemsRef = useRef(equippedItems);
  useEffect(() => { equippedItemsRef.current = equippedItems; }, [equippedItems]);

  // ── Collection ref (for digibank XP inside setTimeout closures) ────────────
  const collectionRef = useRef(collection);
  useEffect(() => { collectionRef.current = collection; }, [collection]);

  // ── Auto battle ────────────────────────────────────────────────────────────
  const [autoMode, setAutoMode] = useState(paramAutoMode);
  const [autoRunCount, setAutoRunCount] = useState(paramAutoCount);
  const autoModeRef = useRef(paramAutoMode);
  const autoRunCountRef = useRef(paramAutoCount);
  const AUTO_RUN_MAX = 10;
  useEffect(() => { autoModeRef.current = autoMode; }, [autoMode]);
  useEffect(() => { autoRunCountRef.current = autoRunCount; }, [autoRunCount]);

  // ── Turn queue ─────────────────────────────────────────────────────────────
  type TurnEntry = { side: 'player' | 'enemy'; idx: number };
  const [turnQueue, setTurnQueue] = useState<TurnEntry[]>([]);
  const [turnQueueIdx, setTurnQueueIdx] = useState(0);
  const [awaitingPlayerAction, setAwaitingPlayerAction] = useState(false);
  const [attackMenuOpen, setAttackMenuOpen] = useState(false);
  const turnQueueRef = useRef<TurnEntry[]>([]);
  const turnQueueIdxRef = useRef(0);
  const awaitingPlayerActionRef = useRef(false);

  // ── Animations ─────────────────────────────────────────────────────────────
  const playerShake = useRef(new Animated.Value(0)).current;
  const enemyShakes = useRef<Animated.Value[]>([]).current;
  function getEnemyShake(idx: number): Animated.Value {
    while (enemyShakes.length <= idx) enemyShakes.push(new Animated.Value(0));
    return enemyShakes[idx];
  }
  const shake = useCallback((anim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Element hit flash ───────────────────────────────────────────────────────
  const [hitFlash, setHitFlash] = useState<{ element: ElementId; idx: number; key: number } | null>(null);
  const flashElementHit = useCallback((element: ElementId, idx: number) => {
    setHitFlash({ element, idx, key: Date.now() });
    setTimeout(() => setHitFlash(null), 600);
  }, []);

  const [playerHitFlash, setPlayerHitFlash] = useState<{ element: ElementId; key: number } | null>(null);
  const flashPlayerHit = useCallback((element: ElementId) => {
    setPlayerHitFlash({ element, key: Date.now() });
    setTimeout(() => setPlayerHitFlash(null), 600);
  }, []);

  // ── Background pan animation ───────────────────────────────────────────────
  const bgPan = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (phase !== 'battle') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bgPan, { toValue: -40, duration: 10000, useNativeDriver: true }),
        Animated.timing(bgPan, { toValue: 0, duration: 10000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => { anim.stop(); bgPan.setValue(0); };
  }, [phase, bgPan]);

  // ── Auto-battle tick ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoMode || !awaitingPlayerAction || phase !== 'battle' || winner !== null) return;
    const timer = setTimeout(() => {
      if (autoModeRef.current && awaitingPlayerActionRef.current) handlePlayerAction('ATTACK');
    }, 700);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, awaitingPlayerAction, phase, winner]);

  // ── Auto-start battle when coming from auto-restart ────────────────────────
  useEffect(() => {
    if (!paramAutoMode || collection.length === 0) return;
    const autoTeam = team.length > 0 ? team : (selectedCharacter ? [selectedCharacter.ownedId] : []);
    if (autoTeam.length === 0) return;
    startBattle(autoTeam);
  // Run only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.length]);

  // ── Auto-restart after win ─────────────────────────────────────────────────
  useEffect(() => {
    if (!autoMode || winner !== 'player') return;
    if (autoRunCountRef.current >= AUTO_RUN_MAX) { setAutoMode(false); return; }
    const timer = setTimeout(() => {
      if (!autoModeRef.current) return;
      const nextCount = autoRunCountRef.current + 1;
      router.replace(`/battle?mapId=${mapId}&stageIndex=${stageIndex}&auto=1&autoCount=${nextCount}`);
    }, 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, winner]);

  function addLog(text: string, color: string = colors.foreground) {
    setLog((prev) => [...prev, { text, color }]);
    setTimeout(() => logRef.current?.scrollToEnd({ animated: true }), 100);
  }

  // ── Build equip bonuses ────────────────────────────────────────────────────
  function buildEquipBonuses(): EquipBonuses {
    const bonuses: EquipBonuses = { flat: {} };
    EQUIP_SLOTS_ORDER.forEach((slot) => {
      const itemId = equippedItems[slot];
      if (!itemId) return;
      const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
      if (!item) return;
      Object.entries(item.bonuses).forEach(([k, v]) => {
        (bonuses.flat as Record<string, number>)[k] = ((bonuses.flat as Record<string, number>)[k] ?? 0) + (v ?? 0);
      });
      if (item.elementBonus) {
        if (!bonuses.elementBonuses) bonuses.elementBonuses = [];
        bonuses.elementBonuses.push(item.elementBonus);
      }
      if (item.percentBonuses) {
        if (!bonuses.percentBonuses) bonuses.percentBonuses = {};
        Object.entries(item.percentBonuses).forEach(([k, v]) => {
          if (v !== undefined) {
            (bonuses.percentBonuses as Record<string, number>)[k] =
              ((bonuses.percentBonuses as Record<string, number>)[k] ?? 0) + v;
          }
        });
      }
    });
    return bonuses;
  }

  // ── Build single enemy ─────────────────────────────────────────────────────
  function buildEnemy(charId: string): BattleFighter {
    const eChar = CHARACTERS[charId];
    let f = buildFighter(
      eChar.name, eChar.attribute, eChar.element, eChar.baseStats, stage!.enemyLevel,
      undefined, { attackName: eChar.attackName, spiritName: eChar.spiritName },
    );
    if (stage!.bossMultipliers) {
      const bm = stage!.bossMultipliers;
      const hp = bm.hp ? Math.floor(f.stats.hp * bm.hp) : f.stats.hp;
      const def = bm.def ? Math.floor(f.stats.def * bm.def) : f.stats.def;
      f = { ...f, currentHP: hp, stats: { ...f.stats, hp, def } };
    }
    return f;
  }

  // ── Grant rewards ──────────────────────────────────────────────────────────
  function grantRewards(activeOwnedId: string) {
    setDvBonusInfo(null);

    const wasCleared = isStageCleared(mapId, stageIndex);
    if (map?.isDaily) {
      claimDailyDungeon();
      addLog('📅 Treinamento diário concluído! Volta amanhã às 00:00.', '#f59e0b');
    } else {
      clearStage(mapId, stageIndex);
    }
    if (!wasCleared && stage?.firstClearReward) {
      addToInventory(stage.firstClearReward);
      const ri = EQUIPMENT_ITEMS.find((i) => i.id === stage!.firstClearReward);
      addLog(`🎁 ${ri?.name ?? stage.firstClearReward} obtido!`, '#f59e0b');
    }
    if (!wasCleared && stage?.gemsFirstClear && stage.gemsFirstClear > 0) {
      gainGemas(stage.gemsFirstClear);
      addLog(`💎 +${stage.gemsFirstClear} Gemas (1ª conclusão)!`, '#a78bfa');
    }

    const charIds = stage?.enemyCharacterIds ?? [stage?.enemyCharacterId ?? ''];
    charIds.forEach((eid) => { if (CHARACTERS[eid]?.rarity === 'COMMON') gainScan(eid, 5); });

    if (map?.bitsReward) {
      gainBits(map.bitsReward);
      addLog(`💰 +${map.bitsReward.toLocaleString()} Bits!`, '#facc15');
    }
    if (map?.tamerExpReward) {
      const ei = equippedItemsRef.current;
      const dv = ei.digivice ? EQUIPMENT_ITEMS.find((i) => i.id === ei.digivice) : null;
      const tx = dv?.tamerXpBonusPercent
        ? Math.floor(map.tamerExpReward * (1 + dv.tamerXpBonusPercent))
        : map.tamerExpReward;
      gainTamerExp(tx);
      addLog(`⭐ +${tx} XP Tamer!`, '#a78bfa');
    }

    const drops: DroppedItem[] = [];
    const recordDrop = (id: string, amount: number) => {
      const meta = PIECE_META[id];
      if (!meta) return;
      const existing = drops.find((d) => d.id === id);
      if (existing) existing.amount += amount;
      else drops.push({ id, name: meta.name, amount, color: meta.color });
    };

    if (stage?.drops) {
      stage.drops.forEach((d) => {
        if (Math.random() < d.chance) {
          if (d.type === 'bits') { gainBits(d.amount); addLog(`💰 +${d.amount.toLocaleString()} Bits!`, '#facc15'); }
          else if (d.type === 'piece' && d.id) { gainPiece(d.id, d.amount); recordDrop(d.id, d.amount); addLog('✦ Fragmento obtido!', '#f59e0b'); }
        }
      });
    }

    if ((stage as any)?.tamerCrestReward && tamerId) {
      const pieceId = TAMER_CREST_MAP[tamerId];
      if (pieceId) {
        const amount = (stage as any).tamerCrestReward.amount as number;
        gainPiece(pieceId, amount);
        recordDrop(pieceId, amount);
        addLog(`🏅 +${amount}× Fragmento do Brasão obtido!`, '#f59e0b');
      }
    }
    if (Math.random() < 0.20) { gainPiece('piece_tecido', 1); recordDrop('piece_tecido', 1); addLog('🎨 Tecido Colorido!', '#ec4899'); }
    if (Math.random() < 0.20) { gainPiece('piece_agulha', 1); recordDrop('piece_agulha', 1); addLog('🪡 Agulha Média!', '#8b5cf6'); }
    if (Math.random() < 0.20) { gainPiece('piece_linha', 1); recordDrop('piece_linha', 1); addLog('🧵 Linha Colorida!', '#06b6d4'); }

    // ── Battery drops ────────────────────────────────────────────────────────
    if (map?.isDaily) {
      gainPiece('piece_battery_gold',   10); recordDrop('piece_battery_gold',   10);
      gainPiece('piece_battery_purple', 20); recordDrop('piece_battery_purple', 20);
      gainPiece('piece_battery_blue',   30); recordDrop('piece_battery_blue',   30);
      gainPiece('piece_battery_green',  40); recordDrop('piece_battery_green',  40);
      addLog('🔋 10× Bateria Dourada!', '#f59e0b');
      addLog('🔋 20× Bateria Roxa!',    '#a855f7');
      addLog('🔋 30× Bateria Azul!',    '#3b82f6');
      addLog('🔋 40× Bateria Verde!',   '#22c55e');
    } else {
      const regularMaps = GAME_MAPS.filter((m) => !(m as any).isDungeon && !m.isDaily);
      const mapNum = regularMaps.findIndex((m) => m.id === mapId) + 1;
      const isBoss = !!(stage as any).isBoss;
      if (mapNum > 0) {
        if (mapNum <= 2) {
          const amt = isBoss ? 3 : 1;
          gainPiece('piece_battery_green', amt); recordDrop('piece_battery_green', amt);
          addLog(`🔋 ${amt}× Bateria Verde!`, '#22c55e');
        } else if (mapNum <= 5) {
          if (isBoss) {
            gainPiece('piece_battery_blue', 3); recordDrop('piece_battery_blue', 3);
            addLog('🔋 3× Bateria Azul!', '#3b82f6');
          } else {
            gainPiece('piece_battery_green', 2); recordDrop('piece_battery_green', 2);
            gainPiece('piece_battery_blue',  1); recordDrop('piece_battery_blue',  1);
            addLog('🔋 2× Bateria Verde!', '#22c55e');
            addLog('🔋 1× Bateria Azul!', '#3b82f6');
          }
        } else {
          const tier = Math.floor((mapNum - 6) / 3);
          const purpleAmt = 1 + tier;
          const blueAmt   = 2 + tier;
          gainPiece('piece_battery_purple', purpleAmt); recordDrop('piece_battery_purple', purpleAmt);
          gainPiece('piece_battery_blue',   blueAmt);   recordDrop('piece_battery_blue',   blueAmt);
          addLog(`🔋 ${purpleAmt}× Bateria Roxa!`, '#a855f7');
          addLog(`🔋 ${blueAmt}× Bateria Azul!`,   '#3b82f6');
        }
      }
    }

    setDroppedItems(drops);
  }

  // ── Start battle ───────────────────────────────────────────────────────────
  function startBattle(teamIds: string[]) {
    if (!stage || teamIds.length === 0) return;
    const eqBonuses = buildEquipBonuses();

    const fighters: TeamFighter[] = [];
    for (const ownedId of teamIds) {
      const owned = collection.find((c) => c.ownedId === ownedId);
      if (!owned) continue;
      const ch = getCharacter(owned.characterId) ?? CHARACTERS[owned.characterId];
      if (!ch) continue;
      fighters.push({
        ...buildFighter(ch.name, ch.attribute, ch.element, ch.baseStats, owned.level, eqBonuses,
          { attackName: ch.attackName, spiritName: ch.spiritName }),
        ownedId,
        spiritHitsAll: ch.spiritHitsAll,
      });
    }
    if (fighters.length === 0) return;

    // ── Dádiva Divina: compute passive buffs from team composition ────────────
    const anelSagradoFlags = teamIds.map((ownedId) => {
      const owned = collection.find((c) => c.ownedId === ownedId);
      if (!owned) return false;
      const ch = getCharacter(owned.characterId) ?? CHARACTERS[owned.characterId];
      return (ch as any)?.requiredItem === 'anel_sagrado';
    });
    const dvBonus = computeDadivaDivina(
      fighters.map((f) => f.name),
      fighters.map((f) => f.element),
      anelSagradoFlags,
    );
    dadivaDivinaRef.current = dvBonus;
    for (const f of fighters) {
      if (dvBonus.atk) f.stats = { ...f.stats, atk: Math.floor(f.stats.atk * (1 + dvBonus.atk)) };
      if (dvBonus.def) f.stats = { ...f.stats, def: Math.floor(f.stats.def * (1 + dvBonus.def)) };
      if (dvBonus.spd) f.stats = { ...f.stats, spd: Math.floor(f.stats.spd * (1 + dvBonus.spd)) };
    }
    const dvParts: string[] = [];
    if (dvBonus.atk) dvParts.push(`ATK+${Math.round(dvBonus.atk * 100)}%`);
    if (dvBonus.def) dvParts.push(`DEF+${Math.round(dvBonus.def * 100)}%`);
    if (dvBonus.spd) dvParts.push(`VEL+${Math.round(dvBonus.spd * 100)}%`);
    if (dvBonus.hpRegen) dvParts.push(`Cura ${Math.round(dvBonus.hpRegen * 100)}%/rodada`);
    if (dvBonus.enemyDmgPerRound) dvParts.push(`Inimigo -${Math.round(dvBonus.enemyDmgPerRound * 100)}%/rodada`);
    if (dvBonus.alphamonPresent) dvParts.push('Alphamon: cura aliado');
    if (dvParts.length > 0) addLog(`✨ Dádiva Divina: ${dvParts.join(' | ')}`, '#f59e0b');

    // Build enemies — random subset if randomEnemyCount is set
    const pool = stage.enemyCharacterIds ?? [stage.enemyCharacterId];
    let charIds: string[];
    if (stage.randomEnemyCount && stage.randomEnemyCount < pool.length) {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      charIds = shuffled.slice(0, stage.randomEnemyCount);
    } else {
      charIds = pool;
    }
    const allEnemies = charIds.map((id) => buildEnemy(id));

    teamFightersRef.current = fighters;
    activeTeamIdxRef.current = 0;
    enemiesRef.current = allEnemies;
    targetIdxRef.current = 0;

    setTeamFighters(fighters);
    setActiveTeamIdx(0);
    setEnemies(allEnemies);
    setBattleCharIds(charIds);
    setTargetIdx(0);
    setSelectedCharacter(fighters[0].ownedId);
    setTeam(teamIds);
    setLog([]);
    setWinner(null);
    setBusy(false);
    awaitingPlayerActionRef.current = false;
    setAwaitingPlayerAction(false);
    setAttackMenuOpen(false);

    const firstQueue = buildTurnOrder(fighters, allEnemies);
    turnQueueRef.current = firstQueue;
    setTurnQueue(firstQueue);
    turnQueueIdxRef.current = 0;
    setTurnQueueIdx(0);
    setPhase('battle');

    setTimeout(() => processNextTurn(firstQueue, 0, fighters, allEnemies), 400);
  }

  // ── Build turn order by SPD ────────────────────────────────────────────────
  function buildTurnOrder(tf: TeamFighter[], en: BattleFighter[]): TurnEntry[] {
    const all: { side: 'player' | 'enemy'; idx: number; spd: number }[] = [
      ...tf.map((f, i) => ({ side: 'player' as const, idx: i, spd: f.stats.spd })),
      ...en.map((e, i) => ({ side: 'enemy' as const, idx: i, spd: e.stats.spd })),
    ];
    all.sort((a, b) => b.spd - a.spd || (Math.random() < 0.5 ? -1 : 1));
    return all.map(({ side, idx }) => ({ side, idx }));
  }

  // ── Advance to next turn in queue ──────────────────────────────────────────
  function processNextTurn(
    queue: TurnEntry[],
    qIdx: number,
    fighters: TeamFighter[],
    enems: BattleFighter[],
  ) {
    // Skip dead combatants
    let next = qIdx;
    while (next < queue.length) {
      const e = queue[next];
      const dead = e.side === 'player'
        ? (fighters[e.idx]?.currentHP ?? 0) <= 0
        : (enems[e.idx]?.currentHP ?? 0) <= 0;
      if (!dead) break;
      next++;
    }

    if (next >= queue.length) {
      // Round over → apply Dádiva Divina end-of-round effects, then new round
      const allEnemsDead = enems.every((e) => e.currentHP <= 0);
      const allPlayersDead = fighters.every((f) => f.currentHP <= 0);
      if (allEnemsDead || allPlayersDead) return;

      const dvBonus = dadivaDivinaRef.current;
      let eorFighters = fighters;
      let eorEnems = enems;

      // Anel Sagrado team HP regen
      if (dvBonus.hpRegen && dvBonus.hpRegen > 0) {
        eorFighters = eorFighters.map((f) => {
          if (f.currentHP <= 0) return f;
          const heal = Math.floor(f.stats.hp * dvBonus.hpRegen!);
          return { ...f, currentHP: Math.min(f.currentHP + heal, f.stats.hp) };
        });
        setTeamFighters(eorFighters);
        teamFightersRef.current = eorFighters;
        addLog(`💚 Dádiva Divina: equipe curou ${Math.round(dvBonus.hpRegen * 100)}% de HP!`, '#22c55e');
      }

      // Dark trio: enemy takes % damage at end of round
      if (dvBonus.enemyDmgPerRound && dvBonus.enemyDmgPerRound > 0) {
        eorEnems = eorEnems.map((e) => {
          if (e.currentHP <= 0) return e;
          const dmg = Math.max(1, Math.floor(e.stats.hp * dvBonus.enemyDmgPerRound!));
          return { ...e, currentHP: Math.max(0, e.currentHP - dmg) };
        });
        setEnemies(eorEnems);
        enemiesRef.current = eorEnems;
        addLog(`🔥 Dádiva Divina: inimigos sofrem ${Math.round(dvBonus.enemyDmgPerRound * 100)}% de dano!`, '#ef4444');
        if (eorEnems.every((e) => e.currentHP <= 0)) {
          setTimeout(() => {
            addLog('Todos os inimigos derrotados! Vitória!', '#22c55e');
            const activeId = teamFightersRef.current.find((f) => f.currentHP > 0)?.ownedId;
            if (activeId) grantRewards(activeId);
            setWinner('player'); setPhase('result'); setBusy(false);
          }, 400);
          return;
        }
      }

      const newQueue = buildTurnOrder(eorFighters, eorEnems);
      turnQueueRef.current = newQueue;
      setTurnQueue(newQueue);
      turnQueueIdxRef.current = 0;
      setTurnQueueIdx(0);
      addLog('── Novo turno ──', '#6b7280');
      setTimeout(() => processNextTurn(newQueue, 0, eorFighters, eorEnems), 300);
      return;
    }

    turnQueueIdxRef.current = next;
    setTurnQueueIdx(next);

    const entry = queue[next];
    if (entry.side === 'player') {
      const pf = fighters[entry.idx];
      activeTeamIdxRef.current = entry.idx;
      setActiveTeamIdx(entry.idx);

      // Alphamon Dádiva Divina: choose an ally to heal 20% HP before attacking
      if (
        dadivaDivinaRef.current.alphamonPresent &&
        pf.name.toLowerCase().includes('alphamon') &&
        pf.currentHP > 0 &&
        fighters.some((f, i) => i !== entry.idx && f.currentHP > 0 && f.currentHP < f.stats.hp)
      ) {
        alphaHealCtxRef.current = { fighters, alphaIdx: entry.idx };
        setAlphaHealModal(true);
        setBusy(false);
        return;
      }

      addLog(`🎮 Vez de ${pf.name}!`, colors.primary);
      awaitingPlayerActionRef.current = true;
      setAwaitingPlayerAction(true);
      setBusy(false);
    } else {
      setBusy(true);
      setTimeout(() => doEnemyAttackTurn(entry.idx, queue, next + 1, fighters, enems), 700);
    }
  }

  // ── Enemy takes its turn ───────────────────────────────────────────────────
  function doEnemyAttackTurn(
    enemyIdx: number,
    queue: TurnEntry[],
    nextQIdx: number,
    fighters: TeamFighter[],
    enems: BattleFighter[],
  ) {
    const enemy = enems[enemyIdx];
    if (!enemy || enemy.currentHP <= 0) {
      processNextTurn(queue, nextQIdx, fighters, enems);
      return;
    }

    // Find first living player target
    const targetPlayerIdx = fighters.findIndex((f) => f.currentHP > 0);
    if (targetPlayerIdx < 0) {
      addLog('Toda a equipe foi derrotada!', '#ef4444');
      setWinner('enemy');
      setPhase('result');
      setBusy(false);
      return;
    }
    const target = fighters[targetPlayerIdx];

    const action = enemyChooseAction(enemy);
    const result = executeTurn(enemy, target, action);
    const newTargetHP = result.defenderResult.newHP;
    const lc = result.defenderResult.attrMult > 1 || result.defenderResult.elemMult > 1
      ? '#ef4444' : colors.foreground;
    addLog(result.defenderResult.log, lc);
    shake(playerShake);
    flashPlayerHit(enemy.element);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const updatedEnems = enems.map((e, i) =>
      i === enemyIdx ? { ...e, currentMP: result.attackerResult.newMP } : e
    );
    setEnemies(updatedEnems);
    enemiesRef.current = updatedEnems;

    const updatedFighters = fighters.map((f, i) =>
      i === targetPlayerIdx ? { ...f, currentHP: newTargetHP } : f
    );
    setTeamFighters(updatedFighters);
    teamFightersRef.current = updatedFighters;

    if (newTargetHP <= 0) {
      addLog(`${target.name} foi derrotado!`, '#ef4444');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (updatedFighters.every((f) => f.currentHP <= 0)) {
        setTimeout(() => {
          addLog('Toda a equipe foi derrotada!', '#ef4444');
          setWinner('enemy');
          setPhase('result');
          setBusy(false);
        }, 400);
        return;
      }
    }

    setTimeout(() => processNextTurn(queue, nextQIdx, updatedFighters, updatedEnems), 450);
  }

  // ── Player action ──────────────────────────────────────────────────────────
  function handlePlayerAction(action: ActionType | 'FLEE') {
    if (!awaitingPlayerActionRef.current) return;
    awaitingPlayerActionRef.current = false;
    setAwaitingPlayerAction(false);
    setAttackMenuOpen(false);
    setBusy(true);

    // ── Flee ─────────────────────────────────────────────────────────────────
    if (action === 'FLEE') {
      if (Math.random() < 0.30) {
        addLog('Fugiu com sucesso!', '#f59e0b');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => router.back(), 600);
      } else {
        addLog('Tentativa de fuga falhou!', '#ef4444');
        setTimeout(() => processNextTurn(
          turnQueueRef.current,
          turnQueueIdxRef.current + 1,
          teamFightersRef.current,
          enemiesRef.current,
        ), 500);
      }
      return;
    }

    const actingEntry = turnQueueRef.current[turnQueueIdxRef.current];
    const actingPlayerIdx = actingEntry?.side === 'player' ? actingEntry.idx : activeTeamIdxRef.current;
    const currentPF = teamFightersRef.current[actingPlayerIdx];
    if (!currentPF || currentPF.currentHP <= 0) { setBusy(false); return; }

    if (action === 'SPIRIT' && currentPF.currentMP < SPIRIT_MP_COST) {
      addLog('MP insuficiente!', '#ef4444');
      awaitingPlayerActionRef.current = true;
      setAwaitingPlayerAction(true);
      setBusy(false);
      return;
    }

    // Ensure a living target is selected
    let tIdx = targetIdxRef.current;
    if ((enemiesRef.current[tIdx]?.currentHP ?? 0) <= 0) {
      tIdx = enemiesRef.current.findIndex((e) => e.currentHP > 0);
      if (tIdx < 0) { setBusy(false); return; }
      targetIdxRef.current = tIdx;
      setTargetIdx(tIdx);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // ── Multi-target spirit ───────────────────────────────────────────────────
    if (action === 'SPIRIT' && currentPF.spiritHitsAll) {
      const spiritNewMP = Math.max(0, currentPF.currentMP - SPIRIT_MP_COST);
      const spiritAttacker = { ...currentPF, currentMP: SPIRIT_MP_COST };
      const liveIndices = enemiesRef.current.map((e, i) => ({ e, i })).filter(({ e }) => e.currentHP > 0);
      const updatedEnemiesAll = [...enemiesRef.current];
      for (const { e: enemy, i: idx } of liveIndices) {
        const res = executeTurn(spiritAttacker, enemy, 'SPIRIT');
        updatedEnemiesAll[idx] = { ...enemy, currentHP: res.defenderResult.newHP };
        const lc = res.defenderResult.attrMult > 1 || res.defenderResult.elemMult > 1 ? '#22c55e' : colors.foreground;
        addLog(res.defenderResult.log, lc);
        shake(getEnemyShake(idx));
        flashElementHit(currentPF.element, idx);
        if (res.defenderResult.newHP <= 0) { addLog(`${enemy.name} foi derrotado!`, '#22c55e'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
      }
      const updatedTeamAll = teamFightersRef.current.map((f, i) => i === actingPlayerIdx ? { ...f, currentMP: spiritNewMP } : f);
      setEnemies(updatedEnemiesAll); enemiesRef.current = updatedEnemiesAll;
      setTeamFighters(updatedTeamAll); teamFightersRef.current = updatedTeamAll;
      const livingAfterAll = updatedEnemiesAll.filter((e) => e.currentHP > 0);
      if (livingAfterAll.length === 0) {
        setTimeout(() => {
          addLog('Todos os inimigos derrotados! Vitória!', '#22c55e');
          const activeId = teamFightersRef.current.find((f) => f.currentHP > 0)?.ownedId;
          if (activeId) grantRewards(activeId);
          setWinner('player'); setPhase('result'); setBusy(false);
        }, 400);
        return;
      }
      const nextAlive = updatedEnemiesAll.findIndex((e) => e.currentHP > 0);
      if (nextAlive >= 0) { targetIdxRef.current = nextAlive; setTargetIdx(nextAlive); }
      setTimeout(() => processNextTurn(turnQueueRef.current, turnQueueIdxRef.current + 1, updatedTeamAll, updatedEnemiesAll), 400);
      return;
    }

    // ── Single-target attack ──────────────────────────────────────────────────
    const target = enemiesRef.current[tIdx];
    const pResult = executeTurn(currentPF, target, action);
    const newPlayerMP = pResult.attackerResult.newMP;
    const newTargetHP = pResult.defenderResult.newHP;
    const lc = pResult.defenderResult.attrMult > 1 || pResult.defenderResult.elemMult > 1 ? '#22c55e' : colors.foreground;
    addLog(pResult.defenderResult.log, lc);
    shake(getEnemyShake(tIdx));
    flashElementHit(currentPF.element, tIdx);

    const updatedEnemies = enemiesRef.current.map((e, i) => i === tIdx ? { ...e, currentHP: newTargetHP } : e);
    const updatedTeam = teamFightersRef.current.map((f, i) => i === actingPlayerIdx ? { ...f, currentMP: newPlayerMP } : f);
    setEnemies(updatedEnemies); enemiesRef.current = updatedEnemies;
    setTeamFighters(updatedTeam); teamFightersRef.current = updatedTeam;

    if (newTargetHP <= 0) {
      addLog(`${target.name} foi derrotado!`, '#22c55e');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const livingAfter = updatedEnemies.filter((e) => e.currentHP > 0);
      if (livingAfter.length === 0) {
        setTimeout(() => {
          addLog('Todos os inimigos derrotados! Vitória!', '#22c55e');
          const activeId = teamFightersRef.current.find((f) => f.currentHP > 0)?.ownedId;
          if (activeId) grantRewards(activeId);
          setWinner('player'); setPhase('result'); setBusy(false);
        }, 400);
        return;
      }
      const nextTargetIdx = updatedEnemies.findIndex((e) => e.currentHP > 0);
      targetIdxRef.current = nextTargetIdx;
      setTargetIdx(nextTargetIdx);
      addLog(`Alvo mudou para ${updatedEnemies[nextTargetIdx].name}!`, '#f59e0b');
    }

    setTimeout(() => processNextTurn(turnQueueRef.current, turnQueueIdxRef.current + 1, updatedTeam, updatedEnemies), 400);
  }

  // ── Alphamon Dádiva Divina: heal an ally before attacking ─────────────────
  function handleAlphaHeal(allyIdx: number) {
    const ctx = alphaHealCtxRef.current;
    if (!ctx) return;
    setAlphaHealModal(false);
    const ally = ctx.fighters[allyIdx];
    const healAmt = Math.floor(ally.stats.hp * 0.20);
    const newHP = Math.min(ally.currentHP + healAmt, ally.stats.hp);
    const updatedFighters = ctx.fighters.map((f, i) => i === allyIdx ? { ...f, currentHP: newHP } : f);
    setTeamFighters(updatedFighters);
    teamFightersRef.current = updatedFighters;
    addLog(`💎 Alphamon curou ${ally.name} em ${healAmt} HP (Dádiva Divina)!`, '#a855f7');
    const alphamon = updatedFighters[ctx.alphaIdx];
    addLog(`🎮 Vez de ${alphamon.name}!`, colors.primary);
    awaitingPlayerActionRef.current = true;
    setAwaitingPlayerAction(true);
  }

  function continueAfterAlphaHeal() {
    const ctx = alphaHealCtxRef.current;
    if (!ctx) return;
    setAlphaHealModal(false);
    const alphamon = ctx.fighters[ctx.alphaIdx];
    addLog(`🎮 Vez de ${alphamon.name}!`, colors.primary);
    awaitingPlayerActionRef.current = true;
    setAwaitingPlayerAction(true);
  }

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!stage || !map) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{t('battle.notFound')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: colors.primary }}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stageCharIds = stage.enemyCharacterIds ?? [stage.enemyCharacterId];
  const canSpirit = !!playerFighter && playerFighter.currentMP >= SPIRIT_MP_COST;
  const livingEnemies = enemies.filter((e) => e.currentHP > 0);
  const pOwned = teamFighters[activeTeamIdx]
    ? collection.find((c) => c.ownedId === teamFighters[activeTeamIdx].ownedId)
    : null;
  const pChar = pOwned ? CHARACTERS[pOwned.characterId] : null;

  function setSlot(slotIdx: number, ownedId: string | null) {
    setSelectedTeam((prev) => {
      const next = [...prev];
      if (ownedId === null) {
        next.splice(slotIdx, 1);
        return next.filter(Boolean);
      }
      const existingIdx = next.indexOf(ownedId);
      if (existingIdx !== -1 && existingIdx !== slotIdx) {
        next.splice(existingIdx, 1);
      }
      next[slotIdx] = ownedId;
      return next.filter(Boolean);
    });
  }

  // ─── SELECT ────────────────────────────────────────────────────────────────
  if (phase === 'select') {
    const firstEnemyChar = CHARACTERS[stageCharIds[0]];
    const firstEnemyAttr = firstEnemyChar ? ATTRIBUTES[firstEnemyChar.attribute] : null;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{stage.name}</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Enemy preview — compact row */}
        <View style={[styles.enemyPreviewCompact, { backgroundColor: colors.card, borderColor: firstEnemyAttr ? firstEnemyAttr.color + '88' : colors.border }]}>
          {map.backgroundImage && (
            <ImageBackground source={map.backgroundImage} style={styles.previewBgSmall} imageStyle={{ resizeMode: 'cover' }} />
          )}
          <View style={styles.previewInfoCompact}>
            <Text style={[styles.enemyLevel, { color: colors.primary }]}>{t('common.level')} {stage.enemyLevel}</Text>
            <View style={[styles.expBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
              <Feather name="award" size={11} color={colors.primary} />
              <Text style={[styles.expBadgeText, { color: colors.primary }]}>+{stage.expReward} EXP</Text>
            </View>
            <Text style={[styles.possibleLabel, { color: colors.mutedForeground }]} numberOfLines={2}>
              {stageCharIds.map((id) => CHARACTERS[id]?.name ?? id).join(', ')}
            </Text>
          </View>
        </View>

        {/* Slot-based team builder */}
        <Text style={[styles.chooseLabel, { color: colors.mutedForeground }]}>
          {t('battle.buildTeam')} ({selectedTeam.length}/3)
        </Text>

        <View style={styles.slotsRow}>
          {[0, 1, 2].map((slotIdx) => {
            const ownedId = selectedTeam[slotIdx];
            const owned = ownedId ? collection.find((c) => c.ownedId === ownedId) : null;
            const char = owned ? (getCharacter(owned.characterId) ?? CHARACTERS[owned.characterId]) : null;
            return (
              <TouchableOpacity
                key={slotIdx}
                style={[
                  styles.slotCard,
                  {
                    backgroundColor: owned ? colors.primary + '18' : colors.card,
                    borderColor: owned ? colors.primary : colors.border,
                    borderStyle: owned ? 'solid' : 'dashed',
                  },
                  pixelStyle,
                ]}
                onPress={() => setSlotPickerOpen(slotIdx)}
                activeOpacity={0.8}
              >
                <View style={[styles.slotNumBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.slotNumText, { color: colors.primaryForeground }]}>{slotIdx + 1}</Text>
                </View>
                {owned && char ? (
                  <>
                    <CharacterAvatar characterId={char.id} size={54} />
                    <Text style={[styles.slotName, { color: colors.foreground }]} numberOfLines={1}>{char.name}</Text>
                    <Text style={[styles.slotLevel, { color: colors.primary }]}>Lv {owned.level}</Text>
                    <TouchableOpacity
                      style={[styles.slotRemoveBtn, { backgroundColor: '#ef444422', borderColor: '#ef444488' }]}
                      onPress={(e) => { e.stopPropagation(); setSlot(slotIdx, null); }}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <Feather name="x" size={11} color="#ef4444" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={[styles.slotEmpty, { borderColor: colors.border }]}>
                      <Feather name="plus" size={22} color={colors.mutedForeground} />
                    </View>
                    <Text style={[styles.slotEmptyText, { color: colors.mutedForeground }]}>{t('battle.empty')}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Slot picker modal */}
        <Modal
          visible={slotPickerOpen !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setSlotPickerOpen(null)}
        >
          <Pressable style={styles.slotModalOverlay} onPress={() => setSlotPickerOpen(null)}>
            <Pressable style={[styles.slotModalSheet, { backgroundColor: colors.card }, pixelStyle]} onPress={(e) => e.stopPropagation()}>
              <View style={[styles.slotModalHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.slotModalTitle, { color: colors.foreground }]}>
                {t('battle.chooseSlot')} {(slotPickerOpen ?? 0) + 1}
              </Text>
              <FlatList
                data={collection}
                keyExtractor={(item) => item.ownedId}
                contentContainerStyle={{ paddingBottom: botPad + 16 }}
                renderItem={({ item }) => {
                  const c = getCharacter(item.characterId) ?? CHARACTERS[item.characterId];
                  if (!c) return null;
                  const isSelected = selectedTeam.includes(item.ownedId);
                  const isThisSlot = selectedTeam[slotPickerOpen ?? 0] === item.ownedId;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        if (slotPickerOpen !== null) {
                          setSlot(slotPickerOpen, item.ownedId);
                          setSlotPickerOpen(null);
                        }
                      }}
                      style={[
                        styles.slotPickerRow,
                        { borderBottomColor: colors.border },
                        isThisSlot && { backgroundColor: colors.primary + '18' },
                      ]}
                    >
                      <View style={[styles.slotPickerAvatar, { borderColor: isSelected ? colors.primary : colors.border }]}>
                        <CharacterAvatar characterId={c.id} size={44} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.slotPickerName, { color: colors.foreground }]}>{c.name}</Text>
                        <Text style={[styles.slotPickerLevel, { color: colors.mutedForeground }]}>{t('common.level')} {item.level}</Text>
                      </View>
                      {isSelected && !isThisSlot && (
                        <View style={[styles.inOtherSlot, { backgroundColor: colors.mutedForeground + '22' }]}>
                          <Text style={[styles.inOtherSlotText, { color: colors.mutedForeground }]}>
                            Slot {selectedTeam.indexOf(item.ownedId) + 1}
                          </Text>
                        </View>
                      )}
                      {isThisSlot && (
                        <Feather name="check-circle" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>

        <TouchableOpacity
          onPress={() => { if (selectedTeam.length > 0) startBattle(selectedTeam); }}
          activeOpacity={selectedTeam.length > 0 ? 0.8 : 1}
          style={[
            styles.startBattleBtn,
            {
              backgroundColor: selectedTeam.length > 0 ? 'transparent' : colors.card,
              borderColor: selectedTeam.length > 0 ? 'transparent' : colors.border,
              marginBottom: botPad + 16,
            },
          ]}
        >
          {selectedTeam.length > 0 ? (
            <View style={styles.startBattleBtnImgWrap}>
              <Image
                source={require('../assets/images/battle-btn.png')}
                style={styles.startBattleBtnImg}
                resizeMode="contain"
              />
              <Text style={[styles.startBattleBtnCount, { color: '#fff' }]}>
                {selectedTeam.length} Digimon{selectedTeam.length > 1 ? 's' : ''}
              </Text>
            </View>
          ) : (
            <>
              <Feather name="crosshair" size={20} color={colors.mutedForeground} />
              <Text style={[styles.startBattleBtnText, { color: colors.mutedForeground }]}>
                {t('battle.empty')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // ─── BATTLE ────────────────────────────────────────────────────────────────
  if (phase === 'battle' && playerFighter) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.battleHeader, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
          <Text style={[styles.battleTitle, { color: colors.foreground }]}>{stage.name}</Text>
          {enemies.length > 1 && (
            <View style={[styles.enemyCountBadge, { backgroundColor: '#ef444422', borderColor: '#ef4444' }]}>
              <Text style={styles.enemyCountText}>
                {livingEnemies.length}/{enemies.length} vivos
              </Text>
            </View>
          )}
        </View>

        {/* Arena: all enemies at once */}
        <View style={styles.arena}>
          {/* Background */}
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0a0a0a' }]} />
          {map.backgroundImage && (
            <View style={StyleSheet.absoluteFillObject}>
              <Animated.Image
                source={map.backgroundImage}
                style={{ width: '100%', height: '100%', transform: [{ scale: 1.3 }, { translateX: bgPan }] }}
                resizeMode="contain"
              />
            </View>
          )}
          <View style={styles.arenaOverlay}>
            <View style={styles.arenaEnemyRow}>
              {enemies.map((enemy, i) => {
                const charId = battleCharIds[i] ?? stageCharIds[i] ?? stageCharIds[0];
                const eChar = CHARACTERS[charId];
                const eAttr = eChar ? ATTRIBUTES[eChar.attribute] : null;
                const isTarget = i === targetIdx;
                const isDead = enemy.currentHP <= 0;
                const maxHP = getScaledStats(eChar?.baseStats ?? enemy.stats, stage.enemyLevel).hp;
                const hasBg = !!map.backgroundImage;
                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={isDead ? 1 : 0.85}
                    onPress={() => { if (!isDead && !busy) { targetIdxRef.current = i; setTargetIdx(i); } }}
                    style={[styles.arenaEnemySlot, isDead && styles.arenaEnemyDead]}
                  >
                    {isTarget && !isDead && (
                      <View style={[styles.targetRing, { borderColor: hasBg ? '#ef4444' : colors.primary }]} />
                    )}
                    <Animated.View style={{ transform: [{ translateX: getEnemyShake(i) }] }}>
                      {CHARACTER_IMAGES[charId] ? (
                        <Image
                          source={CHARACTER_IMAGES[charId]}
                          style={[styles.arenaEnemySprite, enemies.length === 1 && styles.arenaSingleSprite]}
                          resizeMode="contain"
                        />
                      ) : (
                        <CharacterAvatar characterId={charId} size={enemies.length === 1 ? 90 : 64} plain={hasBg} borderColor={hasBg ? 'transparent' : undefined} bgColor={hasBg ? 'transparent' : undefined} />
                      )}
                      {hitFlash?.idx === i && (
                        <HitEffect key={hitFlash.key} color={ELEMENTS[hitFlash.element]?.color ?? '#ffffff'} />
                      )}
                    </Animated.View>
                    <View style={[styles.arenaEnemyInfo, { backgroundColor: hasBg ? 'rgba(0,0,0,0.6)' : colors.card }]}>
                      <Text style={[styles.arenaEnemyName, !hasBg && { color: colors.foreground }]} numberOfLines={1}>{enemy.name}</Text>
                      <View style={[styles.arenaEnemyHpTrack, { backgroundColor: hasBg ? 'rgba(255,255,255,0.2)' : colors.border }]}>
                        <View style={[
                          styles.arenaEnemyHpFill,
                          { width: `${Math.max(0, (enemy.currentHP / maxHP) * 100)}%` as any, backgroundColor: isDead ? '#6b7280' : (eAttr?.color ?? (hasBg ? '#ef4444' : colors.primary)) },
                        ]} />
                      </View>
                    </View>
                    {isDead && (
                      <View style={styles.deadOverlay}>
                        <Feather name="x-circle" size={28} color="#ef4444" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {enemies.length > 1 && (
          <Text style={[styles.targetHint, { color: colors.mutedForeground }]}>
            Toque num inimigo para selecionar o alvo
          </Text>
        )}

        {/* Battle log */}
        <ScrollView
          ref={logRef}
          style={[styles.logBox, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}
          contentContainerStyle={styles.logContent}
          showsVerticalScrollIndicator={false}
        >
          {log.map((entry, i) => (
            <Text key={i} style={[styles.logEntry, { color: entry.color }]}>{entry.text}</Text>
          ))}
        </ScrollView>

        {/* Player + team strip */}
        <View style={[styles.playerSection, { borderTopColor: colors.border }]}>
          <HPBar
            current={playerFighter.currentHP}
            max={getScaledStats(pChar?.baseStats ?? playerFighter.stats, pOwned?.level ?? 1).hp}
            color={colors.primary}
          />
          <View style={styles.playerInfoRow}>
            <View>
              <Text style={[styles.fighterName, { color: colors.foreground }]}>{playerFighter.name}</Text>
              <Text style={[styles.mpText, { color: '#a855f7' }]}>
                MP {playerFighter.currentMP}/{playerFighter.stats.mp}
              </Text>
            </View>
            <Animated.View style={{ transform: [{ translateX: playerShake }] }}>
              <View style={{ position: 'relative' }}>
                <CharacterAvatar characterId={pOwned?.characterId ?? ''} size={64} />
                {playerHitFlash && (
                  <HitEffect key={playerHitFlash.key} color={ELEMENTS[playerHitFlash.element]?.color ?? '#ffffff'} />
                )}
              </View>
            </Animated.View>
          </View>

          {teamFighters.length > 1 && (
            <View style={styles.teamStrip}>
              {teamFighters.map((tf, i) => {
                const tfOwned = collection.find((c) => c.ownedId === tf.ownedId);
                const tfChar = tfOwned ? CHARACTERS[tfOwned.characterId] : null;
                const maxHP = tfChar ? getScaledStats(tfChar.baseStats, tfOwned?.level ?? 1).hp : tf.stats.hp;
                const isActive = i === activeTeamIdx;
                const dead = tf.currentHP <= 0;
                return (
                  <TouchableOpacity
                    key={tf.ownedId}
                    activeOpacity={dead || busy || autoMode ? 1 : 0.75}
                    onPress={() => {
                      if (!dead && !busy && !autoMode && i !== activeTeamIdx) {
                        activeTeamIdxRef.current = i;
                        setActiveTeamIdx(i);
                      }
                    }}
                    style={[
                      styles.teamChip,
                      { borderColor: isActive ? colors.primary : colors.border, opacity: dead ? 0.35 : 1 },
                      isActive && { backgroundColor: colors.primary + '18' },
                      pixelStyle,
                    ]}
                  >
                    {isActive && (
                      <View style={[styles.teamChipActiveDot, { backgroundColor: colors.primary }]} />
                    )}
                    <CharacterAvatar characterId={tfOwned?.characterId ?? ''} size={28} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.teamChipName, { color: isActive ? colors.primary : colors.mutedForeground }]} numberOfLines={1}>
                        {tfChar?.name ?? '—'}
                      </Text>
                      <View style={[styles.teamChipHpTrack, { backgroundColor: colors.border }]}>
                        <View style={[styles.teamChipHpFill, {
                          width: `${Math.max(0, (tf.currentHP / maxHP) * 100)}%` as any,
                          backgroundColor: dead ? '#ef4444' : isActive ? colors.primary : '#22c55e',
                        }]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={[styles.actionsWrap, { paddingBottom: botPad + 6, borderTopColor: colors.border }]}>
          {/* Attack submenu */}
          {attackMenuOpen && !autoMode && (
            <View style={[styles.attackMenu, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePlayerAction('ATTACK')}
                style={[styles.attackOption, { borderColor: '#ef4444', backgroundColor: '#ef444418' }, pixelStyle]}
              >
                <Text style={{ fontSize: 15 }}>{ELEMENT_EMOJI[playerFighter.attackElement ?? playerFighter.element] ?? '⚔️'}</Text>
                <Text style={[styles.attackOptionLabel, { color: '#ef4444' }]}>{playerFighter.attackName ?? 'Ataque'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={canSpirit ? 0.8 : 1}
                onPress={() => canSpirit && handlePlayerAction('SPIRIT')}
                style={[styles.attackOption, {
                  borderColor: canSpirit ? '#a855f7' : colors.border,
                  backgroundColor: canSpirit ? '#a855f718' : colors.card,
                  opacity: canSpirit ? 1 : 0.45,
                }, pixelStyle]}
              >
                <Text style={{ fontSize: 15 }}>{ELEMENT_EMOJI[playerFighter.spiritElement ?? playerFighter.element] ?? '✨'}</Text>
                <Text style={[styles.attackOptionLabel, { color: canSpirit ? '#a855f7' : colors.mutedForeground }]}>
                  {playerFighter.spiritName ?? 'Espírito'} ({SPIRIT_MP_COST}MP)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setAttackMenuOpen(false)}
                style={[styles.attackCancel, { borderColor: colors.border }]}
              >
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          )}

          {/* Main action row */}
          <View style={styles.actions}>
            {autoMode ? (
              <View style={[styles.autoIndicator, { backgroundColor: '#22c55e11', borderColor: '#22c55e', flex: 1 }]}>
                <Image source={AUTO_BATTLE_IMG} style={{ width: 22, height: 22 }} resizeMode="contain" />
                <Text style={[styles.autoIndicatorText, { color: '#22c55e' }]}>{t('battle.auto')}…</Text>
              </View>
            ) : awaitingPlayerAction && !attackMenuOpen ? (
              <>
                {/* ATAQUE */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setAttackMenuOpen(true)}
                  style={[styles.actionBtn, { backgroundColor: '#ef444422', borderColor: '#ef4444' }, pixelStyle]}
                >
                  <Text style={{ fontSize: 14 }}>⚔️</Text>
                  <Text style={[styles.actionBtnLabel, { color: '#ef4444' }]}>{t('battle.attack')}</Text>
                </TouchableOpacity>
                {/* FUGIR */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handlePlayerAction('FLEE')}
                  style={[styles.actionBtn, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b' }, pixelStyle]}
                >
                  <Text style={{ fontSize: 14 }}>🏃</Text>
                  <Text style={[styles.actionBtnLabel, { color: '#f59e0b' }]}>{t('battle.flee')}</Text>
                </TouchableOpacity>
                {/* ITEM (placeholder) */}
                <TouchableOpacity
                  activeOpacity={1}
                  disabled
                  style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.4 }]}
                >
                  <Text style={{ fontSize: 14 }}>💊</Text>
                  <Text style={[styles.actionBtnLabel, { color: colors.mutedForeground }]}>Item</Text>
                </TouchableOpacity>
              </>
            ) : !autoMode && !awaitingPlayerAction ? (
              <View style={[styles.autoIndicator, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
                <Text style={{ fontSize: 14 }}>⏳</Text>
              </View>
            ) : null}

            {/* Auto toggle */}
            {(alreadyCleared || map.isDungeon) && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { setAutoMode((p) => { const n = !p; if (n) { setAutoRunCount(0); setAttackMenuOpen(false); } return n; }); }}
                style={[styles.autoBtn, { backgroundColor: autoMode ? '#22c55e22' : colors.card, borderColor: autoMode ? '#22c55e' : colors.border }, pixelStyle]}
              >
                <Image source={AUTO_BATTLE_IMG} style={{ width: 18, height: 18, opacity: autoMode ? 1 : 0.5 }} resizeMode="contain" />
                <Text style={[styles.autoBtnLabel, { color: autoMode ? '#22c55e' : colors.mutedForeground }]}>
                  {autoMode ? '⏸' : t('battle.auto')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <AlphaHealModal
          visible={alphaHealModal}
          fighters={(alphaHealCtxRef.current?.fighters ?? []) as BattleFighter[]}
          alphaIdx={alphaHealCtxRef.current?.alphaIdx ?? 0}
          onHeal={handleAlphaHeal}
          onSkip={continueAfterAlphaHeal}
          colors={colors}
        />
      </View>
    );
  }

  // ─── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const won = winner === 'player';
    const autoRunning = autoMode && won && autoRunCount < AUTO_RUN_MAX;
    const hasNextStage = !!(map?.stages[stageIndex + 1]);

    return (
      <View style={[styles.container, styles.resultCenter, { backgroundColor: colors.background }]}>
        <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: won ? '#22c55e' : '#ef4444' }, pixelStyle]}>
          {won ? (
            <Image source={require('../assets/images/victory-gabumon.gif')} style={{ width: 100, height: 100 }} resizeMode="contain" />
          ) : (
            <Feather name="x-circle" size={64} color="#ef4444" />
          )}
          <Text style={[styles.resultTitle, { color: won ? '#22c55e' : '#ef4444' }]}>
            {won ? t('battle.result.victory') : t('battle.result.defeat')}
          </Text>
          {won && dvBonusInfo && (
            <View style={[styles.rewardBox, { backgroundColor: '#60a5fa18', borderColor: '#60a5fa55' }]}>
              <Text style={{ fontSize: 14 }}>📡</Text>
              <View style={{ gap: 2 }}>
                {dvBonusInfo.active > 0 && (
                  <Text style={[styles.rewardText, { color: '#60a5fa' }]}>+{dvBonusInfo.active} XP ativo (D-2)</Text>
                )}
                {dvBonusInfo.bank > 0 && dvBonusInfo.bankCount > 0 && (
                  <Text style={[styles.rewardText, { color: '#60a5fa' }]}>+{dvBonusInfo.bank} XP banco ({dvBonusInfo.bankCount} Digimon)</Text>
                )}
              </View>
            </View>
          )}
          {won && stage && (() => {
            const ec = battleCharIds.length > 0 ? battleCharIds.length : 1;
            const totalXp = stage.expReward * ec;
            return (
              <View style={[styles.rewardBox, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
                <Feather name="award" size={16} color={colors.primary} />
                <Text style={[styles.rewardText, { color: colors.primary }]}>
                  +{totalXp} EXP ganhos{ec > 1 ? ` (${ec}× inimigos)` : ''}!
                </Text>
              </View>
            );
          })()}

          {/* Dropped items */}
          {won && droppedItems.length > 0 && (
            <View style={styles.dropsBox}>
              {droppedItems.map((drop) => {
                const img = EQUIP_ITEM_IMAGES[drop.id];
                return (
                  <View key={drop.id} style={[styles.dropChip, { borderColor: drop.color + '99', backgroundColor: drop.color + '18' }, pixelStyle]}>
                    {img ? (
                      <Image source={img} style={styles.dropChipImg} resizeMode="contain" />
                    ) : (
                      <Feather name="package" size={22} color={drop.color} />
                    )}
                    <Text style={[styles.dropChipText, { color: drop.color }]}>+{drop.amount} {drop.name}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Auto-battle indicators */}
          {autoRunning && (
            <View style={[styles.autoRestartBanner, { backgroundColor: '#22c55e11', borderColor: '#22c55e55' }]}>
              <Feather name="zap" size={14} color="#22c55e" />
              <Text style={[styles.autoRestartText, { color: '#22c55e' }]}>
                🔄 ({autoRunCount}/{AUTO_RUN_MAX})
              </Text>
            </View>
          )}
          {autoMode && won && autoRunCount >= AUTO_RUN_MAX && (
            <View style={[styles.autoRestartBanner, { backgroundColor: '#f59e0b11', borderColor: '#f59e0b55' }]}>
              <Feather name="check-circle" size={14} color="#f59e0b" />
              <Text style={[styles.autoRestartText, { color: '#f59e0b' }]}>{t('battle.auto')} ✓ ({AUTO_RUN_MAX}/{AUTO_RUN_MAX})</Text>
            </View>
          )}
          {autoMode && won && (
            <TouchableOpacity onPress={() => { setAutoMode(false); setAutoRunCount(0); }} style={[styles.resultBtnOutline, { borderColor: '#ef4444' }]}>
              <Text style={[styles.resultBtnText, { color: '#ef4444' }]}>✕ {t('battle.auto')}</Text>
            </TouchableOpacity>
          )}

          {/* Post-battle action buttons (shown when not in auto-loop) */}
          {!autoRunning && (
            <View style={styles.resultActions}>
              <TouchableOpacity
                onPress={() => router.replace(`/battle?mapId=${mapId}&stageIndex=${stageIndex}`)}
                style={[styles.resultBtn, { backgroundColor: 'transparent', borderWidth: 0 }]}
              >
                <Image
                  source={require('../assets/images/battle-again-btn.png')}
                  style={styles.startBattleBtnImg}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              {won && hasNextStage && (
                <TouchableOpacity
                  onPress={() => router.replace(`/battle?mapId=${mapId}&stageIndex=${stageIndex + 1}`)}
                  style={[styles.resultBtn, { backgroundColor: 'transparent', borderWidth: 0 }]}
                >
                  <Image
                    source={require('../assets/images/next-stage-btn.png')}
                    style={styles.nextStageBtnImg}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => router.replace('/(tabs)/map')}
                style={[styles.resultBtn, { backgroundColor: 'transparent', borderWidth: 0 }]}
              >
                <Image
                  source={require('../assets/images/back-map-btn.png')}
                  style={styles.startBattleBtnImg}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  return null;
}

// ── Alphamon heal modal (rendered outside main battle flow) ─────────────────
function AlphaHealModal({
  visible,
  fighters,
  alphaIdx,
  onHeal,
  onSkip,
  colors,
}: {
  visible: boolean;
  fighters: BattleFighter[];
  alphaIdx: number;
  onHeal: (idx: number) => void;
  onSkip: () => void;
  colors: any;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onSkip}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, width: '100%', maxWidth: 380, borderWidth: 2, borderColor: '#a855f7' }}>
          <Text style={{ color: '#a855f7', fontSize: 14, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>💎 Dádiva Divina — Alphamon</Text>
          <Text style={{ color: colors.foreground, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>Escolha um aliado para curar 20% do HP:</Text>
          {fighters.map((f, i) => {
            if (i === alphaIdx || f.currentHP <= 0) return null;
            const healAmt = Math.floor(f.stats.hp * 0.20);
            const hpPct = Math.round((f.currentHP / f.stats.hp) * 100);
            return (
              <TouchableOpacity key={i} onPress={() => onHeal(i)}
                style={{ backgroundColor: colors.muted, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#a855f730' }}>
                <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 12 }}>{f.name}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: '700' }}>+{healAmt} HP</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>HP atual: {hpPct}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={onSkip} style={{ marginTop: 6, padding: 10, alignItems: 'center' }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Pular cura</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorText: { textAlign: 'center', fontSize: 14, margin: 40 },
  backBtn: { padding: 4 },

  // ── Header ──
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '700' as const },
  battleHeader: { paddingHorizontal: 20, paddingBottom: 8, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  battleTitle: { fontSize: 14, fontWeight: '700' as const },
  enemyCountBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  enemyCountText: { fontSize: 12, fontWeight: '800' as const, color: '#ef4444' },

  // ── Select ──
  enemyPreviewCard: { margin: 20, borderRadius: 16, borderWidth: 1.5, overflow: 'hidden' },
  previewBg: { width: '100%', height: 150 },
  previewBgOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  enemyPreviewCompact: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', height: 90 },
  previewBgSmall: { width: 110, height: '100%' as any },
  previewInfoCompact: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 4, justifyContent: 'center' },
  selectScroll: { flexGrow: 0, flexShrink: 0, height: 150 },
  previewLabel: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1.5, color: '#ffffffcc' },
  previewEnemyRow: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  previewSprite: { width: 90, height: 90 },
  previewInfo: { alignItems: 'center', gap: 8, padding: 14 },
  enemyNameLg: { fontSize: 14, fontWeight: '800' as const, textAlign: 'center' },
  enemyLevel: { fontSize: 13, fontWeight: '700' as const },
  expBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  expBadgeText: { fontSize: 13, fontWeight: '700' as const },
  possibleLabel: { fontSize: 11, fontWeight: '500' as const, textAlign: 'center', marginTop: 6 },
  chooseLabel: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1, paddingHorizontal: 20, marginBottom: 12, marginTop: 8 },

  slotsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  slotCard: { flex: 1, borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', gap: 6, position: 'relative' as const, minHeight: 130 },
  slotNumBadge: { position: 'absolute' as const, top: 6, left: 6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  slotNumText: { fontSize: 11, fontWeight: '800' as const },
  slotName: { fontSize: 11, fontWeight: '700' as const, textAlign: 'center' as const },
  slotLevel: { fontSize: 11, fontWeight: '800' as const },
  slotRemoveBtn: { position: 'absolute' as const, top: 6, right: 6, width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  slotEmpty: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderStyle: 'dashed' as const, alignItems: 'center', justifyContent: 'center' },
  slotEmptyText: { fontSize: 11 },

  slotModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' },
  slotModalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%' as any },
  slotModalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  slotModalTitle: { fontSize: 13, fontWeight: '800' as const, paddingHorizontal: 20, paddingBottom: 12 },
  slotPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  slotPickerAvatar: { borderRadius: 26, borderWidth: 2, padding: 2, overflow: 'hidden' as const },
  slotPickerName: { fontSize: 12, fontWeight: '700' as const },
  slotPickerLevel: { fontSize: 12, marginTop: 2 },
  inOtherSlot: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  inOtherSlotText: { fontSize: 11, fontWeight: '600' as const },

  selectList: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  selectCard: { width: 100, borderRadius: 14, borderWidth: 1.5, padding: 10, alignItems: 'center', gap: 6, position: 'relative' as const },
  teamPosBadge: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  teamPosBadgeText: { fontSize: 11, fontWeight: '800' as const, color: '#fff' },
  selectName: { fontSize: 12, fontWeight: '700' as const },
  selectLevel: { fontSize: 12, fontWeight: '600' as const },
  startBattleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 20, borderRadius: 16, borderWidth: 1.5, paddingVertical: 4 },
  startBattleBtnText: { fontSize: 13, fontWeight: '800' as const },
  startBattleBtnImgWrap: { alignItems: 'center', gap: 2 },
  startBattleBtnImg: { width: 150, height: 48 },
  nextStageBtnImg: { width: 110, height: 35 },
  startBattleBtnCount: { fontSize: 12, fontWeight: '700' as const, marginTop: -8, letterSpacing: 0.5 },

  // ── Arena with simultaneous enemies ──
  arena: { width: '100%', height: 220, overflow: 'hidden' as const },
  arenaBgImg: { position: 'absolute' as const, top: 0, bottom: 0, left: 0, right: 0 },
  arenaOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  arenaFallback: { width: '100%', height: 180, borderBottomWidth: 1, justifyContent: 'center', alignItems: 'center' },
  arenaEnemyRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 8, flexWrap: 'wrap' },
  arenaEnemySlot: { alignItems: 'center', gap: 4, position: 'relative' as const, minWidth: 80 },
  arenaEnemyDead: { opacity: 0.4 },
  targetRing: { position: 'absolute', top: -4, left: -4, right: -4, bottom: 20, borderRadius: 12, borderWidth: 2.5, zIndex: 1 },
  elementFlashImg: { position: 'absolute', width: 72, height: 72, zIndex: 20, pointerEvents: 'none' as const },
  arenaEnemySprite: { width: 72, height: 72 },
  arenaSingleSprite: { width: 110, height: 110 },
  arenaEnemyInfo: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, alignItems: 'center', gap: 2, minWidth: 72 },
  arenaEnemyName: { fontSize: 10, fontWeight: '700' as const, color: '#ffffff', textAlign: 'center' },
  arenaEnemyHpTrack: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' as const, minWidth: 60 },
  arenaEnemyHpFill: { height: 4, borderRadius: 2 },
  deadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  targetHint: { fontSize: 10, textAlign: 'center', paddingVertical: 4 },

  // ── Player section ──
  playerSection: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 10, gap: 6 },
  playerInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fighterName: { fontSize: 14, fontWeight: '700' as const },
  mpText: { fontSize: 12, fontWeight: '600' as const },
  teamStrip: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' as const },
  teamChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1.5, padding: 5, position: 'relative' as const },
  teamChipActiveDot: { position: 'absolute' as const, top: -4, right: -4, width: 8, height: 8, borderRadius: 4 },
  teamChipName: { fontSize: 10, fontWeight: '600' as const },
  teamChipHpTrack: { height: 5, borderRadius: 3, overflow: 'hidden' as const },
  teamChipHpFill: { height: 5, borderRadius: 3 },

  // ── Log ──
  logBox: { flex: 1, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, maxHeight: 110 },
  logContent: { padding: 10, gap: 3 },
  logEntry: { fontSize: 12, lineHeight: 17 },

  // ── Actions ──
  actionsWrap: { borderTopWidth: 1 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 },
  actionBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center', gap: 4 },
  actionBtnLabel: { fontSize: 11, fontWeight: '700' as const },
  attackMenu: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  attackOption: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', gap: 4 },
  attackOptionLabel: { fontSize: 11, fontWeight: '700' as const, textAlign: 'center' as const },
  attackCancel: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  autoIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  autoIndicatorText: { fontSize: 12, fontWeight: '700' as const },
  autoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, paddingVertical: 10, paddingHorizontal: 14 },
  autoBtnLabel: { fontSize: 12, fontWeight: '700' as const },

  // ── Result ──
  dropsBox: { width: '100%', gap: 8 },
  dropChip: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8 },
  dropChipImg: { width: 32, height: 32 },
  dropChipText: { fontSize: 13, fontWeight: '700' as const, flex: 1 },
  resultCenter: { alignItems: 'center', justifyContent: 'center' },
  resultCard: { width: '80%', borderRadius: 20, borderWidth: 2, padding: 32, alignItems: 'center', gap: 16 },
  resultTitle: { fontSize: 18, fontWeight: '900' as const },
  rewardBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  rewardText: { fontSize: 12, fontWeight: '700' as const },
  resultActions: { width: '100%', gap: 10 },
  resultBtn: { width: '100%', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  resultBtnOutline: { width: '100%', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  resultBtnText: { fontSize: 13, fontWeight: '700' as const },
  autoRestartBanner: { width: '100%', borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 },
  autoRestartText: { fontSize: 13, fontWeight: '700' as const },
});
