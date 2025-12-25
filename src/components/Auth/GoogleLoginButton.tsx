"use client";

import { Chrome } from "lucide-react";
import React from "react";

export default function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    console.log("Google login clicked");
    // Handle Google OAuth logic here
  };
  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full py-3.5 px-6 rounded-xl font-medium text-base bg-card text-foreground border-2 border-input hover:bg-accent hover:border-primary/50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 shadow-sm"
    >
      <Chrome className="w-5 h-5" />
      Sign up with Google
    </button>
  );
}
