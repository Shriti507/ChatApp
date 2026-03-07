# Real-Time Chat Application

A modern, professional real-time chat application built with Next.js, TypeScript, and a powerful real-time backend using Convex and Clerk for authentication.

## Tech Stack

- **Frontend**: [Next.js (App Router)](https://nextjs.org/), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Backend / Database**: [Convex](https://www.convex.dev/) (Real-time database + Server functions)
- **Authentication**: [Clerk](https://clerk.com/)
- **Real-time Engine**: Convex Subscriptions for instant UI updates

## Features Implemented

### Authentication & Security
- **Secure Sign-up/Login**: Fully managed authentication flow via Clerk.
- **Session Management**: Persistent user sessions with automatic re-authentication.
- **Protected Routes**: Middleware and client-side guards to ensure chat data is only accessible to authenticated users.

### User Discovery
- **User List**: Automatically populates with other users registered in the application.
- **Instant Conversations**: Start a direct message thread by simply selecting a user from the discovery list.

### Direct Messaging
- **1-on-1 Chat**: Private real-time messaging between users.
- **Instant Delivery**: Messages appear instantly across all devices using Convex reactive queries.
- **Message Timestamps**: Each message displays a formatted timestamp for clear conversation tracking.

### Theme & UI/UX
- **Responsive Layout**: 
  - **Desktop**: Full-height sidebar with independent scrolling for conversation lists.
  - **Mobile**: Collapsible sidebar with a dedicated back-to-conversations navigation.
- **Dark & Light Mode**: Seamless theme switching with optimized contrast for all UI elements.
- **Empty States**: Professionally designed placeholders when no conversation is selected or when a chat is new.

### Presence & Status
- **Online/Offline Indicators**: Real-time presence tracking showing when users are "Online" or "Offline" via text-based indicators.
- **Active Now Status**: Subtle dynamic text updates to reflect current user activity.

### Typing Indicators
- **Real-Time Visuals**: Pulse-animated three-dot indicator appears when the other participant is typing.
- **Sender Identification**: Clearly states "[Name] is typing..." to provide context.
- **Smart Behavior**: Automatically disappears after 2 seconds of inactivity or immediately upon sending a message.

### Unread Message Tracking
- **Smart Badges**: Sleek, pill-shaped badges with blue-to-indigo gradients showing the count of unread messages.
- **Read Receipts**: Tracking using `lastReadAt` logic; badges disappear instantly when a conversation is opened.

### Smart Auto-Scroll
- **Automatic Scrolling**: Automatically scrolls to the latest message as they arrive if you are at the bottom.
- **Manual Control**: Auto-scroll pauses if you scroll up to read history.
- **New Message Alert**: A "↓ New messages" button appears if new content arrives while you are scrolled up, allowing for an easy jump to the latest messages.

## Application Navigation Flow

### Unauthenticated Users
1. User visits the landing page or chat dashboard.
2. System detects no active session and redirects the user to the **Clerk Sign-in/Sign-up** page.
3. Upon successful authentication, the user is redirected back to the main chat dashboard.

### Authenticated Users
1. If a valid session exists, the login screen is skipped.
2. The browser automatically loads the **Chat Dashboard** via `Session Detected -> Chat Interface`.

### Logout Flow
1. User clicks the Logout button.
2. Clerk clears the local session and signs the user out globally.
3. User is redirected back to the sign-in page; protected routes become inaccessible.

## Chat Interface Structure

### Sidebar
- **Full-Height Design**: Covers the entire page height on desktop.
- **Conversation List**: Shows active chats with unread counts and online status.
- **User Discovery**: Access to find and start chats with new users.

### Chat Area
- **Header**: Displays the current contact's name and "Active now" text status.
- **Message List**: Scrollable area with smart auto-scroll and file/image attachment support.
- **Typing Zone**: Refined indicator area just above the input box.
- **Message Input**: Clean, responsive input field for composing messages.

## Environment Variables

The following environment variables are required in your `.env.local` file:

### Clerk Configuration
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Public key for the Clerk frontend SDK.
- `CLERK_SECRET_KEY`: Private key for the Clerk backend logic.

### Convex Configuration
- `NEXT_PUBLIC_CONVEX_URL`: The URL of your Convex deployment.
- `CONVEX_DEPLOYMENT`: The name of your Convex deployment.
- `CLERK_JWT_ISSUER_DOMAIN`: Domain for JWT validation between Clerk and Convex.
- `CLERK_WEBHOOK_SECRET`: Secret for handling Clerk webhooks in Convex.

## Local Development Setup

Follow these steps to get the project running locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shriti507/ChatApp.git
   cd ChatApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file and add the required keys listed above.

4. **Run the Convex development server**
   ```bash
   npx convex dev
   ```

5. **Run the Next.js development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Folder Structure

- `/app`: Next.js App Router pages and layouts.
- `/components`: Reusable UI components (Sidebar, ChatArea, etc.).
- `/convex`: Convex backend functions (queries, mutations) and schema.
- `/hooks`: Custom React hooks (e.g., `useTypingIndicator`).
- `/lib`: Utility functions and core configuration logic.
- `/contexts`: React Contexts for theme and global state management.

