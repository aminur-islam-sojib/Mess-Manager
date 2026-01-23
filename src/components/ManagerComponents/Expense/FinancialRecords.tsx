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
import { AnimatePresence } from "framer-motion";
import {
  Eye,
  Trash2,
  CheckCircle,
  Filter,
  Receipt,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import {
  ExpenseDocumentSerialized,
  GetExpensesSerializedResponse,
} from "@/types/ExpenseType";
import { Badge } from "@/components/ui/badge";
import { MessDataResponse } from "@/types/MealManagement";
import { format } from "date-fns";

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

type FinancialRecordsProps = {
  allExpenses: GetExpensesSerializedResponse;
  setIsAddModalOpen: (value: boolean) => void;
  messData: MessDataResponse;
};

export default function FinancialRecords({
  allExpenses,
  setIsAddModalOpen,
  messData,
}: FinancialRecordsProps) {
  // --- STATE (Functional Logic Kept) ---
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

  console.log(messData);
  const getPayerName = (id: string) => {
    const member = messData.members?.find((m) => m.userId === id);
    return member ? member.name : "Unknown Member";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Card className=" shadow-none ">
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

        <CardContent>
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
                          {new Date(expense.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {expense.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {expense.category}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            {/* Avatar Circle */}
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary">
                              {getInitials(getPayerName(expense.paidBy))}
                            </div>

                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground leading-none">
                                {getPayerName(expense.paidBy)}
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-1 lowercase tracking-tighter">
                                {messData.members?.find(
                                  (m) => m.userId === expense.paidBy,
                                )?.email || "User"}
                              </span>
                            </div>
                          </div>
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
                          <div className="flex items-center justify-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
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
        <DialogContent className="sm:max-w-lg border-none overflow-hidden p-0 shadow-2xl">
          {selectedExpense && (
            <>
              {/* Header Section */}
              <div className="bg-primary p-8 text-primary-foreground relative">
                <p className="text-primary-foreground/70 uppercase text-[10px] font-bold tracking-[0.2em] mb-2">
                  Expense Details
                </p>
                <DialogTitle className="text-3xl font-bold leading-tight">
                  {selectedExpense.title}
                </DialogTitle>
                {/* Subtle background icon for flair */}
                <Receipt className="absolute right-6 bottom-4 w-16 h-16 text-white/10 -rotate-12" />
              </div>

              <div className="p-8 space-y-4">
                {/* Financials and Status Row */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                      Total Amount
                    </p>
                    <p className="text-3xl font-extrabold text-primary">
                      ৳{selectedExpense.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                      Verification Status
                    </p>
                    <Badge
                      className={cn(
                        "px-3 py-1 text-xs font-semibold uppercase tracking-tight",
                        selectedExpense.status === "approved"
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-amber-500 hover:bg-amber-600",
                      )}
                    >
                      {selectedExpense.status}
                    </Badge>
                  </div>
                </div>

                {/* User Info (The part you requested) */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar with dynamic initials */}
                    <div className="h-12 w-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold">
                      {getInitials(getPayerName(selectedExpense.paidBy))}
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-bold">
                        Paid By
                      </p>
                      <p className="text-base font-bold text-foreground">
                        {getPayerName(selectedExpense.paidBy)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">
                      Date
                    </p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedExpense.date), "PPP")}
                    </p>
                  </div>
                </div>

                {/* Description Section */}
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                    Notes & Description
                  </p>
                  <div className="rounded-lg bg-muted/20 p-4 border border-dashed border-border">
                    <DialogDescription className="text-sm leading-relaxed text-foreground/80 italic">
                      &quot;
                      {selectedExpense.description ||
                        "No additional notes provided for this transaction."}
                      &quot;
                    </DialogDescription>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              {/* Footer Actions */}
              <DialogFooter className="p-6 bg-muted/50 border-t flex flex-row items-center gap-3 sm:space-x-0">
                <Button
                  variant="outline"
                  className="flex-1 font-semibold hover:bg-background h-11" // Added height for better mobile touch
                  onClick={() => setSelectedExpense(null)}
                >
                  Close Window
                </Button>

                <Button className="flex-1 font-semibold h-11 shadow-sm">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Record
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
