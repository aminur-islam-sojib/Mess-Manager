"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  CreditCard,
  Loader2,
  Receipt,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateDepositRules,
  updateExpenseRules,
  updateMonthlyBudget,
} from "@/actions/server/ManagerSettings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ManagerSettingsMess } from "@/types/ManagerSettings";

export default function FinanceSettingsSection({
  mess,
}: {
  mess: ManagerSettingsMess;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [depositRules, setDepositRules] = useState({
    minimumDeposit: String(mess.depositSettings.minimumDeposit),
    approvalMode: mess.depositSettings.approvalMode,
  });
  const [expenseRules, setExpenseRules] = useState(
    mess.settings.expenseRules.whoCanAddExpenses,
  );
  const [budget, setBudget] = useState(String(mess.budget));

  const runAction = (action: () => Promise<{ success: boolean; message: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.message);
    });
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Deposit Rules</CardTitle>
              <CardDescription>
                Define minimum deposit requirements and how approvals should work.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minimum-deposit">Minimum Deposit Amount</Label>
              <Input
                id="minimum-deposit"
                type="number"
                min="0"
                value={depositRules.minimumDeposit}
                onChange={(event) =>
                  setDepositRules((current) => ({
                    ...current,
                    minimumDeposit: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Deposit Approval Mode</Label>
              <Select
                value={depositRules.approvalMode}
                onValueChange={(value) =>
                  setDepositRules((current) => ({
                    ...current,
                    approvalMode: value as "manual" | "automatic",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select approval mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual approval</SelectItem>
                  <SelectItem value="automatic">Automatic approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() =>
              runAction(() =>
                updateDepositRules({
                  minimumDeposit: Number(depositRules.minimumDeposit || 0),
                  approvalMode: depositRules.approvalMode,
                }),
              )
            }
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Deposit Rules
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Expense Rules</CardTitle>
              <CardDescription>
                Choose whether only managers or all members can submit expenses.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Who can add expenses</Label>
            <Select
              value={expenseRules}
              onValueChange={(value) =>
                setExpenseRules(value as "managerOnly" | "membersAllowed")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select expense access" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="managerOnly">Manager only</SelectItem>
                <SelectItem value="membersAllowed">Members allowed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              runAction(() =>
                updateExpenseRules({
                  whoCanAddExpenses: expenseRules,
                }),
              )
            }
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Expense Rules
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <BadgeDollarSign className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Monthly Budget</CardTitle>
              <CardDescription>
                Set a soft monthly budget target for your mess operations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="monthly-budget">Budget</Label>
            <Input
              id="monthly-budget"
              type="number"
              min="0"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
            />
          </div>

          <Button
            onClick={() =>
              runAction(() =>
                updateMonthlyBudget({
                  budget: Number(budget || 0),
                }),
              )
            }
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Budget
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
