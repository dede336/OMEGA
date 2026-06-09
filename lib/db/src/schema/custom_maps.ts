import { pgTable, serial, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

// Each stage in stages jsonb array:
// { index, name, enemies: [{characterId, level}], expReward, bitsReward, drops: [{type:'bits'|'item', itemId?, amount?, chance}] }

export const customMapsTable = pgTable("custom_maps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  type: text("type").notNull().default("normal"), // 'normal' | 'dungeon'
  isActive: boolean("is_active").notNull().default(true),
  isEvent: boolean("is_event").notNull().default(false),
  isPermanent: boolean("is_permanent").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  bitsReward: integer("bits_reward").notNull().default(0),
  stages: jsonb("stages").notNull().default([]),
  imageBase64: text("image_base64"),
  imageMimeType: text("image_mime_type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CustomMap = typeof customMapsTable.$inferSelect;
