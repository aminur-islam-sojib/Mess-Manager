import { Users, UserCog, CheckCircle2 } from "lucide-react";
import LandingPageButton from "@/components/Buttons/LandingPageButton";

export default function RoleSelection() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Role Selection */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-10 h-10 text-primary"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 3V5M16 3V5M4 9H20M6 21H18C19.1046 21 20 20.1046 20 19V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to Mess Manager
            </h1>
            <p className="text-muted-foreground text-sm">
              Choose your role to get started
            </p>
          </div>

          <LandingPageButton />

          {/* Info Text */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            You can change your role anytime in settings
          </p>
        </div>
      </div>

      {/* Right Side - Hero Section (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 items-start justify-center p-12 relative overflow-hidden overflow-y-auto">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-primary"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg w-full">
          <div className="mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-10 h-10 text-primary"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 3V5M16 3V5M4 9H20M6 21H18C19.1046 21 20 20.1046 20 19V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Two Roles, One System
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Manage or track expenses with features designed for seamless
              collaboration.
            </p>
          </div>

          {/* Role Comparison Cards */}
          <div className="space-y-4 mb-4">
            {/* Manager Features */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserCog className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  As a Manager
                </h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    Create and configure mess settings
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    Invite members and approve expenses
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    Generate reports and settlement bills
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    Monitor meal attendance patterns
                  </span>
                </li>
              </ul>
            </div>

            {/* User Features */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">As a User</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    Join mess via invitation link
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    Track daily meals and expenses
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    View balance and payment history
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    Get instant payment notifications
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
            <p className="text-sm text-foreground text-center">
              💡 <strong>Pro Tip:</strong> Switch between roles anytime in
              settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
