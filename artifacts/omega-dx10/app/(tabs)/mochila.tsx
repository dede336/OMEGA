import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, TextInput, Image,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { pixelStyle } from '@/constants/pixelStyle';
import {
  EQUIP_SLOT_ICONS, EQUIPMENT_ITEMS, EQUIP_SLOTS_ORDER,
  RARITY_COLORS, ELEMENTS, EquipSlot, RarityId, ElementId,
  TAMERS, tamerExpToNextLevel, CRAFT_RECIPES,
} from '@/constants/gameData';
import EQUIP_ITEM_IMAGES from '@/constants/equipImages';
import { useLanguage } from '@/context/LanguageContext';

export default function MochilaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const {
    playerName, gender, tamerId, inventory, equippedItems,
    tamerExp, tamerLevel, pieces, bits,
    equipItem, unequipItem, setPlayerName, craftItem,
  } = game;

  const { t } = useLanguage();
  const genderColor = gender === 'M' ? '#3b82f6' : gender === 'F' ? '#ec4899' : '#a855f7';
  const genderSymbol = gender === 'M' ? '♂' : gender === 'F' ? '♀' : '⚧';
  const genderLabel = gender === 'M' ? t('mochila.genderM') : gender === 'F' ? t('mochila.genderF') : t('mochila.genderN');

  const selectedTamer = TAMERS.find((t) => t.id === tamerId) ?? null;

  const [selectedSlot, setSelectedSlot] = useState<EquipSlot | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);

  const topPad = 0;
  const botPad = insets.bottom + 20;

  const totalBonus = game.totalEquipBonus();
  const bonusEntries = Object.entries(totalBonus).filter(([, v]) => (v ?? 0) > 0);

  const { customEquipItems } = game;
  const allEquipmentItems = [...EQUIPMENT_ITEMS, ...customEquipItems];
  const slotItems = selectedSlot
    ? allEquipmentItems.filter((i) => i.slot === selectedSlot && inventory.includes(i.id))
    : [];

  function handleSlotPress(slot: EquipSlot) {
    setSelectedSlot((prev) => (prev === slot ? null : slot));
  }

  function handleEquip(itemId: string) {
    if (!selectedSlot) return;
    if (equippedItems[selectedSlot] === itemId) {
      unequipItem(selectedSlot);
    } else {
      equipItem(selectedSlot, itemId);
    }
  }

  function saveName() {
    const trimmed = nameInput.trim();
    if (trimmed.length > 0) setPlayerName(trimmed);
    setEditingName(false);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 20, paddingBottom: botPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Tamer Card ── */}
      <View style={[styles.tamerCard, { backgroundColor: colors.card, borderColor: selectedTamer ? selectedTamer.accentColor + '88' : colors.border }, pixelStyle]}>
        <View style={styles.tamerAvatarWrap}>
          {selectedTamer ? (
            <View style={[styles.tamerAvatarImg, { borderColor: selectedTamer.accentColor }]}>
              <ExpoImage
                source={selectedTamer.image}
                style={[styles.tamerAvatarImageStyle, { marginTop: selectedTamer.avatarOffset }]}
                contentFit="cover"
              />
            </View>
          ) : (
            <View style={[styles.tamerAvatar, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
              <Feather name="user" size={40} color={colors.primary} />
            </View>
          )}
          {gender === 'M' && (
            <View style={[styles.genderBadge, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.genderBadgeText}>♂</Text>
            </View>
          )}
          {gender === 'F' && (
            <View style={[styles.genderBadge, { backgroundColor: '#ec4899' }]}>
              <Text style={styles.genderBadgeText}>♀</Text>
            </View>
          )}
          {gender === 'N' && (
            <View style={[styles.genderBadge, { backgroundColor: '#a855f7' }]}>
              <Text style={styles.genderBadgeText}>⚧</Text>
            </View>
          )}
        </View>

        <View style={styles.tamerInfo}>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={[styles.nameInput, { color: colors.foreground, borderColor: colors.primary }]}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                maxLength={16}
                onBlur={saveName}
                onSubmitEditing={saveName}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={saveName} style={styles.nameConfirm}>
                <Feather name="check" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={() => { setNameInput(playerName); setEditingName(true); }}>
              <Text style={[styles.tamerName, { color: colors.foreground }]}>{playerName}</Text>
              <Feather name="edit-2" size={14} color={colors.mutedForeground} style={{ marginLeft: 6, marginTop: 4 }} />
            </TouchableOpacity>
          )}
          <View style={styles.tamerMetaRow}>
            <Text style={[styles.tamerLabel, { color: colors.mutedForeground }]}>{t('mochila.tamerDigital')}</Text>
            <View style={[styles.genderPill, { backgroundColor: genderColor + '22', borderColor: genderColor + '66' }]}>
              <Text style={[styles.genderPillText, { color: genderColor }]}>{genderSymbol}</Text>
            </View>
          </View>
          {/* Tamer XP Bar */}
          <View style={styles.tamerXpRow}>
            <Text style={[styles.tamerXpLabel, { color: colors.mutedForeground }]}>
              Lv {tamerLevel}
            </Text>
            <View style={[styles.tamerXpBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.tamerXpBarFill,
                  {
                    backgroundColor: selectedTamer?.accentColor ?? colors.primary,
                    width: `${Math.min(100, (tamerExp / tamerExpToNextLevel(tamerLevel)) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.tamerXpNum, { color: colors.mutedForeground }]}>
              {tamerExp}/{tamerExpToNextLevel(tamerLevel)}
            </Text>
          </View>
          <Text style={[styles.tamerXpMissing, { color: colors.mutedForeground }]}>
            {t('mochila.expNeeded')} {tamerExpToNextLevel(tamerLevel) - tamerExp} EXP {t('mochila.forLevel')} {tamerLevel + 1}
          </Text>
        </View>
      </View>

      {/* ── Equipamentos ── */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('mochila.equipment')}</Text>
      <View style={styles.slotsGrid}>
        {EQUIP_SLOTS_ORDER.map((slot) => {
          const equippedId = equippedItems[slot];
          const equippedItem = equippedId ? EQUIPMENT_ITEMS.find((i) => i.id === equippedId) : null;
          const isSelected = selectedSlot === slot;
          const rarityCol = equippedItem ? RARITY_COLORS[equippedItem.rarity] : null;

          return (
            <TouchableOpacity
              key={slot}
              style={[
                styles.slotCard,
                {
                  backgroundColor: isSelected
                    ? colors.primary + '18'
                    : equippedItem ? rarityCol + '12' : colors.card,
                  borderColor: isSelected
                    ? colors.primary
                    : equippedItem ? rarityCol + '88' : colors.border,
                },
                pixelStyle,
              ]}
              onPress={() => handleSlotPress(slot)}
              activeOpacity={0.8}
            >
              <View style={[styles.slotIconWrap, { backgroundColor: (rarityCol ?? colors.primary) + '22' }]}>
                {equippedItem && EQUIP_ITEM_IMAGES[equippedItem.id] ? (
                  <Image source={EQUIP_ITEM_IMAGES[equippedItem.id]} style={{ width: 28, height: 28 }} resizeMode="contain" />
                ) : (
                  <Feather
                    name={EQUIP_SLOT_ICONS[slot] as any}
                    size={18}
                    color={rarityCol ?? colors.primary}
                  />
                )}
              </View>
              <Text style={[styles.slotName, { color: colors.mutedForeground }]}>{t(`slot.${slot}`)}</Text>
              {equippedItem ? (
                <>
                  <Text style={[styles.slotItemName, { color: rarityCol ?? colors.foreground }]} numberOfLines={1}>
                    {t(`item.${equippedItem.id}`) || equippedItem.name}
                  </Text>
                  <View style={[styles.rarityPill, { backgroundColor: rarityCol + '33' }]}>
                    <Text style={[styles.rarityPillText, { color: rarityCol ?? colors.foreground }]}>
                      {t(`rarity.${equippedItem.rarity}`)}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={[styles.slotEmpty, { color: colors.mutedForeground }]}>{t('mochila.emptySlot')}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Item Picker ── */}
      {selectedSlot && (
        <View style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
          <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
            {t(`slot.${selectedSlot}`)} — {t('mochila.selectItem')}
          </Text>

          {slotItems.length === 0 ? (
            <View style={styles.pickerEmpty}>
              <Feather name="package" size={28} color={colors.mutedForeground} />
              <Text style={[styles.pickerEmptyText, { color: colors.mutedForeground }]}>
                {t('mochila.noItemsSlot')}
              </Text>
            </View>
          ) : (
            slotItems.map((item) => {
              const isEquipped = equippedItems[selectedSlot] === item.id;
              const rc = RARITY_COLORS[item.rarity as RarityId];
              const flatBonusStr = Object.entries(item.bonuses)
                .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
                .join('  ');
              const pctBonusStr = item.percentBonuses
                ? Object.entries(item.percentBonuses)
                    .map(([k, v]) => `+${Math.round(((v as number) ?? 0) * 100)}% ${k.toUpperCase()}`)
                    .join('  ')
                : '';
              const specialBonuses: string[] = [];
              if ((item as any).xpBonusPercent)      specialBonuses.push(`⚔️ +${Math.round((item as any).xpBonusPercent * 100)}% ${t('mochila.xpBattle')}`);
              if ((item as any).xpSharePercent)      specialBonuses.push(`📡 +${Math.round((item as any).xpSharePercent * 100)}% ${t('mochila.xpReserve')}`);
              if ((item as any).tamerXpBonusPercent) specialBonuses.push(`⭐ +${Math.round((item as any).tamerXpBonusPercent * 100)}% ${t('mochila.xpTamer')}`);
              const bonusStr = [flatBonusStr, pctBonusStr, ...specialBonuses].filter(Boolean).join('  ');

              const itemImg = EQUIP_ITEM_IMAGES[item.id];
              const elemBonus = item.elementBonus;
              const elemLabel = elemBonus ? elemBonus.elements.map((e: ElementId) => ELEMENTS[e]?.label).join(' & ') : null;
              const elemColor = elemBonus ? ELEMENTS[elemBonus.elements[0] as ElementId]?.color : null;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.pickerItem,
                    {
                      backgroundColor: isEquipped ? rc + '22' : colors.background,
                      borderColor: isEquipped ? rc : colors.border,
                    },
                    pixelStyle,
                  ]}
                  onPress={() => handleEquip(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.pickerItemLeft}>
                    {itemImg ? (
                      <Image source={itemImg} style={styles.pickerItemImg} resizeMode="contain" />
                    ) : (
                      <View style={[styles.pickerRarityDot, { backgroundColor: rc }]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={styles.pickerItemNameRow}>
                        <Text style={[styles.pickerItemName, { color: colors.foreground }]}>{t(`item.${item.id}`) || item.name}</Text>
                        <View style={[styles.rarityPill, { backgroundColor: rc + '33', marginLeft: 6 }]}>
                          <Text style={[styles.rarityPillText, { color: rc }]}>{t(`rarity.${item.rarity}`)}</Text>
                        </View>
                      </View>
                      {bonusStr.length > 0 && (
                        <Text style={[styles.pickerItemBonus, { color: rc }]}>{bonusStr}</Text>
                      )}
                      {elemBonus && elemLabel && elemColor && (
                        <View style={[styles.elemBonusRow, { backgroundColor: elemColor + '22', borderColor: elemColor + '55' }]}>
                          <Text style={[styles.elemBonusText, { color: elemColor }]}>
                            ✦ +{Math.round(elemBonus.percent * 100)}% {t('mochila.allStats')} — {elemLabel}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.pickerItemDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.equipBtn,
                    { backgroundColor: isEquipped ? rc + '33' : colors.primary + '22', borderColor: isEquipped ? rc : colors.primary },
                  ]}>
                    <Text style={[styles.equipBtnText, { color: isEquipped ? rc : colors.primary }]}>
                      {isEquipped ? t('mochila.unequip') : t('mochila.equip')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}


      {/* ── Total Bonus ── */}
      {bonusEntries.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('mochila.totalBonus')}</Text>
          <View style={[styles.bonusCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
            <View style={styles.bonusGrid}>
              {bonusEntries.map(([key, val]) => (
                <View key={key} style={[styles.bonusChip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '44' }]}>
                  <Text style={[styles.bonusKey, { color: colors.mutedForeground }]}>{key.toUpperCase()}</Text>
                  <Text style={[styles.bonusVal, { color: colors.primary }]}>+{val}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.bonusNote, { color: colors.mutedForeground }]}>
              {t('mochila.appliedInBattle')}
            </Text>
          </View>
        </>
      )}

      {/* ── Itens Forjados ── */}
      {CRAFT_RECIPES.some((r) => inventory.includes(r.resultItemId)) && (
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('mochila.craftedItems')}</Text>
      )}

      {/* Fragmentos disponíveis */}
      {(() => {
        const knownPieces = [
          { pieceId: 'piece_tecido',  label: t('item.piece_tecido'),  icon: 'layers', color: '#ec4899' },
          { pieceId: 'piece_linha',   label: t('item.piece_linha'),   icon: 'wind',   color: '#06b6d4' },
          { pieceId: 'piece_agulha',  label: t('item.piece_agulha'),  icon: 'edit-2', color: '#8b5cf6' },
        ];
        const hasAny = knownPieces.some((p) => (pieces[p.pieceId] ?? 0) > 0);
        const hasCrafted = CRAFT_RECIPES.some((r) => inventory.includes(r.resultItemId));
        if (!hasAny || !hasCrafted) return null;
        return (
          <View style={[styles.fragmentSummaryRow, { borderColor: colors.border, backgroundColor: colors.card, marginBottom: 16 }, pixelStyle]}>
            {knownPieces.map((p) => (
              <View key={p.pieceId} style={styles.fragmentSummaryItem}>
                <View style={[styles.fragmentSummaryIcon, { backgroundColor: p.color + '22' }]}>
                  <Feather name={p.icon as any} size={18} color={p.color} />
                </View>
                <Text style={[styles.fragmentSummaryCount, { color: colors.foreground }]}>
                  {pieces[p.pieceId] ?? 0}
                </Text>
                <Text style={[styles.fragmentSummaryLabel, { color: colors.mutedForeground }]}>{p.label}</Text>
              </View>
            ))}
            <View style={styles.fragmentSummaryItem}>
              <View style={[styles.fragmentSummaryIcon, { backgroundColor: '#facc1522' }]}>
                <Image source={require('../../assets/images/bits-icon.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
              </View>
              <Text style={[styles.fragmentSummaryCount, { color: '#facc15' }]}>
                {bits >= 1000 ? `${(bits / 1000).toFixed(1)}k` : bits.toLocaleString()}
              </Text>
              <Text style={[styles.fragmentSummaryLabel, { color: colors.mutedForeground }]}>Bits</Text>
            </View>
          </View>
        );
      })()}

      {CRAFT_RECIPES.filter((r) => inventory.includes(r.resultItemId)).map((recipe, idx) => {
        const alreadyCrafted = true;
        const rc = RARITY_COLORS[recipe.resultRarity];
        const resultImg = EQUIP_ITEM_IMAGES[recipe.resultItemId];

        // Determine requirements list for display
        const reqs = recipe.pieceRequirements && recipe.pieceRequirements.length > 0
          ? recipe.pieceRequirements
          : [{ pieceId: recipe.pieceId, count: recipe.requiredCount, pieceName: recipe.pieceName, pieceIcon: recipe.pieceIcon, pieceColor: recipe.pieceColor }];

        // Check if all piece requirements are met
        const allPiecesMet = reqs.every((r) => (pieces[r.pieceId] ?? 0) >= r.count);
        const bitsMet = !recipe.bitsCost || bits >= recipe.bitsCost;
        const canCraft = !alreadyCrafted && allPiecesMet && bitsMet;

        // Progress: for multi-piece use limiting ratio; for single use normal
        const minRatio = Math.min(...reqs.map((r) => Math.min(1, (pieces[r.pieceId] ?? 0) / r.count)));

        return (
          <View
            key={`${recipe.resultItemId}-${idx}`}
            style={[styles.craftCard, { backgroundColor: colors.card, borderColor: canCraft ? rc : alreadyCrafted ? rc + '66' : colors.border }, pixelStyle]}
          >
            {/* Header */}
            <View style={styles.craftCardHeader}>
              {resultImg ? (
                <Image source={resultImg} style={{ width: 52, height: 52 }} resizeMode="contain" />
              ) : (
                <View style={[styles.craftPieceIcon, { backgroundColor: recipe.pieceColor + '22' }]}>
                  <Feather name={recipe.pieceIcon as any} size={22} color={recipe.pieceColor} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.craftResultName, { color: colors.foreground }]}>{recipe.resultItemName}</Text>
                <View style={styles.craftRarityRow}>
                  <View style={[styles.craftRarityBadge, { backgroundColor: rc + '22' }]}>
                    <Text style={[styles.craftRarityText, { color: rc }]}>{t(`rarity.${recipe.resultRarity}`)}</Text>
                  </View>
                </View>
                <Text style={[{ fontSize: 11, color: colors.mutedForeground, marginTop: 3 }]} numberOfLines={2}>
                  {recipe.pieceDescription}
                </Text>
              </View>
            </View>

            {/* Requirements chips */}
            <View style={styles.craftReqRow}>
              {reqs.map((r) => {
                const have = pieces[r.pieceId] ?? 0;
                const met = have >= r.count;
                return (
                  <View
                    key={r.pieceId}
                    style={[styles.craftReqChip, {
                      backgroundColor: met ? r.pieceColor + '22' : colors.background,
                      borderColor: met ? r.pieceColor : colors.border,
                    }]}
                  >
                    <Feather name={r.pieceIcon as any} size={13} color={met ? r.pieceColor : colors.mutedForeground} />
                    <Text style={[styles.craftReqText, { color: met ? r.pieceColor : colors.mutedForeground }]}>
                      {have}/{r.count} {r.pieceName}
                    </Text>
                  </View>
                );
              })}
              {!!recipe.bitsCost && (
                <View style={[styles.craftReqChip, {
                  backgroundColor: bitsMet ? '#facc1522' : colors.background,
                  borderColor: bitsMet ? '#facc15' : colors.border,
                }]}>
                  <Image source={require('../../assets/images/bits-icon.png')} style={{ width: 14, height: 14, opacity: bitsMet ? 1 : 0.4 }} resizeMode="contain" />
                  <Text style={[styles.craftReqText, { color: bitsMet ? '#facc15' : colors.mutedForeground }]}>
                    {recipe.bitsCost.toLocaleString()} Bits
                  </Text>
                </View>
              )}
            </View>

            {/* Progress bar */}
            <View style={styles.craftProgressRow}>
              <View style={[styles.craftProgressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.craftProgressFill, { width: `${Math.round(minRatio * 100)}%` as any, backgroundColor: canCraft ? rc : recipe.pieceColor }]} />
              </View>
              <Text style={[styles.craftProgressLabel, { color: canCraft ? rc : colors.mutedForeground }]}>
                {Math.round(minRatio * 100)}%
              </Text>
            </View>

            {/* Action */}
            {alreadyCrafted ? (
              <View style={[styles.craftedBadge, { backgroundColor: rc + '18', borderColor: rc + '55' }]}>
                <Feather name="check-circle" size={16} color={rc} />
                <Text style={[styles.craftedText, { color: rc }]}>{t('mochila.alreadyCrafted')}</Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={canCraft ? 0.8 : 1}
                onPress={() => { if (canCraft) craftItem(recipe); }}
                style={[styles.craftBtn, {
                  backgroundColor: canCraft ? rc + '22' : colors.background,
                  borderColor: canCraft ? rc : colors.border,
                }]}
              >
                <Feather name="tool" size={16} color={canCraft ? rc : colors.mutedForeground} />
                <Text style={[styles.craftBtnText, { color: canCraft ? rc : colors.mutedForeground }]}>
                  {canCraft ? `${t('craft.forge')} ${recipe.resultItemName}` : t('mochila.insufficientMaterials')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },

  tamerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 24,
  },
  tamerAvatarWrap: { position: 'relative' },
  tamerAvatar: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  tamerAvatarImg: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 2.5,
    overflow: 'hidden' as const,
    backgroundColor: 'transparent',
  },
  tamerAvatarImageStyle: {
    width: '100%' as unknown as number,
    height: 180,
    marginTop: -8,
  },
  genderBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  genderBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' as const },
  tamerInfo: { flex: 1 },
  tamerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' },
  genderPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  genderPillText: { fontSize: 11, fontWeight: '700' as const },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  tamerName: { fontSize: 14, fontWeight: '800' as const },
  tamerLabel: { fontSize: 12, marginTop: 2 },
  tamerXpRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  tamerXpLabel: { fontSize: 11, fontWeight: '700' as const, minWidth: 28 },
  tamerXpBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' as const },
  tamerXpBarFill: { height: 6, borderRadius: 3 },
  tamerXpNum: { fontSize: 10, minWidth: 36, textAlign: 'right' as const },
  tamerXpMissing: { fontSize: 10, marginTop: 2, textAlign: 'center' as const, opacity: 0.7 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    flex: 1, fontSize: 15, fontWeight: '700' as const,
    borderBottomWidth: 2, paddingVertical: 2,
  },
  nameConfirm: { padding: 4 },

  sectionTitle: {
    fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.5,
    marginBottom: 12, textTransform: 'uppercase',
  },

  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  genderBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1.5,
    paddingVertical: 14, alignItems: 'center', gap: 4,
  },
  genderSymbol: { fontSize: 14, fontWeight: '700' as const },
  genderLabel: { fontSize: 11, fontWeight: '600' as const },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  slotCard: {
    width: '47%', borderRadius: 14, borderWidth: 1.5,
    padding: 12, alignItems: 'center', gap: 6,
  },
  slotIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  slotName: { fontSize: 11, fontWeight: '600' as const, textTransform: 'uppercase', letterSpacing: 0.5 },
  slotItemName: { fontSize: 13, fontWeight: '700' as const, textAlign: 'center' },
  slotEmpty: { fontSize: 12, fontStyle: 'italic' },
  rarityPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  rarityPillText: { fontSize: 10, fontWeight: '700' as const },

  pickerCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24, gap: 12,
  },
  pickerTitle: { fontSize: 12, fontWeight: '700' as const, marginBottom: 4 },
  pickerEmpty: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  pickerEmptyText: { fontSize: 13 },
  pickerItem: {
    borderRadius: 14, borderWidth: 1.5, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  pickerItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pickerRarityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  pickerItemImg: { width: 44, height: 44 },
  elemBonusRow: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 4, alignSelf: 'flex-start' as const },
  elemBonusText: { fontSize: 11, fontWeight: '700' as const },
  pickerItemNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 },
  pickerItemName: { fontSize: 12, fontWeight: '700' as const },
  pickerItemBonus: { fontSize: 12, fontWeight: '700' as const, marginBottom: 3 },
  pickerItemDesc: { fontSize: 12, lineHeight: 17 },
  equipBtn: {
    borderRadius: 10, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  equipBtnText: { fontSize: 12, fontWeight: '700' as const },

  fragmentCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 16, gap: 12 },
  fragmentTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fragmentImg: { width: 52, height: 52 },
  fragmentName: { fontSize: 13, fontWeight: '700' as const, marginBottom: 3 },
  fragmentDesc: { fontSize: 12, lineHeight: 17 },
  fragmentProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fragmentTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' as const },
  fragmentFill: { height: 8, borderRadius: 4 },
  fragmentCount: { fontSize: 13, fontWeight: '700' as const, minWidth: 45, textAlign: 'right' as const },
  // craft summary
  fragmentSummaryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  fragmentSummaryItem: { alignItems: 'center', gap: 4 },
  fragmentSummaryIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  fragmentSummaryCount: { fontSize: 14, fontWeight: '800' as const },
  fragmentSummaryLabel: { fontSize: 11 },
  // craft cards
  craftCard: { borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 14, gap: 10 },
  craftCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  craftPieceIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  craftResultName: { fontSize: 13, fontWeight: '700' as const, marginBottom: 4 },
  craftRarityRow: { flexDirection: 'row' },
  craftRarityBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  craftRarityText: { fontSize: 11, fontWeight: '700' as const },
  craftReqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  craftReqChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  craftReqText: { fontSize: 12, fontWeight: '600' as const },
  craftProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  craftProgressTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' as const },
  craftProgressFill: { height: 6, borderRadius: 3 },
  craftProgressLabel: { fontSize: 12, fontWeight: '700' as const, minWidth: 36, textAlign: 'right' as const },
  craftBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1.5, paddingVertical: 12 },
  craftBtnText: { fontSize: 13, fontWeight: '700' as const },
  craftedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  craftedText: { fontSize: 12, fontWeight: '600' as const },
  bonusCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  bonusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  bonusChip: {
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', minWidth: 70,
  },
  bonusKey: { fontSize: 10, fontWeight: '600' as const },
  bonusVal: { fontSize: 14, fontWeight: '800' as const },
  bonusNote: { fontSize: 11, textAlign: 'center' },
});
