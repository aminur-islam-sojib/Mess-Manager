"use client";

import { UserCog, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingPageButton() {
  const [selectedRole, setSelectedRole] = useState<"user" | "manager" | null>(
    null
  );
  const router = useRouter();

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/auth/register/${selectedRole}`);
    }
  };

  return (
    <div>
      {/* Role Selection Cards */}
      <div className="space-y-4 mb-8">
        {/* User Role Card */}
        <button
          onClick={() => setSelectedRole("user")}
          className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 ${
            selectedRole === "user"
              ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
              : "border-border bg-card hover:border-primary/50 hover:bg-accent"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                selectedRole === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-lg text-foreground mb-1">
                User
              </h3>
              <p className="text-sm text-muted-foreground">
                Join a mess via invitation and track your expenses
              </p>
            </div>
            {/* Selection Indicator */}
            <div
              className={` shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedRole === "user"
                  ? "border-primary bg-primary"
                  : "border-muted"
              }`}
            >
              {selectedRole === "user" && (
                <svg
                  className="w-4 h-4 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
        </button>

        {/* Manager Role Card */}
        <button
          onClick={() => setSelectedRole("manager")}
          className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 ${
            selectedRole === "manager"
              ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
              : "border-border bg-card hover:border-primary/50 hover:bg-accent"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={` shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                selectedRole === "manager"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <UserCog className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-lg text-foreground mb-1">
                Manager
              </h3>
              <p className="text-sm text-muted-foreground">
                Create and manage a mess with full control
              </p>
            </div>
            {/* Selection Indicator */}
            <div
              className={` shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedRole === "manager"
                  ? "border-primary bg-primary"
                  : "border-muted"
              }`}
            >
              {selectedRole === "manager" && (
                <svg
                  className="w-4 h-4 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!selectedRole}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 ${
          selectedRole
            ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl active:scale-[0.98]"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        Continue as{" "}
        {selectedRole
          ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)
          : "..."}
      </button>
    </div>
  );
}
