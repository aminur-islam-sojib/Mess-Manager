import LoginFormPage from "@/components/Auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form (Mobile Full Width, Desktop 50%) */}
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
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in to continue to Mess Manager
            </p>
          </div>

          <LoginFormPage />

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground mt-4 px-4">
            By signing in, you agree to our{" "}
            <button className="text-primary hover:underline">
              Terms of Service
            </button>{" "}
            and{" "}
            <button className="text-primary hover:underline">
              Privacy Policy
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Hero Section (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 items-center justify-center p-12 relative overflow-hidden">
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
        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-12 h-12 text-primary"
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
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Manage Your Mess Expenses Effortlessly
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Track meals, manage expenses, and settle payments with your mess
              members - all in one place.
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Real-time Expense Tracking
                </h3>
                <p className="text-sm text-muted-foreground">
                  Monitor all mess expenses and member contributions instantly
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Easy Member Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  Invite members, track their meals, and manage permissions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center  shrink-0">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Automated Calculations
                </h3>
                <p className="text-sm text-muted-foreground">
                  Let the system calculate monthly bills and settle balances
                  automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
