"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";

export function UserDiscovery() {
  const { user } = useUser();
  const otherUsers = useQuery(api.functions.getOtherUsers, user ? { currentClerkId: user.id } : "skip");

  if (!otherUsers) {
    return <div>Loading users...</div>;
  }

  if (otherUsers.length === 0) {
    return <div className="p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Discover Users</h3>
      <p className="text-sm text-gray-400">No other users found</p>
    </div>;
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Discover Users</h3>
      <div className="space-y-2">
        {otherUsers.map((user: any) => (
          <div
            key={user._id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback>
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium text-sm">{user.username}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
