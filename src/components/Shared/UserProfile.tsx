"use client";
import { SessionUser } from "@/types/Model";

export default function UserProfile({ user }: { user: SessionUser }) {
  return (
    <div className="p-6 border-b border-sidebar-border">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg">
          {user?.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sidebar-foreground truncate">
            {user?.name}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
}
