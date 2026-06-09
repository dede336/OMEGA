import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame, MailMessage } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { CHARACTERS } from '@/constants/gameData';
import { getCharacterImageSource as _getCharImg } from '@/constants/extendedCharacters';
import { pixelStyle } from '@/constants/pixelStyle';
import { useLanguage } from '@/context/LanguageContext';

const CHARACTER_IMAGES = new Proxy({} as Record<string, any>, { get: (_t, p) => _getCharImg(String(p)) });
const SAVE_KEY = 'omega_dx10_save_v3';

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

export default function CorreiosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const { messages, tamerLevel, readMessage, claimReward, loadFromCloud } = game;
  const { getApiUrl, token } = useAuth();
  const { t } = useLanguage();

  const handleClaim = useCallback(async (msgId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg || msg.rewardClaimed || !token) return;

    const reward = msg.reward;
    const base = Date.now();
    let newBits = game.bits;
    let newInventory = [...game.inventory];
    let newCollection = [...game.collection];

    if (reward?.bits) newBits += reward.bits;
    if (reward?.items) {
      for (const itemId of reward.items) {
        if (!newInventory.includes(itemId)) newInventory.push(itemId);
      }
    }
    const newPieces = { ...(game.pieces ?? {}) };
    if (reward?.pieces) {
      for (const [pieceId, amount] of Object.entries(reward.pieces)) {
        newPieces[pieceId] = (newPieces[pieceId] ?? 0) + amount;
      }
    }
    if (reward?.digimon) {
      reward.digimon.forEach((characterId, i) => {
        if (newCollection.length < 500) {
          newCollection.push({ ownedId: `owned_${characterId}_${base}_${i}`, characterId, level: 1, exp: 0 });
        }
      });
    }
    if (reward?.digimonWithLevel) {
      reward.digimonWithLevel.forEach(({ characterId, level }, i) => {
        if (newCollection.length < 500) {
          newCollection.push({ ownedId: `owned_${characterId}_${base}_digi_${i}`, characterId, level, exp: 0 });
        }
      });
    }
    const updatedMessages = messages.map((m) =>
      m.id === msgId ? { ...m, isRead: true, rewardClaimed: true } : m
    );

    claimReward(msgId);

    try {
      const raw = await AsyncStorage.getItem(SAVE_KEY);
      const baseSave = raw ? JSON.parse(raw) : {};
      const saveData = {
        ...baseSave,
        bits: newBits,
        inventory: newInventory,
        collection: newCollection,
        pieces: newPieces,
        messages: updatedMessages,
      };
      await fetch(`${getApiUrl()}/saves`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ saveData }),
      });
    } catch {}
  }, [claimReward, game, messages, getApiUrl, token]);

  useFocusEffect(useCallback(() => {
    loadFromCloud(getApiUrl());
  }, [loadFromCloud, getApiUrl]));

  const sorted = [...messages].sort((a, b) => b.createdAt - a.createdAt);

  function isUnlocked(msg: MailMessage): boolean {
    return !msg.unlocksAtTamerLevel || tamerLevel >= msg.unlocksAtTamerLevel;
  }

  function handleOpen(msg: MailMessage) {
    if (!msg.isRead && isUnlocked(msg)) readMessage(msg.id);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: 20, paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <Image
          source={require('../../assets/images/mailbox-icon.png')}
          style={styles.headerIcon}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t('correio.title')}</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {t('correio.subtitle')}
          </Text>
        </View>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Feather name="inbox" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('correio.empty')}</Text>
        </View>
      ) : (
        sorted.map((msg) => {
          const unlocked = isUnlocked(msg);
          const hasUnclaimed = !!msg.reward && !msg.rewardClaimed;
          const borderColor = !unlocked
            ? colors.border
            : !msg.isRead
            ? '#3b82f6'
            : hasUnclaimed
            ? '#f59e0b'
            : colors.border;

          return (
            <TouchableOpacity
              key={msg.id}
              style={[
                styles.msgCard,
                {
                  backgroundColor: colors.card,
                  borderColor,
                  borderWidth: (!msg.isRead && unlocked) ? 2 : 1,
                  opacity: !unlocked ? 0.65 : 1,
                },
                pixelStyle,
              ]}
              onPress={() => handleOpen(msg)}
              activeOpacity={unlocked ? 0.85 : 1}
            >
              {/* unread dot */}
              {!msg.isRead && unlocked && (
                <View style={[styles.unreadDot, { backgroundColor: '#3b82f6' }]} />
              )}

              <View style={styles.msgTop}>
                <View style={styles.msgTitleRow}>
                  <Feather
                    name={!unlocked ? 'lock' : 'mail'}
                    size={16}
                    color={!unlocked ? colors.mutedForeground : (!msg.isRead ? '#3b82f6' : colors.mutedForeground)}
                    style={{ marginTop: 1 }}
                  />
                  <Text style={[styles.msgTitle, { color: colors.foreground, fontWeight: (!msg.isRead && unlocked) ? '800' : '600' }]}>
                    {msg.title}
                  </Text>
                </View>
                <Text style={[styles.msgDate, { color: colors.mutedForeground }]}>
                  {formatDate(msg.createdAt)}
                </Text>
              </View>

              {/* locked notice */}
              {!unlocked && msg.unlocksAtTamerLevel && (
                <View style={[styles.lockedBanner, { backgroundColor: '#6b728022', borderColor: '#6b728055' }, pixelStyle]}>
                  <Feather name="lock" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.lockedText, { color: colors.mutedForeground }]}>
                    {t('correio.lockedRank')} {msg.unlocksAtTamerLevel} ({t('correio.lockedCurrent')}{tamerLevel})
                  </Text>
                </View>
              )}

              {unlocked && (
                <Text style={[styles.msgBody, { color: colors.mutedForeground }]}>
                  {msg.body}
                </Text>
              )}

              {/* reward section */}
              {msg.reward && unlocked && (
                <View style={[styles.rewardBox, { backgroundColor: msg.rewardClaimed ? colors.background : '#f59e0b11', borderColor: msg.rewardClaimed ? colors.border : '#f59e0b66' }, pixelStyle]}>
                  <View style={styles.rewardRow}>
                    <Feather name="gift" size={14} color={msg.rewardClaimed ? colors.mutedForeground : '#f59e0b'} />
                    <Text style={[styles.rewardLabel, { color: msg.rewardClaimed ? colors.mutedForeground : '#f59e0b' }]}>
                      {t('correio.reward')}
                    </Text>
                  </View>
                  <View style={styles.rewardItems}>
                    {msg.reward.bits && (
                      <View style={[styles.rewardChip, { backgroundColor: '#eab30822', borderColor: '#eab30855' }, pixelStyle]}>
                        <Text style={[styles.rewardChipText, { color: '#eab308' }]}>
                          🪙 {msg.reward.bits.toLocaleString()} Bits
                        </Text>
                      </View>
                    )}
                    {msg.reward.items?.map((itemId) => (
                      <View key={itemId} style={[styles.rewardChip, { backgroundColor: '#8b5cf622', borderColor: '#8b5cf655' }, pixelStyle]}>
                        <Text style={[styles.rewardChipText, { color: '#8b5cf6' }]}>{t(`item.${itemId}`) || itemId}</Text>
                      </View>
                    ))}
                    {msg.reward.digimon && (() => {
                      const counts: Record<string, number> = {};
                      for (const id of msg.reward.digimon) counts[id] = (counts[id] ?? 0) + 1;
                      return Object.entries(counts).map(([charId, count]) => {
                        const char = CHARACTERS[charId];
                        const img = CHARACTER_IMAGES[charId];
                        return (
                          <View key={charId} style={[styles.digiRewardChip, { backgroundColor: '#22c55e22', borderColor: '#22c55e55' }, pixelStyle]}>
                            {img && (
                              <Image source={img} style={styles.digiRewardImg} resizeMode="contain" />
                            )}
                            <Text style={[styles.rewardChipText, { color: '#22c55e' }]}>
                              {count > 1 ? `${count}x ` : ''}{char?.name ?? charId}
                            </Text>
                          </View>
                        );
                      });
                    })()}
                  </View>
                  {!msg.rewardClaimed ? (
                    <TouchableOpacity
                      style={[styles.claimBtn, { backgroundColor: '#f59e0b', borderColor: '#d97706' }, pixelStyle]}
                      onPress={() => handleClaim(msg.id)}
                      activeOpacity={0.8}
                    >
                      <Feather name="download" size={14} color="#fff" />
                      <Text style={styles.claimBtnText}>{t('correio.claim')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.claimedBadge, { borderColor: colors.border }, pixelStyle]}>
                      <Feather name="check-circle" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.claimedText, { color: colors.mutedForeground }]}>{t('correio.claimed')}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24,
  },
  headerIcon: { width: 52, height: 52 },
  headerTitle: { fontSize: 14, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 2 },

  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 16 },
  emptyText: { fontSize: 13 },

  msgCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    gap: 10,
    position: 'relative' as const,
  },
  unreadDot: {
    position: 'absolute' as const,
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  msgTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  msgTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  msgTitle: { fontSize: 13, flexShrink: 1 },
  msgDate: { fontSize: 11, marginLeft: 8 },
  msgBody: { fontSize: 13, lineHeight: 19 },

  lockedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6,
  },
  lockedText: { fontSize: 12 },

  rewardBox: {
    borderRadius: 12, borderWidth: 1, padding: 12, gap: 8, marginTop: 4,
  },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rewardLabel: { fontSize: 13, fontWeight: '700' },
  rewardItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rewardChip: {
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4,
  },
  rewardChipText: { fontSize: 12, fontWeight: '700' },
  digiRewardChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4,
  },
  digiRewardImg: { width: 28, height: 28 },
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 10,
  },
  claimBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  claimedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center', borderRadius: 10, borderWidth: 1, paddingVertical: 8,
  },
  claimedText: { fontSize: 12, fontWeight: '600' },
});
