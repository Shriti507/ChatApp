import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Welcome to Chat App</h1>
        <p className="text-lg text-gray-600 mb-8">Hello, {user.firstName || user.username}!</p>
        
        <div className="space-y-4">
          <Link 
            href="/chat" 
            className="block w-full max-w-md mx-auto bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
