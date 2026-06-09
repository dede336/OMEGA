import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  Modal, FlatList, Pressable, Platform, ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { CHARACTERS, PRE_ROOKIE_STAGE_RARITIES, RARITY_LABELS } from '@/constants/gameData';
import { getCharacter } from '@/constants/extendedCharacters';
import { pixelStyle } from '@/constants/pixelStyle';
import { CharacterAvatar } from '@/components/GameComponents';
import { useLanguage } from '@/context/LanguageContext';

const FARM_BG = require('../../assets/images/digifarm-bg.png');

const FARM_POSITIONS = [
  { left: 0.27, top: 0.25 },
  { left: 0.53, top: 0.20 },
  { left: 0.79, top: 0.25 },
  { left: 0.35, top: 0.48 },
  { left: 0.60, top: 0.52 },
  { left: 0.85, top: 0.46 },
];

const FARM_IMG_HEIGHT = 260;

function maxFarmSlots(tamerLevel: number): number {
  return Math.min(6, 1 + Math.floor(tamerLevel / 5));
}

function calcPendingXp(slots: string[], lastClaim: number, tamerLevel: number, xpPerHour: number, maxHours: number): number {
  if (slots.length === 0) return 0;
  const elapsedHours = Math.min((Date.now() - lastClaim) / 3600000, maxHours);
  const xpPerSlot = xpPerHour * (1 + tamerLevel * 0.1) * elapsedHours;
  return Math.floor(xpPerSlot * slots.length);
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function DigifarmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { collection, tamerLevel, farmSlots, farmLastClaim, farmEntryTimes, setFarmSlots, gainExp, processFarmEvolutions } = useGame();
  const { getApiUrl } = useAuth();
  const apiUrl = getApiUrl();
  const { t } = useLanguage();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 20 : insets.bottom + 20;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlotIdx, setPickerSlotIdx] = useState<number | null>(null);
  const [xpPerHour, setXpPerHour] = useState(10);
  const [maxHours, setMaxHours] = useState(8);
  const [elapsed, setElapsed] = useState('0s');
  const [pendingXp, setPendingXp] = useState(0);
  const [collecting, setCollecting] = useState(false);
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const maxSlots = maxFarmSlots(tamerLevel);

  useEffect(() => {
    fetch(`${apiUrl}/config`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.config) {
          const xph = Number(data.config.farmXpPerHour ?? 10);
          const mh = Number(data.config.farmMaxHours ?? 8);
          setXpPerHour(isNaN(xph) ? 10 : xph);
          setMaxHours(isNaN(mh) ? 8 : mh);
        }
      })
      .catch(() => {});
  }, [apiUrl]);

  useEffect(() => {
    const update = () => {
      const cappedMs = Math.min(Date.now() - farmLastClaim, maxHours * 3600000);
      setElapsed(formatDuration(cappedMs));
      setPendingXp(calcPendingXp(farmSlots, farmLastClaim, tamerLevel, xpPerHour, maxHours));
      processFarmEvolutions();
    };
    update();
    const timer = setInterval(update, 5000);
    return () => clearInterval(timer);
  }, [farmSlots, farmLastClaim, tamerLevel, xpPerHour, maxHours]);

  function openPicker(slotIdx: number) {
    setPickerSlotIdx(slotIdx);
    setPickerOpen(true);
  }

  function assignToSlot(ownedId: string) {
    if (pickerSlotIdx === null) return;
    const newSlots = [...farmSlots];
    const existingIdx = newSlots.indexOf(ownedId);
    if (existingIdx !== -1) newSlots.splice(existingIdx, 1);
    while (newSlots.length <= pickerSlotIdx) newSlots.push('');
    newSlots[pickerSlotIdx] = ownedId;
    setFarmSlots(newSlots.filter(Boolean));
    setPickerOpen(false);
  }

  function removeFromSlot(ownedId: string) {
    setFarmSlots(farmSlots.filter((id) => id !== ownedId));
  }

  function collectXp() {
    if (pendingXp <= 0 || farmSlots.length === 0) return;
    setCollecting(true);
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    const xpEach = Math.max(1, Math.floor(pendingXp / farmSlots.length));
    farmSlots.forEach((ownedId) => gainExp(ownedId, xpEach));
    setFarmSlots(farmSlots, true);
    processFarmEvolutions();
    setTimeout(() => setCollecting(false), 500);
  }

  function getEvoInfo(ownedId: string, characterId: string, level: number): { label: string; color: string } | null {
    const char = getCharacter(characterId) ?? CHARACTERS[characterId];
    if (!char) return null;
    const rarity = char.rarity as string;
    if (!PRE_ROOKIE_STAGE_RARITIES.has(rarity as any)) return null;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (rarity === 'EGG' || rarity === 'BABY') {
      const entryTime = farmEntryTimes[ownedId] ?? Date.now();
      const remaining = ONE_DAY - (Date.now() - entryTime);
      const stageName = RARITY_LABELS[rarity as keyof typeof RARITY_LABELS];
      if (remaining <= 0) return { label: `${stageName} → ${t('farm.readyToEvo')}`, color: '#22c55e' };
      return { label: `${stageName} ${t('farm.evolveIn')} ${formatDuration(remaining)}`, color: '#fbbf24' };
    }
    if (rarity === 'TRAINING') {
      if (level >= 5) return { label: `Treinamento → ${t('farm.readyToEvo')}`, color: '#22c55e' };
      return { label: `Treinamento ${t('farm.evolveAtLv')} ${level})`, color: '#60a5fa' };
    }
    return null;
  }

  const activeFarmSlots = farmSlots.slice(0, maxSlots);
  const availableDigimons = collection.filter((c) => !activeFarmSlots.includes(c.ownedId));
  const nextLevelSlot = maxSlots < 6 ? maxSlots * 5 : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('farm.title')}</Text>
        <Text style={[styles.slotsLabel, { color: colors.mutedForeground }]}>
          {activeFarmSlots.length}/{maxSlots} {t('farm.slots')} {tamerLevel}
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.farmBgContainer}>
          <Image source={FARM_BG} style={styles.farmBg} resizeMode="cover" />

          {Array.from({ length: maxSlots }).map((_, slotIdx) => {
            const pos = FARM_POSITIONS[slotIdx];
            const ownedId = activeFarmSlots[slotIdx];
            const owned = ownedId ? collection.find((c) => c.ownedId === ownedId) : null;
            const slotChar = owned ? (getCharacter(owned.characterId) ?? CHARACTERS[owned.characterId]) : null;
            const slotIsEgg = slotChar?.rarity === 'EGG';
            return (
              <View
                key={slotIdx}
                style={[styles.digimonOnFarm, { left: `${pos.left * 100}%` as any, top: pos.top * FARM_IMG_HEIGHT }]}
              >
                {owned ? (
                  <TouchableOpacity onPress={() => removeFromSlot(owned.ownedId)} activeOpacity={0.8}>
                    <View style={styles.digimonBubble}>
                      <CharacterAvatar characterId={owned.characterId} size={slotIsEgg ? 52 : 88} />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.emptySlotBtn} onPress={() => openPicker(slotIdx)} activeOpacity={0.8}>
                    <Feather name="plus" size={20} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {nextLevelSlot !== null && (
          <View style={[styles.unlockInfo, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
            <Feather name="lock" size={13} color={colors.mutedForeground} />
            <Text style={[styles.unlockText, { color: colors.mutedForeground }]}>
              {t('farm.nextSlot')} {nextLevelSlot}
            </Text>
          </View>
        )}

        <View style={[styles.xpCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
          <View style={styles.xpCardHeader}>
            <View>
              <Text style={[styles.xpTitle, { color: colors.foreground }]}>{t('farm.passiveXp')}</Text>
              <Text style={[styles.xpSub, { color: colors.mutedForeground }]}>{t('farm.accumulated')} {elapsed}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.xpValue, { color: '#22c55e' }]}>+{pendingXp.toLocaleString()} XP</Text>
              <Text style={[styles.xpRate, { color: colors.mutedForeground }]}>
                {activeFarmSlots.length > 0
                  ? `~${(xpPerHour * (1 + tamerLevel * 0.1)).toFixed(1)} ${t('farm.xpRateSuffix')}`
                  : t('farm.addDigimons')}
              </Text>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
              <TouchableOpacity
                style={[styles.collectBtn, { backgroundColor: pendingXp > 0 && !collecting ? '#22c55e' : colors.muted }, pixelStyle]}
                onPress={collectXp}
                disabled={pendingXp <= 0 || collecting || activeFarmSlots.length === 0}
                activeOpacity={0.8}
              >
              <Feather name="download" size={18} color="#fff" />
              <Text style={styles.collectBtnText}>
                {pendingXp > 0 ? `${t('farm.collect')} +${pendingXp.toLocaleString()} XP` : t('farm.noXp')}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={[styles.xpNote, { color: colors.mutedForeground }]}>
            {t('farm.xpNote').replace('{h}', String(maxHours))}
          </Text>
        </View>

        {activeFarmSlots.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('farm.onFarm')}</Text>
            {activeFarmSlots.map((ownedId) => {
              const owned = collection.find((c) => c.ownedId === ownedId);
              const char = owned ? (getCharacter(owned.characterId) ?? CHARACTERS[owned.characterId]) : null;
              if (!owned || !char) return null;
              const slotXp = Math.floor(xpPerHour * (1 + tamerLevel * 0.1) * Math.min((Date.now() - farmLastClaim) / 3600000, maxHours));
              const evoInfo = getEvoInfo(ownedId, owned.characterId, owned.level);
              return (
                <View key={ownedId} style={[styles.farmListRow, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
                  <CharacterAvatar characterId={owned.characterId} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.farmListName, { color: colors.foreground }]}>{char.name}</Text>
                    {char.rarity !== 'EGG' && (
                      <Text style={[styles.farmListLevel, { color: colors.mutedForeground }]}>{t('common.lv')} {owned.level}</Text>
                    )}
                    {evoInfo && (
                      <Text style={{ fontSize: 10, color: evoInfo.color, fontWeight: '700', marginTop: 2 }}>{evoInfo.label}</Text>
                    )}
                  </View>
                  {!evoInfo && <Text style={[styles.farmListXp, { color: '#86efac' }]}>+{slotXp} XP</Text>}
                  <TouchableOpacity onPress={() => removeFromSlot(ownedId)} style={styles.removeSlotBtn}>
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setPickerOpen(false)}>
          <Pressable style={[styles.pickerSheet, { backgroundColor: colors.card }, pixelStyle]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>{t('farm.chooseDigi')}</Text>
            {availableDigimons.length === 0 ? (
              <View style={styles.pickerEmpty}>
                <Feather name="inbox" size={36} color={colors.mutedForeground} />
                <Text style={[styles.pickerEmptyText, { color: colors.mutedForeground }]}>{t('farm.allInFarm')}</Text>
              </View>
            ) : (
              <FlatList
                data={availableDigimons}
                keyExtractor={(c) => c.ownedId}
                contentContainerStyle={{ gap: 8, paddingBottom: 40 }}
                renderItem={({ item }) => {
                  const char = getCharacter(item.characterId) ?? CHARACTERS[item.characterId];
                  if (!char) return null;
                  return (
                    <TouchableOpacity
                      style={[styles.pickerRow, { backgroundColor: colors.background, borderColor: colors.border }, pixelStyle]}
                      onPress={() => assignToSlot(item.ownedId)}
                      activeOpacity={0.8}
                    >
                      <CharacterAvatar characterId={item.characterId} size={44} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerRowName, { color: colors.foreground }]}>{char.name}</Text>
                        {char.rarity !== 'EGG' && (
                          <Text style={[styles.pickerRowLevel, { color: colors.mutedForeground }]}>{t('common.lv')} {item.level}</Text>
                        )}
                      </View>
                      <Feather name="plus-circle" size={22} color={colors.primary} />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 14, fontWeight: '900' as const },
  slotsLabel: { fontSize: 12 },
  content: { gap: 16, padding: 16 },
  farmBgContainer: { width: '100%', height: FARM_IMG_HEIGHT, borderRadius: 16, overflow: 'hidden' as const, position: 'relative' as const },
  farmBg: { width: '100%', height: FARM_IMG_HEIGHT },
  digimonOnFarm: { position: 'absolute' as const, alignItems: 'center', transform: [{ translateX: -56 }] },
  digimonBubble: {
    width: 112, height: 112, alignItems: 'center', justifyContent: 'center',
  },
  digimonLevelBadge: {
    color: '#fff', fontSize: 9, fontWeight: '800' as const,
    backgroundColor: 'rgba(34,197,94,0.9)', paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 6, marginTop: 2, textAlign: 'center', overflow: 'hidden' as const,
  },
  emptySlotBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2,
    borderStyle: 'dashed' as const, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  unlockInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  unlockText: { fontSize: 12 },
  xpCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  xpCardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  xpTitle: { fontSize: 13, fontWeight: '800' as const },
  xpSub: { fontSize: 12, marginTop: 2 },
  xpValue: { fontSize: 14, fontWeight: '900' as const },
  xpRate: { fontSize: 11, marginTop: 2 },
  collectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14 },
  collectBtnText: { color: '#fff', fontWeight: '800' as const, fontSize: 13 },
  xpNote: { fontSize: 11, textAlign: 'center' as const, lineHeight: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
  farmListRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  farmListName: { fontSize: 12, fontWeight: '700' as const },
  farmListLevel: { fontSize: 12, marginTop: 2 },
  farmListXp: { fontSize: 12, fontWeight: '700' as const },
  removeSlotBtn: { padding: 6 },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  pickerTitle: { fontSize: 14, fontWeight: '800' as const, marginBottom: 14 },
  pickerEmpty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  pickerEmptyText: { fontSize: 12, textAlign: 'center' },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  pickerRowName: { fontSize: 12, fontWeight: '700' as const },
  pickerRowLevel: { fontSize: 12, marginTop: 2 },
});
