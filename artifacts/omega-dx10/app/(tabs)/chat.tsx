import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Platform, Modal, Pressable,
  TextInput, KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useSocket, GlobalChatMessage } from '@/context/SocketContext';
import { pixelStyle } from '@/constants/pixelStyle';
import { useLanguage } from '@/context/LanguageContext';

interface Conversation {
  partnerId: number;
  partnerUsername: string;
  lastMessage: { id: number; content: string; from: string; createdAt: string };
  unread: number;
  online: boolean;
}

interface Friend {
  username: string;
  playerName: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

type Tab = 'global' | 'private';

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, user, getApiUrl } = useAuth();
  const { t } = useLanguage();
  const {
    connected, onlineUsers, unreadCounts, recentMessages,
    globalMessages, sendGlobalMessage, globalError, clearGlobalError,
  } = useSocket();

  const [activeTab, setActiveTab] = useState<Tab>('global');

  // Private chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newChatModal, setNewChatModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Global chat state
  const [historyMsgs, setHistoryMsgs] = useState<GlobalChatMessage[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [globalInput, setGlobalInput] = useState('');
  const [sendingGlobal, setSendingGlobal] = useState(false);
  const globalFlatRef = useRef<FlatList>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 16 : insets.bottom + 8;

  const apiUrl = getApiUrl();
  const headers = { Authorization: `Bearer ${token}` };

  // ── Fetch history ────────────────────────────────────────────────────────
  const fetchConversations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/chat/conversations`, { headers });
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [apiUrl, token]);

  const fetchGlobalHistory = useCallback(async () => {
    setLoadingGlobal(true);
    try {
      const res = await fetch(`${apiUrl}/chat/global`, { headers });
      const data = await res.json();
      if (data.messages) setHistoryMsgs(data.messages);
    } catch {}
    setLoadingGlobal(false);
  }, [apiUrl, token]);

  const fetchFriends = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const res = await fetch(`${apiUrl}/friends`, { headers });
      const data = await res.json();
      if (data.friends) setFriends(data.friends as Friend[]);
    } catch {}
    setLoadingFriends(false);
  }, [apiUrl, token]);

  useEffect(() => { fetchConversations(); fetchGlobalHistory(); }, []);

  // Merge socket global messages with history
  const allGlobalMessages = React.useMemo(() => {
    const existing = new Set(historyMsgs.map((m) => m.id));
    const extra = globalMessages.filter((m) => !existing.has(m.id));
    return [...historyMsgs, ...extra].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [historyMsgs, globalMessages]);

  // Scroll to bottom when new global messages arrive
  useEffect(() => {
    if (allGlobalMessages.length > 0 && activeTab === 'global') {
      setTimeout(() => globalFlatRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [allGlobalMessages.length]);

  // Show profanity error briefly
  useEffect(() => {
    if (globalError) {
      const t = setTimeout(() => clearGlobalError(), 4000);
      return () => clearTimeout(t);
    }
  }, [globalError]);

  function handleSendGlobal() {
    const content = globalInput.trim();
    if (!content) return;
    setSendingGlobal(true);
    sendGlobalMessage(content);
    setGlobalInput('');
    setSendingGlobal(false);
  }

  // ── Private conversations ────────────────────────────────────────────────
  const mergedConversations = conversations.map((conv) => {
    const msgs = recentMessages[conv.partnerUsername] ?? [];
    const lastSocketMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    const socketUnread = unreadCounts[conv.partnerUsername] ?? 0;
    return {
      ...conv,
      online: onlineUsers.has(conv.partnerUsername),
      unread: Math.max(conv.unread, socketUnread),
      lastMessage: lastSocketMsg
        ? { id: lastSocketMsg.id, content: lastSocketMsg.content, from: lastSocketMsg.from, createdAt: lastSocketMsg.createdAt }
        : conv.lastMessage,
    };
  });

  const existingPartners = new Set(conversations.map((c) => c.partnerUsername));
  const socketOnlyConvs: Conversation[] = [];
  for (const [partner, msgs] of Object.entries(recentMessages)) {
    if (!existingPartners.has(partner) && msgs.length > 0) {
      const last = msgs[msgs.length - 1];
      socketOnlyConvs.push({
        partnerId: -1,
        partnerUsername: partner,
        lastMessage: { id: last.id, content: last.content, from: last.from, createdAt: last.createdAt },
        unread: unreadCounts[partner] ?? 0,
        online: onlineUsers.has(partner),
      });
    }
  }

  const allConversations = [...mergedConversations, ...socketOnlyConvs]
    .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('chat.title')}</Text>
        <View style={[styles.statusDot, { backgroundColor: connected ? '#22c55e' : '#6b7280' }]} />
        <Text style={{ color: colors.mutedForeground, fontSize: 12, flex: 1 }}>
          {connected ? t('chat.online') : t('chat.offline')}
        </Text>
        {activeTab === 'private' && (
          <TouchableOpacity
            style={[styles.newChatBtn, { backgroundColor: colors.primary + '22', borderColor: colors.primary }, pixelStyle]}
            onPress={() => { setNewChatModal(true); fetchFriends(); }}
            activeOpacity={0.75}
          >
            <Feather name="edit" size={18} color={colors.primary} />
            <Text style={[styles.newChatBtnText, { color: colors.primary }]}>{t('chat.newChat')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'global' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('global')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'global' ? colors.primary : colors.mutedForeground }]}>
            {t('chat.globalTab')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'private' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('private')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'private' ? colors.primary : colors.mutedForeground }]}>
            {t('chat.privateTab')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Global Chat ── */}
      {activeTab === 'global' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {loadingGlobal ? (
            <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              ref={globalFlatRef}
              data={allGlobalMessages}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ padding: 12, paddingBottom: 10, gap: 4 }}
              onContentSizeChange={() => globalFlatRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={{ fontSize: 22 }}>🌍</Text>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    {t('chat.globalEmpty')}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isMe = item.from === user?.username;
                return (
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <View style={[
                      styles.bubbleContent,
                      { backgroundColor: isMe ? '#3b82f6' : colors.card, borderColor: colors.border },
                      pixelStyle,
                    ]}>
                      {!isMe && (
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 2 }}>
                          {item.from}
                        </Text>
                      )}
                      <Text style={{ color: isMe ? '#fff' : colors.foreground, fontSize: 12 }}>
                        {item.content}
                      </Text>
                      <Text style={{ color: isMe ? '#ffffffaa' : colors.mutedForeground, fontSize: 10, alignSelf: 'flex-end', marginTop: 2 }}>
                        {formatTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Profanity error banner */}
          {!!globalError && (
            <View style={[styles.errorBanner, { backgroundColor: '#ef4444' }]}>
              <Feather name="alert-circle" size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, flex: 1 }}>{globalError}</Text>
            </View>
          )}

          {/* Input */}
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: botPad }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }, pixelStyle]}
              value={globalInput}
              onChangeText={setGlobalInput}
              placeholder={t('chat.messagePlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={300}
              onSubmitEditing={handleSendGlobal}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { opacity: globalInput.trim() ? 1 : 0.4 }]}
              onPress={handleSendGlobal}
              disabled={!globalInput.trim() || sendingGlobal}
            >
              <Feather name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ── Private Conversations ── */}
      {activeTab === 'private' && (
        loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
        ) : allConversations.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 24 }}>💬</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {t('chat.privateEmpty')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={allConversations}
            keyExtractor={(item) => item.partnerUsername}
            contentContainerStyle={{ paddingBottom: botPad + 80 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchConversations(true)} tintColor={colors.mutedForeground} />}
            renderItem={({ item }) => {
              const totalUnread = (unreadCounts[item.partnerUsername] ?? 0) || item.unread;
              return (
                <TouchableOpacity
                  style={[styles.convRow, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}
                  onPress={() => router.push(`/chat-conversation?username=${item.partnerUsername}` as any)}
                  activeOpacity={0.75}
                >
                  <View style={styles.avatarWrap}>
                    <View style={[styles.avatar, { backgroundColor: '#3b82f622' }]}>
                      <Text style={{ fontSize: 14 }}>🧑‍💻</Text>
                    </View>
                    <View style={[styles.presenceDot, { backgroundColor: item.online ? '#22c55e' : '#6b7280' }]} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 12 }}>
                        {item.partnerUsername}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                        {timeAgo(item.lastMessage.createdAt)}
                      </Text>
                    </View>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13 }} numberOfLines={1}>
                      {item.lastMessage.from === user?.username ? t('chat.you') : ''}
                      {item.lastMessage.content}
                    </Text>
                  </View>
                  {totalUnread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )
      )}

      {/* ── New Chat Modal ── */}
      <Modal
        visible={newChatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setNewChatModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setNewChatModal(false)}>
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.card }, pixelStyle]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{t('chat.newConversation')}</Text>
            {loadingFriends ? (
              <ActivityIndicator color="#3b82f6" style={{ margin: 24 }} />
            ) : friends.length === 0 ? (
              <View style={{ paddingVertical: 28, alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 20 }}>👥</Text>
                <Text style={{ color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 }}>
                  {t('chat.noFriends')}
                </Text>
              </View>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(f) => f.username}
                style={{ maxHeight: 380 }}
                contentContainerStyle={{ paddingBottom: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.friendRow, { backgroundColor: colors.background, borderColor: colors.border }, pixelStyle]}
                    onPress={() => {
                      setNewChatModal(false);
                      router.push(`/chat-conversation?username=${item.username}` as any);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.avatar, { backgroundColor: '#3b82f622' }]}>
                      <Text style={{ fontSize: 14 }}>🧑‍💻</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 12 }}>
                        {item.username}
                      </Text>
                      {item.playerName && item.playerName !== item.username && (
                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{item.playerName}</Text>
                      )}
                    </View>
                    <Feather name="message-circle" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingBottom: 10,
  },
  title: { fontSize: 16, fontWeight: '800' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  newChatBtnText: { fontSize: 13, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row', borderBottomWidth: 1,
    marginHorizontal: 0, marginBottom: 0,
  },
  tabBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
  },
  tabLabel: { fontSize: 13, fontWeight: '700' },
  convRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 12, marginBottom: 8, marginTop: 8,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  presenceDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: 'transparent',
  },
  unreadBadge: {
    backgroundColor: '#3b82f6', borderRadius: 12,
    minWidth: 22, height: 22, paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 80 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 22 },
  bubble: { flexDirection: 'row', marginVertical: 1 },
  bubbleMe: { justifyContent: 'flex-end' },
  bubbleThem: { justifyContent: 'flex-start' },
  bubbleContent: {
    maxWidth: '80%', padding: 10, borderRadius: 16, borderWidth: 1,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingTop: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1, borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 12, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 12, marginBottom: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10,
  },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 16, paddingBottom: 36,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 14,
  },
  sheetTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12, paddingHorizontal: 4 },
  friendRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
});
