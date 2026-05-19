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

const CreateConversationResponseSchema = z.object({ id: z.string() });

export function createConversation() {
  return client.post("conversations").json(CreateConversationResponseSchema);
}

export interface UpdateConversationParams {
  id: string;
  title: string;
}

export function updateConversation(params: UpdateConversationParams) {
  const { id, title } = params;
  return client.patch(`conversations/${id}`, { json: { title } });
}

export interface UpdateConversationTitleParams {
  id: string;
}

export function updateConversationTitle(params: UpdateConversationTitleParams) {
  const { id } = params;
  return client.post(`conversations/${id}/title`);
}

export interface DeleteConversationParams {
  id: string;
}

export function deleteConversation(params: DeleteConversationParams) {
  const { id } = params;
  return client.delete(`conversations/${id}`);
}

export interface GetMessagesParams {
  conversationId: string;
}

export function getMessages(params: GetMessagesParams) {
  const { conversationId } = params;
  return client
    .get(`conversations/${conversationId}/messages`)
    .json(z.array(MessageSchema));
}

const ShareScheme = z.object({ shareUrl: z.string() });

export type Share = z.infer<typeof ShareScheme>;

export interface CreateShareParams {
  conversationId: string;
}

export function createShare(params: CreateShareParams) {
  const { conversationId } = params;
  return client.post(`conversations/${conversationId}/share`).json(ShareScheme);
}

export interface RevokeShareParams {
  conversationId: string;
}

export function revokeShare(params: RevokeShareParams) {
  const { conversationId } = params;
  return client.delete(`conversations/${conversationId}/share`);
}
