import { pgTable, serial, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const customItemsTable = pgTable("custom_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("equipment"), // 'equipment' | 'fragment'
  slot: text("slot"),
  description: text("description").notNull().default(""),
  rarity: text("rarity").notNull().default("COMMON"),
  howToObtain: text("how_to_obtain").notNull().default("drop"), // 'drop' | 'craft' | 'admin'
  bonuses: jsonb("bonuses").notNull().default({}),
  percentBonuses: jsonb("percent_bonuses"),
  isActive: boolean("is_active").notNull().default(true),
  imageBase64: text("image_base64"),
  imageMimeType: text("image_mime_type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CustomItem = typeof customItemsTable.$inferSelect;
