import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { TAMERS, CHARACTERS } from '@/constants/gameData';
import { CharacterAvatar } from '@/components/GameComponents';
import { pixelStyle } from '@/constants/pixelStyle';
import { useLanguage } from '@/context/LanguageContext';

const TK_CARD    = require('../../assets/images/tk_card.png');
const TAI_CARD   = require('../../assets/images/tai_card.png');
const SORA_CARD  = require('../../assets/images/sora_card.png');
const MIMI_CARD  = require('../../assets/images/mimi_card.png');
const KARI_CARD  = require('../../assets/images/kari_card.png');
const MATT_CARD  = require('../../assets/images/matt_card.png');

interface LeaderboardEntry {
  rank: number;
  username: string;
  tamerLevel: number;
  tamerName: string;
  collectionSize: number;
  tamerId: string | null;
  updatedAt: string;
  bestDigimonCharId?: string | null;
  bestDigimonLevel?: number;
}

type RankType = 'level' | 'count' | 'stats';

const RANK_COLORS = ['#facc15', '#94a3b8', '#b87333'];
const RANK_ICONS = ['🥇', '🥈', '🥉'];

const TAB_CONFIG: { key: RankType; label: string; icon: string }[] = [
  { key: 'level', label: 'Tamer', icon: '⭐' },
  { key: 'count', label: 'Digimons', icon: '🐉' },
  { key: 'stats', label: 'Stats', icon: '💥' },
];

