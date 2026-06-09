import { pgTable, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const gameSavesTable = pgTable("game_saves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  saveData: jsonb("save_data").notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type GameSave = typeof gameSavesTable.$inferSelect;
