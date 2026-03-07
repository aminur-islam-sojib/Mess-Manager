"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Receipt, Save } from "lucide-react";
import { toast } from "sonner";
import { createDepositRequest } from "@/actions/server/UserSettings";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  UserDepositRecord,
  UserDepositRequest,
  UserMessInfo,
} from "@/types/UserSettings";

export default function FinanceSettingsSection({
  mess,
  deposits,
  depositRequests,
}: {
  mess: UserMessInfo;
  deposits: UserDepositRecord[];
  depositRequests: UserDepositRequest[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [requestForm, setRequestForm] = useState({
    amount: "",
    method: "cash",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  const requestSummary = useMemo(
    () => ({
      pending: depositRequests.filter((request) => request.status === "pending")
        .length,
      approved: depositRequests.filter((request) => request.status === "approved")
        .length,
      rejected: depositRequests.filter((request) => request.status === "rejected")
        .length,
    }),
    [depositRequests],
  );

  const submitRequest = () => {
    startTransition(async () => {
      const result = await createDepositRequest({
        amount: Number(requestForm.amount || 0),
        method: requestForm.method as "cash" | "bkash" | "nagad" | "bank",
        date: requestForm.date,
        note: requestForm.note,
      });

      if (result.success) {
        toast.success(result.message);
        setRequestForm((current) => ({
          ...current,
          amount: "",
          note: "",
          date: new Date().toISOString().slice(0, 10),
        }));
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
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Deposit Requests</CardTitle>
              <CardDescription>
                Submit a deposit request for manager approval and track its
                status from one place.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryChip label="Pending" value={requestSummary.pending} />
            <SummaryChip label="Approved" value={requestSummary.approved} />
            <SummaryChip label="Rejected" value={requestSummary.rejected} />
          </div>

          {mess.minimumDeposit > 0 && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
              Minimum request amount for this mess is ৳
              {mess.minimumDeposit.toLocaleString()}.
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="request-amount">Amount</Label>
              <Input
                id="request-amount"
                type="number"
                min="0"
                value={requestForm.amount}
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={requestForm.method}
                onValueChange={(value) =>
                  setRequestForm((current) => ({
                    ...current,
                    method: value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a method" />
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

          <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="request-date">Request Date</Label>
              <Input
                id="request-date"
                type="date"
                value={requestForm.date}
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-note">Note</Label>
              <Textarea
                id="request-note"
                value={requestForm.note}
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                placeholder="Optional context for the manager"
                className="min-h-24 resize-none"
              />
            </div>
          </div>

          <Button onClick={submitRequest} disabled={isPending} className="gap-2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Request Deposit
          </Button>

          <div className="rounded-2xl border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depositRequests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No deposit requests yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  depositRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{formatDate(request.date)}</TableCell>
                      <TableCell>৳{request.amount.toLocaleString()}</TableCell>
                      <TableCell>{formatMethod(request.method)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-muted-foreground">
                        {request.note || request.approvalNote || "No note"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>My Deposits</CardTitle>
              <CardDescription>
                View the deposits already added to your mess account.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryChip label="Approved Deposits" value={deposits.length} />
            <SummaryChip
              label="Total Amount"
              value={`৳${deposits
                .reduce((sum, deposit) => sum + deposit.amount, 0)
                .toLocaleString()}`}
            />
            <SummaryChip
              label="Latest Method"
              value={
                deposits[0] ? formatMethod(deposits[0].method) : "No deposits"
              }
            />
          </div>

          <div className="rounded-2xl border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No deposits have been recorded for you yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  deposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>{formatDate(deposit.date)}</TableCell>
                      <TableCell>৳{deposit.amount.toLocaleString()}</TableCell>
                      <TableCell>{formatMethod(deposit.method)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(deposit.status)}>
                          {deposit.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-muted-foreground">
                        {deposit.note || "No note"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">
            Approved deposits affect your balance immediately. Pending and
            rejected requests remain listed above until the manager reviews
            them.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryChip({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMethod(value: string) {
  if (value === "bkash") return "bKash";
  if (value === "nagad") return "Nagad";
  if (value === "bank") return "Bank Transfer";
  return "Cash";
}

function getStatusBadgeClass(status: "approved" | "pending" | "rejected") {
  if (status === "approved") {
    return "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20";
  }

  if (status === "rejected") {
    return "bg-destructive/10 text-destructive hover:bg-destructive/20";
  }

  return "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20";
}
