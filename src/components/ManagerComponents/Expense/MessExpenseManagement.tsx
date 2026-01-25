"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, DollarSign, CheckCircle, Clock, TrendingUp } from "lucide-react";

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
  allExpenses: GetExpensesSerializedResponse;
  role: string;
};

export default function MessExpenseManagement({
  messData,
  allExpenses,
  role,
}: MessExpenseManagementProps) {
  // --- STATE (Functional Logic Kept) ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Compute mapped expenses from allExpenses prop
  const mappedExpenses = useMemo(() => {
    if (allExpenses.success && allExpenses.expenses) {
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

        {/* FILTERS & TABLE */}
        {allExpenses && messData && role && (
          <FinancialRecords
            allExpenses={allExpenses}
            setIsAddModalOpen={handleIsModalOpen}
            messData={messData}
            role={role}
          />
        )}

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
