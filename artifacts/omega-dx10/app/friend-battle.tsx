import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Platform, Modal, ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { useSocket, ActiveBattleMember } from '@/context/SocketContext';
import { CHARACTERS } from '@/constants/gameData';
import { getCharacter } from '@/constants/extendedCharacters';
import { CharacterAvatar } from '@/components/GameComponents';
import { pixelStyle } from '@/constants/pixelStyle';
import { useLanguage } from '@/context/LanguageContext';

const ARENA_BG = require('../assets/images/friend-battle-arena.png');
const BOXING_ICON = require('../assets/images/friend-battle-icon.png');

function buildTeam(
  collection: ReturnType<typeof useGame>['collection'],
  team: ReturnType<typeof useGame>['team'],
): ActiveBattleMember[] {
  return team.slice(0, 3).map((ownedId) => {
    const owned = collection.find((c) => c.ownedId === ownedId);
    if (!owned) return null;
    const char = getCharacter(owned.characterId) ?? CHARACTERS[owned.characterId];
    if (!char) return null;
    const lvl = owned.level;
    return {
      characterId: owned.characterId,
      name: char.name,
      hp: char.baseStats.hp * lvl,
      maxHp: char.baseStats.hp * lvl,
      atk: char.baseStats.atk,
      def: char.baseStats.def,
      attackName: char.attackName || 'Ataque',
      spiritName: char.spiritName || char.attackName || 'Espírito',
      level: lvl,
    } as ActiveBattleMember;
  }).filter(Boolean) as ActiveBattleMember[];
}

