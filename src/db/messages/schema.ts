import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { conversations } from "../conversations/schema";

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").$type<"user" | "assistant">().notNull(),
    model: text("model"),
    content: text("content").notNull(),
    toolCalls: jsonb("tool_calls"),
    durationMs: integer("duration_ms"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    finishReason: text("finish_reason"),
    traceId: text("trace_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("idx_messages_conversation_id").on(t.conversationId)],
);
