/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ShieldCheck,
  PlayCircle,
  ArrowRight,
  Shield,
} from "lucide-react";
import React, { useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import Link from "next/link"; // Import Link for internal routing

export default function LoginFormPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setLoading("login");
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.ok) {
        toast.success("Login Successful!");
        window.location.assign("/dashboard");
      } else {
        toast.error(result?.error || "Invalid credentials");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(null);
    }
  };

  const handleDemoLogin = async (role: "manager" | "member" | "admin") => {
    const demoCredentials = {
      manager: {
        email: "demo.manager@mail.com",
        password: "DemoManager.12",
      },
      member: {
        email: "demo.member@mail.com",
        password: "DemoMember.12",
      },
      admin: {
        email: "demo.admin@mail.com",
        password: "DemoAdmin.12",
      },
    };

    const selected = demoCredentials[role];
    setFormData({
      email: selected.email,
      password: selected.password,
    });
    setErrors({ email: "", password: "" });
    setLoading(role);

    setTimeout(async () => {
      try {
        const result = await signIn("credentials", {
          ...selected,
          redirect: false,
          callbackUrl: "/dashboard",
        });

        if (result?.ok) {
          toast.success(`Welcome to the ${role} demo!`);
          window.location.assign("/dashboard");
        } else {
          toast.error("Demo account not found");
        }
      } catch (error) {
        toast.error("Demo login failed");
      } finally {
        setLoading(null);
      }
    }, 500);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 ">
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-card transition-all ${
                errors.email
                  ? "border-destructive"
                  : "border-input focus:border-primary focus:outline-none"
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Min. 8 characters"
              className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 bg-card transition-all ${
                errors.password
                  ? "border-destructive"
                  : "border-input focus:border-primary focus:outline-none"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading !== null}
          className="w-full py-3.5 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading === "login" ? "Logging in..." : "Log In"}
        </button>
      </form>

      <div className="pt-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
            <PlayCircle className="w-3 h-3" /> Quick Demo Access
          </span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleDemoLogin("member")}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-input bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors disabled:opacity-50"
          >
            <User className="w-4 h-4 text-primary" />
            {loading === "member" ? "Wait..." : "Member"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleDemoLogin("manager")}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-input bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Shield className="w-4 h-4 text-primary" />
            {loading === "manager" ? "Wait..." : "Manager"}
          </button>

          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleDemoLogin("admin")}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-input bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
            {loading === "admin" ? "Wait..." : "Admin"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-border"></div>
        <span className="text-xs text-muted-foreground">OR</span>
        <div className="flex-1 h-px bg-border"></div>
      </div>

      <GoogleLoginButton />

      {/* --- NEW REGISTER REDIRECT SECTION --- */}
      <p className="text-center text-sm text-muted-foreground pt-4">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="font-bold text-primary hover:underline inline-flex items-center gap-1 transition-all group"
        >
          Register here
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </p>
    </div>
  );
}
