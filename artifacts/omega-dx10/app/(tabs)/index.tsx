import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Modal, FlatList } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { CHARACTERS, ATTRIBUTES, GAME_MAPS, getScaledStats, TAMERS } from '@/constants/gameData';
import { getCharacter } from '@/constants/extendedCharacters';
import { AttributeBadge, ElementBadge, HPBar, CharacterAvatar } from '@/components/GameComponents';
import { pixelStyle } from '@/constants/pixelStyle';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/constants/i18n';

const FLAG_IMAGES: Record<Language, any> = {
  pt: require('../../assets/images/flag_pt.png'),
  en: require('../../assets/images/flag_en.png'),
  es: require('../../assets/images/flag_es.webp'),
};
const LANG_CYCLE: Language[] = ['pt', 'en', 'es'];

const GACHA_ANIME_IMG  = require('../../assets/images/gacha-anime.png');
const GEM_ICON_IMG     = require('../../assets/images/gem-icon.webp');

const TK_BG_GIF        = require('../../assets/images/tk_bg.gif');
const TAI_BG           = require('../../assets/images/tai_bg.webp');
const SORA_BG          = require('../../assets/images/sora_bg.jpg');
const MIMI_BG          = require('../../assets/images/mimi_bg.jpg');
const KARI_BG          = require('../../assets/images/kari_bg.jpg');
const MATT_BG          = require('../../assets/images/matt_bg.png');

const ELEMENT_GIFS: Record<string, any> = {
  FIRE:      require('../../assets/images/fire_status.gif'),
  WATER:     require('../../assets/images/water_status.gif'),
  ICE:       require('../../assets/images/ice_status.gif'),
  WIND:      require('../../assets/images/wind_status.gif'),
  PLANT:     require('../../assets/images/plant_status.gif'),
  LIGHT:     require('../../assets/images/light_status.gif'),
  DARK:      require('../../assets/images/dark_status.gif'),
  LIGHTNING: require('../../assets/images/thunder_status.gif'),
};

