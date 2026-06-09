import { pgTable, serial, text, integer, timestamp, json } from "drizzle-orm/pg-core";

export const customTamersTable = pgTable("custom_tamers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  description: text("description").notNull().default(""),
  accentColor: text("accent_color").notNull().default("#3b82f6"),
  tamerImageBase64: text("tamer_image_base64"),
  tamerImageMime: text("tamer_image_mime").default("image/png"),
  rankingCardImageBase64: text("ranking_card_image_base64"),
  rankingCardImageMime: text("ranking_card_image_mime").default("image/png"),
  homeImageBase64: text("home_image_base64"),
  homeImageMime: text("home_image_mime").default("image/png"),
  avatarOffsetY: integer("avatar_offset_y").notNull().default(-8),
  avatarOffsetX: integer("avatar_offset_x").notNull().default(0),
  rankingOffsetY: integer("ranking_offset_y").notNull().default(-8),
  rankingOffsetX: integer("ranking_offset_x").notNull().default(0),
  homeOffsetY: integer("home_offset_y").notNull().default(-8),
  homeOffsetX: integer("home_offset_x").notNull().default(0),
  fragmentsToComplete: integer("fragments_to_complete").notNull().default(10),
  stageDrops: json("stage_drops").$type<{ stageId: string; stageIndex: number }[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CustomTamer = typeof customTamersTable.$inferSelect;
