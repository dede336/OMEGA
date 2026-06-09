import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, Pressable, Animated, Image,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';

const BATTERY_IMG_GREEN  = require('../../assets/images/battery_green.png');
const BATTERY_IMG_BLUE   = require('../../assets/images/battery_blue.png');
const BATTERY_IMG_PURPLE = require('../../assets/images/battery_purple.png');
const BATTERY_IMG_GOLD   = require('../../assets/images/battery_gold.png');

const XP_BATTERIES = [
  { id: 'piece_battery_green',  colorKey: 'battery.verde',   xp: 100,  color: '#22c55e', img: BATTERY_IMG_GREEN  },
  { id: 'piece_battery_blue',   colorKey: 'battery.azul',    xp: 200,  color: '#3b82f6', img: BATTERY_IMG_BLUE   },
  { id: 'piece_battery_purple', colorKey: 'battery.roxa',    xp: 400,  color: '#a855f7', img: BATTERY_IMG_PURPLE },
  { id: 'piece_battery_gold',   colorKey: 'battery.dourada', xp: 800,  color: '#f59e0b', img: BATTERY_IMG_GOLD   },
];
import {
  CHARACTERS, ATTRIBUTES, ELEMENTS,
  RARITY_COLORS,
  getScaledStats, expToNextLevel,
  FUSIONS,
} from '@/constants/gameData';
import { getCharacter } from '@/constants/extendedCharacters';
import { AttributeBadge, ElementBadge, StatBar, CharacterAvatar } from '@/components/GameComponents';
import { pixelStyle } from '@/constants/pixelStyle';

const DIGIVO_GIF             = require('../../assets/images/digivolution.gif');
const FUSION_GIF             = require('../../assets/images/fusion_crimson.gif');
const OMEGAMON_GIF              = require('../../assets/images/omegamon_digivolve.gif');
const OMEGAMON_FUSION_INTRO     = require('../../assets/images/omegamon_fusion_intro.gif');
const SHINEGREYMON_BM_GIF       = require('../../assets/images/characters/shinegreymonbm_special.gif');
const ROSEMON_BM_GIF            = require('../../assets/images/characters/rosemonBurstMode_status.gif');
const IMPERIALDRAMON_PM_GIF     = require('../../assets/images/characters/imperialDramonPM_status.gif');
const LIGHT_STATUS_GIF          = require('../../assets/images/light_status.gif');
const DARK_STATUS_GIF           = require('../../assets/images/dark_status.gif');
const FIRE_STATUS_GIF           = require('../../assets/images/fire_status.gif');
const PLANT_STATUS_GIF          = require('../../assets/images/plant_status.gif');
const WIND_STATUS_GIF           = require('../../assets/images/wind_status.gif');
const WATER_STATUS_GIF          = require('../../assets/images/water_status.gif');
const ICE_STATUS_GIF            = require('../../assets/images/ice_status.gif');

const ELEMENT_STATUS_GIFS: Record<string, any> = {
  LIGHT:     LIGHT_STATUS_GIF,
  DARK:      DARK_STATUS_GIF,
  FIRE:      FIRE_STATUS_GIF,
  PLANT:     PLANT_STATUS_GIF,
  WIND:      WIND_STATUS_GIF,
  WATER:     WATER_STATUS_GIF,
  ICE:       ICE_STATUS_GIF,
  LIGHTNING: require('../../assets/images/thunder_status.gif'),
};

type FusePhase = 'playing' | 'reveal' | 'done';

interface DadivaInfo {
  descKey: string;
  condKey?: string;
}

function getDadivaDivinaInfo(charName: string, requiredItem?: string): DadivaInfo | null {
  const n = charName.toLowerCase();
  if (n === 'magnamon' || n === 'craniummon' || n === 'gallantmon')
    return { descKey: 'dadiva.def_team' };
  if (n === 'ulforcevedramon')
    return { descKey: 'dadiva.spd_team' };
  if (n === 'examon' || n === 'omegamon' || n === 'leopardmon' || n === 'duftmon' || n === 'dynasmon')
    return { descKey: 'dadiva.atk_team' };
  if (n === 'jesmon' || n === 'gankoomon')
    return { descKey: 'dadiva.atk_def_team' };
  if (n === 'alphamon')
    return { descKey: 'dadiva.heal_ally' };
  if (n === 'crusadermon')
    return { descKey: 'dadiva.atk_15', condKey: 'dadiva.atk_15_cond' };
  if (n === 'imperialdramonpm' || n === 'imperialdramon pm')
    return { descKey: 'dadiva.atk_10_spd_5', condKey: 'dadiva.atk_10_spd_5_cond' };
  if (n === 'lucemonsatanmode' || n === 'lucemon satan mode' || n === 'armagedemon' || n === 'apocalymon')
    return { descKey: 'dadiva.dot' };
  if (requiredItem === 'anel_sagrado')
    return { descKey: 'dadiva.heal_team' };
  return null;
}