export default function RankingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, user, getApiUrl } = useAuth();
  const { t } = useLanguage();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [rankType, setRankType] = useState<RankType>('level');
  const [dataMap, setDataMap] = useState<Partial<Record<RankType, LeaderboardEntry[]>>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const data = dataMap[rankType] ?? [];
  const fetched = rankType in dataMap;

  const fetchLeaderboard = useCallback(async (type: RankType, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetch(`${getApiUrl()}/leaderboard?limit=50&type=${type}`);
      if (!res.ok) throw new Error('Erro ao carregar ranking');
      const json: LeaderboardEntry[] = await res.json();
      setDataMap((prev) => ({ ...prev, [type]: json }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro de conexão');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getApiUrl]);

  React.useEffect(() => {
    if (!(rankType in dataMap)) {
      fetchLeaderboard(rankType);
    }
  }, [rankType, dataMap, fetchLeaderboard]);

  function handleTabPress(type: RankType) {
    setRankType(type);
    if (!(type in dataMap)) fetchLeaderboard(type);
  }

  function renderEntry({ item }: { item: LeaderboardEntry }) {
    const isMe = user?.username === item.username;
    const topRank = item.rank <= 3;
    const tamer = item.tamerId ? TAMERS.find((t) => t.id === item.tamerId) : null;
    const isTK   = item.tamerId === 'tamer_tk';
    const isTai  = item.tamerId === 'tamer_tai';
    const isSora = item.tamerId === 'tamer_sora';
    const isMimi = item.tamerId === 'tamer_mimi';
    const isKari = item.tamerId === 'tamer_kari';
    const isMatt = item.tamerId === 'tamer_matt';
    const bestChar = (rankType === 'stats' && item.bestDigimonCharId) ? CHARACTERS[item.bestDigimonCharId] : null;

    return (
      <View style={[
        styles.entry,
        {
          backgroundColor: isMe ? colors.primary + '18' : colors.card,
          borderColor: isMe ? colors.primary : topRank ? RANK_COLORS[item.rank - 1] + '88' : colors.border,
          borderWidth: isMe || topRank ? 1.5 : 1,
        },
        pixelStyle,
      ]}>
        {isTK && <Image source={TK_CARD} style={styles.cardBg} resizeMode="cover" />}
        {isTai && <Image source={TAI_CARD} style={styles.cardBg} resizeMode="cover" />}
        {isSora && <Image source={SORA_CARD} style={styles.cardBg} resizeMode="cover" />}
        {isMimi && <Image source={MIMI_CARD} style={styles.cardBg} resizeMode="cover" />}
        {isKari && <Image source={KARI_CARD} style={styles.cardBg} resizeMode="cover" />}
        {isMatt && <Image source={MATT_CARD} style={styles.cardBg} resizeMode="cover" />}

        <View style={styles.rankCol}>
          {topRank ? (
            <Text style={styles.rankEmoji}>{RANK_ICONS[item.rank - 1]}</Text>
          ) : (
            <Text style={[styles.rankNum, { color: colors.mutedForeground }]}>#{item.rank}</Text>
          )}
        </View>

        <View style={styles.avatarWrap}>
          {tamer ? (
            <Image
              source={tamer.image}
              style={[
                styles.avatarImg,
                isMatt && { transform: [{ scale: 1.8 }] },
                isTK   && { transform: [{ scale: 1.2 }] },
              ]}
              resizeMode="contain"
            />
          ) : (
            <Feather name="user" size={20} color={colors.mutedForeground} />
          )}
        </View>

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={[styles.tamerName, { color: colors.foreground }]} numberOfLines={1}>
              {item.tamerName}
            </Text>
            {isMe && (
              <View style={[styles.meBadge, { backgroundColor: colors.primary }, pixelStyle]}>
                <Text style={[styles.meBadgeText, { color: colors.primaryForeground }]}>{t('ranking.you')}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.username, { color: colors.mutedForeground }]}>@{item.username}</Text>
        </View>

        <View style={styles.statsCol}>
          {rankType === 'level' && (
            <>
              <Text style={[styles.levelText, { color: colors.primary }]}>Lv {item.tamerLevel}</Text>
              <Text style={[styles.collText, { color: colors.mutedForeground }]}>{item.collectionSize} 🐉</Text>
            </>
          )}
          {rankType === 'count' && (
            <>
              <Text style={[styles.levelText, { color: '#22c55e' }]}>{item.collectionSize} 🐉</Text>
              <Text style={[styles.collText, { color: colors.mutedForeground }]}>Lv {item.tamerLevel}</Text>
            </>
          )}
          {rankType === 'stats' && (
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              {bestChar ? (
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <CharacterAvatar characterId={item.bestDigimonCharId!} size={36} />
                  <Text style={[styles.collText, { color: colors.primary }]}>Lv {item.bestDigimonLevel}</Text>
                </View>
              ) : (
                <Text style={[styles.collText, { color: colors.mutedForeground }]}>—</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('ranking.title')}</Text>
        {!token && (
          <TouchableOpacity onPress={() => router.push('/login')} style={[styles.loginBtn, { borderColor: colors.primary }]}>
            <Feather name="log-in" size={14} color={colors.primary} />
            <Text style={[styles.loginBtnText, { color: colors.primary }]}>{t('ranking.login')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        {TAB_CONFIG.map((tab) => {
          const active = rankType === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }, active && pixelStyle]}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: active ? colors.primary : colors.mutedForeground }]}>
                {tab.icon} {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !fetched ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>{t('ranking.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
          <TouchableOpacity onPress={() => fetchLeaderboard(rankType)} style={[styles.retryBtn, { borderColor: colors.border }, pixelStyle]}>
            <Text style={{ color: colors.foreground }}>{t('ranking.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.username}
          renderItem={renderEntry}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchLeaderboard(rankType, true)} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            fetched ? (
              <View style={styles.center}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('ranking.empty')}</Text>
              </View>
            ) : null
          }
          ListHeaderComponent={
            !token ? (
              <View style={[styles.loginBanner, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
                <Feather name="info" size={16} color={colors.mutedForeground} />
                <Text style={[styles.bannerText, { color: colors.mutedForeground }]}>
                  {t('ranking.loginBanner')}
                </Text>
                <TouchableOpacity onPress={() => router.push('/login')} style={[styles.bannerBtn, { backgroundColor: colors.primary }, pixelStyle]}>
                  <Text style={[styles.bannerBtnText, { color: colors.primaryForeground }]}>{t('ranking.loginBtn')}</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '900' as const },
  loginBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  loginBtnText: { fontSize: 13, fontWeight: '700' as const },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: '700' as const },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  loadingText: { fontSize: 12 },
  errorText: { fontSize: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 24 },
  list: { padding: 16, gap: 10 },
  entry: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, gap: 10, overflow: 'hidden' as const },
  cardBg: { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 180, opacity: 0.60 },
  rankCol: { width: 32, alignItems: 'center' },
  avatarWrap: { width: 44, height: 64, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 44, height: 64 },
  rankEmoji: { fontSize: 14 },
  rankNum: { fontSize: 12, fontWeight: '700' as const },
  infoCol: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tamerName: { fontSize: 13, fontWeight: '700' as const, flexShrink: 1 },
  meBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  meBadgeText: { fontSize: 10, fontWeight: '800' as const },
  username: { fontSize: 12 },
  statsCol: { alignItems: 'flex-end', gap: 2 },
  levelText: { fontSize: 13, fontWeight: '800' as const },
  collText: { fontSize: 12 },
  loginBanner: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  bannerText: { fontSize: 13, lineHeight: 18 },
  bannerBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  bannerBtnText: { fontSize: 13, fontWeight: '700' as const },
});
