"use client";

import { format } from "date-fns";
import { addUserDeposit } from "@/actions/server/Deposit";
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
import { Textarea } from "@/components/ui/textarea";
import { MessDataResponse } from "@/types/MealManagement";
import { Label } from "@radix-ui/react-label";
import { Separator } from "@radix-ui/react-separator";
import { CalendarIcon, DollarSign, Loader2, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface DepositFormData {
  userId: string;
  amount: string;
  method: string;
  date: string;
  note: string;
}

type AddDepositProps = {
  messData: MessDataResponse;
};

export default function AddDeposit({ messData }: AddDepositProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<DepositFormData>>({});

  const [formData, setFormData] = useState<DepositFormData>({
    userId: "",
    amount: "",
    method: "",
    date: "",
    note: "",
  });

  /* ---------- VALIDATION ---------- */
  const validateForm = (): boolean => {
    const newErrors: Partial<DepositFormData> = {};

    if (!formData.userId) newErrors.userId = "Member is required";
    if (!formData.amount || parseFloat(formData.amount) <= 0)
      newErrors.amount = "Valid amount is required";
    if (!formData.method) newErrors.method = "Payment method is required";
    if (!formData.date) newErrors.date = "Date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!messData?.messId) {
      alert("Mess ID is missing. Please reload.");
      return;
    }

    setIsLoading(true);

    const payload = {
      messId: messData.messId,
      userId: formData.userId,
      amount: parseFloat(formData.amount),
      method: formData.method as "cash" | "bkash" | "nagad" | "bank",
      note: formData.note,
      date: formData.date,
    };

    startTransition(async () => {
      const res = await addUserDeposit(payload);

      if (res.success) {
        setFormData({
          userId: "",
          amount: "",
          method: "",
          date: "",
          note: "",
        });

        setIsOpen(false);
        router.refresh();
      } else {
        alert("Failed to add deposit");
      }

      setIsLoading(false);
    });
  };

  return (
    <>
      {/* 🔘 Trigger Button */}
      <Button onClick={() => setIsOpen(true)} className="gap-2 cursor-pointer">
        <Plus className="h-4 w-4" />
        Add Deposit
      </Button>

      {/* 🪟 Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-112.5 p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-0 bg-muted/30">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Add Deposit
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Record a member’s deposit. Only managers can add deposits.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <div className="p-6 space-y-5">
              {/* Member */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Deposited By <span className="text-destructive">*</span>
                </Label>
                <IndividualMemberSelector
                  messData={messData}
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
                {/* Amount */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Amount <span className="text-destructive">*</span>
                  </Label>
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
                        setFormData({ ...formData, amount: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Method */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Payment Method <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setFormData({ ...formData, method: value })
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
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Deposit Date <span className="text-destructive">*</span>
                </Label>
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
                      selected={
                        formData.date ? new Date(formData.date) : undefined
                      }
                      onSelect={(date) =>
                        setFormData({
                          ...formData,
                          date: date ? date.toISOString().split("T")[0] : "",
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">
                  Note (Optional)
                </Label>
                <Textarea
                  placeholder="e.g. February advance, meal payment"
                  className="resize-none min-h-20"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                />
              </div>
            </div>
          </ScrollArea>

          <Separator />

          <DialogFooter className="px-6 py-4 bg-muted/30 gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className=" cursor-pointer"
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
              ) : (
                "Add Deposit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
