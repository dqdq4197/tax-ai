interface PendingChat {
  conversationId: string;
  firstMessage: string;
}

const SESSION_KEY = "tax_ai_pending_chat";

export function setPendingChat(chat: PendingChat) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(chat));
}

/**
 * 한 번만 읽는(one-time read) 방식:
 * 저장소에서 첫 번째 메시지를 반환한 뒤 즉시 제거한다.
 * 저장된 값이 없거나, 저장된 conversationId가 현재 라우트와 일치하지 않는 경우
 * (이전 세션의 오래된 데이터인 경우)에는 undefined를 반환한다.
 **/
export function takePendingChat(conversationId: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) {
    return undefined;
  }

  try {
    const chat: PendingChat = JSON.parse(raw);

    if (chat.conversationId !== conversationId) {
      return undefined;
    }

    sessionStorage.removeItem(SESSION_KEY);

    return chat.firstMessage;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);

    return undefined;
  }
}
