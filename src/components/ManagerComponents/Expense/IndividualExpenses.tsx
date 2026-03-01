"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  getMemberMealAndCostSummary,
  type MemberSummary,
} from "@/actions/server/MealExpenses";
import {
  approveExpense,
  getPendingIndividualExpenses,
} from "@/actions/server/Expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type PendingExpense = {
  id: string;
  title: string;
  amount: number;
  expenseDate: string;
  paidBy: string;
};

type IndividualExpensesProps = {
  role: string;
  memberNameMap: Map<string, string>;
};

export default function IndividualExpenses({
  role,
  memberNameMap,
}: IndividualExpensesProps) {
  const [summary, setSummary] = useState<MemberSummary[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [isLoading, startTransition] = useTransition();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadData = () => {
    startTransition(async () => {
      const [summaryRes, pendingRes] = await Promise.all([
        getMemberMealAndCostSummary(),
        getPendingIndividualExpenses(),
      ]);

      if (summaryRes.success) {
        setSummary(summaryRes.data);
      } else {
        toast.error(summaryRes.message);
      }

      if (pendingRes.success) {
        setPendingExpenses(
          (pendingRes.expenses ?? []).map((expense) => ({
            id: expense.id,
            title: expense.title,
            amount: expense.amount,
            expenseDate: expense.expenseDate,
            paidBy: expense.paidBy,
          })),
        );
      } else {
        setPendingExpenses([]);
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => {
    return summary.reduce(
      (acc, member) => {
        acc.totalMeals += member.totalMeals;
        acc.totalApproved += member.approvedExpense;
        acc.totalPending += member.pendingExpense;
        acc.totalExpense += member.totalExpense;
        return acc;
      },
      { totalMeals: 0, totalApproved: 0, totalPending: 0, totalExpense: 0 },
    );
  }, [summary]);

  const handleApprove = async (expenseId: string) => {
    if (role !== "manager") return;

    setApprovingId(expenseId);
    try {
      const result = await approveExpense(expenseId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Expense approved");
      loadData();
    } finally {
      setApprovingId(null);
    }
  };

  const getPayerName = (payerId: string) =>
    memberNameMap.get(payerId) || "Unknown Member";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Meals</p>
            <p className="text-2xl font-bold">{totals.totalMeals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold">৳{totals.totalApproved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">৳{totals.totalPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Expense</p>
            <p className="text-2xl font-bold">৳{totals.totalExpense}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member Meal & Expense Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Meals</TableHead>
                <TableHead className="text-right">Approved</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    {isLoading ? "Loading..." : "No member summary found"}
                  </TableCell>
                </TableRow>
              ) : (
                summary.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-right">
                      {member.totalMeals}
                    </TableCell>
                    <TableCell className="text-right">
                      ৳{member.approvedExpense}
                    </TableCell>
                    <TableCell className="text-right">
                      ৳{member.pendingExpense}
                    </TableCell>
                    <TableCell className="text-right">
                      ৳{member.totalExpense}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Individual Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingExpenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    {isLoading ? "Loading..." : "No pending expenses"}
                  </TableCell>
                </TableRow>
              ) : (
                pendingExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.expenseDate}</TableCell>
                    <TableCell>{expense.title}</TableCell>
                    <TableCell>{getPayerName(expense.paidBy)}</TableCell>
                    <TableCell className="text-right">
                      ৳{expense.amount}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
                        pending
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {role === "manager" ? (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(expense.id)}
                          disabled={approvingId === expense.id}
                        >
                          {approvingId === expense.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Manager only
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
