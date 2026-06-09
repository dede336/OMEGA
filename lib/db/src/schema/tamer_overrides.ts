import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const tamerOverridesTable = pgTable("tamer_overrides", {
  id: serial("id").primaryKey(),
  tamerId: text("tamer_id").notNull().unique(),
  avatarOffsetY: integer("avatar_offset_y"),
  avatarOffsetX: integer("avatar_offset_x"),
  rankingOffsetY: integer("ranking_offset_y"),
  rankingOffsetX: integer("ranking_offset_x"),
  rankingCardImageBase64: text("ranking_card_image_base64"),
  rankingCardImageMime: text("ranking_card_image_mime").default("image/png"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type TamerOverride = typeof tamerOverridesTable.$inferSelect;
