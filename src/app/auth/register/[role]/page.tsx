/* eslint-disable @typescript-eslint/no-explicit-any */
import RegisterForm from "@/components/Auth/RegisterForm";
import Image from "next/image";
import Link from "next/link";
import logo from "../../../../../public/mess-manager.png";

export default async function RegisterPage({ params }: { params: any }) {
  const { role } = await params;
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6">
      {/* Mobile/Tablet Only Container */}
      <div className="w-full max-w-md lg:hidden">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Image src={logo} alt="Mess Manager Logo" height={40} width={40} />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create Account
          </h1>
          <p className="text-muted-foreground text-sm">
            Join Mess Manager and start tracking expenses
          </p>
        </div>
        {role && <RegisterForm role={role} />}

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-primary font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground mt-4 px-4">
          By creating an account, you agree to our{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>

      {/* Desktop Message */}
      <div className="hidden lg:flex flex-col items-center justify-center text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Mobile Experience Only
        </h2>
        <p className="text-muted-foreground">
          This registration page is optimized for mobile and tablet devices.
          Please access it from a smaller screen or resize your browser window.
        </p>
      </div>
    </div>
  );
}
