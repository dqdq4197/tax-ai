import { z } from "zod";

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  status: z.enum(["generating", "complete", "error", "abandoned"]).nullable(),
  content: z.string(),
  createdAt: z.coerce.date(),
});
export type Message = z.infer<typeof MessageSchema>;
