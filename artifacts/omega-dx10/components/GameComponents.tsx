import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import {
  AttributeId, ElementId, ATTRIBUTES, ELEMENTS,
  RARITY_COLORS, RARITY_LABELS, RarityId, BaseStats,
  CHARACTERS, expToNextLevel, getScaledStats,
} from '@/constants/gameData';
import { CHARACTER_SPRITE_SHEETS, EGG_IMAGES } from '@/constants/characterImages';
import { getCharacterImageSource, getCharacterImageScale, getCharacter } from '@/constants/extendedCharacters';
import { SpriteSheet } from '@/components/SpriteSheet';
import { OwnedCharacter } from '@/context/GameContext';
import ELEMENT_IMAGES from '@/constants/elementImages';
import ATTRIBUTE_IMAGES from '@/constants/attributeImages';
import { pixelStyle } from '@/constants/pixelStyle';

const SPECIAL_EGG_ID = 'custom_1550';

export function AnimatedEgg({ characterId, element, size }: { characterId: string; element: string; size: number }) {
  const isSpecial = characterId === SPECIAL_EGG_ID;
  const imgSource = isSpecial ? EGG_IMAGES.SPECIAL : (EGG_IMAGES[element] ?? EGG_IMAGES.NULL);

  const rockAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rock = Animated.loop(
      Animated.sequence([
        Animated.timing(rockAnim, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rockAnim, { toValue: -1, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rockAnim, { toValue: 0.5, duration: 200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rockAnim, { toValue: -0.5, duration: 200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rockAnim, { toValue: 0, duration: 200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(1200),
      ])
    );
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -1, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(2000),
      ])
    );
    rock.start();
    bounce.start();
    return () => { rock.stop(); bounce.stop(); };
  }, []);

  const rotate = rockAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-12deg', '0deg', '12deg'] });
  const translateY = bounceAnim.interpolate({ inputRange: [-1, 0], outputRange: [-6, 0] });

  return (
    <Animated.View style={{ transform: [{ rotate }, { translateY }] }}>
      <Image source={imgSource} style={{ width: size, height: size }} contentFit="contain" autoplay />
    </Animated.View>
  );
}

// ─── CharacterAvatar ───────────────────────────────────────────────────────────
interface AvatarProps {
  characterId: string;
  size?: number;
  borderColor?: string;
  bgColor?: string;
  dimmed?: boolean;
  plain?: boolean;
}

// Characters that need a bigger image scale inside the avatar circle
const AVATAR_SCALE: Record<string, number> = {
  omegamon:         0.65,
  salamon:          1.3,
  palmon:           0.7,
  gabumon:          0.65,
  lucemonSatanMode: 1.5,
  penguinmon:       0.6,
  syakomon:         0.6,
  terriermon:       0.6,
  agumonSaver:      0.6,
};

export function CharacterAvatar({ characterId, size = 72, borderColor, bgColor, dimmed, plain }: AvatarProps) {
  const img = getCharacterImageSource(characterId);
  const sprite = CHARACTER_SPRITE_SHEETS[characterId];
  const char = getCharacter(characterId) ?? CHARACTERS[characterId];
  const elemData = char ? ELEMENTS[char.element] : null;
  const bc = borderColor ?? elemData?.color ?? '#00d4ff';
  const imgScale = AVATAR_SCALE[characterId] ?? getCharacterImageScale(characterId);
  const isEgg = char?.rarity === 'EGG';

  const renderSize = size * imgScale;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: dimmed ? 0.45 : 1, overflow: 'visible' }}>
      {isEgg ? (
        <AnimatedEgg characterId={characterId} element={char?.element ?? 'NULL'} size={size * 0.6} />
      ) : sprite ? (
        <SpriteSheet
          source={sprite.source}
          totalWidth={sprite.totalWidth}
          frameHeight={sprite.frameHeight}
          frameCount={sprite.frameCount}
          fps={sprite.fps}
          displaySize={renderSize}
          frameSequence={sprite.frameSequence}
        />
      ) : img ? (
        <Image source={img} style={{ width: renderSize, height: renderSize }} contentFit="contain" autoplay />
      ) : (
        <Feather name="zap" size={size * 0.5} color={bc} />
      )}
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

