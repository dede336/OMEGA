import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Platform,
  Modal, Pressable, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { CHARACTERS, TAMERS } from '@/constants/gameData';
import { pixelStyle } from '@/constants/pixelStyle';
import { CharacterAvatar } from '@/components/GameComponents';
import { useSocket } from '@/context/SocketContext';
import { router as navRouter } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';

const BOXING_ICON = require('../../assets/images/friend-battle-icon.png');

interface TeamDetail {
  ownedId: string;
  characterId: string;
  level: number;
}

interface Friend {
  username: string;
  playerName: string;
  tamerLevel: number;
  tamerId: string | null;
  teamDetails: TeamDetail[];
  friendshipId: number;
}

interface FriendRequest {
  id: number;
  username: string;
  createdAt: string;
}

export default function AmigosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, user, getApiUrl } = useAuth();
  const { tamerLevel } = useGame();
  const { t } = useLanguage();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 20 : insets.bottom + 20;

  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const apiUrl = getApiUrl();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [friendsRes, reqRes] = await Promise.all([
        fetch(`${apiUrl}/friends`, { headers }),
        fetch(`${apiUrl}/friends/requests`, { headers }),
      ]);
      if (friendsRes.ok) {
        const j = await friendsRes.json();
        setFriends(j.friends ?? []);
      }
      if (reqRes.ok) {
        const j = await reqRes.json();
        setRequests(j.requests ?? []);
      }
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, apiUrl]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function sendRequest() {
    if (!addInput.trim()) return;
    setAdding(true);
    setAddError('');
    setAddSuccess('');
    try {
      const res = await fetch(`${apiUrl}/friends/request`, {
        method: 'POST', headers,
        body: JSON.stringify({ username: addInput.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setAddError(j.error ?? t('amigos.errorRequest')); }
      else { setAddSuccess(`${t('amigos.requestSent')}${addInput.trim()}!`); setAddInput(''); }
    } catch { setAddError(t('amigos.errorConnection')); }
    finally { setAdding(false); }
  }

  async function acceptRequest(id: number) {
    try {
      await fetch(`${apiUrl}/friends/${id}/accept`, { method: 'PUT', headers });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      fetchAll(true);
    } catch {}
  }

  async function removeFriend(username: string) {
    try {
      await fetch(`${apiUrl}/friends/${encodeURIComponent(username)}`, { method: 'DELETE', headers });
      setFriends((prev) => prev.filter((f) => f.username !== username));
      setSelectedFriend(null);
    } catch {}
  }

  const { onlineUsers } = useSocket();

  function FriendCard({ friend }: { friend: Friend }) {
    const tamer = friend.tamerId ? TAMERS.find((t) => t.id === friend.tamerId) : null;
    const isOnline = onlineUsers.has(friend.username);
    return (
      <TouchableOpacity
        style={[styles.friendCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}
        onPress={() => setSelectedFriend(friend)}
        activeOpacity={0.8}
      >
        <View style={{ position: 'relative' }}>
          <View style={[styles.friendAvatar, { borderColor: tamer?.accentColor ?? colors.border, backgroundColor: '#0f1629' }]}>
            {tamer ? (
              <View style={{ overflow: 'hidden', borderRadius: 22 }}>
                <Text style={{ fontSize: 16 }}>{tamer.fullName.charAt(0)}</Text>
              </View>
            ) : (
              <Feather name="user" size={22} color={colors.mutedForeground} />
            )}
          </View>
          <View style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 12, height: 12, borderRadius: 6,
            backgroundColor: isOnline ? '#22c55e' : '#6b7280',
            borderWidth: 2, borderColor: colors.card,
          }} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.friendName, { color: colors.foreground }]}>{friend.playerName}</Text>
            <Text style={{ color: isOnline ? '#22c55e' : colors.mutedForeground, fontSize: 10, fontWeight: '600' }}>
              {isOnline ? t('amigos.online') : t('amigos.offline')}
            </Text>
          </View>
          <Text style={[styles.friendUser, { color: colors.mutedForeground }]}>@{friend.username} · Lv {friend.tamerLevel}</Text>
        </View>
        <View style={styles.teamRow}>
          {friend.teamDetails.slice(0, 3).map((td) => (
            <View key={td.ownedId} style={[styles.teamSlot, { borderColor: colors.border }, pixelStyle]}>
              <CharacterAvatar characterId={td.characterId} size={30} />
            </View>
          ))}
          {friend.teamDetails.length === 0 && (
            <Text style={[styles.noTeam, { color: colors.mutedForeground }]}>{t('amigos.noTeam')}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => { setSelectedFriend(null); navRouter.push(`/chat-conversation?username=${friend.username}` as any); }}
          style={{ padding: 4 }}
        >
          <Feather name="message-circle" size={20} color="#3b82f6" />
        </TouchableOpacity>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    );
  }

  if (!token) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('amigos.title')}</Text>
        </View>
        <View style={styles.center}>
          <Feather name="users" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('amigos.loginPrompt')}</Text>
          <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary }, pixelStyle]} onPress={() => router.push('/login')}>
            <Text style={[styles.loginBtnText, { color: colors.primaryForeground }]}>{t('amigos.loginBtn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('amigos.title')}</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{friends.length} amigo{friends.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={friends}
        keyExtractor={(f) => f.username}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: botPad, padding: 16, gap: 10 }}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 8 }}>
            <View style={[styles.addBox, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
              <Text style={[styles.addTitle, { color: colors.foreground }]}>{t('amigos.addFriend')}</Text>
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.addInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }, pixelStyle]}
                  placeholder={t('amigos.usernamePlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  value={addInput}
                  onChangeText={(t) => { setAddInput(t); setAddError(''); setAddSuccess(''); }}
                  autoCapitalize="none"
                  onSubmitEditing={sendRequest}
                />
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: colors.primary }, pixelStyle]}
                  onPress={sendRequest}
                  disabled={adding || !addInput.trim()}
                  activeOpacity={0.8}
                >
                  {adding ? <ActivityIndicator size={16} color={colors.primaryForeground} /> : <Feather name="user-plus" size={18} color={colors.primaryForeground} />}
                </TouchableOpacity>
              </View>
              {addError ? <Text style={styles.addError}>{addError}</Text> : null}
              {addSuccess ? <Text style={styles.addSuccess}>{addSuccess}</Text> : null}
            </View>

            {requests.length > 0 && (
              <View style={[styles.reqBox, { backgroundColor: colors.card, borderColor: colors.primary + '55' }, pixelStyle]}>
                <Text style={[styles.reqTitle, { color: colors.foreground }]}>
                  {t('amigos.requestsReceived')} ({requests.length})
                </Text>
                {requests.map((r) => (
                  <View key={r.id} style={[styles.reqRow, { borderTopColor: colors.border }]}>
                    <Feather name="user" size={18} color={colors.mutedForeground} />
                    <Text style={[styles.reqName, { color: colors.foreground }]}>@{r.username}</Text>
                    <TouchableOpacity
                      style={[styles.acceptBtn, { backgroundColor: '#22c55e' }, pixelStyle]}
                      onPress={() => acceptRequest(r.id)}
                    >
                      <Feather name="check" size={14} color="#fff" />
                      <Text style={styles.acceptBtnText}>{t('amigos.accept')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.declineBtn, { borderColor: colors.border }, pixelStyle]}
                      onPress={() => removeFriend(r.username)}
                    >
                      <Feather name="x" size={14} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {loading && !refreshing && (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            )}

            {friends.length > 0 && (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('amigos.yourFriends')}</Text>
            )}
          </View>
        }
        renderItem={({ item }) => <FriendCard friend={item} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.center}>
              <Feather name="users" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t('amigos.empty')}
              </Text>
            </View>
          ) : null
        }
      />

      <Modal visible={selectedFriend !== null} transparent animationType="slide" onRequestClose={() => setSelectedFriend(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedFriend(null)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.card }, pixelStyle]} onPress={(e) => e.stopPropagation()}>
            {selectedFriend && (() => {
              const f = selectedFriend;
              return (
                <>
                  <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
                  <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{f.playerName}</Text>
                  <Text style={[styles.sheetUser, { color: colors.mutedForeground }]}>@{f.username} · Nível {f.tamerLevel}</Text>

                  <Text style={[styles.teamTitle, { color: colors.foreground }]}>{t('amigos.battleTeam')}</Text>
                  <View style={styles.teamFull}>
                    {[0, 1, 2].map((i) => {
                      const td = f.teamDetails[i];
                      const char = td ? CHARACTERS[td.characterId] : null;
                      return (
                        <View key={i} style={[styles.teamSlotBig, { borderColor: td ? colors.primary + '88' : colors.border, backgroundColor: colors.background }, pixelStyle]}>
                          {td && char ? (
                            <>
                              <CharacterAvatar characterId={td.characterId} size={60} />
                              <Text style={[styles.teamCharName, { color: colors.foreground }]} numberOfLines={1}>{char.name}</Text>
                              <Text style={[styles.teamCharLevel, { color: colors.primary }]}>Lv {td.level}</Text>
                            </>
                          ) : (
                            <>
                              <Feather name="minus" size={22} color={colors.mutedForeground} />
                              <Text style={[styles.teamEmpty, { color: colors.mutedForeground }]}>{t('amigos.emptySlot')}</Text>
                            </>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {tamerLevel >= 5 ? (
                    <TouchableOpacity
                      style={[styles.challengeBtn, pixelStyle]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedFriend(null);
                        router.push({
                          pathname: '/friend-battle',
                          params: {
                            username: f.username,
                            playerName: f.playerName,
                            tamerLevel: String(f.tamerLevel),
                            teamJson: JSON.stringify(f.teamDetails),
                          },
                        } as any);
                      }}
                    >
                      <Image source={BOXING_ICON} style={{ width: 22, height: 22, borderRadius: 4 }} resizeMode="contain" />
                      <Text style={styles.challengeBtnText}>{t('amigos.challenge')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.lockedBattleBtn, { backgroundColor: colors.muted, borderColor: colors.border }, pixelStyle]}>
                      <Feather name="lock" size={15} color={colors.mutedForeground} />
                      <Text style={[styles.lockedBattleText, { color: colors.mutedForeground }]}>{t('amigos.battleLocked')}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.removeBtn, { borderColor: '#ef444466' }, pixelStyle]}
                    activeOpacity={0.8}
                    onPress={() => removeFriend(f.username)}
                  >
                    <Feather name="user-x" size={16} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontWeight: '700' as const }}>{t('amigos.removeFriend')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.closeSheetBtn, { borderColor: colors.border }, pixelStyle]} onPress={() => setSelectedFriend(null)}>
                    <Text style={{ color: colors.mutedForeground }}>{t('common.close')}</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 14, fontWeight: '900' as const },
  headerSub: { fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 60, paddingHorizontal: 40 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 22 },
  loginBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  loginBtnText: { fontSize: 12, fontWeight: '700' as const },
  addBox: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  addTitle: { fontSize: 12, fontWeight: '800' as const },
  addRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addInput: { flex: 1, minWidth: 0, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12 },
  addBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  addError: { color: '#ef4444', fontSize: 12, marginTop: 2 },
  addSuccess: { color: '#22c55e', fontSize: 12, marginTop: 2 },
  reqBox: { borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 0 },
  reqTitle: { fontSize: 13, fontWeight: '800' as const, marginBottom: 10 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  reqName: { flex: 1, fontSize: 12, fontWeight: '600' as const },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  acceptBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' as const },
  declineBtn: { borderWidth: 1, borderRadius: 8, padding: 6 },
  sectionLabel: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
  friendCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  friendAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' as const },
  friendName: { fontSize: 12, fontWeight: '700' as const },
  friendUser: { fontSize: 12, marginTop: 2 },
  teamRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  teamSlot: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, overflow: 'hidden' as const, alignItems: 'center', justifyContent: 'center' },
  noTeam: { fontSize: 11 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: 15, fontWeight: '900' as const, textAlign: 'center' as const },
  sheetUser: { fontSize: 13, textAlign: 'center' as const },
  teamTitle: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.5, marginTop: 8 },
  teamFull: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  teamSlotBig: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 12, alignItems: 'center', gap: 6 },
  teamCharName: { fontSize: 11, fontWeight: '700' as const, textAlign: 'center' as const },
  teamCharLevel: { fontSize: 11, fontWeight: '800' as const },
  teamEmpty: { fontSize: 11 },
  removeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, marginTop: 4 },
  closeSheetBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  challengeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  challengeBtnText: { color: '#fff', fontWeight: '800' as const, fontSize: 13 },
  lockedBattleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 12, marginTop: 8 },
  lockedBattleText: { fontSize: 13 },
});
