"use client";

import { format } from "date-fns";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  addUserDeposit,
  requestDeposit,
} from "@/actions/server/Deposit";
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
import type { MessDataResponse } from "@/types/MealManagement";
import type { DepositMethod, DepositPageRole } from "@/types/Deposit";
import { CalendarIcon, DollarSign, Loader2, Plus } from "lucide-react";

interface DepositFormData {
  userId: string;
  amount: string;
  method: string;
  date: string;
  note: string;
}

type AddDepositProps = {
  messData: MessDataResponse;
  role: DepositPageRole;
  currentUserId: string;
};

const INITIAL_FORM_STATE: DepositFormData = {
  userId: "",
  amount: "",
  method: "",
  date: "",
  note: "",
};

export default function AddDeposit({
  messData,
  role,
  currentUserId,
}: AddDepositProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<DepositFormData>>({});
  const [formData, setFormData] = useState<DepositFormData>({
    ...INITIAL_FORM_STATE,
    userId: role === "user" ? currentUserId : "",
  });

  const memberOptions = useMemo(() => {
    if (!messData.success || !messData.members) return [];

    if (role === "manager") {
      return messData.members;
    }

    return messData.members.filter((member) => member.userId === currentUserId);
  }, [currentUserId, messData, role]);

  const selectorMessData = useMemo<MessDataResponse>(
    () => ({
      success: true,
      members: memberOptions,
    }),
    [memberOptions],
  );

  const resetForm = () => {
    setFormData({
      ...INITIAL_FORM_STATE,
      userId: role === "user" ? currentUserId : "",
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<DepositFormData> = {};
    const amount = Number(formData.amount);

    if (!messData.success || !messData.messId) {
      toast.error("User must belong to a mess");
      return false;
    }

    if (!currentUserId) {
      toast.error("Unauthorized");
      return false;
    }

    if (!formData.userId) {
      newErrors.userId = "Member is required";
    }

    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
    } else if (!Number.isFinite(amount)) {
      newErrors.amount = "Amount must be a valid number";
    } else if (amount <= 0) {
      newErrors.amount = "Deposit amount must be greater than 0";
    }

    if (!formData.method) newErrors.method = "Payment method is required";
    if (!formData.date) newErrors.date = "Date is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return false;
    }

    return true;
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && role === "user") {
      setFormData((prev) => ({ ...prev, userId: currentUserId }));
    }
    setIsOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSubmit = async () => {
    if (isLoading || isPending) {
      toast.error("Please wait for the current submission to finish");
      return;
    }

    if (!validateForm() || !messData.success || !messData.messId) return;

    setIsLoading(true);
    const payload = {
      messId: messData.messId,
      userId: formData.userId,
      amount: Number(formData.amount),
      method: formData.method as DepositMethod,
      note: formData.note,
      date: formData.date,
    };

    startTransition(async () => {
      try {
        const response =
          role === "manager"
            ? await addUserDeposit(payload)
            : await requestDeposit(payload);

        if (!response.success) {
          toast.error(response.message);
          return;
        }

        toast.success(response.message);
        handleOpenChange(false);
        router.refresh();
      } catch {
        toast.error(
          role === "manager"
            ? "Failed to add deposit"
            : "Failed to send deposit request",
        );
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <>
      <Button onClick={() => handleOpenChange(true)} className="gap-2 cursor-pointer">
        <Plus className="h-4 w-4" />
        {role === "manager" ? "Add Deposit" : "Request Deposit"}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-112.5 p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-0 bg-muted/30">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {role === "manager" ? "Add Deposit" : "Request Deposit"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {role === "manager"
                ? "Record a member’s deposit. Only managers can add deposits."
                : "Submit your deposit request for manager approval."}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Deposited By <span className="text-destructive">*</span>
                </label>
                <IndividualMemberSelector
                  messData={selectorMessData}
                  setSelectedId={(id) =>
                    setFormData((prev) => ({ ...prev, userId: id }))
                  }
                />
                {errors.userId && (
                  <p className="text-[11px] font-medium text-destructive">
                    {errors.userId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 space-x-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Amount <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0.00"
                      className={cn(
                        "pl-8",
                        errors.amount && "border-destructive",
                      )}
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, amount: e.target.value }))
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
                    Payment Method <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, method: value }))
                    }
                  >
                    <SelectTrigger
                      className={errors.method ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bkash">bKash</SelectItem>
                      <SelectItem value="nagad">Nagad</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.method && (
                    <p className="text-[11px] font-medium text-destructive">
                      {errors.method}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Deposit Date <span className="text-destructive">*</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground",
                        errors.date && "border-destructive",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date
                        ? format(new Date(formData.date), "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date) : undefined}
                      onSelect={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          date: date ? format(date, "yyyy-MM-dd") : "",
                        }))
                      }
                      initialFocus
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
                <label className="text-sm font-semibold text-muted-foreground">
                  Note (Optional)
                </label>
                <Textarea
                  placeholder="e.g. February advance, meal payment"
                  className="resize-none min-h-20"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, note: e.target.value }))
                  }
                />
              </div>
            </div>
          </ScrollArea>

          <Separator />

          <DialogFooter className="px-6 py-4 bg-muted/30 gap-2">
            <Button
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || isPending}
              className="px-8 cursor-pointer"
            >
              {isLoading || isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : role === "manager" ? (
                "Add Deposit"
              ) : (
                "Send Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
