"use client";

import { AlertTriangle, Home, MessageCircle, RefreshCw } from "lucide-react";

export default function ErrorPage({}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-20 h-20 text-destructive" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-destructive/20 animate-ping"></div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">
          Something Went Wrong
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          We are experiencing technical difficulties. Our team has been notified
          and is working to fix the issue.
        </p>

        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Error Details
              </h3>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred while processing your request.
                Please try again in a few moments.
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 px-2 py-1 rounded">
                Error Code: ERR_500_INTERNAL
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg">
            <RefreshCw className="w-5 h-5" />
            Retry
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-card text-foreground border-2 border-border rounded-xl font-semibold hover:bg-accent transition-all">
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Problem persists?
          </p>
          <button className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
            <MessageCircle className="w-4 h-4" />
            Contact Support Team
          </button>
        </div>
      </div>
    </div>
  );
}