// ─── AttributeBadge ────────────────────────────────────────────────────────────
export function AttributeBadge({ attr }: { attr: AttributeId }) {
  const data = ATTRIBUTES[attr];
  const img = ATTRIBUTE_IMAGES[attr];
  if (img) {
    const sz = (attr === 'VC' || attr === 'VR') ? 20 : 26;
    return <Image source={img} style={{ width: sz, height: sz }} contentFit="contain" />;
  }
  return (
    <View style={[attrBadgeStyles.fallback, { backgroundColor: data.color }, pixelStyle]}>
      <Text style={attrBadgeStyles.text}>{data.abbr}</Text>
    </View>
  );
}

const attrBadgeStyles = StyleSheet.create({
  fallback: {
    width: 26, height: 26, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  text: { fontSize: 10, fontWeight: '800' as const, color: '#fff', letterSpacing: 0.3 },
});

// ─── Element emoji map ─────────────────────────────────────────────────────────
export const ELEMENT_EMOJI: Record<ElementId, string> = {
  FIRE:      '🔥',
  WATER:     '💧',
  PLANT:     '🍃',
  EARTH:     '⛰️',
  ICE:       '❄️',
  DARK:      '🌑',
  LIGHT:     '☀️',
  LIGHTNING: '⚡',
  WIND:      '🌀',
  METAL:     '⚙️',
  NULL:      '—',
};

// ─── ElementBadge ──────────────────────────────────────────────────────────────
export function ElementBadge({ elem }: { elem: ElementId }) {
  const img = ELEMENT_IMAGES[elem];
  if (img) {
    return <Image source={img} style={{ width: 22, height: 22 }} contentFit="contain" />;
  }
  return <Text style={elemBadgeStyles.emoji}>{ELEMENT_EMOJI[elem]}</Text>;
}

const elemBadgeStyles = StyleSheet.create({
  emoji: { fontSize: 14 },
});

// ─── StatBar ───────────────────────────────────────────────────────────────────
export function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(1, value / max);
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <View style={statStyles.track}>
        <View style={[statStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={statStyles.value}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { width: 40, fontSize: 11, color: '#64748b', fontWeight: '600' as const },
  track: { flex: 1, height: 6, backgroundColor: '#1e3a5f', borderRadius: 3, overflow: 'hidden', marginHorizontal: 8 },
  fill: { height: '100%', borderRadius: 3 },
  value: { width: 36, fontSize: 12, color: '#e2e8f0', fontWeight: '700' as const, textAlign: 'right' },
});

// ─── CharacterCard ─────────────────────────────────────────────────────────────
interface CharacterCardProps {
  owned: OwnedCharacter;
  onPress?: () => void;
  isSelected?: boolean;
  compact?: boolean;
  canEvolve?: boolean;
}

export function CharacterCard({ owned, onPress, isSelected, compact, canEvolve }: CharacterCardProps) {
  const colors = useColors();
  const char = getCharacter(owned.characterId);
  if (!char) return null;

  const isMaxLevel = owned.level >= 100;
  const expNeeded = isMaxLevel ? 1 : expToNextLevel(owned.level);
  const rarityColor = RARITY_COLORS[char.rarity];

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[
          cardStyles.compact,
          { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border },
          pixelStyle
        ]}
      >
        <CharacterAvatar characterId={owned.characterId} size={52} />
        <Text style={[cardStyles.compactName, { color: colors.foreground }]} numberOfLines={1}>{char.name}</Text>
        <Text style={[cardStyles.compactLevel, { color: colors.primary }]}>Lv {owned.level}</Text>
        {isSelected && <View style={[cardStyles.selectedDot, { backgroundColor: colors.primary }]} />}
        {canEvolve && (
          <View style={[cardStyles.evoBadgeCompact, { backgroundColor: '#f59e0b' }]}>
            <Text style={cardStyles.evoBadgeCompactText}>▲</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        cardStyles.card,
        {
          backgroundColor: colors.card,
          borderColor: canEvolve ? '#f59e0b' : (isSelected ? colors.primary : colors.border),
          borderWidth: canEvolve ? 2 : 1,
        },
        pixelStyle
      ]}
    >
      <View style={[cardStyles.topAccent, { backgroundColor: rarityColor }]} />

      {/* Evolution-ready badge */}
      {canEvolve && (
        <View style={cardStyles.evoBadge}>
          <Text style={cardStyles.evoBadgeText}>⬆ PRONTO PARA EVOLUIR</Text>
        </View>
      )}

      <View style={cardStyles.header}>
        <CharacterAvatar characterId={owned.characterId} size={Platform.select({ web: 56, default: 80 })} />
        <View style={[cardStyles.headerInfo, { marginLeft: Platform.select({ web: 8, default: 14 }) }]}>
          <Text numberOfLines={1} style={[cardStyles.name, { color: colors.foreground }]}>{char.name}</Text>
          <Text style={[cardStyles.rarity, { color: rarityColor }]}>{RARITY_LABELS[char.rarity]}</Text>
          <View style={cardStyles.badges}>
            <AttributeBadge attr={char.attribute} />
            <View style={{ width: 6 }} />
            <ElementBadge elem={char.element} />
          </View>
        </View>
        <View style={cardStyles.levelBox}>
          <Text style={[cardStyles.levelLabel, { color: colors.mutedForeground }]}>LV</Text>
          <Text style={[cardStyles.levelNum, { color: colors.primary }]}>{owned.level}</Text>
        </View>
      </View>

      <View style={[cardStyles.expRow, { paddingHorizontal: Platform.select({ web: 10, default: 16 }), paddingBottom: Platform.select({ web: 10, default: 14 }) }]}>
        <Text style={[cardStyles.expLabel, { color: colors.mutedForeground }]}>EXP</Text>
        <View style={[cardStyles.expTrack, { backgroundColor: colors.border }]}>
          <View style={[cardStyles.expFill, { width: isMaxLevel ? '100%' : `${Math.min(1, owned.exp / expNeeded) * 100}%` as any, backgroundColor: isMaxLevel ? '#f59e0b' : colors.primary }]} />
        </View>
        <Text style={[cardStyles.expText, { color: isMaxLevel ? '#f59e0b' : colors.mutedForeground, fontWeight: isMaxLevel ? 'bold' : 'normal' }]}>
          {isMaxLevel ? 'MAX' : `${owned.exp}/${expNeeded}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: Platform.select({ web: 8, default: 14 }) },
  topAccent: { height: 3, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', padding: Platform.select({ web: 10, default: 16 }) },
  headerInfo: { flex: 1 },
  name: { fontSize: Platform.select({ web: 14, default: 20 }), fontWeight: '700' as const, marginBottom: 2 },
  rarity: { fontSize: Platform.select({ web: 10, default: 12 }), fontWeight: '600' as const, marginBottom: Platform.select({ web: 4, default: 8 }) },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  levelBox: { alignItems: 'center' },
  levelLabel: { fontSize: 10, fontWeight: '600' as const },
  levelNum: { fontSize: Platform.select({ web: 18, default: 28 }), fontWeight: '800' as const },
  divider: { height: 1, marginHorizontal: 16 },
  stats: { padding: 16, paddingBottom: 8 },
  expRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  expLabel: { fontSize: 11, fontWeight: '600' as const, width: 30 },
  expTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  expFill: { height: '100%', borderRadius: 2 },
  expText: { fontSize: 10, width: 60, textAlign: 'right' },
  compact: {
    width: 90, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', padding: 10, marginRight: 10,
    position: 'relative' as const,
  },
  compactName: { fontSize: 12, fontWeight: '700' as const, textAlign: 'center', marginBottom: 2 },
  compactLevel: { fontSize: 11, fontWeight: '600' as const },
  selectedDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  evoBadge: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 2,
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  evoBadgeText: { fontSize: 10, fontWeight: '800' as const, color: '#000', letterSpacing: 0.5 },
  evoBadgeCompact: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evoBadgeCompactText: { fontSize: 8, fontWeight: '800' as const, color: '#000' },
});

// ─── ScanCard ──────────────────────────────────────────────────────────────────
interface ScanCardProps {
  characterId: string;
  scanPct: number;
  onCreate: () => void;
}

export function ScanCard({ characterId, scanPct, onCreate }: ScanCardProps) {
  const colors = useColors();
  const char = CHARACTERS[characterId];
  if (!char) return null;

  const rarityColor = RARITY_COLORS[char.rarity];
  const complete = scanPct >= 100;
  const pct = Math.min(100, scanPct);

  return (
    <View style={[scanStyles.card, { backgroundColor: colors.card, borderColor: complete ? colors.primary : colors.border }, pixelStyle]}>
      <View style={[scanStyles.topAccent, { backgroundColor: rarityColor + (complete ? 'ff' : '55') }]} />
      <View style={scanStyles.header}>
        <CharacterAvatar characterId={characterId} size={Platform.select({ web: 56, default: 80 })} dimmed={!complete} />
        <View style={[scanStyles.info, { marginLeft: Platform.select({ web: 8, default: 14 }) }]}>
          <Text numberOfLines={1} style={[scanStyles.name, { color: complete ? colors.foreground : colors.mutedForeground }]}>{char.name}</Text>
          <Text style={[scanStyles.rarity, { color: rarityColor }]}>{RARITY_LABELS[char.rarity]}</Text>
          <View style={scanStyles.badges}>
            <AttributeBadge attr={char.attribute} />
            <View style={{ width: 6 }} />
            <ElementBadge elem={char.element} />
          </View>
        </View>
        <View style={scanStyles.pctBox}>
          <Text style={[scanStyles.pctNum, { color: complete ? colors.primary : colors.mutedForeground }]}>
            {Math.round(pct)}%
          </Text>
          <Text style={[scanStyles.pctLabel, { color: colors.mutedForeground }]}>scan</Text>
        </View>
      </View>

      <View style={[scanStyles.progressRow, { paddingHorizontal: Platform.select({ web: 10, default: 16 }), paddingBottom: complete ? 8 : Platform.select({ web: 10, default: 16 }) }]}>
        <View style={[scanStyles.track, { backgroundColor: colors.border }]}>
          <View style={[
            scanStyles.fill,
            { width: `${pct}%` as any, backgroundColor: complete ? colors.primary : '#3b82f6' },
          ]} />
        </View>
        <Text style={[scanStyles.trackLabel, { color: colors.mutedForeground }]}>
          {complete ? 'Scan completo!' : `${Math.round(pct)}/100`}
        </Text>
      </View>

      {complete && (
        <TouchableOpacity
          onPress={onCreate}
          activeOpacity={0.8}
          style={[scanStyles.createBtn, { backgroundColor: colors.primary, marginHorizontal: 16, marginBottom: 14 }, pixelStyle]}
        >
          <Feather name="plus-circle" size={16} color={colors.primaryForeground} />
          <Text style={[scanStyles.createBtnText, { color: colors.primaryForeground }]}>Criar Digimon</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const scanStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: Platform.select({ web: 8, default: 14 }) },
  topAccent: { height: 3, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', padding: Platform.select({ web: 10, default: 16 }), paddingBottom: Platform.select({ web: 8, default: 12 }) },
  info: { flex: 1 },
  name: { fontSize: Platform.select({ web: 14, default: 20 }), fontWeight: '700' as const, marginBottom: 2 },
  rarity: { fontSize: Platform.select({ web: 10, default: 12 }), fontWeight: '600' as const, marginBottom: Platform.select({ web: 4, default: 8 }) },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pctBox: { alignItems: 'center', minWidth: Platform.select({ web: 40, default: 52 }) },
  pctNum: { fontSize: Platform.select({ web: 15, default: 22 }), fontWeight: '800' as const },
  pctLabel: { fontSize: 10, fontWeight: '600' as const, marginTop: 2 },
  progressRow: { gap: 4 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  trackLabel: { fontSize: 11, textAlign: 'right' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 12 },
  createBtnText: { fontSize: 13, fontWeight: '700' as const },
});

// ─── LockedCard ────────────────────────────────────────────────────────────────
interface LockedCardProps {
  hint: string;
  label?: string;
}

export function LockedCard({ hint, label = 'Evolução Especial' }: LockedCardProps) {
  const colors = useColors();
  return (
    <View style={[lockedStyles.card, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
      <View style={[lockedStyles.topAccent, { backgroundColor: '#f59e0b55' }]} />
      <View style={lockedStyles.inner}>
        <View style={[lockedStyles.avatar, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="lock" size={32} color={colors.mutedForeground} />
        </View>
        <View style={lockedStyles.info}>
          <Text style={[lockedStyles.label, { color: '#f59e0b' }]}>{label}</Text>
          <Text style={[lockedStyles.hint, { color: colors.mutedForeground }]}>{hint}</Text>
        </View>
      </View>
    </View>
  );
}

const lockedStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  topAccent: { height: 3, width: '100%' },
  inner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700' as const, marginBottom: 6 },
  hint: { fontSize: 13, lineHeight: 18 },
});

// ─── HPBar ─────────────────────────────────────────────────────────────────────
export function HPBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(1, current / max));
  const barColor = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#facc15' : '#ef4444';
  return (
    <View style={hpStyles.container}>
      <View style={[hpStyles.track, { borderColor: color + '44' }]}>
        <View style={[hpStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
      </View>
      <Text style={[hpStyles.text, { color }]}>{current}/{max}</Text>
    </View>
  );
}

const hpStyles = StyleSheet.create({
  container: { width: '100%', gap: 4 },
  track: { height: 10, backgroundColor: '#1e3a5f', borderRadius: 5, borderWidth: 1, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  text: { fontSize: 12, fontWeight: '700' as const, textAlign: 'center' },
});
