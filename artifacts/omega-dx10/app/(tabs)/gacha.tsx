import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Image, Modal, Platform, Easing, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame, GachaReward, GachaPoolEntry } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { CHARACTERS, RARITY_COLORS, RARITY_LABELS } from '@/constants/gameData';
import { getCharacterImageSource, getCharacter } from '@/constants/extendedCharacters';
import { AnimatedEgg } from '@/components/GameComponents';
import { pixelStyle } from '@/constants/pixelStyle';
import EQUIP_ITEM_IMAGES from '@/constants/equipImages';
import { useLanguage } from '@/context/LanguageContext';

const GACHA_MACHINE_IMG = require('../../assets/images/gacha-machine.png');
const GEM_ICON_IMG      = require('../../assets/images/gem-icon.webp');
const GACHA_ANIME_IMG   = require('../../assets/images/gacha-anime.png');

const RARIDADE_CONFIG: Record<GachaReward['raridade'], { color: string; label: string; glow: string }> = {
  Comum:    { color: '#6b7280', label: 'Comum',    glow: '#6b728044' },
  Especial: { color: '#8b5cf6', label: 'Especial', glow: '#8b5cf644' },
  Raro:     { color: '#f59e0b', label: 'Raro ✦',   glow: '#f59e0b66' },
};

const TIPO_EMOJI: Record<string, string> = { ITEM: '⚔️', FRAGMENTO: '🔮', DIGIMON: '🦖' };

// ── Bubble animation items (Raros e Especiais do pool padrão) ──
const BUBBLE_ITEMS = [
  { characterId: 'permissao_real', raridade: 'Raro'     as const, nome: 'Permição Real da Deusa', isItem: true },
  { characterId: 'dorumon',        raridade: 'Raro'     as const, nome: 'Dorumon' },
  { characterId: 'custom_313',     raridade: 'Raro'     as const, nome: 'Ryudamon' },
  { characterId: 'custom_356',     raridade: 'Especial' as const, nome: 'Dorulumon' },
  { characterId: 'magnaAngemon',   raridade: 'Especial' as const, nome: 'MagnaAngemon' },
  { characterId: 'angewomon',      raridade: 'Especial' as const, nome: 'Angewomon' },
  { characterId: 'metalGreymon',   raridade: 'Especial' as const, nome: 'MetalGreymon' },
  { characterId: 'wereGarurumon',  raridade: 'Especial' as const, nome: 'WereGarurumon' },
  { characterId: 'garudamon',      raridade: 'Especial' as const, nome: 'Garudamon' },
];

function GachaBubble({ item, opacity }: { item: typeof BUBBLE_ITEMS[0]; opacity: Animated.Value }) {
  const isRaro = item.raridade === 'Raro';
  const color  = isRaro ? '#f59e0b' : '#8b5cf6';
  const img    = item.isItem
    ? (EQUIP_ITEM_IMAGES[item.characterId] ?? null)
    : getCharacterImageSource(item.characterId);

  return (
    <Animated.View style={[styles.bubble, { opacity, borderColor: color, backgroundColor: color + '22',
      shadowColor: color, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
      elevation: 6 }]}>
      {img ? (
        <Image source={img} style={{ width: 36, height: 36 }} resizeMode="contain" />
      ) : (
        <Text style={{ fontSize: 20 }}>⚔️</Text>
      )}
    </Animated.View>
  );
}

function GachaBubbleColumn() {
  const [pageIndex, setPageIndex] = useState(0);
  const opacities = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const pageItems = useMemo(() => {
    const base = (pageIndex * 3) % BUBBLE_ITEMS.length;
    return [0, 1, 2].map((i) => BUBBLE_ITEMS[(base + i) % BUBBLE_ITEMS.length]);
  }, [pageIndex]);

  useEffect(() => {
    let cancelled = false;
    opacities.forEach((o) => o.setValue(0));

    Animated.sequence([
      Animated.stagger(550, opacities.map((o) =>
        Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }),
      )),
      Animated.delay(2000),
      Animated.stagger(400, opacities.map((o) =>
        Animated.timing(o, { toValue: 0, duration: 600, useNativeDriver: true }),
      )),
      Animated.delay(500),
    ]).start(({ finished }) => {
      if (finished && !cancelled) setPageIndex((p) => p + 1);
    });

    return () => { cancelled = true; };
  }, [pageIndex]);

  return (
    <View style={styles.bubblesColumn}>
      {pageItems.map((item, i) => (
        <GachaBubble key={`${item.characterId}_${i}`} item={item} opacity={opacities[i]} />
      ))}
    </View>
  );
}

