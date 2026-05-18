import { z } from "zod";
import { client } from "../core/client";
import { MessageSchema } from "../schemas";

const SharedConversationSchema = z.object({
  title: z.string().nullable(),
  messages: z.array(MessageSchema),
});

export type SharedConversation = z.infer<typeof SharedConversationSchema>;

export interface getSharedConversationParams {
  token: string;
}

export function getSharedConversation(params: getSharedConversationParams) {
  const { token } = params;
  return client.get(`share/${token}`).json(SharedConversationSchema);
}
