"use client";
import { Home, Receipt, Settings, Users } from "lucide-react";
import { useState } from "react";
import { mockData } from "../MockData/MockData";

export default function BottomNav() {
  const [activeTab, setActiveTab] = useState("overview");
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border lg:hidden z-30">
      <div className="grid grid-cols-4 gap-1 p-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeTab === "overview"
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">Home</span>
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeTab === "members"
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Users className="w-6 h-6" />
          <span className="text-xs font-medium">Members</span>
        </button>

        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative ${
            activeTab === "expenses"
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Receipt className="w-6 h-6" />
          <span className="text-xs font-medium">Expenses</span>
          {mockData.pendingApprovals > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {mockData.pendingApprovals}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeTab === "settings"
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
}
