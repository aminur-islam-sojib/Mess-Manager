"use client";
import { Home, ArrowRight, Mail, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();
  const handleRedirectDashboard = () => {
    return router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        {/* Main Content */}
        <div className="text-center mb-12">
          {/* 404 Number - Clean and Bold */}
          <div className="mb-8">
            <h1 className="text-[140px] md:text-[200px] font-bold leading-none tracking-tight">
              <span className="text-primary">4</span>
              <span className="text-muted-foreground">0</span>
              <span className="text-primary">4</span>
            </h1>
          </div>

          {/* Title & Description */}
          <div className="max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-muted-foreground">
              The page you are looking for might have been removed, had its name
              changed, or is temporarily unavailable.
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={handleRedirectDashboard}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Home className="w-5 h-5" />
              Back to Dashboard
            </button>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-card text-foreground border border-border rounded-lg font-semibold hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="border-t border-border pt-12">
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Visit Dashboard
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Go back to your dashboard to view your meals, manage expenses,
                and track your mess activities.
              </p>
              <button
                onClick={handleRedirectDashboard}
                className="inline-flex items-center text-sm font-medium text-primary hover:gap-2 transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Contact Support
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Having trouble accessing a meal or expense? Our support team is
                here to help you.
              </p>
              <button className="inline-flex items-center text-sm font-medium text-primary hover:gap-2 transition-all">
                Get Help
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Error Code: 404 • If you believe this is a mistake, please contact
            support.
          </p>
        </div>
      </div>
    </div>
  );
}
