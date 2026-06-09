import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Image, Modal, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { CRAFT_RECIPES, EQUIPMENT_ITEMS, CraftRecipe } from '@/constants/gameData';
import EQUIP_ITEM_IMAGES from '@/constants/equipImages';
import { pixelStyle } from '@/constants/pixelStyle';
import { useLanguage } from '@/context/LanguageContext';

const isWeb = Platform.OS === 'web';

// ─── Fragment display metadata ──────────────────────────────────────────────
const PIECE_META: Record<string, { label: string; icon: string; color: string; image?: any }> = {
  piece_brasao_coragem:      { label: 'Fragmento da Coragem',      icon: 'sun',     color: '#f97316' },
  piece_brasao_esperanca:    { label: 'Fragmento da Esperança',    icon: 'sun',     color: '#eab308' },
  piece_brasao_amizade:      { label: 'Fragmento da Amizade',      icon: 'users',   color: '#3b82f6' },
  piece_brasao_confianca:    { label: 'Fragmento da Confiança',    icon: 'shield',  color: '#94a3b8' },
  piece_brasao_pureza:       { label: 'Fragmento da Pureza',       icon: 'droplet', color: '#22c55e' },
  piece_brasao_amor:         { label: 'Fragmento do Amor',         icon: 'heart',   color: '#f43f5e' },
  piece_brasao_luz:          { label: 'Fragmento da Luz',          icon: 'star',    color: '#c084fc' },
  piece_brasao_conhecimento: { label: 'Fragmento do Conhecimento', icon: 'book',    color: '#a855f7' },
  piece_agulha:              { label: 'Agulha Média',              icon: 'edit-2',  color: '#8b5cf6', image: require('../../assets/images/agulha-media.png') },
  piece_tecido:              { label: 'Tecido Colorido',           icon: 'layers',  color: '#ec4899', image: require('../../assets/images/tecido-arco-iris.png') },
  piece_linha:               { label: 'Linha Colorida',            icon: 'wind',    color: '#06b6d4', image: require('../../assets/images/linha-arco-iris.png') },
  piece_anel_sagrado:        { label: 'Fragmento do Anel Sagrado', icon: 'circle',  color: '#fde68a' },
  piece_gehenna:             { label: 'Fragmento do Gehenna',      icon: 'moon',    color: '#6366f1' },
  piece_caos:                { label: 'Fragmento do Caos',         icon: 'cpu',     color: '#a855f7' },
};

// ─── Category definitions ────────────────────────────────────────────────────
type CraftCategory = 'evolucao' | 'roupa' | 'brasao';

const CATEGORIES: { id: CraftCategory; label: string; icon: string; color: string }[] = [
  { id: 'evolucao', label: 'Evolução', icon: 'zap',          color: '#f59e0b' },
  { id: 'roupa',    label: 'Roupa',    icon: 'shopping-bag', color: '#ec4899' },
  { id: 'brasao',   label: 'Brasão',   icon: 'shield',       color: '#8b5cf6' },
];

const EVOLUTION_ITEM_IDS = new Set(['anel_sagrado', 'gehenna']);
const ROUPA_ITEM_IDS = new Set(['blusa_social', 'bermuda_poliester', 'tenis_corrida', 'pulseira_ouro']);

function getCategoryForRecipe(recipe: CraftRecipe): CraftCategory {
  if (recipe.resultItemId.startsWith('brasao_')) return 'brasao';
  if (EVOLUTION_ITEM_IDS.has(recipe.resultItemId)) return 'evolucao';
  return 'roupa';
}

function computeProgress(recipe: CraftRecipe, pieces: Record<string, number>): number {
  if (recipe.pieceRequirements?.length) {
    const fracs = recipe.pieceRequirements.map(r => Math.min(1, (pieces[r.pieceId] ?? 0) / r.count));
    return Math.min(...fracs);
  }
  return Math.min(1, (pieces[recipe.pieceId] ?? 0) / recipe.requiredCount);
}

function getItemDescription(itemId: string): string {
  const found = EQUIPMENT_ITEMS.find(i => i.id === itemId);
  if (found) return found.description;
  if (itemId === 'anel_sagrado') return 'Usado para evoluir Angewomon → Ophanimon e MagnaAngemon → Seraphimon.';
  if (itemId === 'gehenna') return 'Usado para evoluir Lucemon Chaos Mode → Lucemon Satan Mode.';
  return '';
}

