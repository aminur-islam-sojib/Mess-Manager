"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { AnimatePresence, cubicBezier, motion } from "framer-motion";
import {
  Plus,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  CalendarDaysIcon,
  UsersIcon,
} from "lucide-react";

// Shadcn UI (Assuming these are in your components/ui folder)
import { Card, CardContent } from "@/components/ui/card";

import {
  GetExpensesSerializedResponse,
  ExpenseDocumentSerialized,
} from "@/types/ExpenseType";

import { Button } from "@/components/ui/button";
import AddExpense from "./AddExpense";
import { MessDataResponse } from "@/types/MealManagement";
import { cn } from "@/lib/utils";
import FinancialRecords from "./FinancialRecords";
import UserAddExpense from "./UserAddExpense";
import { getAllExpenses } from "@/actions/server/Expense";
import { DateRange } from "react-day-picker";
import IndividualExpenses from "./IndividualExpenses";
import { getMemberMealAndCostSummary } from "@/actions/server/MealExpenses";

interface Expense {
  id: string;
  date: string;
  title: string;
  category: string;
  amount: number;
  paidBy: string;
  status: "approved" | "pending";
  description?: string;
}

type MessExpenseManagementProps = {
  messData: MessDataResponse;
  role: string;
};
const views = [
  { key: "monthlyExpenses", label: "Monthly Expenses", icon: CalendarDaysIcon },
  {
    key: "individualExpenses",
    label: "Individual Expenses",
    icon: UsersIcon,
  },
] as const;
const contentVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: cubicBezier(0.25, 0.46, 0.45, 0.94),
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.25,
      ease: cubicBezier(0.17, 0.67, 0.83, 0.67),
    },
  },
};

export default function MessExpenseManagement({
  messData,
  role,
}: MessExpenseManagementProps) {
  // --- STATE (Functional Logic Kept) ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<
    GetExpensesSerializedResponse | undefined
  >();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isPending, startTransition] = useTransition();
  const [selectedView, setSelectedView] = useState<
    "monthlyExpenses" | "individualExpenses"
  >("monthlyExpenses");

  const fetchMealCost = async () => {
    const res = await getMemberMealAndCostSummary();
    console.log("mela cos", res);
  };
  useEffect(() => {
    fetchMealCost();
  }, []);

  // 🔥 MASTER FETCH FUNCTION - Called from both parent mount and child date selection
  const fetchExpensesWithDateRange = async (fromDate?: Date, toDate?: Date) => {
    startTransition(async () => {
      const data = await getAllExpenses(fromDate, toDate);
      setAllExpenses(data);
    });
  };

  // Fetch all expenses on component mount (default = current month)
  useEffect(() => {
    fetchExpensesWithDateRange();
  }, []);

  // 🔥 CALLBACK FUNCTION - Child component (FinancialRecords) calls this with selected dates
  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
    if (newDateRange?.from) {
      // Fetch data with new date range
      fetchExpensesWithDateRange(newDateRange.from, newDateRange.to);
    }
  };

  // Compute mapped expenses from allExpenses prop
  const mappedExpenses = useMemo(() => {
    if (allExpenses && allExpenses.success && allExpenses.expenses) {
      return allExpenses.expenses.map(
        (e: ExpenseDocumentSerialized, index: number) => ({
          id: `expense-${e.expenseDate}-${index}`,
          date: e.expenseDate,
          title: e.title,
          category: e.category,
          amount: e.amount,
          paidBy: e.paidBy,
          status: e.status,
          description: e.description,
        }),
      );
    }
    return [];
  }, [allExpenses]);

  // Sync mapped expenses to state
  useEffect(() => {
    setExpenses(mappedExpenses);
  }, [mappedExpenses]);

  if (!role) {
    return (
      <div>
        <h1>User role needed</h1>
      </div>
    );
  }

  // --- Calculations ---
  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalApproved = expenses
    .filter((exp) => exp.status === "approved")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const totalPending = expenses
    .filter((exp) => exp.status === "pending")
    .reduce((sum, exp) => sum + exp.amount, 0);

  const handleIsModalOpen = (value: boolean) => {
    setIsAddModalOpen(value);
  };

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER SECTION (Modernized) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              Mess Expenses
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Manage and track collective spending for this month.
            </p>
          </motion.div>

          {/* DON'T TOUCH: Add Expenses Logic Trigger */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              size="lg"
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all gap-2"
            >
              <Plus className="w-5 h-5" />
              New Expense
            </Button>
          </motion.div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              label: "Total Volume",
              value: totalExpense,
              icon: DollarSign,
              color: "bg-primary",
              sub: "This Month",
            },
            {
              label: "Approved",
              value: totalApproved,
              icon: CheckCircle,
              color: "bg-emerald-500",
              sub: `${expenses.filter((e) => e.status === "approved").length} Items`,
            },
            {
              label: "In Review",
              value: totalPending,
              icon: Clock,
              color: "bg-amber-500",
              sub: `${expenses.filter((e) => e.status === "pending").length} Pending`,
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="relative overflow-hidden border-none shadow-sm">
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <h3 className="text-3xl font-bold">
                        ৳{stat.value.toLocaleString()}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {stat.sub}
                      </p>
                    </div>
                    <div
                      className={cn("p-3 rounded-2xl text-white", stat.color)}
                    >
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className=" flex flex-col gap-5">
          <div className="relative flex items-center gap-1 bg-muted rounded-xl p-1">
            {views.map(({ key, label, icon: Icon }) => {
              const isActive = selectedView === key;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedView(key)}
                  className="relative flex-1 px-4 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 z-10"
                >
                  {/* Active background */}
                  {isActive && (
                    <motion.div
                      layoutId="activeViewTab"
                      className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}

                  <span
                    className={`relative flex items-center gap-2 transition-colors ${
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Animated Content */}
          <div className="relative ">
            <AnimatePresence mode="wait">
              {selectedView === "monthlyExpenses" && (
                <motion.div
                  key="daily"
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {allExpenses && messData && role && (
                    <FinancialRecords
                      allExpenses={allExpenses}
                      setIsAddModalOpen={handleIsModalOpen}
                      messData={messData}
                      role={role}
                      onDateRangeChange={handleDateRangeChange}
                      isLoadingExpenses={isPending}
                      selectedDateRange={dateRange}
                    />
                  )}
                </motion.div>
              )}

              {selectedView === "individualExpenses" && (
                <motion.div
                  key="monthly"
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <IndividualExpenses />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* DON'T TOUCH: Add Expense Component */}
        {role === "manager" && isAddModalOpen && messData && (
          <AddExpense
            setIsAddModalOpen={handleIsModalOpen}
            messData={messData}
          />
        )}

        {role === "user" && isAddModalOpen && (
          <UserAddExpense setIsAddModalOpen={handleIsModalOpen} />
        )}
      </div>
    </div>
  );
}
