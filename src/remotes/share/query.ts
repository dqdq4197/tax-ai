import { queryOptions } from "@tanstack/react-query";
import { getSharedConversation, type getSharedConversationParams } from "./api";

export function sharedConversationQuery(params: getSharedConversationParams) {
  return queryOptions({
    queryKey: ["share", params],
    queryFn: () => getSharedConversation(params),
  });
}
