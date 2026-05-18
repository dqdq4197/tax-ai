import { queryOptions } from "@tanstack/react-query";
import { getConversations, getMessages, type getMessagesParams } from "./api";

export function conversationsQuery() {
  return queryOptions({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });
}

export function getMessagesQuery(params: getMessagesParams) {
  return queryOptions({
    queryKey: ["messages", params],
    queryFn: () => getMessages(params),
  });
}
