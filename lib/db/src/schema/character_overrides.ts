import { pgTable, text, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";

export const characterOverridesTable = pgTable("character_overrides", {
  characterId: text("character_id").primaryKey(),
  name: text("name"),
  attribute: text("attribute"),
  rarity: text("rarity"),
  element: text("element"),
  hp: integer("hp"),
  mp: integer("mp"),
  atk: integer("atk"),
  def: integer("def"),
  spt: integer("spt"),
  spd: integer("spd"),
  description: text("description"),
  attackName: text("attack_name"),
  attackElement: text("attack_element"),
  spiritName: text("spirit_name"),
  spiritElement: text("spirit_element"),
  imageBase64: text("image_base64"),
  imageMimeType: text("image_mime_type"),
  imageScale: real("image_scale"),
  scannable: boolean("scannable"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CharacterOverride = typeof characterOverridesTable.$inferSelect;
