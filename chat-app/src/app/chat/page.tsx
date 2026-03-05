import { ChatSidebar } from "@/components/chat-sidebar";

export default function ChatPage() {
  return (
    <div className="flex h-screen">
      <ChatSidebar />
      
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold">Select a conversation</h2>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Chat App</h3>
            <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
          </div>
        </div>
      </div>
    </div>
  );
}
