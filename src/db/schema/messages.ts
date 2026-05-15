import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sessions } from "./sessions";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id),
  role: text("role").$type<"user" | "assistant">().notNull(),
  content: text("content").notNull(),
  toolCalls: jsonb("tool_calls"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
