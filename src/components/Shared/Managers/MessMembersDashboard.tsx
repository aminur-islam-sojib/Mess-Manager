"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Utensils,
  DollarSign,
  ArrowUpDown,
  Search,
  Info,
  TrendingUp,
  ChevronRight,
  Filter,
  MoreVertical,
  ExternalLink,
  UserCircle,
  Settings,
  Mail,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import type { MessMember as Member } from "@/types/MessMember";

interface MessDashboardProps {
  members: Member[];
  messName?: string;
}

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export default function MessMembersDashboard({
  members,
  messName,
}: MessDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Member;
    direction: "asc" | "desc";
  } | null>(null);

  // --- Logic: Summary Calculations ---
  const summary = useMemo(() => {
    const totalMeals = members.reduce((acc, m) => acc + m.monthlyMeals, 0);
    const totalExpenses = members.reduce(
      (acc, m) => acc + m.monthlyMealCost,
      0,
    );
    const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;
    return { totalMeals, totalExpenses, mealRate };
  }, [members]);

  // --- Logic: Sorting & Filtering ---
  const sortedMembers = useMemo(() => {
    const filtered = members.filter(
      (m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key]! < b[sortConfig.key]!)
          return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key]! > b[sortConfig.key]!)
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [members, searchTerm, sortConfig]);

  const requestSort = (key: keyof Member) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Section (from Before UI) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-8">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-foreground italic uppercase">
            {messName || "Organization"}
          </h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Analyze monthly consumption and manage organization access levels.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-black px-5 py-2 bg-primary/10 text-primary rounded-2xl border border-primary/20 uppercase tracking-widest">
            {members.length} Members
          </div>
        </div>
      </div>

      {/* 1. TOP SECTION: ANALYTICS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Total Mess Meals"
          value={summary.totalMeals}
          icon={<Utensils className="text-primary" size={20} />}
          description="Total consumption this month"
        />
        <SummaryCard
          title="Total Expenses"
          value={`$${summary.totalExpenses.toLocaleString()}`}
          icon={<DollarSign className="text-emerald-500" size={20} />}
          description="Aggregate monthly cost"
        />
        <SummaryCard
          title="Cost Per Meal"
          value={`$${summary.mealRate.toFixed(2)}`}
          icon={<TrendingUp className="text-indigo-500" size={20} />}
          description="Current calculated rate"
        />
      </div>

      {/* 2. TABLE CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96 group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
            size={18}
          />
          <Input
            placeholder="Search by name or email..."
            className="pl-10 h-12 rounded-2xl border-border bg-card/50 shadow-sm focus-visible:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="rounded-xl border-border h-12 px-6 gap-2 font-bold uppercase text-[11px] tracking-widest"
        >
          <Filter size={16} /> Filter View
        </Button>
      </div>

      {/* 3. MEMBERS TABLE (Hybrid Look) */}
      <Card className="border border-border/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-card/50 backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="py-5 px-6">
                  <Button
                    variant="ghost"
                    className="p-0 hover:bg-transparent font-black uppercase text-[10px] tracking-widest"
                    onClick={() => requestSort("name")}
                  >
                    Member Details <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-center">
                  Status
                </TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">
                  Meals
                </TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 uppercase tracking-widest cursor-help">
                        Monthly Cost <Info size={12} className="opacity-40" />
                      </TooltipTrigger>
                      <TooltipContent>Meals × Rate</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right">
                  Balance
                </TableHead>
                <TableHead className="py-5 px-6 text-right font-black uppercase text-[10px] tracking-widest">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <AnimatePresence mode="popLayout">
                {sortedMembers.map((member) => (
                  <motion.tr
                    key={member.userId}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group border-border/50 hover:bg-muted/20 transition-all duration-200"
                  >
                    {/* User Info with Roles */}
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black border border-primary/10 shadow-sm transition-transform group-hover:scale-110">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground flex items-center gap-2">
                            {member.name}
                            <Badge
                              className={`text-[9px] h-4 px-1.5 font-black uppercase tracking-tighter ${
                                member.role === "manager"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              }`}
                              variant="outline"
                            >
                              {member.role}
                            </Badge>
                          </span>
                          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 opacity-70">
                            <Mail size={12} className="text-primary/60" />{" "}
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status Indicator (from Before UI) */}
                    <TableCell>
                      <div className="flex items-center justify-center gap-2 text-[10px] font-black text-foreground/80">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        {member.status || "ACTIVE"}
                      </div>
                    </TableCell>

                    <TableCell className="font-bold text-slate-500">
                      {member.monthlyMeals}
                    </TableCell>

                    <TableCell className="font-bold text-slate-900 tabular-nums">
                      ${member.monthlyMealCost.toFixed(2)}
                    </TableCell>

                    <TableCell className="py-5 text-right">
                      <div
                        className={`text-sm font-black tracking-tight tabular-nums ${
                          member.currentBalance < 0
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {member.currentBalance < 0 ? "-" : "+"}$
                        {Math.abs(member.currentBalance).toFixed(2)}
                      </div>
                      <p className="text-[9px] font-black uppercase text-muted-foreground/40 mt-1">
                        Total Dep: ${member.totalDeposit.toFixed(0)}
                      </p>
                    </TableCell>

                    {/* Action Dropdown (from Before UI) */}
                    <TableCell className="px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl hover:bg-background border border-transparent hover:border-border transition-all"
                          >
                            <MoreVertical
                              size={18}
                              className="text-muted-foreground"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 rounded-xl p-2 shadow-xl border-border/60"
                        >
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">
                            Member Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/profile/${member.userId}`}
                              className="flex items-center gap-2 px-2 py-2.5 rounded-lg cursor-pointer transition-colors focus:bg-primary focus:text-primary-foreground font-semibold text-sm"
                            >
                              <UserCircle size={16} /> View Profile{" "}
                              <ExternalLink
                                size={12}
                                className="ml-auto opacity-50"
                              />
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2 px-2 py-2.5 rounded-lg cursor-pointer text-muted-foreground font-semibold text-sm">
                            <Settings size={16} /> Manage Permissions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem className="flex items-center gap-2 px-2 py-2.5 rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive font-semibold text-sm">
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// --- Reusable Sub-Component ---
function SummaryCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] bg-card rounded-[2rem] p-7 group hover:shadow-md transition-all duration-300 border border-transparent hover:border-primary/10">
      <div className="flex justify-between items-start mb-5">
        <div className="p-3.5 rounded-2xl bg-muted group-hover:bg-primary/10 transition-colors">
          {icon}
        </div>
        <ChevronRight
          size={16}
          className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
          {title}
        </p>
        <h3 className="text-4xl font-black tracking-tighter text-foreground tabular-nums">
          {value}
        </h3>
        <p className="text-[10px] font-bold text-muted-foreground opacity-60 italic">
          {description}
        </p>
      </div>
    </Card>
  );
}
