import ChatView from "./chat-view";

interface Props {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function ChatPage({ params, searchParams }: Props) {
  const { conversationId } = await params;
  const { q } = await searchParams;
  return <ChatView conversationId={conversationId} initialPrompt={q} />;
}