const SPECIAL_GIFS: Record<string, any> = {
  omegamon:              require('../../assets/images/omegamon_digivolve.gif'),
  shineGreymonBurstMode: require('../../assets/images/characters/shinegreymonbm_special.gif'),
  rosemonBurstMode:      require('../../assets/images/characters/rosemonBurstMode_status.gif'),
  imperialDramonPM:      require('../../assets/images/characters/imperialDramonPM_status.gif'),
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  function cycleLanguage() {
    const idx = LANG_CYCLE.indexOf(language);
    const next = LANG_CYCLE[(idx + 1) % LANG_CYCLE.length];
    setLanguage(next);
  }
  const { selectedCharacter, collection, clearedStages, playerName, totalPlayerLevel, bits, gemas, tamerId, setSelectedCharacter } = game;

  const [swapModalVisible, setSwapModalVisible] = useState(false);

  const totalStages = GAME_MAPS.reduce((s, m) => s + m.stages.length, 0);
  const clearedCount = Object.keys(clearedStages).length;

  const char = selectedCharacter ? (getCharacter(selectedCharacter.characterId) ?? CHARACTERS[selectedCharacter.characterId] ?? null) : null;
  const scaled = char && selectedCharacter ? getScaledStats(char.baseStats, selectedCharacter.level) : null;
  const attrData = char ? ATTRIBUTES[char.attribute] : null;

  const tamer = tamerId ? TAMERS.find((t) => t.id === tamerId) : null;
  const isTK   = tamerId === 'tamer_tk';
  const isTai  = tamerId === 'tamer_tai';
  const isSora = tamerId === 'tamer_sora';
  const isMimi = tamerId === 'tamer_mimi';
  const isKari = tamerId === 'tamer_kari';
  const isMatt = tamerId === 'tamer_matt';

  const botPad = Platform.OS === 'web' ? 20 : insets.bottom + 20;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: botPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── tamer top wrapper (hero + stats + actions) ── */}
      <View style={{ overflow: 'hidden' }}>
        {isTK && (
          <Image
            source={TK_BG_GIF}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.35 }]}
            resizeMode="cover"
          />
        )}
        {isTai && (
          <Image
            source={TAI_BG}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.30 }]}
            resizeMode="cover"
          />
        )}
        {isSora && (
          <Image
            source={SORA_BG}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.30 }]}
            resizeMode="cover"
          />
        )}
        {isMimi && (
          <View style={StyleSheet.absoluteFillObject}>
            <Image
              source={MIMI_BG}
              style={{ width: '100%', height: '100%', opacity: 0.30 }}
              resizeMode="cover"
            />
          </View>
        )}
        {isKari && (
          <Image
            source={KARI_BG}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.30 }]}
            resizeMode="cover"
          />
        )}
        {isMatt && (
          <Image
            source={MATT_BG}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.30 }]}
            resizeMode="cover"
          />
        )}

        {/* ── Hero banner ── */}
        <View style={[styles.heroBanner, { backgroundColor: colors.primary + '18' }]}>
        {/* Tamer portrait */}
        <View style={styles.tamerPortrait}>
          {tamer ? (
            <Image
              source={tamer.image}
              style={[
                styles.tamerPortraitImg,
                isMatt && { transform: [{ scale: 1.8 }] },
                isTK   && { transform: [{ scale: 1.2 }] },
              ]}
              resizeMode="contain"
            />
          ) : (
            <Feather name="user" size={36} color={colors.primary} />
          )}
        </View>

        {/* Welcome text */}
        <View style={styles.heroText}>
          <Text style={[styles.heroGreeting, { color: colors.primary }]}>{t('home.welcome')}</Text>
          <Text style={[styles.heroName, { color: colors.foreground }]} numberOfLines={1}>{playerName}</Text>
          {tamer && (
            <Text style={[styles.heroTamer, { color: colors.primary + 'cc' }]}>{tamer.fullName}</Text>
          )}
        </View>

        {/* Rank badge + account + language */}
        <View style={styles.heroBadges}>
          <View style={[styles.rankBadge, { backgroundColor: colors.primary, }, pixelStyle]}>
            <Text style={[styles.rankBadgeLabel, { color: colors.primaryForeground }]}>RANK</Text>
            <Text style={[styles.rankBadgeNum, { color: colors.primaryForeground }]}>{totalPlayerLevel}</Text>
          </View>
          {user ? (
            <View style={[styles.userBadge, { backgroundColor: '#22c55e22', borderColor: '#22c55e55' }, pixelStyle]}>
              <Feather name="user-check" size={11} color="#22c55e" />
              <Text style={[styles.userBadgeText, { color: '#22c55e' }]} numberOfLines={1}>{user.username}</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={[styles.userBadge, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}
            >
              <Feather name="log-in" size={11} color={colors.mutedForeground} />
              <Text style={[styles.userBadgeText, { color: colors.mutedForeground }]}>{t('home.signin')}</Text>
            </TouchableOpacity>
          )}
          {/* Language toggle flag */}
          <TouchableOpacity onPress={cycleLanguage} style={styles.langFlag} activeOpacity={0.75}>
            <Image source={FLAG_IMAGES[language]} style={styles.langFlagImg} resizeMode="cover" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats strip ── */}
      <View style={[styles.statsStrip, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
        <View style={styles.statItem}>
          <Image source={require('../../assets/images/digimon-icon.gif')} style={styles.statIcon} resizeMode="contain" />
          <Text style={[styles.statNum, { color: colors.foreground }]}>{collection.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('home.stat.digimons')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Image source={require('../../assets/images/bits-icon.png')} style={styles.statIcon} resizeMode="contain" />
          <Text style={[styles.statNum, { color: '#facc15' }]}>{bits >= 1000 ? `${(bits / 1000).toFixed(1)}k` : bits}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('home.stat.bits')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Image source={GEM_ICON_IMG} style={styles.statIcon} resizeMode="contain" />
          <Text style={[styles.statNum, { color: '#22d3ee' }]}>{gemas >= 1000 ? `${(gemas / 1000).toFixed(1)}k` : gemas}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('home.stat.gems')}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* ── Quick Actions ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/digifarm')}
            activeOpacity={0.8}
          >
            <Image source={require('../../assets/images/digifarm-icon.png')} style={styles.actionIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/collection')}
            activeOpacity={0.8}
          >
            <Image source={require('../../assets/images/digibank-icon.png')} style={styles.actionIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/mochila')}
            activeOpacity={0.8}
          >
            <Image source={require('../../assets/images/mochila-icon.png')} style={styles.actionIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/gacha')}
            activeOpacity={0.8}
          >
            <Image source={GACHA_ANIME_IMG} style={styles.actionIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>
      </View>

      <View style={styles.body}>
        {/* ── Active Digimon ── */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('home.activeDigimon')}</Text>
        {char && scaled && selectedCharacter && attrData ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setSwapModalVisible(true)}
            style={[styles.activeCard, { backgroundColor: colors.card, borderColor: attrData.color + '55' }, pixelStyle]}
          >
            {/* top colored strip */}
            <View style={[styles.activeStrip, { backgroundColor: attrData.color + '22' }]}>
              {(SPECIAL_GIFS[char.id] ?? ELEMENT_GIFS[char.element]) ? (
                <ExpoImage
                  source={SPECIAL_GIFS[char.id] ?? ELEMENT_GIFS[char.element]}
                  style={[StyleSheet.absoluteFillObject, styles.activeStripGif]}
                  contentFit="cover"
                  autoplay
                />
              ) : null}
              <CharacterAvatar characterId={char.id} size={72} />
              <View style={styles.activeInfo}>
                <Text style={[styles.activeName, { color: colors.foreground }]}>{char.name}</Text>
                <View style={styles.activeBadges}>
                  <AttributeBadge attr={char.attribute} />
                  <View style={{ width: 6 }} />
                  <ElementBadge elem={char.element} />
                </View>
                <Text style={[styles.activeLevel, { color: colors.primary }]}>{t('common.level')} {selectedCharacter.level}</Text>
              </View>
            </View>

            {/* HP */}
            <View style={styles.hpRow}>
              <HPBar current={scaled.hp} max={scaled.hp} color={colors.primary} />
            </View>

            {/* Stat grid */}
            <View style={styles.statGrid}>
              {[
                { k: 'ATK', v: scaled.atk, c: '#ef4444' },
                { k: 'DEF', v: scaled.def, c: '#3b82f6' },
                { k: 'SPT', v: scaled.spt, c: '#a855f7' },
                { k: 'SPD', v: scaled.spd, c: '#facc15' },
                { k: 'MP',  v: scaled.mp,  c: '#00d4ff' },
                { k: 'APT', v: scaled.apt, c: '#f97316' },
              ].map((s) => (
                <View key={s.k} style={[styles.miniStat, { backgroundColor: s.c + '11', borderColor: s.c + '44' }, pixelStyle]}>
                  <Text style={[styles.miniStatLabel, { color: colors.mutedForeground }]}>{s.k}</Text>
                  <Text style={[styles.miniStatValue, { color: s.c }]}>{s.v}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/collection')}
            style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}
          >
            <Feather name="plus-circle" size={32} color={colors.primary} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('home.tapToSelect')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Swap Modal ── */}
      <Modal
        visible={swapModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSwapModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }, pixelStyle]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('home.chooseActive')}</Text>
              <TouchableOpacity onPress={() => setSwapModalVisible(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={collection}
              keyExtractor={(item) => item.ownedId}
              contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
              renderItem={({ item }) => {
                const c = getCharacter(item.characterId) ?? CHARACTERS[item.characterId];
                if (!c) return null;
                const isActive = item.ownedId === selectedCharacter?.ownedId;
                const attr = ATTRIBUTES[c.attribute] ?? { color: '#6b7280' };
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => { setSelectedCharacter(item.ownedId); setSwapModalVisible(false); }}
                    style={[
                      styles.swapRow,
                      { borderBottomColor: colors.border },
                      isActive && { backgroundColor: colors.primary + '14' },
                    ]}
                  >
                    <View style={[styles.swapAvatarWrap, { borderColor: isActive ? colors.primary : attr.color + '66' }]}>
                      <CharacterAvatar characterId={c.id} size={44} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.swapName, { color: colors.foreground }]} numberOfLines={1}>{c.name}</Text>
                      <Text style={[styles.swapLevel, { color: colors.mutedForeground }]}>{t('common.level')} {item.level}</Text>
                    </View>
                    <AttributeBadge attr={c.attribute} />
                    {isActive && (
                      <View style={[styles.activePill, { backgroundColor: colors.primary }, pixelStyle]}>
                        <Text style={[styles.activePillText, { color: colors.primaryForeground }]}>{t('home.active')}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero
  heroBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, gap: 12 },
  tamerPortrait: { width: 60, height: 86 },
  tamerPortraitImg: { width: '100%' as unknown as number, height: '100%' as unknown as number },
  heroText: { flex: 1 },
  heroGreeting: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.5 },
  heroName: { fontSize: Platform.select({ web: 13, default: 15 }), fontWeight: '900' as const, marginTop: 1 },
  heroTamer: { fontSize: 10, fontWeight: '500' as const, marginTop: 1 },
  heroBadges: { alignItems: 'flex-end', gap: 6 },
  rankBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center', minWidth: 46 },
  rankBadgeLabel: { fontSize: 8, fontWeight: '700' as const, letterSpacing: 1 },
  rankBadgeNum: { fontSize: Platform.select({ web: 13, default: 15 }), fontWeight: '900' as const, lineHeight: Platform.select({ web: 15, default: 17 }) },
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 100 },
  userBadgeText: { fontSize: 10, fontWeight: '700' as const, flexShrink: 1 },
  langFlag: { width: 28, height: 20, borderRadius: 3, overflow: 'hidden' as const, borderWidth: 1, borderColor: '#ffffff22' },
  langFlagImg: { width: 28, height: 20 },

  // Stats strip
  statsStrip: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, borderRadius: 14, borderWidth: 1, padding: 12 },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, marginVertical: 4 },
  statIcon: { width: 22, height: 22 },
  statNum: { fontSize: Platform.select({ web: 12, default: 13 }), fontWeight: '800' as const },
  statLabel: { fontSize: 9 },

  body: { paddingHorizontal: 16 },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', gap: 6 },
  actionIcon: { width: 44, height: 44 },
  actionLabel: { fontSize: 12, fontWeight: '700' as const },

  sectionTitle: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' as const },

  // Active card
  activeCard: { borderRadius: 16, borderWidth: 1.5, overflow: 'hidden' as const, marginBottom: 20 },
  activeStrip: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14, minHeight: 110, overflow: 'hidden' },
  activeStripGif: { opacity: 0.55 },
  activeStripGifNative: { opacity: 0.55 },
  activeAvatarRing: { borderRadius: 40, borderWidth: 2, padding: 2 },
  activeInfo: { flex: 1 },
  activeName: { fontSize: Platform.select({ web: 13, default: 15 }), fontWeight: '800' as const, marginBottom: 5 },
  activeBadges: { flexDirection: 'row', marginBottom: 5 },
  activeLevel: { fontSize: 13, fontWeight: '700' as const },
  hpRow: { paddingHorizontal: 0, paddingBottom: 8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8, padding: 14, paddingTop: 0 },
  miniStat: { flex: 1, minWidth: '30%' as any, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center' },
  miniStatLabel: { fontSize: 10, fontWeight: '600' as const },
  miniStatValue: { fontSize: Platform.select({ web: 12, default: 13 }), fontWeight: '800' as const },

  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: 'center', gap: 12, marginBottom: 20 },
  emptyText: { fontSize: 13, textAlign: 'center' as const },

  // Swap modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' },
  modalSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1 },
  modalTitle: { fontSize: 13, fontWeight: '800' as const, letterSpacing: 0.5 },
  swapRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  swapAvatarWrap: { borderRadius: 26, borderWidth: 2, padding: 2, overflow: 'hidden' as const },
  swapName: { fontSize: 12, fontWeight: '700' as const },
  swapLevel: { fontSize: 12, marginTop: 2 },
  activePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 6 },
  activePillText: { fontSize: 10, fontWeight: '800' as const },
});
