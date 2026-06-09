import { EquipItem, EquipSlot, RarityId } from './gameData';

interface CustomItemRaw {
  id: string; dbId: number; name: string; type: string; slot?: string;
  description: string; rarity: string; howToObtain: string; isActive: boolean;
  bonuses: Record<string, number>; percentBonuses?: Record<string, number>;
  hasImage: boolean; imageMimeType?: string;
}

let _customItems: CustomItemRaw[] = [];
let _apiUrl = '';

export function loadCustomItems(items: CustomItemRaw[], apiUrl: string) {
  _apiUrl = apiUrl;
  _customItems = items.filter((i) => i.isActive && i.type === 'equipment' && i.slot);
}

export function getCustomEquipmentItems(): EquipItem[] {
  return _customItems.map((i) => ({
    id: i.id,
    name: i.name,
    slot: i.slot as EquipSlot,
    rarity: i.rarity as RarityId,
    description: i.description,
    bonuses: i.bonuses ?? {},
    percentBonuses: i.percentBonuses ?? undefined,
  }));
}

export function getItemImageSource(itemId: string): any {
  const item = _customItems.find((i) => i.id === itemId);
  if (item?.hasImage) return { uri: `${_apiUrl}/items/${item.dbId}/image` };
  return null;
}

export function getAllCustomItemsRaw(): CustomItemRaw[] {
  return _customItems;
}
