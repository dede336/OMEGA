import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { pixelStyle } from '@/constants/pixelStyle';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { GAME_MAPS, MapStage, StageDrop } from '@/constants/gameData';
import { useLanguage } from '@/context/LanguageContext';

const STARS_3  = require('../../assets/images/ui/stars3.png');
const PADLOCK  = require('../../assets/images/ui/padlock.png');

// Shows 1-3 gold stars based on progress
function StarRating({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Text
          key={i}
          style={{ fontSize: 14, color: '#f59e0b', textShadowColor: '#92400e', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}
        >★</Text>
      ))}
    </View>
  );
}

function getMsToMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { isStageCleared, isMapUnlocked, selectedCharacter, collection, totalPlayerLevel, isDailyDungeonAvailable, customGameMaps } = useGame();
  const allMaps = [
    ...GAME_MAPS,
    ...customGameMaps.map((m) => ({
      ...m,
      backgroundImage: m.backgroundImageUri ? { uri: m.backgroundImageUri } : undefined,
    })),
  ];
  const [expandedMap, setExpandedMap] = useState<string>('map_forest');
  const [countdown, setCountdown] = useState(() => formatCountdown(getMsToMidnight()));

  useEffect(() => {
    const tick = setInterval(() => setCountdown(formatCountdown(getMsToMidnight())), 1000);
    return () => clearInterval(tick);
  }, []);

  const topPad = 0;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function handleStagePress(mapId: string, stageIndex: number, isDaily?: boolean) {
    if (!selectedCharacter) return;
    if (isDaily && !isDailyDungeonAvailable) return;
    router.push(`/battle?mapId=${mapId}&stageIndex=${stageIndex}`);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('map.title')}</Text>
        {!selectedCharacter && (
          <View style={[styles.warnBadge, { backgroundColor: '#facc15' + '22', borderColor: '#facc15' }]}>
            <Feather name="alert-triangle" size={12} color="#facc15" />
            <Text style={[styles.warnText, { color: '#facc15' }]}>{t('map.selectDigimon')}</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {allMaps.map((map) => {
          const unlocked = isMapUnlocked(map.id);
          const expanded = expandedMap === map.id;
          const clearedInMap = map.stages.filter((s: MapStage) => isStageCleared(map.id, s.index)).length;
          const allCleared = clearedInMap === map.stages.length;
          const isDungeon = map.isDungeon === true;
          const isDaily  = map.isDaily === true;
          const dailyDone = isDaily && !isDailyDungeonAvailable;
          const dungeonBorderColor = isDaily ? (isDailyDungeonAvailable ? '#f59e0b' : '#6b7280') : '#8b5cf6';
          const borderColor = isDungeon
            ? dungeonBorderColor
            : unlocked ? (allCleared ? '#22c55e' : colors.border) : colors.border + '44';

          return (
            <View key={map.id} style={[
              styles.mapCard,
              { borderColor, backgroundColor: isDungeon ? '#1a0f2e' : colors.card },
              pixelStyle,
            ]}>
              {isDungeon && !isDaily && (
                <View style={[styles.dungeonBanner, { backgroundColor: dungeonBorderColor + '33', borderBottomColor: dungeonBorderColor + '55' }]}>
                  <Feather name="alert-triangle" size={12} color={dungeonBorderColor} />
                  <Text style={[styles.dungeonBannerText, { color: dungeonBorderColor }]}>{t('map.dungeon')}</Text>
                </View>
              )}
              {isDaily && (
                <View style={[styles.dungeonBanner, { backgroundColor: (isDailyDungeonAvailable ? '#f59e0b' : '#6b728066') + '33', borderBottomColor: (isDailyDungeonAvailable ? '#f59e0b' : '#6b7280') + '55' }]}>
                  <Feather name={isDailyDungeonAvailable ? 'sun' : 'clock'} size={12} color={isDailyDungeonAvailable ? '#f59e0b' : '#9ca3af'} />
                  <Text style={[styles.dungeonBannerText, { color: isDailyDungeonAvailable ? '#f59e0b' : '#9ca3af' }]}>
                    {isDailyDungeonAvailable ? t('map.daily.available') : `${t('map.daily.resetsIn')} ${countdown}`}
                  </Text>
                </View>
              )}

              {/* Map header tap area */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => unlocked && setExpandedMap(expanded ? '' : map.id)}
              >
                {/* Background image banner */}
                {map.backgroundImage ? (
                  <ImageBackground
                    source={map.backgroundImage}
                    style={styles.mapBanner}
                    imageStyle={styles.mapBannerImage}
                  >
                    <View style={styles.mapBannerOverlay}>
                      {!unlocked && (
                        <Image source={PADLOCK} style={styles.padlockImg} resizeMode="contain" />
                      )}
                      <View style={styles.mapBannerInfo}>
                        <Text style={styles.mapBannerName}>{map.name}</Text>
                        <Text style={styles.mapBannerDesc} numberOfLines={1}>{map.description}</Text>
                        {!unlocked && !isDungeon && (
                          <Text style={styles.mapBannerLock}>{t('map.lockPrevMap')}</Text>
                        )}
                        {!unlocked && isDungeon && map.requiredTamerLevel && (
                          <Text style={[styles.mapBannerLock, { color: '#c4b5fd' }]}>
                            {t('map.lockTamerLv')}{map.requiredTamerLevel} ({t('map.lockCurrentLv')}{totalPlayerLevel})
                          </Text>
                        )}
                      </View>
                      <View style={styles.mapBannerRight}>
                        {clearedInMap > 0 ? (
                          <StarRating count={allCleared ? 3 : Math.min(clearedInMap, 2)} />
                        ) : (
                          <Text style={[styles.mapProgress, { color: '#ffffff' }]}>
                            {clearedInMap}/{map.stages.length}
                          </Text>
                        )}
                        {unlocked && (
                          <Feather
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color="#ffffffaa"
                          />
                        )}
                      </View>
                    </View>
                  </ImageBackground>
                ) : (
                  /* Plain header for maps without a background */
                  <View style={styles.mapHeader}>
                    {!unlocked && (
                      <Image source={PADLOCK} style={styles.padlockImg} resizeMode="contain" />
                    )}
                    {isDungeon && unlocked && (
                      <Feather name="shield-off" size={20} color={dungeonBorderColor} />
                    )}
                    <View style={styles.mapInfo}>
                      <Text style={[styles.mapName, { color: isDungeon ? '#c4b5fd' : (unlocked ? colors.foreground : colors.mutedForeground) }]}>{map.name}</Text>
                      <Text style={[styles.mapDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{map.description}</Text>
                      {!unlocked && !isDungeon && (
                        <Text style={[styles.lockHint, { color: colors.mutedForeground }]}>
                          {t('map.lockPrevMap')}
                        </Text>
                      )}
                      {!unlocked && isDungeon && map.requiredTamerLevel && (
                        <Text style={[styles.lockHint, { color: '#a78bfa' }]}>
                          {t('map.lockTamerLv')}{map.requiredTamerLevel} ({t('map.lockCurrentLv')}{totalPlayerLevel})
                        </Text>
                      )}
                    </View>
                    <View style={styles.mapRight}>
                      {clearedInMap > 0 ? (
                        <StarRating count={allCleared ? 3 : Math.min(clearedInMap, 2)} />
                      ) : (
                        <Text style={[styles.mapProgress, { color: colors.primary }]}>
                          {clearedInMap}/{map.stages.length}
                        </Text>
                      )}
                      {unlocked && (
                        <Feather
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={colors.mutedForeground}
                        />
                      )}
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Stage list */}
              {expanded && unlocked && (
                <View style={[styles.stagesContainer, { borderTopColor: colors.border }]}>
                  {map.stages.map((stage: MapStage) => {
                    const cleared = isStageCleared(map.id, stage.index);
                    const stageDailyLocked = isDaily && !isDailyDungeonAvailable;
                    const isBossStage = stage.isBoss === true;
                    const regularStagesCleared = !isBossStage ? true :
                      map.stages.filter((s: MapStage) => !s.isBoss).every((s: MapStage) => isStageCleared(map.id, s.index));
                    const bossLocked = isBossStage && !regularStagesCleared;
                    const canPlay = !!selectedCharacter && !stageDailyLocked && !bossLocked;

                    return (
                <TouchableOpacity
                  key={stage.index}
                  activeOpacity={canPlay ? 0.8 : 1}
                  onPress={() => canPlay && handleStagePress(map.id, stage.index, isDaily)}
                  style={[
                    styles.stageRow,
                    isBossStage && { backgroundColor: '#3b000011', borderLeftWidth: 3, borderLeftColor: '#ef4444' },
                    { borderBottomColor: colors.border, backgroundColor: isDungeon ? '#2a0f4e22' : 'transparent' },
                    isBossStage && { backgroundColor: '#3b000022' },
                    cleared && !isDaily && { backgroundColor: isBossStage ? '#22c55e22' : '#22c55e11' },
                    (stageDailyLocked || bossLocked) && { opacity: 0.55 },
                    pixelStyle,
                  ]}
                >
                        {/* Info */}
                        <View style={styles.stageInfo}>
                          <Text style={[styles.stageName, { color: isBossStage ? '#ef4444' : (isDungeon ? '#e9d5ff' : colors.foreground) }]}>{stage.name}</Text>
                          {isBossStage && !cleared && (stage as any).tamerCrestReward && (
                            <View style={styles.rewardRow}>
                              <Text style={{ fontSize: 11 }}>🏅</Text>
                              <Text style={[styles.rewardText, { color: '#f59e0b' }]}>
                                +{(stage as any).tamerCrestReward.amount}× {t('map.tamerCrest')}
                              </Text>
                            </View>
                          )}
                          {isBossStage && bossLocked && (
                            <View style={styles.rewardRow}>
                              <Feather name="lock" size={11} color="#ef4444" />
                              <Text style={[styles.rewardText, { color: '#ef4444' }]}>{t('map.bossLocked')}</Text>
                            </View>
                          )}
                          {!cleared && !isDungeon && !isBossStage && (stage as any).gemsFirstClear > 0 && (
                            <View style={styles.rewardRow}>
                              <Text style={{ fontSize: 11 }}>💎</Text>
                              <Text style={[styles.rewardText, { color: '#a78bfa' }]}>
                                +{(stage as any).gemsFirstClear} {t('map.firstClearGems')}
                              </Text>
                            </View>
                          )}
                          {cleared && !isDungeon && (
                            <View style={styles.rewardRow}>
                              <Text style={{ fontSize: 10 }}>✅</Text>
                              <Text style={[styles.rewardText, { color: '#22c55e' }]}>{t('map.cleared')}</Text>
                            </View>
                          )}
                          {!cleared && !isDungeon && !isBossStage && (
                            <View style={styles.rewardRow}>
                              <Feather name="cpu" size={11} color="#3b82f6" />
                              <Text style={[styles.rewardText, { color: '#3b82f6' }]}>{t('map.scanReward')}</Text>
                            </View>
                          )}
                          {isDungeon && stage.drops && (() => {
                            const bitsDrops  = stage.drops.filter((d: StageDrop) => d.type === 'bits');
                            const pieceDrops = stage.drops.filter((d: StageDrop) => d.type === 'piece');
                            const PIECE_KEY_MAP: Record<string, string> = {
                              piece_brasao_coragem:      'map.piece.coragem',
                              piece_brasao_esperanca:    'map.piece.esperanca',
                              piece_brasao_amizade:      'map.piece.amizade',
                              piece_brasao_confianca:    'map.piece.confianca',
                              piece_brasao_pureza:       'map.piece.pureza',
                              piece_brasao_conhecimento: 'map.piece.conhecimento',
                              piece_brasao_luz:          'map.piece.luz',
                              piece_brasao_amor:         'map.piece.amor',
                            };
                            return (
                              <>
                                {bitsDrops.map((drop: StageDrop, di: number) => (
                                  <View key={`bits-${di}`} style={styles.rewardRow}>
                                    <Image source={require('../../assets/images/bits-icon.png')} style={{ width: 14, height: 14 }} resizeMode="contain" />
                                    <Text style={[styles.rewardText, { color: '#facc15' }]}>
                                      {drop.amount.toLocaleString()} Bits ({Math.round(drop.chance * 100)}%)
                                    </Text>
                                  </View>
                                ))}
                                {pieceDrops.length > 0 && (
                                  <View style={styles.rewardRow}>
                                    <Feather name="gift" size={11} color="#f59e0b" />
                                    <Text style={[styles.rewardText, { color: '#f59e0b' }]}>
                                      {pieceDrops.length === 1
                                        ? t(PIECE_KEY_MAP[(pieceDrops[0] as any).id] ?? 'map.brasaoFragment')
                                        : `${t('map.brasaoFragment')} (${pieceDrops.length} ${t('map.brasaoFragmentTypes')})`}
                                    </Text>
                                  </View>
                                )}
                              </>
                            );
                          })()}
                        </View>

                        <View style={styles.stageRight}>
                          {stage.expReward > 0 && (
                          <View style={[styles.expTag, { backgroundColor: colors.primary + '22' }]}>
                            <Text style={[styles.expText, { color: colors.primary }]}>+{stage.expReward} EXP</Text>
                          </View>
                          )}
                          {!cleared && !isDungeon && (stage as any).gemsFirstClear > 0 && (
                            <View style={[styles.gemTag]}>
                              <Text style={styles.gemTagText}>💎 {(stage as any).gemsFirstClear}</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '800' as const },
  warnBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  warnText: { fontSize: 11, fontWeight: '600' as const },
  content: { padding: 20, gap: 14 },
  mapCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  /* Background image banner */
  mapBanner: { width: '100%', height: 120 },
  mapBannerImage: { resizeMode: 'cover' },
  mapBannerOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  mapBannerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  mapBannerInfo: { flex: 1 },
  mapBannerName: { fontSize: 14, fontWeight: '800' as const, color: '#ffffff', marginBottom: 3 },
  mapBannerDesc: { fontSize: 11, color: '#ffffffbb', lineHeight: 14 },
  mapBannerLock: { fontSize: 10, color: '#facc15cc', marginTop: 3 },
  mapBannerRight: { alignItems: 'center', gap: 4 },

  /* Plain header (no bg image) */
  mapHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  mapIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  mapInfo: { flex: 1 },
  mapName: { fontSize: 14, fontWeight: '700' as const, marginBottom: 4 },
  mapDesc: { fontSize: 12, lineHeight: 16 },
  lockHint: { fontSize: 11, marginTop: 4 },
  mapRight: { alignItems: 'center', gap: 4 },
  mapProgress: { fontSize: 14, fontWeight: '800' as const },
  starsImg: { width: 72, height: 28 },
  padlockImg: { width: 36, height: 36 },

  dungeonBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 7, borderBottomWidth: 1 },
  dungeonBannerText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.6 },

  stagesContainer: { borderTopWidth: 1 },
  stageRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, gap: 12 },
  stageNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  stageNumText: { fontSize: 13, fontWeight: '700' as const },
  stageInfo: { flex: 1, gap: 4 },
  stageName: { fontSize: 12, fontWeight: '600' as const },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rewardText: { fontSize: 11, fontWeight: '600' as const },
  stageRight: { alignItems: 'center', gap: 8 },
  expTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  expText: { fontSize: 11, fontWeight: '700' as const },
  gemTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#7c3aed22', borderWidth: 1, borderColor: '#7c3aed44' },
  gemTagText: { fontSize: 11, fontWeight: '700' as const, color: '#a78bfa' },
});
