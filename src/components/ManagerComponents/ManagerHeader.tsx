import { MessResponseType } from "@/types/MessTypes";
import React from "react";

export default function ManagerHeader({
  messData,
}: {
  messData: MessResponseType;
}) {
  return (
    <div>
      {" "}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {messData.mess?.messName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your mess operations and expenses
          </p>
        </div>
        {/* <button className="p-3 rounded-xl hover:bg-accent transition-colors relative">
          <Bell className="w-6 h-6 text-foreground" />
          {mockData.pendingApprovals > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-destructive text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {mockData.pendingApprovals}
            </span>
          )}
        </button> */}
      </div>
    </div>
  );
}
