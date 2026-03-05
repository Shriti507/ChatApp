import { ChatSidebar } from "../../../components/chat-sidebar";
import { ChatArea } from "../../../components/chat-area";

export default function ConversationPage({ params }: { params: { conversationId: string } }) {
  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <ChatArea conversationId={params.conversationId} />
    </div>
  );
}