function RewardCard({ reward, big = false }: { reward: GachaReward; big?: boolean }) {
  const colors = useColors();
  const char = getCharacter(reward.characterId) ?? CHARACTERS[reward.characterId];
  const cfg = RARIDADE_CONFIG[reward.raridade];
  const img = getCharacterImageSource(reward.characterId);
  const rarColor = char ? RARITY_COLORS[char.rarity as keyof typeof RARITY_COLORS] ?? cfg.color : cfg.color;

  const cardSize = big ? 150 : 110;
  const imgSize  = big ? 90  : 64;

  const isNonDigimon = reward.tipo === 'ITEM' || reward.tipo === 'FRAGMENTO';
  const isEgg = char?.rarity === 'EGG';
  const displayName  = reward.nome ?? char?.name ?? reward.characterId;
  const tipoEmoji    = reward.tipo ? TIPO_EMOJI[reward.tipo] : '🦖';

  return (
    <View style={[
      styles.rewardCard,
      {
        backgroundColor: colors.card,
        borderColor: rarColor,
        width: cardSize,
        shadowColor: rarColor,
        shadowOpacity: 0.5,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      },
      pixelStyle,
    ]}>
      <View style={[styles.rewardGlow, { backgroundColor: rarColor + '33' }]} />
      {isEgg && !isNonDigimon ? (
        <AnimatedEgg characterId={reward.characterId} element={char?.element ?? 'NULL'} size={imgSize} />
      ) : img && !isNonDigimon ? (
        <Image source={img} style={{ width: imgSize, height: imgSize }} resizeMode="contain" />
      ) : (
        <View style={[styles.rewardImgPlaceholder, { backgroundColor: cfg.glow, width: imgSize, height: imgSize }]}>
          <Text style={{ fontSize: big ? 38 : 28 }}>{tipoEmoji}</Text>
        </View>
      )}
      <View style={[styles.rarBadge, { backgroundColor: rarColor + '33', borderColor: rarColor }]}>
        <Text style={[styles.rarBadgeText, { color: rarColor }]}>{cfg.label}</Text>
      </View>
      <Text style={[styles.rewardName, { color: colors.foreground, fontSize: big ? 13 : 11 }]} numberOfLines={2}>
        {displayName}
      </Text>
    </View>
  );
}

