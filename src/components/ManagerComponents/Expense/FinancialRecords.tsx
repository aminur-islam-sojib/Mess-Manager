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
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ExpenseDocumentSerialized,
  GetExpensesSerializedResponse,
} from "@/types/ExpenseType";
import { Badge } from "@/components/ui/badge";
import { MessDataResponse } from "@/types/MealManagement";
import { format } from "date-fns";
import { approveExpense } from "@/actions/server/Expense";
import Swal from "sweetalert2";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

interface Expense {
  id: string;
  date: string;
  title: string;
  category: string;
  amount: number;
  paidBy: string;
  status: "approved" | "pending";
  description?: string;
  paymentSource: string;
}

type FinancialRecordsProps = {
  allExpenses: GetExpensesSerializedResponse;
  setIsAddModalOpen: (value: boolean) => void;
  messData: MessDataResponse;
  role: string;
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
  isLoadingExpenses?: boolean;
  selectedDateRange?: DateRange | undefined;
};

export default function FinancialRecords({
  allExpenses,
  setIsAddModalOpen,
  messData,
  role,
  onDateRangeChange,
  isLoadingExpenses = false,
  selectedDateRange,
}: FinancialRecordsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // --- STATE (Functional Logic Kept) ---
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>(selectedDateRange);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Initialize date range from allExpenses response (current month dates)
  useEffect(() => {
    if (
      allExpenses.success &&
      allExpenses.from &&
      allExpenses.to &&
      !selectedDateRange
    ) {
      const fromDate = new Date(allExpenses.from);
      const toDate = new Date(allExpenses.to);
      setDate({
        from: fromDate,
        to: toDate,
      });
    }
  }, [allExpenses, selectedDateRange]);

  console.log(allExpenses);
  // Compute mapped expenses from allExpenses prop
  const mappedExpenses = useMemo(() => {
    if (allExpenses.success && allExpenses.expenses) {
      return allExpenses.expenses.map((e: ExpenseDocumentSerialized) => ({
        id: e.id,
        date: e.expenseDate,
        title: e.title,
        category: e.category,
        amount: e.amount,
        paidBy: e.paidBy,
        status: e.status,
        description: e.description,
        paymentSource: e.paymentSource,
      }));
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

  // --- Filter Expenses ---
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const categoryMatch =
        filterCategory === "all" ||
        expense.category.toLowerCase() === filterCategory.toLowerCase();
      const statusMatch =
        filterStatus === "all" || expense.status === filterStatus;

      // Date range filter
      let dateMatch = true;
      if (date?.from || date?.to) {
        const expenseDate = new Date(expense.date);
        if (date.from && expenseDate < date.from) {
          dateMatch = false;
        }
        if (date.to) {
          const endOfDay = new Date(date.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (expenseDate > endOfDay) {
            dateMatch = false;
          }
        }
      }

      return categoryMatch && statusMatch && dateMatch;
    });
  }, [expenses, filterCategory, filterStatus, date]);

  // --- Handlers (Functional Logic Kept) ---
  const handleDelete = (id: string) => {
    setExpenses(expenses.filter((exp) => exp.id !== id));
    setDeleteConfirmId(null);
  };

  const approveExpenses = async (expenseId: string) => {
    try {
      console.log("expenseId", expenseId);
      const res = await approveExpense(expenseId);
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };

  const handleApprove = (id: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You wanna accept this expenses!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#88be89",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Add Expenses!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        console.log("expenseId", id);
        startTransition(async () => {
          const res = await approveExpenses(id);
          console.log(res);
          // 🔄 Refresh the page to fetch updated expenses
          router.refresh();
        });
      }
    });
  };

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

  // Handle date change - refetch expenses with new date range
  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    // Call parent callback to fetch data
    if (onDateRangeChange) {
      onDateRangeChange(newDate);
    }
  };

  return (
    <>
      <Card className=" shadow-none ">
        <CardHeader className="pb-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Title & Icon */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Filter className="w-4 h-4" />
              </div>
              <CardTitle className="text-xl font-semibold tracking-tight">
                Financial Records
              </CardTitle>
            </div>

            {/* Right: Filters Group */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Modern Date Range Picker */}
              <div className="grid gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      disabled={isLoadingExpenses}
                      className={cn(
                        "w-65 justify-start text-left font-normal bg-muted/50 border-none hover:bg-muted transition-colors",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                      {isLoadingExpenses ? (
                        <span>Loading...</span>
                      ) : date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y") +
                              " - " +
                              format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-4">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleDateChange}
                        numberOfMonths={2}
                        className="rounded-md border "
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => handleDateChange(undefined)}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Category Select */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40 bg-muted/50 border-none focus:ring-1">
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

              {/* Status Select */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 bg-muted/50 border-none focus:ring-1">
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
                  {filteredExpenses.length === 0 ? (
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
                    filteredExpenses.map((expense) => (
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
                          {expense.paymentSource === "mess_pool" ? (
                            <Badge
                              variant="secondary"
                              className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100 px-3 py-1"
                            >
                              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              Official Mess Pool
                            </Badge>
                          ) : (
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
                          )}
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
                          <div className="flex items-center justify-center gap-1  group-hover:opacity-100 transition-opacity">
                            {role === "manager" &&
                              expense.status === "pending" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-emerald-600"
                                  onClick={() => handleApprove(expense.id)}
                                  disabled={isPending}
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
            <Button
              className="mr-2 cursor-pointer bg-accent"
              variant="ghost"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer "
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
                {/* Financial and Status Row */}
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
              <DialogFooter className="p-6 bg-muted/50 border-t flex flex-row items-center gap-3 sm:space-x-0">
                <Button
                  variant="outline"
                  className="flex-1 font-semibold hover:bg-background h-11 cursor-pointer" // Added height for better mobile touch
                  onClick={() => setSelectedExpense(null)}
                >
                  Close Window
                </Button>

                <Button className="flex-1 font-semibold h-11 shadow-sm cursor-pointer">
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
