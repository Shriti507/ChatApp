import { ChatSidebar } from "../../../components/chat-sidebar";
import { ChatArea } from "../../../components/chat-area";

export default async function ConversationPage({ params }: { params: { conversationId: string } }) {
  const { conversationId } = await params;
  
  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <ChatArea conversationId={conversationId} />
    </div>
  );
}
