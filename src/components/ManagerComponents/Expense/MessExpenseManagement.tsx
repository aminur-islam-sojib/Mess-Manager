"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Eye,
  Trash2,
  DollarSign,
  CheckCircle,
  Clock,
  Filter,
  Receipt,
  TrendingUp,
} from "lucide-react";

// Shadcn UI (Assuming these are in your components/ui folder)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GetExpensesSerializedResponse,
  ExpenseDocumentSerialized,
} from "@/types/ExpenseType";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddExpense from "./AddExpense";
import { MessDataResponse } from "@/types/MealManagement";
import { cn } from "@/lib/utils";

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
};

export default function MessExpenseManagement({
  messData,
  allExpenses,
}: MessExpenseManagementProps) {
  // --- STATE (Functional Logic Kept) ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const userRole: "manager" | "user" = "manager";

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

  const categories = [
    "Groceries",
    "Utilities",
    "Supplies",
    "Maintenance",
    "Other",
  ];

  // --- Handlers (Functional Logic Kept) ---
  const handleDelete = (id: string) => {
    setExpenses(expenses.filter((exp) => exp.id !== id));
    setDeleteConfirmId(null);
  };

  const handleApprove = (id: string) => {
    setExpenses(
      expenses.map((exp) =>
        exp.id === id ? { ...exp, status: "approved" as const } : exp,
      ),
    );
  };

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <Card className="relative overflow-hidden border-none shadow-md">
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
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Filter className="w-4 h-4" />
                </div>
                <CardTitle className="text-lg">Financial Records</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select defaultValue="all">
                  <SelectTrigger className="w-37.5 bg-muted/50 border-none">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c.toLowerCase()}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32.5 bg-muted/50 border-none">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="rounded-xl border bg-card">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Receipt className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium">No records found</p>
                            <Button
                              variant="link"
                              onClick={() => setIsAddModalOpen(true)}
                            >
                              Add your first expense
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((expense) => (
                        <TableRow
                          key={expense.id}
                          className="group hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-medium py-4">
                            {new Date(expense.date).toLocaleDateString(
                              "en-GB",
                              { day: "2-digit", month: "short" },
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {expense.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {expense.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {expense.paidBy}
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            ৳{expense.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "rounded-md px-2 py-1",
                                expense.status === "approved"
                                  ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20",
                              )}
                            >
                              {expense.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {userRole === "manager" &&
                                expense.status === "pending" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-emerald-600"
                                    onClick={() => handleApprove(expense.id)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setSelectedExpense(expense)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => setDeleteConfirmId(expense.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* --- MODALS (Modernized with Shadcn) --- */}

        {/* DON'T TOUCH: Add Expense Component */}
        {isAddModalOpen && messData && (
          <AddExpense
            setIsAddModalOpen={handleIsModalOpen}
            messData={messData}
          />
        )}

        {/* DELETE CONFIRMATION */}
        <Dialog
          open={!!deleteConfirmId}
          onOpenChange={() => setDeleteConfirmId(null)}
        >
          <DialogContent className="sm:max-w-md border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This will permanently delete this expense from the mess records.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                Delete Entry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* VIEW DETAILS */}
        <Dialog
          open={!!selectedExpense}
          onOpenChange={() => setSelectedExpense(null)}
        >
          <DialogContent className="sm:max-w-lg border-none overflow-hidden p-0">
            {selectedExpense && (
              <>
                <div className="bg-primary p-8 text-primary-foreground">
                  <p className="text-primary-foreground/70 uppercase text-xs font-bold tracking-widest mb-1">
                    Expense Details
                  </p>
                  <DialogTitle className=" text-3xl font-bold">
                    {selectedExpense.title}
                  </DialogTitle>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold">
                        Amount
                      </p>
                      <p className="text-2xl font-bold">
                        ৳{selectedExpense.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold">
                        Status
                      </p>
                      <Badge
                        className={
                          selectedExpense.status === "approved"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }
                      >
                        {selectedExpense.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">
                      Description
                    </p>

                    <DialogDescription className="text-sm leading-relaxed">
                      {selectedExpense.description ||
                        "No description provided."}
                    </DialogDescription>
                  </div>
                  <div className="pt-4 border-t grid grid-cols-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Paid By:</span>{" "}
                      {selectedExpense.paidBy}
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Date:</span>{" "}
                      {new Date(selectedExpense.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <DialogFooter className="p-4 bg-muted/50">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedExpense(null)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
