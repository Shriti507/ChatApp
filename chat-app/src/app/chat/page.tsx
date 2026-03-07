import { ChatSidebar } from "@/components/chat-sidebar";

export default function ChatPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar />
      {/* Desktop: placeholder when no conversation selected; hidden on mobile */}
      <div className="flex-1 flex flex-col min-w-0 hidden md:flex border-b border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select a conversation</h2>
        </div>
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="text-center px-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Welcome to Chat App</h3>
            <p className="text-gray-500 dark:text-gray-400">Choose a conversation from the sidebar to start messaging</p>
          </div>
        </div>
      </div>
    </div>
  );
}
