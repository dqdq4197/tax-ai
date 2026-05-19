import ChatView from "./components/chat-view";

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { conversationId } = await params;

  return <ChatView conversationId={conversationId} />;
}
