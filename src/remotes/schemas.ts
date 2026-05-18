import { z } from "zod";

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.coerce.date(),
});
export type Message = z.infer<typeof MessageSchema>;
