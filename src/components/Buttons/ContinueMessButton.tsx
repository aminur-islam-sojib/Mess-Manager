"use client";
import React, { useState } from "react";
import { Building2, ArrowRight, CheckCircle } from "lucide-react";
import { SessionUser } from "@/types/Model";
import { useRouter } from "next/navigation";
import { createMess } from "@/actions/server/Mess";

export default function ContinueMessButton({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [messName, setMessName] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const handleSubmit = async () => {
    if (!messName.trim()) {
      setError("Mess name is required");
      return;
    }

    if (messName.trim().length < 3) {
      setError("Mess name must be at least 3 characters");
      return;
    }

    if (!user?.id) {
      setError("Unable to create mess: missing user id");
      return;
    }

    if (!user?.email) {
      setError("Unable to create mess: missing user email");
      return;
    }

    const payload = {
      messName: messName.trim(),
      managerId: user.id,
      managerEmail: user.email,
    };
    setIsCreating(true);

    try {
      const result = await createMess(payload);
      console.log(result);
      setShowSuccess(true);
      router.push("/dashboard");
    } catch (error) {
      console.log(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessName(e.target.value);
    if (error) {
      setError("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };
  return (
    <div>
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex flex-col items-center justify-center px-6 animate-in zoom-in duration-500">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              <div className="relative w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-2xl">
                <CheckCircle
                  className="w-14 h-14 text-primary-foreground"
                  strokeWidth={2.5}
                />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-foreground mb-3 text-center">
              Mess Created! 🎉
            </h2>
            <p className="text-muted-foreground text-center max-w-sm">
              Your mess has been created successfully. Redirecting to
              dashboard...
            </p>
          </div>
        </div>
      )}
      <div className="space-y-6">
        <div>
          <label
            htmlFor="messName"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Mess Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              id="messName"
              name="messName"
              value={messName}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Sunrise Hostel Mess"
              className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-base ${
                error
                  ? "border-destructive"
                  : "border-input focus:border-primary"
              }`}
              disabled={isCreating}
            />
          </div>
          {error && (
            <p className="mt-2 text-sm text-destructive flex items-center gap-1">
              <span>⚠️</span>
              {error}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Choose a name thats easy for members to recognize
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isCreating || !messName.trim()}
          className="w-full py-4 px-6 rounded-xl font-semibold text-base bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isCreating ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              Creating Mess...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
