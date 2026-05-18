import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../index";
import { conversations } from "./schema";

export async function createConversation(anonId: string) {
  const [conversation] = await db
    .insert(conversations)
    .values({ anonId })
    .returning();
  return conversation.id;
}

export async function listConversations(anonId: string) {
  return db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      firstMessage: sql<string | null>`(
        SELECT content FROM messages
        WHERE conversation_id = ${conversations.id} AND role = 'user'
        ORDER BY created_at ASC
        LIMIT 1
      )`,
    })
    .from(conversations)
    .where(
      and(isNull(conversations.deletedAt), eq(conversations.anonId, anonId)),
    )
    .orderBy(desc(conversations.createdAt));
}

export async function updateConversationTitle(id: string, title: string) {
  await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(conversations.id, id));
}

export async function deleteConversation(id: string) {
  await db
    .update(conversations)
    .set({ deletedAt: new Date() })
    .where(eq(conversations.id, id));
}

export async function createShareLink(id: string) {
  const { randomUUID } = await import("crypto");
  const shareId = randomUUID();
  await db
    .update(conversations)
    .set({ shareId, updatedAt: new Date() })
    .where(eq(conversations.id, id));
  return shareId;
}

export async function revokeShareLink(id: string) {
  await db
    .update(conversations)
    .set({ shareId: null, updatedAt: new Date() })
    .where(eq(conversations.id, id));
}

export async function getConversationByShareId(shareId: string) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.shareId, shareId));
  return conversation ?? null;
}
