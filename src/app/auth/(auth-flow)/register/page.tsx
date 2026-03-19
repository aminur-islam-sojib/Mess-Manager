import React, { Suspense } from "react";
import RegisterForm from "@/components/Auth/RegisterForm";
import LandingPageButton from "@/components/Buttons/LandingPageButton";
import Link from "next/link";

type RegisterPageProps = {
  searchParams: Promise<{ role?: string; callbackUrl?: string }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;
  const selectedRole = params?.role;
  const callbackUrl =
    params?.callbackUrl && params.callbackUrl.startsWith("/")
      ? params.callbackUrl
      : undefined;
  const hasValidRole = selectedRole === "user" || selectedRole === "manager";

  const changeRoleHref = callbackUrl
    ? `/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth/register";

  if (!hasValidRole) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
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
                Choose Role
              </h1>
              <p className="text-muted-foreground text-sm">
                Step 1 of 2: Select how you want to use Mess Manager
              </p>
            </div>

            <LandingPageButton callbackUrl={callbackUrl} />

            <p className="text-center text-xs text-muted-foreground mt-6">
              Next, we will show your registration form.
            </p>
          </div>
        </div>

        <div className="hidden lg:flex lg:w-1/2 bg-primary/5 items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="register-grid"
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
              <rect width="100%" height="100%" fill="url(#register-grid)" />
            </svg>
          </div>

          <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl font-bold text-foreground mb-3">
              Start With the Right Access
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Select your role first so we can personalize your dashboard setup
              after registration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="w-full  lg:w-1/2 flex items-center justify-center ">
        <div className="w-full max-w-md">
          <div className="mb-4">
            <Link
              href={changeRoleHref}
              className="text-xs font-medium text-primary hover:underline"
            >
              Change role
            </Link>
          </div>

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
              Create Account
            </h1>
            <p className="text-muted-foreground text-sm">
              Step 2 of 2: Complete your account setup
            </p>
          </div>
          <Suspense fallback={<div className="py-8">Loading form…</div>}>
            <RegisterForm />
          </Suspense>

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground mt-4 px-4">
            By creating an account, you agree to our{" "}
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
              Start Managing Your Mess Today
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Join thousands of users who trust Mess Manager to track expenses,
              manage meals, and simplify shared living.
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-4">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Quick Setup
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create your mess in minutes and start inviting members
                  instantly
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Secure & Private
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your financial data is encrypted and protected with industry
                  standards
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  No Hidden Costs
                </h3>
                <p className="text-sm text-muted-foreground">
                  Completely free to use with all features included from day one
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-8 bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-muted-foreground italic mb-3">
              &quot;Mess Manager has completely transformed how we handle
              expenses in our hostel. No more confusion or disputes!&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                RK
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Sheikh</p>
                <p className="text-xs text-muted-foreground">
                  Mess Manager, Dhaka
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
