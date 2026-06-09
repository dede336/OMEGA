import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  Image, Pressable, Platform, FlatList, Alert,
  Animated, PanResponder, useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { pixelStyle } from '@/constants/pixelStyle';
import { useLanguage } from '@/context/LanguageContext';

const FAB_IMG    = require('../assets/images/menu-fab.png');
const ICON_HOME  = require('../assets/images/home-icon.png');
const ICON_BANCO = require('../assets/images/banco-icon.png');
const ICON_DIGIBANK = require('../assets/images/digibank-icon.png');
const ICON_MOCHILA  = require('../assets/images/mochila-icon.png');
const ICON_CRAFT    = require('../assets/images/craft-icon.png');
const ICON_MUNDO    = require('../assets/images/map-icon.png');
const ICON_MAIL     = require('../assets/images/mailbox-icon.png');
const ICON_RANKING  = require('../assets/images/trophy-icon.png');
const ICON_DIGIFARM = require('../assets/images/digifarm-icon.png');
const ICON_AMIGOS   = require('../assets/images/amigos-icon.png');
const ICON_ADMIN    = require('../assets/images/admin_icon.png');
const ICON_CHAT     = require('../assets/images/chat-icon.png');
const ICON_LOGOUT   = require('../assets/images/logout-icon.png');

// ── FAB size: 60% smaller than original (40% of 64) ──────────────────────────
const FAB_SIZE  = 47;  // outer button (+30% from 36)
const IMG_SIZE  = 38;  // inner image  (+30% from 29)
const EDGE_GAP  = 14;  // distance from screen edge when snapped
const TAP_SLOP  = 6;   // max movement (px) to still count as a tap

interface NavItem {
  labelKey: string;
  route: string;
  image: any;
  color: string;
  adminOnly?: boolean;
  minLevel?: number;
  isChat?: boolean;
  isMail?: boolean;
  bigIcon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.home',     route: '/(tabs)/',          image: ICON_HOME,     color: '#3b82f6' },
  { labelKey: 'nav.banco',    route: '/(tabs)/banco',     image: ICON_BANCO,    color: '#8b5cf6' },
  { labelKey: 'nav.digibank', route: '/(tabs)/collection',image: ICON_DIGIBANK, color: '#06b6d4' },
  { labelKey: 'nav.mochila',  route: '/(tabs)/mochila',   image: ICON_MOCHILA,  color: '#f59e0b' },
  { labelKey: 'nav.craft',    route: '/(tabs)/craft',     image: ICON_CRAFT,    color: '#ef4444' },
  { labelKey: 'nav.world',    route: '/(tabs)/map',       image: ICON_MUNDO,    color: '#22c55e' },
  { labelKey: 'nav.mail',     route: '/(tabs)/correios',  image: ICON_MAIL,     color: '#ec4899', isMail: true },
  { labelKey: 'nav.ranking',  route: '/(tabs)/ranking',   image: ICON_RANKING,  color: '#f97316' },
  { labelKey: 'nav.digifarm', route: '/(tabs)/digifarm',  image: ICON_DIGIFARM, color: '#84cc16' },
  { labelKey: 'nav.friends',  route: '/(tabs)/amigos',    image: ICON_AMIGOS,   color: '#14b8a6', bigIcon: true },
  { labelKey: 'nav.chat',     route: '/(tabs)/chat',      image: ICON_CHAT,     color: '#3b82f6', isChat: true },
  { labelKey: 'nav.admin',    route: '/(tabs)/admin',     image: ICON_ADMIN,    color: '#6b7280', adminOnly: true },
];

