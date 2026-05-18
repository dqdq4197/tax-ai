import { z } from "zod";
import { client } from "../core/client";
import { MessageSchema } from "../schemas";

const ConversationSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  firstMessage: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export function getConversations() {
  return client.get("conversations").json(z.array(ConversationSchema));
}

export interface updateConversationTitleParams {
  id: string;
  title: string;
}

export function updateConversationTitle(params: updateConversationTitleParams) {
  const { id, title } = params;
  return client.patch(`conversations/${id}`, { json: { title } });
}

export interface deleteConversationParams {
  id: string;
}

export function deleteConversation(params: deleteConversationParams) {
  const { id } = params;
  return client.delete(`conversations/${id}`);
}

export interface getMessagesParams {
  conversationId: string;
}

export function getMessages(params: getMessagesParams) {
  const { conversationId } = params;
  return client
    .get(`conversations/${conversationId}/messages`)
    .json(z.array(MessageSchema));
}

const ShareScheme = z.object({ shareUrl: z.string() });

export type Share = z.infer<typeof ShareScheme>;

export interface createShareParams {
  conversationId: string;
}

export function createShare(params: createShareParams) {
  const { conversationId } = params;
  return client.post(`conversations/${conversationId}/share`).json(ShareScheme);
}

export interface revokeShareParams {
  conversationId: string;
}

export function revokeShare(params: revokeShareParams) {
  const { conversationId } = params;
  return client.delete(`conversations/${conversationId}/share`);
}
