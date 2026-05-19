"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateConversationTitle } from "@/remotes/conversations/api";

export function useUpdateConversationTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateConversationTitle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
