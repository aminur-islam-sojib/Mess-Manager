"use client";

import { addExpense } from "@/actions/server/Expense";
import IndividualMemberSelector from "@/components/Shared/IndividualMemberSelector";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MessDataResponse } from "@/types/MealManagement";
import { CalendarIcon, DollarSign, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type FormData = {
  title: string;
  description: string;
  amount: string;
  category: "" | "grocery" | "utility" | "rent" | "others";
  date: string;
  paymentSource: "mess_pool" | "individual";
  paidBy: string;
  assignToAllMembers: boolean;
};

type AddExpenseProps = {
  setIsAddModalOpen: (value: boolean) => void;
  messData?: MessDataResponse;
};

const CATEGORY_OPTIONS = [
  { label: "Grocery", value: "grocery" },
  { label: "Utility", value: "utility" },
  { label: "Rent", value: "rent" },
  { label: "Others", value: "others" },
] as const;

export default function AddExpense({
  setIsAddModalOpen,
  messData,
}: AddExpenseProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    amount: "",
    category: "",
    date: "",
    paymentSource: "mess_pool",
    paidBy: "",
    assignToAllMembers: false,
  });

  const memberOptions = useMemo(
    () => (messData?.members ?? []).filter((m) => m.role === "member"),
    [messData],
  );

  const selectorData = useMemo<MessDataResponse>(
    () => ({
      success: true,
      members: memberOptions,
    }),
    [memberOptions],
  );

  const isIndividual = formData.paymentSource === "individual";

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title.trim()) nextErrors.title = "Title is required";
    if (!formData.amount || Number(formData.amount) <= 0) {
      nextErrors.amount = "Amount must be greater than 0";
    }
    if (!formData.category) nextErrors.category = "Category is required";
    if (!formData.date) nextErrors.date = "Date is required";

    if (isIndividual && !formData.assignToAllMembers && !formData.paidBy) {
      nextErrors.paidBy = "Select a member or apply to all members";
    }

    if (isIndividual && memberOptions.length === 0) {
      nextErrors.paidBy = "No active members available";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      amount: "",
      category: "",
      date: "",
      paymentSource: "mess_pool",
      paidBy: "",
      assignToAllMembers: false,
    });
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await addExpense({
        title: formData.title.trim(),
        description: formData.description.trim(),
        amount: Number(formData.amount),
        category: formData.category as
          | "grocery"
          | "utility"
          | "rent"
          | "others",
        expenseDate: formData.date,
        paymentSource: formData.paymentSource,
        paidBy:
          formData.paymentSource === "individual" &&
          !formData.assignToAllMembers
            ? formData.paidBy
            : undefined,
        assignToAllMembers:
          formData.paymentSource === "individual"
            ? formData.assignToAllMembers
            : undefined,
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      if (res.status === "pending") {
        toast.success("Expense submitted for manager approval");
      } else if ((res.createdCount ?? 1) > 1) {
        toast.success(`${res.createdCount} expenses created successfully`);
      } else {
        toast.success("Expense added successfully");
      }

      resetForm();
      setIsAddModalOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to add expense");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => setIsAddModalOpen(false)}>
      <DialogContent className="sm:max-w-112.5 p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-0 bg-muted/30">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Add Expense
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            `Mess Pool` is manager-only. `Individual` expenses can be tracked
            per member.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-semibold">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                value={formData.title}
                placeholder="e.g. Grocery shopping"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className={
                  errors.title
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              {errors.title && (
                <p className="text-[11px] font-medium text-destructive">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-semibold">
                  Amount <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    className={`pl-8 ${errors.amount ? "border-destructive" : ""}`}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                  />
                </div>
                {errors.amount && (
                  <p className="text-[11px] font-medium text-destructive">
                    {errors.amount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Category <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: value as FormData["category"],
                    }))
                  }
                >
                  <SelectTrigger
                    className={errors.category ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-[11px] font-medium text-destructive">
                    {errors.category}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Payment Type <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.paymentSource}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentSource: value as FormData["paymentSource"],
                    paidBy: "",
                    assignToAllMembers: false,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mess_pool">Mess Pool (Manager)</SelectItem>
                  <SelectItem value="individual">Individual Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isIndividual && (
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Member Assignment <span className="text-destructive">*</span>
                </label>
                <div className="rounded-lg border p-3 space-y-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.assignToAllMembers}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          assignToAllMembers: e.target.checked,
                          paidBy: e.target.checked ? "" : prev.paidBy,
                        }))
                      }
                    />
                    Apply this expense to all active members
                  </label>

                  {!formData.assignToAllMembers && (
                    <IndividualMemberSelector
                      messData={selectorData}
                      setSelectedId={(id) =>
                        setFormData((prev) => ({ ...prev, paidBy: id }))
                      }
                    />
                  )}
                </div>
                {errors.paidBy && (
                  <p className="text-[11px] font-medium text-destructive">
                    {errors.paidBy}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2 flex flex-col">
              <label htmlFor="date" className="text-sm font-semibold">
                Date <span className="text-destructive">*</span>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
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
                      setFormData((prev) => ({
                        ...prev,
                        date: date ? format(date, "yyyy-MM-dd") : "",
                      }))
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

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-sm font-semibold text-muted-foreground"
              >
                Description (Optional)
              </label>
              <Textarea
                id="description"
                value={formData.description}
                placeholder="Add a note..."
                className="resize-none min-h-20"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </ScrollArea>

        <Separator />
        <DialogFooter className="flex px-6 py-4 bg-muted/30 gap-2 sm:gap-0">
          <Button
            variant="secondary"
            onClick={() => setIsAddModalOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="ml-2">
            {isLoading ? (
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
