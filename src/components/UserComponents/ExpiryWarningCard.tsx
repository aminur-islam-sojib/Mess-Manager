import { Clock } from "lucide-react";
import React from "react";

export default function ExpiryWarningCard() {
  return (
    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
      <Clock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-foreground mb-1">
          Time-Limited Invitation
        </p>
        <p className="text-xs text-muted-foreground">
          This invitation expires on{" "}
          {invitation.expiresAt.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
