import { isTextUIPart, type UIMessage } from "ai";
import type { Message } from "@/remotes";

export function getTextContent(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

export function toUIMessage(message: Message): UIMessage {
  return {
    id: message.id,
    role: message.role,
    parts: [{ type: "text", text: message.content }],
  };
}