export default function NavigationFAB() {
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const { unreadMailCount, isAdmin, tamerLevel, resetGame } = useGame();
  const { logout, user } = useAuth();
  const { totalUnread: unreadChat } = useSocket();
  const { t } = useLanguage();
  const canShowAdmin = (user?.isAdmin ?? isAdmin) || user?.role === 'digimon_creator';

  // ── Drag state ──────────────────────────────────────────────────────────────
  const wasDragged = useRef(false);
  const boundsRef = useRef({ W, H, topClamp: 0, botClamp: 0 });
  useEffect(() => {
    boundsRef.current = {
      W,
      H,
      topClamp: insets.top + 8,
      botClamp: insets.bottom + 60,
    };
  }, [W, H, insets.top, insets.bottom]);

  const initialX = W - FAB_SIZE - EDGE_GAP;
  const initialY = H - FAB_SIZE - (insets.bottom + 80);

  const fabPos = useRef({ x: initialX, y: initialY });
  const animPos = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;

  const panResponder = useRef(
    PanResponder.create({
      // Don't steal the touch on start — let TouchableOpacity handle taps
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Only claim the gesture once there's real movement
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > TAP_SLOP || Math.abs(gs.dy) > TAP_SLOP,
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > TAP_SLOP || Math.abs(gs.dy) > TAP_SLOP,

      onPanResponderGrant: () => {
        wasDragged.current = true;
        animPos.setOffset({ x: fabPos.current.x, y: fabPos.current.y });
        animPos.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event(
        [null, { dx: animPos.x, dy: animPos.y }],
        { useNativeDriver: false },
      ),

      onPanResponderRelease: (_, gs) => {
        animPos.flattenOffset();

        const { W: sw, H: sh, topClamp, botClamp } = boundsRef.current;

        const rawX = fabPos.current.x + gs.dx;
        const rawY = fabPos.current.y + gs.dy;

        const snapX = rawX + FAB_SIZE / 2 < sw / 2
          ? EDGE_GAP
          : sw - FAB_SIZE - EDGE_GAP;

        const snapY = Math.max(topClamp, Math.min(sh - FAB_SIZE - botClamp, rawY));

        fabPos.current = { x: snapX, y: snapY };

        Animated.spring(animPos, {
          toValue: { x: snapX, y: snapY },
          useNativeDriver: false,
          bounciness: 10,
        }).start();

        // Reset after a short delay so onPress doesn't fire after a drag
        setTimeout(() => { wasDragged.current = false; }, 300);
      },
    })
  ).current;

  // ── Navigation helpers ──────────────────────────────────────────────────────
  function handleLogout() {
    if (Platform.OS === 'web') {
      setConfirmLogout(true);
    } else {
      Alert.alert(t('nav.logoutTitle'), t('nav.logoutAlertMsg'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('nav.logoutConfirm'),
          style: 'destructive',
          onPress: async () => {
            setOpen(false);
            await resetGame();
            await logout();
            router.replace('/login' as any);
          },
        },
      ]);
    }
  }

  async function doLogout() {
    setConfirmLogout(false);
    setOpen(false);
    await resetGame();
    await logout();
    router.replace('/login' as any);
  }

  const visible = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !canShowAdmin) return false;
    if (item.minLevel && tamerLevel < item.minLevel) return false;
    return true;
  });

  function navigate(route: string) {
    setOpen(false);
    setTimeout(() => router.push(route as any), 150);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Animated.View
        style={[styles.fabWrapper, { left: animPos.x, top: animPos.y }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={() => { if (!wasDragged.current) setOpen(true); }}
          activeOpacity={0.85}
          style={styles.fabBtn}
        >
          <Image source={FAB_IMG} style={styles.fabImg} resizeMode="contain" />
          {unreadMailCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadMailCount > 9 ? '9+' : unreadMailCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => { setOpen(false); setConfirmLogout(false); }}>
          <Pressable style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>

            {confirmLogout ? (
              <View style={styles.confirmBox}>
                <Feather name="log-out" size={28} color="#ef4444" style={{ marginBottom: 12 }} />
                <Text style={styles.confirmTitle}>{t('nav.logoutTitle')}</Text>
                <Text style={styles.confirmSub}>{t('nav.logoutSub')}</Text>
                <View style={styles.confirmBtns}>
                  <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirmLogout(false)} activeOpacity={0.8}>
                    <Text style={styles.confirmCancelText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmOk} onPress={doLogout} activeOpacity={0.8}>
                    <Text style={styles.confirmOkText}>{t('nav.logoutConfirm')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.menuHeader}>
                  <Image source={FAB_IMG} style={{ width: 38, height: 38 }} resizeMode="contain" />
                  <Text style={[styles.menuTitle, { color: colors.foreground }]}>{t('nav.menuTitle')}</Text>
                  <TouchableOpacity onPress={() => setOpen(false)}>
                    <Feather name="x" size={22} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={visible}
                  numColumns={3}
                  keyExtractor={(item) => item.route}
                  scrollEnabled={false}
                  columnWrapperStyle={{ gap: 10 }}
                  contentContainerStyle={{ gap: 10, paddingTop: 8 }}
                  renderItem={({ item }) => {
                    const badgeCount = item.isChat ? unreadChat : item.isMail ? unreadMailCount : 0;
                    const hasUnread = badgeCount > 0;
                    return (
                      <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => navigate(item.route)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.navIcon}>
                          <Image
                            source={item.image}
                            style={{ width: item.bigIcon ? 64 : 32, height: item.bigIcon ? 64 : 32 }}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={[styles.navLabel, { color: colors.foreground }]}>{t(item.labelKey)}</Text>
                        {hasUnread && (
                          <View style={[styles.navBadge, { backgroundColor: '#ef4444' }]}>
                            <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
                <TouchableOpacity
                  style={[styles.logoutBtn, { backgroundColor: '#ef444422', borderColor: '#ef4444' }, pixelStyle]}
                  onPress={handleLogout}
                  activeOpacity={0.75}
                >
                  <Image source={ICON_LOGOUT} style={{ width: 26, height: 26 }} resizeMode="contain" />
                  <Text style={[styles.logoutText, { color: '#ef4444' }]}>{t('nav.logout')}</Text>
                </TouchableOpacity>
              </>
            )}

          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    zIndex: 999,
  },
  fabBtn: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#0f1629',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  fabImg: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: IMG_SIZE / 2,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  menu: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
    position: 'relative',
  },
  navIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  navBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
  },
  confirmBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  confirmTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 6,
  },
  confirmSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmBtns: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  confirmOk: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  confirmOkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
