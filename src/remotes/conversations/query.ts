import { queryOptions } from "@tanstack/react-query";
import { getConversations, getMessages, type GetMessagesParams } from "./api";

export function getConversationsQuery() {
  return queryOptions({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });
}

export function getMessagesQuery(params: GetMessagesParams) {
  return queryOptions({
    queryKey: ["messages", params],
    queryFn: () => getMessages(params),
  });
}
