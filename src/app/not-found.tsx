import { Home, Search } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-20 h-20 text-muted-foreground" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-3xl">
              ❌
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">
          Resource Not Found
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          We could not find what you are looking for. The mess, member, or
          expense you are trying to access may no longer exist.
        </p>

        <div className="bg-card border border-border rounded-2xl p-5 mb-6 text-left">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="text-primary">💡</span>
            Quick suggestions:
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Check if you have the correct link</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Verify your access permissions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Make sure you are logged into the right account</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={"/dashboard"}>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg">
              <Home className="w-5 h-5" />
              Go to Dashboard
            </button>
          </Link>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-card text-foreground border-2 border-border rounded-xl font-semibold hover:bg-accent transition-all">
            <Search className="w-5 h-5" />
            Search Again
          </button>
        </div>
      </div>
    </div>
  );
}
