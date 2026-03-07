import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChatSidebar } from "../../../components/chat-sidebar";
import { ChatArea } from "../../../components/chat-area";

export default async function ConversationPage({ params }: { params: { conversationId: string } }) {
  const { conversationId } = await params;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: hidden on mobile, visible on md+ */}
      <aside className="hidden md:block flex-shrink-0 h-full">
        <ChatSidebar />
      </aside>
      {/* Chat area: full width on mobile, with back button */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex md:hidden items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <Link
            href="/chat"
            className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Back to conversations</span>
        </div>
        <ChatArea conversationId={conversationId} />
      </div>
    </div>
  );
}