// ─── Fragment chip used in detail modal ──────────────────────────────────────
function FragmentChip({
  pieceId, required, have, colors,
}: { pieceId: string; required: number; have: number; colors: ReturnType<typeof import('@/hooks/useColors').useColors> }) {
  const meta = PIECE_META[pieceId];
  const met = have >= required;
  const color = meta?.color ?? '#94a3b8';
  return (
    <View style={[chipStyles.chip, {
      backgroundColor: met ? color + '18' : colors.background,
      borderColor: met ? color : colors.border,
    }, pixelStyle]}>
      {meta?.image ? (
        <Image source={meta.image} style={{ width: 16, height: 16 }} resizeMode="contain" />
      ) : (
        <Feather name={(meta?.icon ?? 'box') as any} size={13} color={met ? color : colors.mutedForeground} />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[chipStyles.name, { color: met ? color : colors.mutedForeground }]} numberOfLines={1}>
          {meta?.label ?? pieceId}
        </Text>
      </View>
      <Text style={[chipStyles.count, { color: met ? color : colors.mutedForeground }]}>
        {have}/{required}
      </Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 8,
    marginBottom: 8,
  },
  name: { fontSize: 12, fontWeight: '600' as const },
  count: { fontSize: 12, fontWeight: '700' as const },
});

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({
  recipe, visible, onClose, pieces, bits, inventory, craftItem, colors,
}: {
  recipe: CraftRecipe | null;
  visible: boolean;
  onClose: () => void;
  pieces: Record<string, number>;
  bits: number;
  inventory: string[];
  craftItem: (r: CraftRecipe) => void;
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
}) {
  if (!recipe) return null;

  const isMulti = !!(recipe.pieceRequirements?.length);
  const alreadyCrafted = inventory.includes(recipe.resultItemId);
  const hasEnoughBits = bits >= (recipe.bitsCost ?? 0);
  const hasEnoughPieces = isMulti
    ? recipe.pieceRequirements!.every(r => (pieces[r.pieceId] ?? 0) >= r.count)
    : (pieces[recipe.pieceId] ?? 0) >= recipe.requiredCount;
  const canCraft = hasEnoughPieces && hasEnoughBits && !alreadyCrafted;

  const progress = computeProgress(recipe, pieces);
  const catObj = CATEGORIES.find(c => c.id === getCategoryForRecipe(recipe))!;
  const description = getItemDescription(recipe.resultItemId);
  const itemImg = EQUIP_ITEM_IMAGES[recipe.resultItemId];

  const allReqs: { pieceId: string; count: number }[] = isMulti
    ? recipe.pieceRequirements!.map(r => ({ pieceId: r.pieceId, count: r.count }))
    : [{ pieceId: recipe.pieceId, count: recipe.requiredCount }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modal.overlay} onPress={onClose}>
        <Pressable style={[modal.sheet, { backgroundColor: colors.card }]} onPress={() => {}}>
          <View style={[modal.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={modal.header}>
            <View style={[modal.iconWrap, { backgroundColor: recipe.pieceColor + '22' }, pixelStyle]}>
              {itemImg ? (
                <Image source={itemImg} style={{ width: 40, height: 40 }} resizeMode="contain" />
              ) : (
                <Feather name={recipe.pieceIcon as any} size={24} color={recipe.pieceColor} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[modal.itemName, { color: colors.foreground }]}>{recipe.resultItemName}</Text>
              <View style={[modal.catBadge, { backgroundColor: catObj.color + '22' }, pixelStyle]}>
                <Feather name={catObj.icon as any} size={10} color={catObj.color} />
                <Text style={[modal.catText, { color: catObj.color }]}>{catObj.label}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          {description ? (
            <Text style={[modal.desc, { color: colors.mutedForeground }]}>{description}</Text>
          ) : null}

          {/* Progress */}
          <View style={modal.progressRow}>
            <View style={[modal.progressTrack, { backgroundColor: colors.border }]}>
              <View style={[modal.progressFill, { width: `${progress * 100}%` as any, backgroundColor: recipe.pieceColor }]} />
            </View>
            <Text style={[modal.progressLabel, { color: recipe.pieceColor }]}>{Math.round(progress * 100)}%</Text>
          </View>

          {/* Materials */}
          <Text style={[modal.sectionLabel, { color: colors.mutedForeground }]}>{t('craft.materials')}</Text>
          <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
            {allReqs.map(req => (
              <FragmentChip
                key={req.pieceId}
                pieceId={req.pieceId}
                required={req.count}
                have={pieces[req.pieceId] ?? 0}
                colors={colors}
              />
            ))}
            {(recipe.bitsCost ?? 0) > 0 && (
              <View style={[chipStyles.chip, {
                backgroundColor: hasEnoughBits ? '#facc1518' : colors.background,
                borderColor: hasEnoughBits ? '#facc15' : colors.border,
              }, pixelStyle]}>
                <Image source={require('../../assets/images/bits-icon.png')} style={{ width: 16, height: 16, opacity: hasEnoughBits ? 1 : 0.4 }} resizeMode="contain" />
                <Text style={[chipStyles.name, { color: hasEnoughBits ? '#facc15' : colors.mutedForeground, flex: 1 }]}>Bits</Text>
                <Text style={[chipStyles.count, { color: hasEnoughBits ? '#facc15' : colors.mutedForeground }]}>
                  {bits.toLocaleString()}/{(recipe.bitsCost ?? 0).toLocaleString()}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action */}
          {alreadyCrafted ? (
            <View style={[modal.craftedBadge, { backgroundColor: '#22c55e22', borderColor: '#22c55e66' }, pixelStyle]}>
              <Feather name="check-circle" size={16} color="#22c55e" />
              <Text style={[modal.craftedText, { color: '#22c55e' }]}>{recipe.resultItemName} {t('craft.crafted')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[modal.craftBtn, {
                backgroundColor: canCraft ? recipe.pieceColor + '28' : colors.background,
                borderColor: canCraft ? recipe.pieceColor : colors.border,
                opacity: canCraft ? 1 : 0.5,
              }, pixelStyle]}
              onPress={() => { if (canCraft) { craftItem(recipe); onClose(); } }}
              activeOpacity={canCraft ? 0.75 : 1}
              disabled={!canCraft}
            >
              <Feather name="tool" size={16} color={canCraft ? recipe.pieceColor : colors.mutedForeground} />
              <Text style={[modal.craftBtnText, { color: canCraft ? recipe.pieceColor : colors.mutedForeground }]}>
                {canCraft ? `${t('craft.forge')} ${recipe.resultItemName}` : !hasEnoughPieces ? t('craft.missingMaterials') : `${t('craft.missingBits')} ${((recipe.bitsCost ?? 0) - bits).toLocaleString()} ${t('craft.bits')}`}
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32, gap: 14,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' as const, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 15, fontWeight: '800' as const, marginBottom: 4 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' as const },
  catText: { fontSize: 10, fontWeight: '700' as const },
  closeBtn: { padding: 4 },
  desc: { fontSize: 12, lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' as const },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 13, fontWeight: '800' as const, minWidth: 38, textAlign: 'right' as const },
  sectionLabel: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.5 },
  craftBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 14, borderWidth: 1.5, paddingVertical: 14,
  },
  craftBtnText: { fontSize: 14, fontWeight: '700' as const },
  craftedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 14,
  },
  craftedText: { fontSize: 13, fontWeight: '600' as const },
});

// ─── Item card in category list ───────────────────────────────────────────────
function RecipeCard({
  recipe, onPress, pieces, inventory, colors,
}: {
  recipe: CraftRecipe;
  onPress: () => void;
  pieces: Record<string, number>;
  inventory: string[];
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
}) {
  const progress = computeProgress(recipe, pieces);
  const crafted = inventory.includes(recipe.resultItemId);
  const itemImg = EQUIP_ITEM_IMAGES[recipe.resultItemId];
  const pct = Math.round(progress * 100);

  return (
    <TouchableOpacity
      style={[card.wrap, {
        backgroundColor: colors.card,
        borderColor: crafted ? '#22c55e55' : progress >= 1 ? recipe.pieceColor + '88' : colors.border,
      }, pixelStyle]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Icon */}
      <View style={[card.iconWrap, { backgroundColor: recipe.pieceColor + '18' }, pixelStyle]}>
        {itemImg ? (
          <Image source={itemImg} style={{ width: 30, height: 30 }} resizeMode="contain" />
        ) : (
          <Feather name={recipe.pieceIcon as any} size={18} color={recipe.pieceColor} />
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, gap: 6 }}>
        <View style={card.nameRow}>
          <Text style={[card.name, { color: colors.foreground }]} numberOfLines={1}>{recipe.resultItemName}</Text>
          {crafted && <Feather name="check-circle" size={14} color="#22c55e" />}
        </View>

        {/* Progress bar */}
        <View style={card.progressRow}>
          <View style={[card.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[card.progressFill, {
              width: `${pct}%` as any,
              backgroundColor: crafted ? '#22c55e' : recipe.pieceColor,
            }]} />
          </View>
          <Text style={[card.pct, { color: crafted ? '#22c55e' : recipe.pieceColor }]}>
            {crafted ? '✓' : `${pct}%`}
          </Text>
        </View>
      </View>

      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1.5, padding: 12, marginBottom: 10,
  },
  iconWrap: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 13, fontWeight: '700' as const, flex: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' as const },
  progressFill: { height: 5, borderRadius: 3 },
  pct: { fontSize: 11, fontWeight: '800' as const, minWidth: 30, textAlign: 'right' as const },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CraftScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pieces, bits, inventory, craftItem } = useGame();
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<CraftCategory>('evolucao');
  const [selectedRecipe, setSelectedRecipe] = useState<CraftRecipe | null>(null);

  const filteredRecipes = CRAFT_RECIPES.filter(r => getCategoryForRecipe(r) === activeCategory);
  const activeCat = CATEGORIES.find(c => c.id === activeCategory)!;

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: 20, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Category tabs ── */}
        <View style={styles.catRow}>
          {CATEGORIES.map(cat => {
            const active = cat.id === activeCategory;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catBtn, {
                  backgroundColor: active ? cat.color + '28' : colors.card,
                  borderColor: active ? cat.color : colors.border,
                  flex: 1,
                }, pixelStyle]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.75}
              >
                <Feather name={cat.icon as any} size={14} color={active ? cat.color : colors.mutedForeground} />
                <Text style={[styles.catLabel, { color: active ? cat.color : colors.mutedForeground }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Section header ── */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {activeCategory === 'evolucao' ? t('craft.evolution') : activeCategory === 'roupa' ? t('craft.outfit') : t('craft.brasao')}
        </Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
          {activeCategory === 'evolucao' && t('craft.desc.evolution')}
          {activeCategory === 'roupa' && t('craft.desc.outfit')}
          {activeCategory === 'brasao' && t('craft.desc.brasao')}
        </Text>

        {/* ── Recipe list ── */}
        {filteredRecipes.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('craft.empty')}</Text>
          </View>
        ) : (
          filteredRecipes.map((recipe, idx) => (
            <RecipeCard
              key={`${recipe.resultItemId}-${idx}`}
              recipe={recipe}
              onPress={() => setSelectedRecipe(recipe)}
              pieces={pieces}
              inventory={inventory}
              colors={colors}
            />
          ))
        )}
      </ScrollView>

      {/* ── Detail Modal ── */}
      <DetailModal
        recipe={selectedRecipe}
        visible={selectedRecipe !== null}
        onClose={() => setSelectedRecipe(null)}
        pieces={pieces}
        bits={bits}
        inventory={inventory}
        craftItem={craftItem}
        colors={colors}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { paddingHorizontal: 20 },

  catRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 12, borderWidth: 1.5,
    paddingVertical: isWeb ? 8 : 11,
  },
  catLabel: { fontSize: 11, fontWeight: '700' as const },

  sectionTitle: { fontSize: 14, fontWeight: '800' as const, marginBottom: 4 },
  sectionSub:   { fontSize: 11, marginBottom: 16 },

  emptyBox:  { borderRadius: 14, borderWidth: 1, padding: 24, alignItems: 'center' as const },
  emptyText: { fontSize: 13 },
});