export default function CharacterDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { collection, selectedCharacter, setSelectedCharacter, fuseDigimon, pieces, useXpItem } = useGame();

  const [confirmFuseVisible, setConfirmFuseVisible] = useState(false);
  const [fuseSacrificeId, setFuseSacrificeId] = useState<string | null>(null);
  const [partnerPickerVisible, setPartnerPickerVisible] = useState(false);

  const [xpModalVisible, setXpModalVisible] = useState(false);
  const [selectedBattery, setSelectedBattery] = useState<string>('piece_battery_green');
  const [batteryQty, setBatteryQty] = useState(1);

  // ── Fusion animation ────────────────────────────────────────────────────────
  const [fuseAnim, setFuseAnim] = useState<{ fromCharId: string; toCharId: string } | null>(null);
  const [fusePhase, setFusePhase] = useState<FusePhase>('playing');
  const flashOpacity  = useRef(new Animated.Value(1)).current;
  const newFormOpacity = useRef(new Animated.Value(0)).current;
  const titleScale    = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!fuseAnim) return;
    if (fusePhase === 'playing') {
      // Intro GIF is 8.37s — wait for it to finish, then reveal
      const t = setTimeout(() => setFusePhase('reveal'), 8400);
      return () => clearTimeout(t);
    }
    if (fusePhase === 'reveal') {
      Animated.parallel([
        Animated.timing(newFormOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(titleScale,     { toValue: 1, useNativeDriver: true, friction: 5 }),
      ]).start(() => setFusePhase('done'));
    }
  }, [fuseAnim, fusePhase]);

  const owned = collection.find((c) => c.ownedId === id);
  const char  = owned ? (getCharacter(owned.characterId) ?? null) : null;

  if (!owned || !char) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{t('char.notFound')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, textAlign: 'center' }}>{t('char.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scaled   = getScaledStats(char.baseStats, owned.level);
  const isMaxLevel = owned.level >= 100;
  const expNeeded = isMaxLevel ? 1 : expToNextLevel(owned.level);
  const expPct   = isMaxLevel ? 1 : Math.min(1, owned.exp / expNeeded);
  const rarityColor = RARITY_COLORS[char.rarity];
  const attrData = ATTRIBUTES[char.attribute];
  const elemData = ELEMENTS[char.element];
  const isSelected = selectedCharacter?.ownedId === owned.ownedId;

  const topPad = insets.top;

  // ── Dádiva Divina info ───────────────────────────────────────────────────────
  const dadivaInfo = getDadivaDivinaInfo(char.name, (char as any).requiredItem);

  // ── Fusion info ─────────────────────────────────────────────────────────────
  const fusionRecipe   = FUSIONS[owned.characterId] ?? null;
  const allPartnerCopies = fusionRecipe
    ? collection.filter((c) => c.characterId === fusionRecipe.partner)
    : [];
  const partnerOwned  = allPartnerCopies[0] ?? null;
  const resultChar    = fusionRecipe ? CHARACTERS[fusionRecipe.resultId]  : null;
  const partnerChar   = fusionRecipe ? CHARACTERS[fusionRecipe.partner]   : null;
  const meetsLevel    = !!(fusionRecipe && owned.level >= fusionRecipe.requiredLevel);
  const canFuse       = !!(fusionRecipe && allPartnerCopies.length > 0 && meetsLevel);

  function handleFusePress() {
    if (allPartnerCopies.length === 0) return;
    if (allPartnerCopies.length === 1) {
      setFuseSacrificeId(allPartnerCopies[0].ownedId);
      setConfirmFuseVisible(true);
    } else {
      setPartnerPickerVisible(true);
    }
  }

  function handleFuseConfirm() {
    if (!fuseSacrificeId || !owned || !fusionRecipe) return;
    setConfirmFuseVisible(false);
    fuseDigimon(owned.ownedId, fuseSacrificeId);
    // Start animation
    newFormOpacity.setValue(0);
    titleScale.setValue(0.7);
    setFusePhase('playing');
    setFuseAnim({ fromCharId: owned.characterId, toCharId: fusionRecipe.resultId });
  }

  // ── Element background pulse ────────────────────────────────────────────────
  const elemPulse = useRef(new Animated.Value(0.08)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(elemPulse, { toValue: 0.22, duration: 2200, useNativeDriver: true }),
        Animated.timing(elemPulse, { toValue: 0.08, duration: 2200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [elemPulse]);

  // GIF to show: intro during 'playing', reveal GIF during 'reveal'/'done'
  const animGif =
    fusePhase === 'playing'
      ? (fuseAnim?.toCharId === 'omegamon' ? OMEGAMON_FUSION_INTRO : FUSION_GIF)
      : (fuseAnim?.toCharId === 'omegamon' ? OMEGAMON_GIF           : FUSION_GIF);
  const fuseToChar   = fuseAnim ? CHARACTERS[fuseAnim.toCharId]   : null;
  const fuseFromChar = fuseAnim ? CHARACTERS[fuseAnim.fromCharId] : null;

  const isOmegamon           = char.id === 'omegamon';
  const isShineGreymonBM     = char.id === 'shineGreymonBurstMode';
  const isRoseMonBM          = char.id === 'rosemonBurstMode';
  const isImperialDramonPM   = char.id === 'imperialDramonPM';
  const specialGif           = isOmegamon ? OMEGAMON_GIF
    : isShineGreymonBM   ? SHINEGREYMON_BM_GIF
    : isRoseMonBM        ? ROSEMON_BM_GIF
    : isImperialDramonPM ? IMPERIALDRAMON_PM_GIF
    : null;
  const elementGif = ELEMENT_STATUS_GIFS[char.element] ?? null;
  const bgGif      = specialGif ?? elementGif;

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {bgGif ? (
          <ExpoImage
            source={bgGif}
            style={styles.omegamonBgGif}
            contentFit="cover"
          />
        ) : (
          <>
            <Animated.View style={[styles.elemBgOverlay, { backgroundColor: elemData.color, opacity: elemPulse }]} />
            <Text style={[styles.elemBgLabel, { color: elemData.color }]}>{elemData.label.toUpperCase()}</Text>
          </>
        )}
      <ScrollView
        style={[styles.scrollView, styles.scrollTransparent]}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)' as never);
          }}
          style={[styles.backBtn, pixelStyle]}
        >
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </TouchableOpacity>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: elemData.color + '66' }, pixelStyle]}>
          <View style={[styles.heroStrip, { backgroundColor: elemData.color + '18' }]}>
            {bgGif ? (
              <ExpoImage
                source={bgGif}
                style={styles.heroStripGif}
                contentFit="cover"
              />
            ) : (
              <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: elemData.color, opacity: elemPulse }]} />
            )}
            <CharacterAvatar characterId={char.id} size={90} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={[styles.heroName, { color: colors.foreground }]}>{char.name}</Text>
            <Text style={[styles.heroRarity, { color: rarityColor }]}>{t(`rarity.${char.rarity}`)}</Text>
            <View style={styles.heroBadges}>
              <AttributeBadge attr={char.attribute} />
              <View style={{ width: 8 }} />
              <ElementBadge elem={char.element} />
            </View>
            <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>{char.description}</Text>

            {/* Dádiva Divina inline */}
            {dadivaInfo && (
              <View style={[styles.dadivaBadge, { backgroundColor: '#f59e0b15', borderColor: '#f59e0b55' }]}>
                <Text style={styles.dadivaBadgeTitle}>{t('char.dadiva')}</Text>
                <Text style={[styles.dadivaBadgeDesc, { color: colors.foreground }]}>{t(dadivaInfo.descKey)}</Text>
                {dadivaInfo.condKey && (
                  <Text style={[styles.dadivaBadgeCond, { color: '#f59e0b' }]}>ℹ️ {t(dadivaInfo.condKey)}</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Level & EXP */}
        <View style={[styles.levelCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
          <View style={styles.levelRow}>
            <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>{t('char.level')}</Text>
            <Text style={[styles.levelNum, { color: colors.primary }]}>{owned.level}</Text>
          </View>
          <View style={styles.expBlock}>
            <View style={styles.expHeader}>
              <Text style={[styles.expLabel, { color: colors.mutedForeground }]}>EXP</Text>
              {isMaxLevel
                ? <Text style={[styles.expValue, { color: colors.primary, fontWeight: 'bold' }]}>MAX</Text>
                : <Text style={[styles.expValue, { color: colors.foreground }]}>{owned.exp} / {expNeeded}</Text>
              }
            </View>
            <View style={[styles.expTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.expFill, { width: `${expPct * 100}%` as any, backgroundColor: isMaxLevel ? '#f59e0b' : colors.primary }]} />
            </View>
            {!isMaxLevel && (
              <Text style={[styles.expNext, { color: colors.mutedForeground }]}>
                {expNeeded - owned.exp} EXP — {t('char.expNextLevel')} {owned.level + 1}
              </Text>
            )}
          </View>
          {!isMaxLevel && (
            <TouchableOpacity
              style={[styles.xpItemBtn, { backgroundColor: '#22c55e22', borderColor: '#22c55e66' }, pixelStyle]}
              activeOpacity={0.8}
              onPress={() => { setSelectedBattery('piece_battery_green'); setBatteryQty(1); setXpModalVisible(true); }}
            >
              <Image source={BATTERY_IMG_GREEN} style={{ width: 18, height: 18 }} resizeMode="contain" />
              <Text style={[styles.xpItemBtnText, { color: '#22c55e' }]}>{t('char.useXpItem')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('char.stats')}</Text>
          <StatBar label="HP"  value={scaled.hp}  max={400} color="#22c55e" />
          <StatBar label="MP"  value={scaled.mp}  max={400} color="#00d4ff" />
          <StatBar label="ATK" value={scaled.atk} max={250} color="#ef4444" />
          <StatBar label="DEF" value={scaled.def} max={250} color="#3b82f6" />
          <StatBar label="SPT" value={scaled.spt} max={250} color="#a855f7" />
          <StatBar label="SPD" value={scaled.spd} max={250} color="#facc15" />
          <StatBar label="APT" value={scaled.apt} max={100} color="#f97316" />
        </View>

        {fusionRecipe && resultChar && partnerChar && (
          <View style={[styles.fusionCard, {
            backgroundColor: colors.card,
            borderColor: canFuse ? '#ff3c6e88' : colors.border,
          }, pixelStyle]}>
            <View style={styles.fusionHeader}>
              <Feather name="git-merge" size={16} color={canFuse ? '#ff3c6e' : colors.mutedForeground} />
              <Text style={[styles.fusionTitle, { color: canFuse ? '#ff3c6e' : colors.foreground }]}>
                {t('char.fusion')} {resultChar.name}
              </Text>
              <View style={[styles.ultraPill, { backgroundColor: '#ff3c6e22', borderColor: '#ff3c6e66' }]}>
                <Text style={styles.ultraPillText}>ULTRA</Text>
              </View>
            </View>

            {/* Diagram */}
            <View style={styles.fusionRow}>
              <View style={styles.fusionSide}>
                <CharacterAvatar characterId={owned.characterId} size={64} />
                <Text style={[styles.fusionName, { color: colors.foreground }]}>{char.name}</Text>
                <Text style={[styles.fusionSub, { color: colors.primary }]}>Lv {owned.level}</Text>
              </View>
              <View style={styles.fusionCenter}>
                <Feather name="plus" size={20} color={canFuse ? '#ff3c6e' : colors.mutedForeground} />
                <Text style={[styles.fusionArrow, { color: canFuse ? '#ff3c6e' : colors.mutedForeground }]}>→</Text>
              </View>
              <View style={styles.fusionSide}>
                <CharacterAvatar characterId={fusionRecipe.partner} size={64} dimmed={!canFuse} />
                <Text style={[styles.fusionName, { color: canFuse ? colors.foreground : colors.mutedForeground }]}>
                  {partnerChar.name}
                </Text>
                <Text style={[styles.fusionSub, { color: canFuse ? colors.primary : colors.mutedForeground }]}>
                  {canFuse ? `Lv ${partnerOwned!.level}` : t('char.notObtained')}
                </Text>
              </View>
              <View style={styles.fusionCenter}>
                <Feather name="chevrons-right" size={20} color={canFuse ? '#ff3c6e' : colors.mutedForeground} />
              </View>
              <View style={styles.fusionSide}>
                <CharacterAvatar characterId={fusionRecipe.resultId} size={64} />
                <Text style={[styles.fusionName, { color: canFuse ? '#ff3c6e' : colors.mutedForeground }]}>
                  {resultChar.name}
                </Text>
              </View>
            </View>

            {canFuse ? (
              <TouchableOpacity
                style={[styles.fuseBtn, { backgroundColor: '#ff3c6e' }, pixelStyle]}
                activeOpacity={0.85}
                onPress={handleFusePress}
              >
                <Feather name="git-merge" size={18} color="#fff" />
                <Text style={styles.fuseBtnText}>{t('char.fuseBtn')} {resultChar.name}</Text>
              </TouchableOpacity>
            ) : !meetsLevel ? (
              <View style={[styles.fuseLocked, { backgroundColor: colors.background, borderColor: '#f59e0b66' }, pixelStyle]}>
                <Feather name="trending-up" size={14} color="#f59e0b" />
                <Text style={[styles.fuseLockedText, { color: '#f59e0b' }]}>
                  {t('char.fuseLevelReq')} {fusionRecipe.requiredLevel} {t('char.fuseLevelReqSub')}
                  {' '}({t('char.fuseLevelMissing')} {fusionRecipe.requiredLevel - owned.level} {t('char.fuseLevelMissingSub')})
                </Text>
              </View>
            ) : (
              <View style={[styles.fuseLocked, { backgroundColor: colors.background, borderColor: colors.border }, pixelStyle]}>
                <Feather name="lock" size={14} color={colors.mutedForeground} />
                <Text style={[styles.fuseLockedText, { color: colors.mutedForeground }]}>
                  {t('char.fuseNeedPartner')} {partnerChar.name} {t('char.fuseNeedPartnerSub')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Attribute advantages */}
        <View style={[styles.advCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('char.attrAdv')}</Text>
          <View style={styles.advRow}>
            <View style={[styles.advTag, { backgroundColor: '#22c55e22', borderColor: '#22c55e' }]}>
              <Feather name="chevrons-up" size={14} color="#22c55e" />
              <Text style={[styles.advText, { color: '#22c55e' }]}>
                {attrData.beats ? `${t('char.effectiveVs')} ${t(`attr.${attrData.beats}`) || ATTRIBUTES[attrData.beats].label} (${attrData.beats})` : t('char.noAdvantage')}
              </Text>
            </View>
            <View style={[styles.advTag, { backgroundColor: '#ef444422', borderColor: '#ef4444' }]}>
              <Feather name="chevrons-down" size={14} color="#ef4444" />
              <Text style={[styles.advText, { color: '#ef4444' }]}>
                {attrData.weakTo ? `${t('char.weakVs')} ${t(`attr.${attrData.weakTo}`) || ATTRIBUTES[attrData.weakTo].label} (${attrData.weakTo})` : t('char.noWeakness')}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>{t('char.elemAdv')}</Text>
          <View style={styles.advRow}>
            <View style={[styles.advTag, { backgroundColor: elemData.color + '22', borderColor: elemData.color }]}>
              <Feather name="chevrons-up" size={14} color={elemData.color} />
              <Text style={[styles.advText, { color: elemData.color }]}>
                {elemData.beats ? `${t('char.effectiveVs')} ${t(`elem.${elemData.beats}`) || ELEMENTS[elemData.beats].label}` : t('char.noAdvantage')}
              </Text>
            </View>
            <View style={[styles.advTag, { backgroundColor: '#ef444422', borderColor: '#ef4444' }]}>
              <Feather name="chevrons-down" size={14} color="#ef4444" />
              <Text style={[styles.advText, { color: '#ef4444' }]}>
                {elemData.weakTo ? `${t('char.weakVs')} ${t(`elem.${elemData.weakTo}`) || ELEMENTS[elemData.weakTo].label}` : t('char.noWeakness')}
              </Text>
            </View>
          </View>
        </View>

        {/* Select button */}
        <TouchableOpacity
          onPress={() => { setSelectedCharacter(owned.ownedId); router.back(); }}
          activeOpacity={0.8}
          style={[
            styles.selectBtn,
            {
              backgroundColor: isSelected ? '#22c55e22' : colors.primary,
              borderColor: isSelected ? '#22c55e' : 'transparent',
              borderWidth: isSelected ? 1.5 : 0,
            },
            pixelStyle,
          ]}
        >
          <Feather name={isSelected ? 'check-circle' : 'zap'} size={18} color={isSelected ? '#22c55e' : colors.primaryForeground} />
          <Text style={[styles.selectBtnText, { color: isSelected ? '#22c55e' : colors.primaryForeground }]}>
            {isSelected ? t('char.isActive') : t('char.selectForBattle')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </View>

      {/* ── Partner Picker Modal (fusion) ────────────────────────────────── */}
      <Modal
        visible={partnerPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPartnerPickerVisible(false)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setPartnerPickerVisible(false)}>
          <Pressable
            style={[styles.confirmBox, { backgroundColor: colors.card, borderColor: '#f59e0b44', maxWidth: 380 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>
              ⚔️ {t('char.pickFusionPartner')}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
              {t('char.pickFusionPartnerSub')} {partnerChar?.name}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320, width: '100%' }}>
              {allPartnerCopies.map((copy) => {
                const copyChar = CHARACTERS[copy.characterId];
                const rc = RARITY_COLORS[copyChar?.rarity as keyof typeof RARITY_COLORS] ?? colors.primary;
                return (
                  <View
                    key={copy.ownedId}
                    style={[styles.pickerCard, { backgroundColor: colors.background, borderColor: '#f59e0b44' }, pixelStyle]}
                  >
                    <CharacterAvatar characterId={copy.characterId} size={52} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 14 }}>
                        {copyChar?.name ?? copy.characterId}
                      </Text>
                      <Text style={{ color: rc, fontSize: 12, marginTop: 2 }}>Lv {copy.level}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.pickerSelectBtn, { backgroundColor: '#f59e0b' }, pixelStyle]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setFuseSacrificeId(copy.ownedId);
                        setPartnerPickerVisible(false);
                        setConfirmFuseVisible(true);
                      }}
                    >
                      <Text style={styles.pickerSelectBtnText}>{t('char.select')}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={[styles.confirmCancel, { borderColor: colors.border, marginTop: 8 }]}
              onPress={() => setPartnerPickerVisible(false)}
            >
              <Text style={[styles.confirmCancelText, { color: colors.mutedForeground }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── XP Item modal ────────────────────────────────────────────────── */}
      <Modal
        visible={xpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setXpModalVisible(false)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setXpModalVisible(false)}>
          <Pressable
            style={[styles.confirmBox, { backgroundColor: colors.card, borderColor: '#22c55e44', maxWidth: 340 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>{t('char.useXpItem')}</Text>
            <Text style={[{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center', marginBottom: 12 }]}>
              {t('char.xpItemSub')}
            </Text>

            {/* Battery selector */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {XP_BATTERIES.map((b) => {
                const qty = pieces?.[b.id] ?? 0;
                const sel = selectedBattery === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => { setSelectedBattery(b.id); setBatteryQty(1); }}
                    style={[styles.batteryOption, {
                      borderColor: sel ? b.color : colors.border,
                      backgroundColor: sel ? b.color + '22' : colors.background,
                      opacity: qty === 0 ? 0.4 : 1,
                    }]}
                  >
                    <Image source={b.img} style={{ width: 36, height: 36 }} resizeMode="contain" />
                    <Text style={{ color: sel ? b.color : colors.foreground, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                      {t(b.colorKey)}
                    </Text>
                    <Text style={{ color: b.color, fontSize: 10, fontWeight: '700' }}>+{b.xp} XP</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>x{qty}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quantity picker */}
            {(() => {
              const bat = XP_BATTERIES.find((b) => b.id === selectedBattery)!;
              const maxQty = pieces?.[selectedBattery] ?? 0;
              const totalXp = bat.xp * batteryQty;
              return (
                <>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                      onPress={() => setBatteryQty((q) => Math.max(1, q - 1))}
                    >
                      <Feather name="minus" size={18} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyNum, { color: colors.foreground }]}>{batteryQty}</Text>
                    <TouchableOpacity
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                      onPress={() => setBatteryQty((q) => Math.min(maxQty, q + 1))}
                    >
                      <Feather name="plus" size={18} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: bat.color, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>
                    +{totalXp.toLocaleString()} {t('char.xpTotal')}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, textAlign: 'center', marginBottom: 16 }}>
                    {t('char.available')} {maxQty}
                  </Text>
                  <View style={styles.confirmBtnRow}>
                    <TouchableOpacity
                      style={[styles.confirmCancel, { borderColor: colors.border }]}
                      onPress={() => setXpModalVisible(false)}
                    >
                      <Text style={[styles.confirmCancelText, { color: colors.mutedForeground }]}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.confirmFuse, { backgroundColor: maxQty === 0 ? '#666' : '#22c55e', opacity: maxQty === 0 ? 0.5 : 1 }]}
                      onPress={() => {
                        if (maxQty === 0) return;
                        useXpItem(owned.ownedId, selectedBattery, batteryQty);
                        setXpModalVisible(false);
                      }}
                      disabled={maxQty === 0}
                    >
                      <Image source={bat.img} style={{ width: 16, height: 16 }} resizeMode="contain" />
                      <Text style={styles.confirmFuseText}>{t('char.useQty')} {batteryQty}×</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Fusion confirmation modal ────────────────────────────────────── */}
      <Modal
        visible={confirmFuseVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmFuseVisible(false)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setConfirmFuseVisible(false)}>
          <Pressable
            style={[styles.confirmBox, { backgroundColor: colors.card, borderColor: '#ff3c6e88' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Feather name="alert-triangle" size={28} color="#ff3c6e" style={{ alignSelf: 'center' }} />
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>{t('char.fuseConfirmTitle')}</Text>
            <Text style={[styles.confirmBody, { color: colors.mutedForeground }]}>
              {partnerChar?.name}{' '}
              <Text style={{ color: '#ff3c6e', fontWeight: '700' }}>{t('char.fuseConfirmPermanent')}</Text>
              {' '}<Text style={{ color: '#ff3c6e', fontWeight: '700' }}>{resultChar?.name}</Text>.
              {'\n\n'}{t('char.fuseConfirmUndo')}
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={[styles.confirmCancel, { borderColor: colors.border }]}
                onPress={() => setConfirmFuseVisible(false)}
              >
                <Text style={[styles.confirmCancelText, { color: colors.mutedForeground }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmFuse} onPress={handleFuseConfirm}>
                <Feather name="git-merge" size={16} color="#fff" />
                <Text style={styles.confirmFuseText}>{t('char.fuseGo')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Fusion animation overlay ─────────────────────────────────────── */}
      <Modal
        visible={fuseAnim !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { if (fusePhase === 'done') { setFuseAnim(null); router.back(); } }}
      >
        <Pressable
          style={styles.evoOverlay}
          onPress={() => { if (fusePhase === 'done') { setFuseAnim(null); router.back(); } }}
        >
          <ExpoImage source={animGif} style={styles.evoGifBg} contentFit="cover" />
          <View style={styles.evoOverlayDim} />

          <View style={styles.evoContent} pointerEvents="none">
            {(fusePhase === 'reveal' || fusePhase === 'done') && fuseAnim && (
              <>
                <Animated.Text style={[styles.evoTopLabel, styles.evoTopLabelFusion, { transform: [{ scale: titleScale }] }]}>
                </Animated.Text>
                <Animated.View style={[styles.evoAvatarWrap, { opacity: newFormOpacity }]}>
                  <CharacterAvatar characterId={fuseAnim.toCharId} size={140} />
                </Animated.View>
                <Animated.Text style={[styles.evoToName, { opacity: newFormOpacity }]}>
                  {fuseToChar?.name ?? ''}
                </Animated.Text>
                {fuseToChar && (
                  <Animated.View style={[styles.evoBadgesRowBig, { opacity: newFormOpacity }]}>
                    <AttributeBadge attr={fuseToChar.attribute} />
                    <ElementBadge   elem={fuseToChar.element}   />
                  </Animated.View>
                )}
                {fusePhase === 'done' && (
                  <Text style={styles.evoDismiss}>{t('char.tapToContinue')}</Text>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  elemBgOverlay: {
    ...StyleSheet.absoluteFillObject as any,
    zIndex: 0,
  },
  elemBgLabel: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    fontSize: 48,
    fontWeight: '900' as const,
    opacity: 0.07,
    letterSpacing: 8,
    zIndex: 0,
    pointerEvents: 'none' as any,
  },
  omegamonBgGif: {
    ...StyleSheet.absoluteFillObject as any,
    width: '100%', height: '100%',
    opacity: 0.18,
    zIndex: 0,
  },
  scrollView: { flex: 1 },
  scrollTransparent: { backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20 },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start', padding: 4 },
  errorText: { textAlign: 'center', fontSize: 14, margin: 40 },
  heroCard: { borderRadius: 20, borderWidth: 1.5, overflow: 'hidden', marginBottom: 16 },
  heroStrip: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  heroStripGif: {
    ...StyleSheet.absoluteFillObject as any,
    width: '100%', height: '100%',
    opacity: 0.35,
  },
  heroInfo: { padding: 14, gap: 6 },
  heroName: { fontSize: 15, fontWeight: '800' as const },
  heroRarity: { fontSize: 11, fontWeight: '700' as const },
  heroBadges: { flexDirection: 'row' },
  heroDesc: { fontSize: 11, lineHeight: 16 },
  levelCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12 },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  levelLabel: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1 },
  levelNum: { fontSize: 17, fontWeight: '900' as const },
  expBlock: { gap: 6 },
  expHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  expLabel: { fontSize: 11, fontWeight: '600' as const },
  expValue: { fontSize: 11 },
  expTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  expFill: { height: '100%', borderRadius: 4 },
  expNext: { fontSize: 11, textAlign: 'right' },
  statsCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },

  // ── Dádiva Divina inline badge ────────────────────────────────────────────────
  dadivaBadge: {
    borderRadius: 10, borderWidth: 1, padding: 10, gap: 4, marginTop: 4,
  },
  dadivaBadgeTitle: { fontSize: 10, fontWeight: '800' as const, color: '#f59e0b', letterSpacing: 0.5, textTransform: 'uppercase' as const },
  dadivaBadgeDesc: { fontSize: 12, fontWeight: '600' as const, lineHeight: 18 },
  dadivaBadgeCond: { fontSize: 10, fontWeight: '500' as const, lineHeight: 14, marginTop: 2 },

  // ── Fusion ──────────────────────────────────────────────────────────────────
  fusionCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 16, gap: 14 },
  fusionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fusionTitle: { fontSize: 12, fontWeight: '800' as const, flex: 1 },
  ultraPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  ultraPillText: { fontSize: 10, fontWeight: '800' as const, color: '#ff3c6e' },
  fusionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fusionSide: { alignItems: 'center', gap: 4, flex: 1 },
  fusionName: { fontSize: 11, fontWeight: '700' as const, textAlign: 'center' },
  fusionSub: { fontSize: 10, fontWeight: '600' as const },
  fusionCenter: { alignItems: 'center', gap: 2 },
  fusionArrow: { fontSize: 14, fontWeight: '900' as const },
  fuseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 14,
  },
  fuseBtnText: { fontSize: 13, fontWeight: '800' as const, color: '#fff' },
  fuseLocked: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  fuseLockedText: { fontSize: 12, flex: 1 },

  advCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  advRow: { gap: 8 },
  advTag: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  advText: { fontSize: 13, fontWeight: '600' as const },
  selectBtn: { borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  selectBtnText: { fontSize: 14, fontWeight: '700' as const },

  // ── XP item button ───────────────────────────────────────────────────────────
  xpItemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12, paddingVertical: 10, marginTop: 12,
  },
  xpItemBtnText: { fontSize: 12, fontWeight: '700' as const },

  // ── Battery selector ─────────────────────────────────────────────────────────
  batteryOption: {
    alignItems: 'center', borderWidth: 2, borderRadius: 12,
    padding: 10, minWidth: 72,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 8 },
  qtyBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 14, fontWeight: '800' as const, minWidth: 40, textAlign: 'center' },

  // ── Confirm modal ────────────────────────────────────────────────────────────
  confirmOverlay: {
    flex: 1, backgroundColor: '#00000088',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  confirmBox: { borderRadius: 20, borderWidth: 1.5, padding: 24, gap: 14, width: '100%' },
  confirmTitle: { fontSize: 15, fontWeight: '800' as const, textAlign: 'center' },
  confirmBody: { fontSize: 12, lineHeight: 22, textAlign: 'center' },
  confirmBtnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  confirmCancel: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 13, alignItems: 'center' },
  confirmCancelText: { fontSize: 12, fontWeight: '700' as const },
  confirmFuse: {
    flex: 1, borderRadius: 12, backgroundColor: '#ff3c6e',
    paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmFuseText: { fontSize: 12, fontWeight: '800' as const, color: '#fff' },

  // ── Partner picker card ───────────────────────────────────────────────────────
  pickerCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    width: '100%' as any,
  },
  pickerSelectBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pickerSelectBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800' as const,
  },

  // ── Fusion animation ─────────────────────────────────────────────────────────
  evoOverlay: {
    flex: 1, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  evoGifBg: {
    ...StyleSheet.absoluteFillObject as any,
    width: '100%', height: '100%', opacity: 0.65,
  },
  evoOverlayDim: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: '#00000055',
  },
  evoContent: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  evoTopLabel: {
    fontSize: 17, fontWeight: '900' as const,
    color: '#facc15',
    textShadowColor: '#000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
    letterSpacing: 2, textAlign: 'center',
  },
  evoTopLabelFusion: { color: '#ff3c6e' },
  evoAvatarWrap: { position: 'relative' as const, width: 140, height: 140 },
  evoSilhouette: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: '#000', borderRadius: 70,
  },
  evoFromName: {
    fontSize: 14, fontWeight: '700' as const, color: '#fff',
    textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  evoToName: {
    fontSize: 14, fontWeight: '900' as const, color: '#fff',
    textShadowColor: '#000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },
  evoBadgesRowBig: { flexDirection: 'row', gap: 10 },
  evoDismiss: {
    fontSize: 13, color: 'rgba(255,255,255,0.6)',
    marginTop: 8, textAlign: 'center',
  },
});
