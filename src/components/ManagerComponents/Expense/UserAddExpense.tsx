"use client";
import { format } from "date-fns";
import { getAllExpenses, addExpense } from "@/actions/server/Expense";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";
import { Separator } from "@radix-ui/react-separator";
import { CalendarIcon, DollarSign, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ExpenseFormData {
  title: string;
  description: string;
  amount: string;
  category: string;
  date: string;
  paidBy: string;
}

type AddExpenseProps = {
  setIsAddModalOpen: (value: boolean) => void;
};

export default function UserAddExpense({ setIsAddModalOpen }: AddExpenseProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ExpenseFormData>>({});
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: "",
    description: "",
    amount: "",
    category: "",
    date: "",
    paidBy: "",
  });
  const categories = [
    { label: "Grocery", value: "grocery" },
    { label: "Utility", value: "utility" },
    { label: "Rent", value: "rent" },
    { label: "Others", value: "others" },
  ];

  // 🔹 Fetch all expenses
  const getAllExpensesData = async () => {
    setIsLoading(true);
    const res = await getAllExpenses();
    if (res.success) {
      // Expenses fetched but not displayed in this modal
      // They would be displayed in a separate list component
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const loadExpenses = async () => {
      await getAllExpensesData();
    };
    loadExpenses();
  }, []);

  // 🔹 Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<ExpenseFormData> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.amount || parseFloat(formData.amount) <= 0)
      newErrors.amount = "Valid amount is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.date) newErrors.date = "Date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Submit form
  const handleSubmit = async () => {
    console.log("click");
    if (!validateForm()) return;

    setIsLoading(true);

    const payload = {
      title: formData.title,
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category as "grocery" | "utility" | "rent" | "others",
      expenseDate: formData.date,
      // paidBy is not provided - backend will use current user's ID
    };

    startTransition(async () => {
      const res = await addExpense(payload);

      if (res.success) {
        setFormData({
          title: "",
          description: "",
          amount: "",
          category: "",
          date: "",
          paidBy: "",
        });
        setIsAddModalOpen(false);
        // 🔄 Refresh the page to fetch updated expenses
        router.refresh();
      } else {
        alert(res.message);
      }

      setIsLoading(false);
    });
  };

  return (
    <Dialog open={true} onOpenChange={() => setIsAddModalOpen(false)}>
      <DialogContent className="sm:max-w-112.5 p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-0 bg-muted/30">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Add Expense
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground">
            Record a new expense for your mess members.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-5">
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold">
                Title <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  placeholder="e.g. Grocery Shopping"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={
                    errors.title
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
              </div>
              {errors.title && (
                <p className="text-[11px] font-medium text-destructive">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Amount Field */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-semibold">
                  Amount <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    className={`pl-8 ${errors.amount ? "border-destructive" : ""}`}
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                </div>
              </div>
              {/* Category Selector */}
              <div className="space-y-2 w-full">
                <Label className="text-sm font-semibold">Category</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  defaultValue={formData.category}
                >
                  <SelectTrigger
                    className={errors.category ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Date Field */}
            <div className="space-y-2 flex flex-col">
              <Label htmlFor="date" className="text-sm font-semibold">
                Date <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 px-3",
                      !formData.date && "text-muted-foreground",
                      errors.date &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    {formData.date ? (
                      format(new Date(formData.date), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.date ? new Date(formData.date) : undefined
                    }
                    onSelect={(date) =>
                      setFormData({
                        ...formData,
                        date: date ? date.toISOString() : "",
                      })
                    }
                    initialFocus
                    className="rounded-md border shadow-md bg-popover"
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-[11px] font-medium text-destructive">
                  {errors.date}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="desc"
                className="text-sm font-semibold text-muted-foreground"
              >
                Description (Optional)
              </Label>
              <Textarea
                id="desc"
                placeholder="Add some notes..."
                className="resize-none min-h-20"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
        </ScrollArea>
        <Separator />
        <DialogFooter className=" flex px-6 py-4 bg-muted/30 gap-2 sm:gap-0">
          <Button
            className=" cursor-pointer"
            variant="secondary"
            onClick={() => setIsAddModalOpen(false)}
            disabled={isLoading || isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isPending}
            className="px-8 shadow-lg shadow-primary/20 ml-2 cursor-pointer"
          >
            {isLoading || isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Expense"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
