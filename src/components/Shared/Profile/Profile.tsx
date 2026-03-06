"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Utensils,
  TrendingUp,
  PiggyBank,
  CalendarDays,
  History,
  ArrowUpRight,
  ShieldCheck,
  Mail,
  Receipt,
  CircleDollarSign,
  TrendingDown,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// --- Types ---
type UserProfileFinancialSummarySuccess = {
  success: true;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: "user" | "manager" | "admin";
      image: string | null;
      createdAt: string | null;
    };
    currentMonth: {
      mealCount: number;
      messMealCount: number;
      messExpense: number;
      mealRate: number;
      userMealCost: number;
      deposits: number;
    };
    lifetime: {
      totalMeals: number;
      totalDeposits: number;
      totalExpensesPaid: number;
      totalMealCost: number;
    };
    wallet: {
      balance: number;
      totalDeposited: number;
      totalCost: number;
    };
  };
};

interface Props {
  data: UserProfileFinancialSummarySuccess["data"];
}

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export const UserFinancialSummaryCard = ({ data }: Props) => {
  const { user, currentMonth, lifetime, wallet } = data;
  const isNegativeBalance = wallet.balance < 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-6xl mx-auto space-y-6 p-1"
    >
      {/* 1. TOP SECTION: USER PROFILE & WALLET HIGHLIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Identity Card */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-card/50 backdrop-blur-md overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
              <ShieldCheck size={160} />
            </div>
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6 relative">
              <Avatar className="h-24 w-24 rounded-3xl border-4 border-background shadow-xl">
                <AvatarImage src={user.image || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {user.name}
                  </h1>
                  <Badge
                    variant="secondary"
                    className="rounded-lg font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-none"
                  >
                    {user.role}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} /> {user.email}
                  </span>
                  <span className="hidden sm:inline opacity-30">•</span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    Joined{" "}
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wallet Balance Card */}
        <motion.div variants={itemVariants}>
          <Card
            className={`h-full border-none shadow-xl relative overflow-hidden transition-all duration-300 ${
              isNegativeBalance
                ? "bg-destructive text-destructive-foreground"
                : "bg-foreground text-background"
            }`}
          >
            <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
              <div className="flex justify-between items-start">
                <div
                  className={`p-3 rounded-2xl ${isNegativeBalance ? "bg-white/10" : "bg-primary/10"}`}
                >
                  <Wallet
                    size={24}
                    className={
                      isNegativeBalance ? "text-white" : "text-primary"
                    }
                  />
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                  Live Balance
                </div>
              </div>

              <div className="mt-8 space-y-1">
                <h2 className="text-4xl font-black tracking-tighter tabular-nums">
                  ${wallet.balance.toFixed(2)}
                </h2>
                <p className="text-[11px] font-bold opacity-70 uppercase tracking-widest">
                  Account Standing:{" "}
                  {isNegativeBalance ? "Due Action" : "Healthy"}
                </p>
              </div>
            </CardContent>
            <div className="absolute -bottom-6 -right-6 opacity-10">
              {isNegativeBalance ? (
                <TrendingDown size={120} />
              ) : (
                <TrendingUp size={120} />
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 2. MIDDLE SECTION: CURRENT MONTH SUMMARY (6 Stats) */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="h-1 w-8 rounded-full bg-primary/40" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Current Month Cycle
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatMiniBlock
            label="Your Meals"
            value={currentMonth.mealCount}
            icon={<Utensils size={14} />}
            color="orange"
          />
          <StatMiniBlock
            label="Mess Meals"
            value={currentMonth.messMealCount}
            icon={<History size={14} />}
            color="blue"
          />
          <StatMiniBlock
            label="Meal Rate"
            value={`$${currentMonth.mealRate.toFixed(2)}`}
            icon={<TrendingUp size={14} />}
            color="emerald"
          />
          <StatMiniBlock
            label="Your Cost"
            value={`$${currentMonth.userMealCost.toFixed(2)}`}
            icon={<Receipt size={14} />}
            color="rose"
          />
          <StatMiniBlock
            label="Your Deposits"
            value={`$${currentMonth.deposits.toFixed(2)}`}
            icon={<PiggyBank size={14} />}
            color="indigo"
          />
          <StatMiniBlock
            label="Mess Exp."
            value={`$${currentMonth.messExpense.toFixed(2)}`}
            icon={<CircleDollarSign size={14} />}
            color="slate"
          />
        </div>
      </motion.div>

      {/* 3. BOTTOM SECTION: LIFETIME + WALLET ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lifetime Summary */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow duration-300 overflow-hidden">
            <div className="bg-muted/30 px-6 py-4 flex justify-between items-center border-b border-border/50">
              <h3 className="text-sm font-bold flex items-center gap-2 italic">
                <History size={16} className="text-primary" /> Lifetime Records
              </h3>
              <ArrowUpRight
                size={14}
                className="text-muted-foreground opacity-40"
              />
            </div>
            <CardContent className="p-6 space-y-4">
              <LifetimeRow
                label="Total Meals Consumed"
                value={lifetime.totalMeals}
              />
              <LifetimeRow
                label="Accumulated Deposits"
                value={`$${lifetime.totalDeposits.toFixed(2)}`}
                unit="USD"
              />
              <LifetimeRow
                label="Expenses Paid"
                value={`$${lifetime.totalExpensesPaid.toFixed(2)}`}
                unit="USD"
              />
              <Separator className="opacity-50" />
              <LifetimeRow
                label="Gross Meal Cost"
                value={`$${lifetime.totalMealCost.toFixed(2)}`}
                highlight
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Wallet Detailed Breakdown */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow duration-300">
            <div className="bg-muted/30 px-6 py-4 border-b border-border/50">
              <h3 className="text-sm font-bold flex items-center gap-2 italic">
                <Wallet size={16} className="text-primary" /> Wallet
                Intelligence
              </h3>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Total In
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-emerald-600">
                    ${wallet.totalDeposited.toFixed(2)}
                  </p>
                  <div className="h-1 w-full bg-emerald-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[70%] animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Total Out
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-slate-800">
                    ${wallet.totalCost.toFixed(2)}
                  </p>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 w-[85%]" />
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 rounded-2xl bg-muted/50 border border-border/50 flex items-start gap-3">
                <CircleDollarSign className="text-primary mt-0.5" size={18} />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Financial records are calculated based on your total deposits
                  against the aggregate meal rate and individual consumption.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- Sub-components for cleaner structure ---

function StatMiniBlock({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    orange: "text-orange-600 bg-orange-50",
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    rose: "text-rose-600 bg-rose-50",
    indigo: "text-indigo-600 bg-indigo-50",
    slate: "text-slate-600 bg-slate-50",
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-card border border-border/50 p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.01)] transition-all"
    >
      <div className={`p-2 rounded-lg w-fit mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1.5">
        {label}
      </p>
      <h4 className="text-lg font-black tracking-tighter tabular-nums text-foreground">
        {value}
      </h4>
    </motion.div>
  );
}

function LifetimeRow({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span
          className={`text-sm font-black tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[10px] font-bold text-muted-foreground/50">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