function HpBar({ hp, maxHp, color = '#22c55e' }: { hp: number; maxHp: number; color?: string }) {
  const pct = maxHp > 0 ? Math.max(0, hp / maxHp) : 0;
  const barColor = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444';
  return (
    <View style={hpStyles.track}>
      <View style={[hpStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
    </View>
  );
}

const hpStyles = StyleSheet.create({
  track: { height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden', width: '100%' },
  fill: { height: 8, borderRadius: 4 },
});

function MiniMember({ member, isActive }: { member: ActiveBattleMember; isActive: boolean }) {
  return (
    <View style={[ms.wrap, isActive && ms.activeWrap]}>
      <CharacterAvatar characterId={member.characterId} size={isActive ? 56 : 36} />
      {isActive && (
        <View style={ms.hpWrap}>
          <HpBar hp={member.hp} maxHp={member.maxHp} />
          <Text style={ms.hpText}>{member.hp}/{member.maxHp}</Text>
        </View>
      )}
      {!isActive && (
        <View style={[ms.dot, { backgroundColor: member.hp > 0 ? '#22c55e' : '#6b7280' }]} />
      )}
    </View>
  );
}

const ms = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 3, opacity: 0.6 },
  activeWrap: { opacity: 1 },
  hpWrap: { width: '100%', gap: 2 },
  hpText: { color: '#fff', fontSize: 10, textAlign: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

export default function FriendBattleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{
    username?: string;
    playerName?: string;
    tamerLevel?: string;
    teamJson?: string;
  }>();

  const { collection, team } = useGame();
  const { user } = useAuth();
  const {
    activeBattle, battleInviteSent, battleDeclined,
    sendBattleInvite, sendBattleAction, surrenderBattle,
    clearBattle, clearBattleDeclined,
  } = useSocket();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 20 : insets.bottom + 20;

  const myUsername = user?.username ?? '';
  const isChallenger = !!params.username;
  const opponentUsername = activeBattle?.opponentName ?? params.username ?? '';
  const opponentDisplayName = activeBattle?.opponentPlayerName ?? params.playerName ?? opponentUsername;

  const myBuiltTeam = React.useMemo(() => buildTeam(collection, team), [collection, team]);

  const [localPhase, setLocalPhase] = useState<'idle' | 'inviting' | 'declined' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showSurrender, setShowSurrender] = useState(false);
  const logScrollRef = useRef<ScrollView>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  // Send invite on mount (challenger flow)
  useEffect(() => {
    if (!isChallenger || !params.username) return;
    if (myBuiltTeam.length === 0) return;
    sendBattleInvite(params.username, myBuiltTeam, myUsername);
    setLocalPhase('inviting');
  }, []);

  // React to battleInviteSent confirmation
  useEffect(() => {
    if (battleInviteSent && isChallenger) setLocalPhase('inviting');
  }, [battleInviteSent]);

  // React to decline
  useEffect(() => {
    if (battleDeclined && isChallenger) {
      setLocalPhase('declined');
      clearBattleDeclined();
    }
  }, [battleDeclined]);

  // Scroll log to bottom on update
  useEffect(() => {
    if (activeBattle?.state.log.length) {
      setTimeout(() => logScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [activeBattle?.state.log.length]);

  // Shake on attack
  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Animate result
  useEffect(() => {
    if (activeBattle?.ended) {
      resultAnim.setValue(0);
      Animated.timing(resultAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  }, [activeBattle?.ended]);

  function handleAction(action: 'normal' | 'special' | 'defend') {
    if (!activeBattle || !activeBattle.yourTurn) return;
    sendBattleAction(activeBattle.battleId, action);
    shake();
  }

  function handleSurrender() {
    if (!activeBattle) return;
    surrenderBattle(activeBattle.battleId);
    setShowSurrender(false);
  }

  function handleLeave() {
    clearBattle();
    router.back();
  }

  // Derive current battle data
  const myState = activeBattle ? activeBattle.state.players[myUsername] : null;
  const oppState = activeBattle ? activeBattle.state.players[opponentUsername] : null;
  const myActive = myState ? myState.team[myState.activeIdx] : null;
  const oppActive = oppState ? oppState.team[oppState.activeIdx] : null;

  // ── Waiting for Invite Acceptance ────────────────────────────────────────
  if (!activeBattle) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0e1a' }}>
        <ExpoImage source={ARENA_BG} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)' }]} />

        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity onPress={() => { clearBattle(); router.back(); }} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <ExpoImage source={BOXING_ICON} style={styles.boxingIcon} contentFit="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t('friendbattle.title')}</Text>
            {params.username && (
              <Text style={styles.headerSub}>{t('friendbattle.vs')}{params.username}</Text>
            )}
          </View>
        </View>

        <View style={styles.centeredContent}>
          {isChallenger && localPhase === 'inviting' && (
            <>
              <ActivityIndicator size="large" color="#f59e0b" />
              <Text style={styles.waitTitle}>{t('friendbattle.inviteSent')}</Text>
              <Text style={styles.waitSub}>{t('friendbattle.waitingAccept')}</Text>
              <Text style={styles.waitNote}>{t('friendbattle.inviteExpires')}</Text>
            </>
          )}

          {localPhase === 'declined' && (
            <>
              <Text style={{ fontSize: 24 }}>😔</Text>
              <Text style={[styles.waitTitle, { color: '#ef4444' }]}>{t('friendbattle.inviteDeclined')}</Text>
              <Text style={styles.waitSub}>@{params.username} {t('friendbattle.didNotAccept')}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => { clearBattle(); router.back(); }}>
                <Text style={styles.retryText}>{t('common.back')}</Text>
              </TouchableOpacity>
            </>
          )}

          {!isChallenger && (
            <>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.waitTitle}>{t('friendbattle.connecting')}</Text>
            </>
          )}

          {isChallenger && myBuiltTeam.length === 0 && (
            <>
              <Feather name="alert-triangle" size={36} color="#f59e0b" />
              <Text style={[styles.waitTitle, { color: '#f59e0b' }]}>{t('friendbattle.noTeam')}</Text>
              <Text style={styles.waitSub}>{t('friendbattle.setTeam')}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
                <Text style={styles.retryText}>{t('common.back')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  // ── Battle Ended ─────────────────────────────────────────────────────────
  if (activeBattle.ended) {
    const won = activeBattle.youWon;
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0e1a' }}>
        <ExpoImage source={ARENA_BG} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: won ? 'rgba(0,20,0,0.7)' : 'rgba(20,0,0,0.7)' }]} />

        <Animated.View style={[styles.resultBox, { opacity: resultAnim }]}>
          <Text style={styles.resultEmoji}>{won ? '🏆' : '💀'}</Text>
          <Text style={[styles.resultText, { color: won ? '#22c55e' : '#ef4444' }]}>
            {won ? t('friendbattle.victory') : t('friendbattle.defeat')}
          </Text>
          <Text style={styles.resultSub}>
            {activeBattle.surrendered
              ? (won ? `${opponentDisplayName} ${t('friendbattle.opponentSurrendered')}` : t('friendbattle.youSurrendered'))
              : (won ? `${t('friendbattle.youDefeated')} ${opponentDisplayName}!` : `${opponentDisplayName} ${t('friendbattle.opponentStronger')}`)}
          </Text>
          <ScrollView style={styles.resultLog} contentContainerStyle={{ gap: 3 }}>
            {activeBattle.state.log.map((line, i) => (
              <Text key={i} style={styles.logLine}>{line}</Text>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
            <Feather name="arrow-left" size={16} color="#fff" />
            <Text style={styles.leaveBtnText}>{t('friendbattle.leaveBattle')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── Active Battle UI ──────────────────────────────────────────────────────
  const isMyTurn = activeBattle.yourTurn;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0e1a' }}>
      <ExpoImage source={ARENA_BG} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => setShowSurrender(true)} style={styles.backBtn}>
          <Feather name="flag" size={20} color="#fff" />
        </TouchableOpacity>
        <ExpoImage source={BOXING_ICON} style={styles.boxingIconSmall} contentFit="contain" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('friendbattle.title')}</Text>
          <Text style={styles.headerSub}>
            {isMyTurn ? t('friendbattle.yourAttackTurn') : `${t('friendbattle.opponentTurn')} ${opponentDisplayName}`}
          </Text>
        </View>
        <View style={[styles.turnBadge, { backgroundColor: isMyTurn ? '#22c55e22' : '#6b728022', borderColor: isMyTurn ? '#22c55e' : '#6b7280' }]}>
          <Text style={{ color: isMyTurn ? '#22c55e' : '#9ca3af', fontSize: 11, fontWeight: '800' }}>
            {isMyTurn ? t('friendbattle.yourTurn') : t('friendbattle.wait')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.battleContent, { paddingBottom: botPad + 16 }]}>

        {/* Opponent Side */}
        <Animated.View style={[styles.teamPanel, styles.oppPanel, { transform: [{ translateX: !isMyTurn ? 0 : shakeAnim }] }, pixelStyle]}>
          <Text style={styles.teamLabel}>{opponentDisplayName}</Text>
          {oppActive && (
            <>
              <View style={styles.activeRow}>
                <CharacterAvatar characterId={oppActive.characterId} size={64} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.digiName}>{oppActive.name} <Text style={styles.digiLv}>Lv {oppActive.level}</Text></Text>
                  <HpBar hp={oppActive.hp} maxHp={oppActive.maxHp} />
                  <Text style={styles.hpNum}>{oppActive.hp} / {oppActive.maxHp} HP</Text>
                </View>
              </View>
              <View style={styles.miniTeamRow}>
                {oppState?.team.map((m, i) => (
                  <MiniMember key={i} member={m} isActive={i === oppState.activeIdx} />
                ))}
              </View>
            </>
          )}
        </Animated.View>

        {/* Battle Log */}
        <View style={[styles.logBox, pixelStyle]}>
          <ScrollView ref={logScrollRef} style={styles.logScroll} contentContainerStyle={{ gap: 2 }}>
            {activeBattle.state.log.map((line, i) => (
              <Text key={i} style={styles.logLine}>{line}</Text>
            ))}
          </ScrollView>
        </View>

        {/* My Side */}
        <Animated.View style={[styles.teamPanel, styles.myPanel, { transform: [{ translateX: isMyTurn ? 0 : shakeAnim }] }, pixelStyle]}>
          <Text style={styles.teamLabel}>{t('friendbattle.you')}</Text>
          {myActive && (
            <>
              <View style={styles.activeRow}>
                <CharacterAvatar characterId={myActive.characterId} size={64} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.digiName}>{myActive.name} <Text style={styles.digiLv}>Lv {myActive.level}</Text></Text>
                  <HpBar hp={myActive.hp} maxHp={myActive.maxHp} />
                  <Text style={styles.hpNum}>{myActive.hp} / {myActive.maxHp} HP</Text>
                </View>
              </View>
              <View style={styles.miniTeamRow}>
                {myState?.team.map((m, i) => (
                  <MiniMember key={i} member={m} isActive={i === myState.activeIdx} />
                ))}
              </View>
            </>
          )}
        </Animated.View>

        {/* Action Buttons */}
        {isMyTurn && myActive && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, styles.normalBtn, pixelStyle]} onPress={() => handleAction('normal')} activeOpacity={0.8}>
              <Feather name="zap" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{myActive.attackName}</Text>
              <Text style={styles.actionBtnSub}>{t('friendbattle.normalAttack')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.specialBtn, pixelStyle]} onPress={() => handleAction('special')} activeOpacity={0.8}>
              <Feather name="star" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{myActive.spiritName}</Text>
              <Text style={styles.actionBtnSub}>{t('friendbattle.specialAttack')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.defendBtn, pixelStyle]} onPress={() => handleAction('defend')} activeOpacity={0.8}>
              <Feather name="shield" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{t('friendbattle.defend')}</Text>
              <Text style={styles.actionBtnSub}>{t('friendbattle.defendSub')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isMyTurn && (
          <View style={styles.waitingActions}>
            <ActivityIndicator color="#9ca3af" size="small" />
            <Text style={styles.waitingText}>{opponentDisplayName} {t('friendbattle.waitingAction')}</Text>
          </View>
        )}
      </ScrollView>

      {/* Surrender Confirm Modal */}
      <Modal visible={showSurrender} transparent animationType="fade" onRequestClose={() => setShowSurrender(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.surrenderModal, { backgroundColor: colors.card }, pixelStyle]}>
            <Text style={[styles.surrenderTitle, { color: colors.foreground }]}>{t('friendbattle.surrenderTitle')}</Text>
            <Text style={[styles.surrenderSub, { color: colors.mutedForeground }]}>{t('friendbattle.surrenderSub')}</Text>
            <View style={styles.surrenderRow}>
              <TouchableOpacity style={[styles.surrenderConfirm, pixelStyle]} onPress={handleSurrender}>
                <Text style={styles.surrenderConfirmText}>{t('friendbattle.surrender')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.surrenderCancel, { borderColor: colors.border }, pixelStyle]} onPress={() => setShowSurrender(false)}>
                <Text style={{ color: colors.mutedForeground }}>{t('friendbattle.continueFight')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 19,
  },
  boxingIcon: { width: 44, height: 44, borderRadius: 10 },
  boxingIconSmall: { width: 32, height: 32, borderRadius: 8 },
  headerTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  turnBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1,
  },
  centeredContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 40,
  },
  waitTitle: { color: '#fff', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  waitSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center' },
  waitNote: { color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' },
  retryBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  battleContent: { padding: 12, gap: 10 },
  teamPanel: {
    backgroundColor: 'rgba(15,22,41,0.85)',
    borderRadius: 16, padding: 14, gap: 10,
    borderWidth: 1,
  },
  oppPanel: { borderColor: 'rgba(239,68,68,0.4)' },
  myPanel: { borderColor: 'rgba(59,130,246,0.4)' },
  teamLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  activeRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  digiName: { color: '#fff', fontSize: 12, fontWeight: '700' },
  digiLv: { color: '#86efac', fontSize: 12, fontWeight: '600' },
  hpNum: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  miniTeamRow: { flexDirection: 'row', gap: 12, paddingTop: 4 },
  logBox: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  logScroll: { maxHeight: 120, padding: 10 },
  logLine: { color: 'rgba(255,255,255,0.8)', fontSize: 12, paddingVertical: 1 },
  actions: { gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14,
    elevation: 4,
  },
  normalBtn: { backgroundColor: '#3b82f6' },
  specialBtn: { backgroundColor: '#8b5cf6' },
  defendBtn: { backgroundColor: '#059669' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, flex: 1 },
  actionBtnSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  waitingActions: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', paddingVertical: 16 },
  waitingText: { color: '#9ca3af', fontSize: 13 },
  resultBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 12,
  },
  resultEmoji: { fontSize: 36 },
  resultText: { fontSize: 21, fontWeight: '900', letterSpacing: 3 },
  resultSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center' },
  resultLog: { maxHeight: 180, width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 10 },
  leaveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  leaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  surrenderModal: { width: '80%', borderRadius: 20, padding: 24, gap: 12 },
  surrenderTitle: { fontSize: 14, fontWeight: '900', textAlign: 'center' },
  surrenderSub: { fontSize: 13, textAlign: 'center' },
  surrenderRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  surrenderConfirm: { flex: 1, backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  surrenderConfirmText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  surrenderCancel: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});