function ResultModal({
  visible, resultado, mensagem, pityAtual,
  onClose,
}: {
  visible: boolean;
  resultado: GachaReward[] | null;
  mensagem: string;
  pityAtual: number;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentScale   = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(contentScale, { toValue: 1, friction: 7, useNativeDriver: true }),
      ]).start();
    } else {
      overlayOpacity.setValue(0);
      contentScale.setValue(0.85);
    }
  }, [visible]);

  if (!visible) return null;

  const temResultado = resultado && resultado.length > 0;
  const temRaro = resultado?.some((r) => r.raridade === 'Raro');
  const temEspecial = resultado?.some((r) => r.raridade === 'Especial');
  const headerColor = temRaro ? '#f59e0b' : temEspecial ? '#8b5cf6' : '#6b7280';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.resultOverlay, { opacity: overlayOpacity, paddingBottom: insets.bottom + 20 }]}>
        <Animated.View style={[styles.resultPanel, {
          backgroundColor: colors.card,
          transform: [{ scale: contentScale }],
          borderColor: temRaro ? '#f59e0b66' : temEspecial ? '#8b5cf666' : colors.border,
        }, pixelStyle]}>

          {/* Header */}
          <View style={[styles.resultHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.resultTitle, { color: headerColor }]}>
              {temResultado ? (temRaro ? '🌟 RARO OBTIDO!' : '✨ Resultado do Sorteio') : '❌ Sorteio falhou'}
            </Text>
            <Text style={[styles.resultMsg, { color: colors.mutedForeground }]}>{mensagem}</Text>
          </View>

          {/* Cards */}
          {temResultado && (
            <ScrollView
              horizontal={resultado!.length > 1}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.resultCards,
                resultado!.length === 1 && styles.resultCardsSingle,
              ]}
            >
              {resultado!.map((r, i) => (
                <RewardCard key={`${r.characterId}_${i}`} reward={r} big={resultado!.length === 1} />
              ))}
            </ScrollView>
          )}

          {/* Pity info */}
          {temResultado && (
            <View style={[styles.pityChip, { backgroundColor: colors.background, borderColor: colors.border }, pixelStyle]}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                🛡️ Pity: <Text style={{ fontWeight: '800', color: pityAtual >= 40 ? '#f59e0b' : colors.foreground }}>{pityAtual}/50</Text>
                {'  '}
                <Text style={{ color: colors.mutedForeground }}>({50 - pityAtual} tiros p/ Raro garantido)</Text>
              </Text>
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity
            style={[styles.resultCloseBtn, { backgroundColor: temRaro ? '#f59e0b' : '#8b5cf6' }, pixelStyle]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.resultCloseTxt}>Fechar</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function GachaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { getApiUrl, user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;
  const { gemas, gachaContadorPity, isTiroGratisDisponivel, realizarTiroGacha, setGachaAdminPool, gachaAdminPool } = useGame();

  const [resultado, setResultado]       = useState<GachaReward[] | null>(null);
  const [mensagem, setMensagem]         = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [animating, setAnimating]       = useState(false);
  const [gachaActive, setGachaActive]   = useState<boolean | null>(null);

  // Fetch admin-configured pool and gacha_active flag
  useEffect(() => {
    const apiUrl = getApiUrl();
    if (!apiUrl) return;
    fetch(`${apiUrl}/config`)
      .then((r) => r.json())
      .then((data) => {
        const activeRaw = data?.config?.gacha_active;
        setGachaActive(activeRaw === 'true');
        const raw = data?.config?.gacha_pool;
        if (raw && raw !== 'none') {
          try {
            const parsed = JSON.parse(raw);
            // New format: { pool: [...], raroMax: N }
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.pool)) {
              if (parsed.pool.length > 0) setGachaAdminPool(parsed.pool);
            } else if (Array.isArray(parsed) && parsed.length > 0) {
              // Legacy format: plain array
              setGachaAdminPool(parsed);
            }
          } catch {}
        }
      })
      .catch(() => { setGachaActive(false); });
  }, []);

  // Find the RARO highlighted Digimon from admin pool (or fall back to null)
  const destaqueRaro = gachaAdminPool?.find((e) => e.raridade === 'Raro' && e.tipo === 'DIGIMON' && e.characterId) ?? null;

  const machineScale   = useRef(new Animated.Value(1)).current;
  const machineRotate  = useRef(new Animated.Value(0)).current;
  const machineOpacity = useRef(new Animated.Value(1)).current;
  const animeOpacity   = useRef(new Animated.Value(0)).current;
  const animeScale     = useRef(new Animated.Value(0.8)).current;
  const glowOpacity    = useRef(new Animated.Value(0)).current;

  function runPullAnimation(onDone: () => void) {
    setAnimating(true);
    machineScale.setValue(1);
    machineRotate.setValue(0);
    machineOpacity.setValue(1);
    animeOpacity.setValue(0);
    animeScale.setValue(0.8);
    glowOpacity.setValue(0);

    Animated.sequence([
      Animated.sequence([
        Animated.timing(machineRotate, { toValue: -8,  duration: 60,  useNativeDriver: true }),
        Animated.timing(machineRotate, { toValue:  8,  duration: 60,  useNativeDriver: true }),
        Animated.timing(machineRotate, { toValue: -6,  duration: 60,  useNativeDriver: true }),
        Animated.timing(machineRotate, { toValue:  6,  duration: 60,  useNativeDriver: true }),
        Animated.timing(machineRotate, { toValue:  0,  duration: 60,  useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(machineScale, { toValue: 1.15, duration: 200, useNativeDriver: true }),
        Animated.timing(glowOpacity,  { toValue: 1,    duration: 200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(machineOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(animeOpacity,   { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(animeScale,     { toValue: 1, duration: 300, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      ]),
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(animeOpacity,   { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(machineOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(machineScale,   { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(glowOpacity,    { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setAnimating(false);
      onDone();
    });
  }

  function handleTiro(qtd: 1 | 10) {
    if (animating) return;

    // Pre-compute result BEFORE animation to avoid async issues on Expo Go
    const res = realizarTiroGacha(qtd);
    if (!res || res.recompensas.length === 0) {
      setMensagem(res?.mensagem ?? 'Gemas insuficientes!');
      setResultado(null);
      setModalVisible(true);
      return;
    }
    setMensagem(res.mensagem);
    setResultado(res.recompensas);

    // Safety timeout: show modal even if animation callback doesn't fire (Expo Go quirk)
    const timer = setTimeout(() => setModalVisible(true), 3200);
    runPullAnimation(() => {
      clearTimeout(timer);
      setModalVisible(true);
    });
  }

  const pityPct   = (gachaContadorPity / 50) * 100;
  const rotateDeg = machineRotate.interpolate({ inputRange: [-20, 20], outputRange: ['-20deg', '20deg'] });

  // Show loading while config is being fetched
  if (gachaActive === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  // Show offline screen for non-admins when gacha is disabled
  if (!gachaActive && !isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
        <Image source={GACHA_MACHINE_IMG} style={{ width: 120, height: 120, opacity: 0.35 }} resizeMode="contain" />
        <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 14, textAlign: 'center' }}>
          🔒 Gacha Indisponível
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center', lineHeight: 22 }}>
          O administrador está preparando um novo período de invocações.{'\n'}Volte em breve!
        </Text>
      </View>
    );
  }

  // Build destaque display data from admin pool
  const destaqueChar = destaqueRaro?.characterId ? (getCharacter(destaqueRaro.characterId) ?? CHARACTERS[destaqueRaro.characterId]) : null;
  const destaqueImg  = destaqueRaro?.characterId ? getCharacterImageSource(destaqueRaro.characterId) : null;
  const destaqueNome = destaqueRaro?.nome ?? destaqueChar?.name ?? null;
  const destaqueIsDigimon = destaqueRaro?.tipo === 'DIGIMON';
  const destaqueIsEgg = destaqueChar?.rarity === 'EGG';
  const destaqueEmoji = destaqueRaro?.tipo ? TIPO_EMOJI[destaqueRaro.tipo] : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: 20, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <Image source={GACHA_MACHINE_IMG} style={styles.headerMachineIcon} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Sistema de Tiros</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Invoque Digimon raros do Mundo Digital
          </Text>
        </View>
      </View>

      {/* ── Destaque do Período (admin-configured) ── */}
      {destaqueNome && (
        <View style={[styles.destaqueCard, { backgroundColor: '#f59e0b11', borderColor: '#f59e0b88' }, pixelStyle]}>
          <View style={styles.destaqueInner}>
            {destaqueIsEgg && destaqueIsDigimon ? (
              <AnimatedEgg characterId={destaqueRaro!.characterId!} element={destaqueChar?.element ?? 'NULL'} size={80} />
            ) : destaqueImg && destaqueIsDigimon ? (
              <Image source={destaqueImg} style={styles.destaqueImg} resizeMode="contain" />
            ) : destaqueEmoji ? (
              <View style={[styles.destaqueImg, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 22 }}>{destaqueEmoji}</Text>
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={[styles.destaqueBadge, { color: '#f59e0b' }]}>🔥 DESTAQUE DO PERÍODO</Text>
              <Text style={[styles.destaqueNome, { color: colors.foreground }]}>{destaqueNome}</Text>
              <Text style={[styles.destaqueHint, { color: colors.mutedForeground }]}>
                Garantido ao atingir 50 tiros acumulados
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Animated machine + bubbles ── */}
      <View style={styles.machineRow}>
        <GachaBubbleColumn />
        <View style={styles.machineWrap}>
          <Animated.View style={[styles.machineGlow, { opacity: glowOpacity }]} />
          <Animated.Image
            source={GACHA_MACHINE_IMG}
            style={[styles.machineImg, {
              opacity: machineOpacity,
              transform: [{ scale: machineScale }, { rotate: rotateDeg }],
            }]}
            resizeMode="contain"
          />
          <Animated.Image
            source={GACHA_ANIME_IMG}
            style={[styles.machineImg, styles.animeImg, {
              opacity: animeOpacity,
              transform: [{ scale: animeScale }],
            }]}
            resizeMode="contain"
          />
        </View>
        <View style={{ flex: 1 }} />
      </View>

      {/* ── Gem balance ── */}
      <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
        <View style={styles.balanceRow}>
          <Image source={GEM_ICON_IMG} style={styles.gemImg} resizeMode="contain" />
          <View>
            <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Suas Gemas</Text>
            <Text style={[styles.balanceValue, { color: colors.foreground }]}>{gemas.toLocaleString()}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.pitySection}>
          <View style={styles.pityRow}>
            <Text style={[styles.pityLabel, { color: colors.mutedForeground }]}>Pity Counter</Text>
            <Text style={[styles.pityValue, { color: gachaContadorPity >= 40 ? '#f59e0b' : colors.foreground }]}>
              {gachaContadorPity}/50
            </Text>
          </View>
          <View style={[styles.pityBar, { backgroundColor: colors.border }]}>
            <View style={[styles.pityFill, {
              width: `${pityPct}%` as any,
              backgroundColor: gachaContadorPity >= 40 ? '#f59e0b' : '#8b5cf6',
            }]} />
          </View>
          <Text style={[styles.pityHint, { color: colors.mutedForeground }]}>
            {50 - gachaContadorPity} tiros até o Raro garantido
          </Text>
        </View>
      </View>

      {/* ── Guarantees info (sem % de drop) ── */}
      <View style={[styles.guaranteesCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
        <Text style={[styles.guaranteesTitle, { color: colors.foreground }]}>🛡️ Garantias do Sistema</Text>
        <View style={styles.guaranteesRow}>
          <View style={[styles.guaranteeChip, { borderColor: '#8b5cf666', backgroundColor: '#8b5cf622' }, pixelStyle]}>
            <Text style={[styles.guaranteeNum, { color: '#8b5cf6' }]}>x10</Text>
            <Text style={[styles.guaranteeLabel, { color: '#8b5cf6' }]}>Especial</Text>
            <Text style={[styles.guaranteeSub, { color: colors.mutedForeground }]}>garantido</Text>
          </View>
          <View style={[styles.guaranteeChip, { borderColor: '#f59e0b66', backgroundColor: '#f59e0b22' }, pixelStyle]}>
            <Text style={[styles.guaranteeNum, { color: '#f59e0b' }]}>x50</Text>
            <Text style={[styles.guaranteeLabel, { color: '#f59e0b' }]}>Raro ✦</Text>
            <Text style={[styles.guaranteeSub, { color: colors.mutedForeground }]}>garantido</Text>
          </View>
          <View style={[styles.guaranteeChip, { borderColor: '#22c55e66', backgroundColor: '#22c55e22' }, pixelStyle]}>
            <Text style={[styles.guaranteeNum, { color: '#22c55e' }]}>1/dia</Text>
            <Text style={[styles.guaranteeLabel, { color: '#22c55e' }]}>Grátis</Text>
            <Text style={[styles.guaranteeSub, { color: colors.mutedForeground }]}>tiro livre</Text>
          </View>
        </View>
      </View>

      {/* ── Buttons ── */}
      <View style={styles.btnGroup}>
        <TouchableOpacity
          style={[styles.btn, styles.btnSolo, {
            backgroundColor: isTiroGratisDisponivel ? '#22c55e' : colors.card,
            borderColor: isTiroGratisDisponivel ? '#16a34a' : colors.border,
            opacity: animating ? 0.6 : 1,
          }, pixelStyle]}
          onPress={() => handleTiro(1)}
          activeOpacity={0.8}
          disabled={animating}
        >
          <Image source={GACHA_MACHINE_IMG} style={styles.btnIcon} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.btnTitle, { color: isTiroGratisDisponivel ? '#fff' : colors.foreground }]}>
              1 Tiro
            </Text>
            <View style={styles.btnCostRow}>
              {!isTiroGratisDisponivel && (
                <Image source={GEM_ICON_IMG} style={styles.btnGemIcon} resizeMode="contain" />
              )}
              <Text style={[styles.btnCost, { color: isTiroGratisDisponivel ? '#dcfce7' : colors.mutedForeground }]}>
                {isTiroGratisDisponivel ? '✨ GRÁTIS hoje!' : '100 gemas'}
              </Text>
            </View>
          </View>
          <Feather
            name="chevron-right"
            size={18}
            color={isTiroGratisDisponivel ? '#fff' : colors.mutedForeground}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btn10, {
            opacity: animating || gemas < 900 ? 0.6 : 1,
          }, pixelStyle]}
          onPress={() => handleTiro(10)}
          activeOpacity={0.8}
          disabled={animating || gemas < 900}
        >
          <Image source={GACHA_MACHINE_IMG} style={styles.btnIcon} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.btnTitle, { color: '#fff' }]}>10 Tiros</Text>
            <View style={styles.btnCostRow}>
              <Image source={GEM_ICON_IMG} style={styles.btnGemIcon} resizeMode="contain" />
              <Text style={[styles.btnCost, { color: '#fef3c7' }]}>900 gemas • Especial garantido</Text>
            </View>
          </View>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-10%</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Info ── */}
      <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Os Digimon invocados são enviados diretamente ao seu DigiBank. Duplicatas são permitidas.
        </Text>
      </View>

      {/* ── Result Modal (full-screen overlay) ── */}
      <ResultModal
        visible={modalVisible}
        resultado={resultado}
        mensagem={mensagem}
        pityAtual={gachaContadorPity}
        onClose={() => setModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerMachineIcon: { width: 56, height: 56 },
  headerTitle: { fontSize: 14, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 2 },

  destaqueCard: { borderRadius: 16, borderWidth: 1.5, padding: 14 },
  destaqueInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  destaqueImg: { width: 72, height: 72 },
  destaqueBadge: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  destaqueNome: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  destaqueHint: { fontSize: 11, marginTop: 3 },

  machineRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  machineWrap: { alignItems: 'center', justifyContent: 'center', width: 200, height: 200 },
  bubblesColumn: { flex: 1, flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center', height: 200 },
  bubble: {
    width: 58, height: 58, borderRadius: 29, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  machineGlow: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#a855f7',
    ...Platform.select({
      ios:     { shadowColor: '#a855f7', shadowOpacity: 0.9, shadowRadius: 40, shadowOffset: { width: 0, height: 0 } },
      android: { elevation: 0 },
    }),
    opacity: 0,
  },
  machineImg: { width: 200, height: 200 },
  animeImg: { position: 'absolute' },

  balanceCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gemImg: { width: 40, height: 40 },
  balanceLabel: { fontSize: 12 },
  balanceValue: { fontSize: 17, fontWeight: '800' },
  divider: { height: 1 },
  pitySection: { gap: 6 },
  pityRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pityLabel: { fontSize: 13 },
  pityValue: { fontSize: 13, fontWeight: '700' },
  pityBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  pityFill: { height: '100%', borderRadius: 3 },
  pityHint: { fontSize: 11 },

  guaranteesCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  guaranteesTitle: { fontSize: 12, fontWeight: '700' },
  guaranteesRow: { flexDirection: 'row', gap: 8 },
  guaranteeChip: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', paddingVertical: 10, gap: 2,
  },
  guaranteeNum:   { fontSize: 14, fontWeight: '800' },
  guaranteeLabel: { fontSize: 12, fontWeight: '700' },
  guaranteeSub:   { fontSize: 10 },

  btnGroup: { gap: 10 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 16,
  },
  btnSolo: {},
  btn10: { backgroundColor: '#7c3aed', borderColor: '#6d28d9' },
  btnIcon: { width: 36, height: 36 },
  btnCostRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  btnGemIcon: { width: 14, height: 14 },
  btnTitle: { fontSize: 14, fontWeight: '700' },
  btnCost: { fontSize: 12 },
  discountBadge: { backgroundColor: '#fbbf24', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  discountText: { fontSize: 11, fontWeight: '800', color: '#78350f' },

  infoBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start' },
  infoText: { fontSize: 12, lineHeight: 17, flex: 1 },

  // Result modal
  resultOverlay: {
    flex: 1, backgroundColor: '#000000cc',
    alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  resultPanel: {
    borderRadius: 24, width: '100%', maxHeight: '90%',
    overflow: 'hidden', borderWidth: 1.5,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 30, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 20 },
    }),
  },
  resultHeader: { padding: 20, borderBottomWidth: 1, gap: 6, alignItems: 'center' },
  resultTitle: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  resultMsg:   { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  resultCards: { flexDirection: 'row', gap: 10, padding: 16 },
  resultCardsSingle: { justifyContent: 'center', flex: 1 },
  pityChip: {
    marginHorizontal: 16, marginBottom: 4,
    borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center',
  },
  resultCloseBtn: {
    margin: 16, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  resultCloseTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Legacy (kept for RewardCard)
  rewardCard: {
    borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', padding: 10, gap: 6, overflow: 'hidden',
  },
  rewardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 60, borderRadius: 14 },
  rewardImgPlaceholder: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rarBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  rarBadgeText: { fontSize: 9, fontWeight: '700' },
  rewardName: { fontWeight: '700', textAlign: 'center' },
});
