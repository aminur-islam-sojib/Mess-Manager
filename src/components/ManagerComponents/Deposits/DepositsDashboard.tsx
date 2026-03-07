"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  approveDepositRequest,
  rejectDepositRequest,
} from "@/actions/server/Deposit";
import AddDeposit from "@/components/ManagerComponents/Deposits/AddDeposits";
import { getColumns } from "@/components/ManagerComponents/Deposits/Columns";
import { DataTable } from "@/components/ManagerComponents/Deposits/data-table";
import ConfirmModal from "@/components/ui/confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  DepositPageRole,
  DepositRequestSerialized,
  UserLedger,
} from "@/types/Deposit";
import type { MessDataResponse } from "@/types/MealManagement";
import { Loader2 } from "lucide-react";

type DepositsDashboardProps = {
  role: DepositPageRole;
  messData: MessDataResponse;
  ledgerData: UserLedger[];
  currentUserId: string;
  depositRequests: DepositRequestSerialized[];
};

export default function DepositsDashboard({
  role,
  messData,
  ledgerData,
  currentUserId,
  depositRequests,
}: DepositsDashboardProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<UserLedger | null>(null);
  const [openRequestsModal, setOpenRequestsModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approveConfirmRequest, setApproveConfirmRequest] =
    useState<DepositRequestSerialized | null>(null);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<UserLedger>;
      setSelectedUser(customEvent.detail);
      setOpenRequestsModal(true);
    };

    window.addEventListener("open-deposit-requests-dialog", handleOpen);
    return () => {
      window.removeEventListener("open-deposit-requests-dialog", handleOpen);
    };
  }, []);

  const columns = useMemo(() => getColumns(role), [role]);
  const visibleRequests = useMemo(() => {
    if (role === "manager") {
      return [...depositRequests]
        .filter((request) => request.status === "pending")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }

    return [...depositRequests].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [depositRequests, role]);

  const selectedRequests = useMemo(
    () =>
      selectedUser
        ? depositRequests.filter((request) =>
            role === "manager"
              ? request.userId === selectedUser.userId &&
                request.status === "pending"
              : request.userId === selectedUser.userId,
          )
        : [],
    [depositRequests, role, selectedUser],
  );

  const getStatusBadgeClass = (status: DepositRequestSerialized["status"]) => {
    if (status === "approved") {
      return "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20";
    }

    if (status === "rejected") {
      return "bg-destructive/10 text-destructive hover:bg-destructive/20";
    }

    return "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20";
  };

  const handleReview = async (
    requestId: string,
    decision: "approved" | "rejected",
  ) => {
    if (role !== "manager") {
      toast.error("You are not authorized to perform this action");
      return;
    }

    setProcessingId(requestId);
    try {
      const response =
        decision === "approved"
          ? await approveDepositRequest(requestId)
          : await rejectDepositRequest(requestId);

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success(response.message);
      router.refresh();
      if (selectedRequests.length <= 1) {
        setOpenRequestsModal(false);
      }
    } catch {
      toast.error("Failed to update deposit request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveConfirm = async () => {
    if (!approveConfirmRequest) return;

    await handleReview(approveConfirmRequest.id, "approved");
    setApproveConfirmRequest(null);
  };

  return (
    <main className="container mx-auto">
      <div className="flex justify-between">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
          Financial Overview
        </h1>
        <AddDeposit
          messData={messData}
          role={role}
          currentUserId={currentUserId}
        />
      </div>
      <DataTable columns={columns} data={ledgerData} />

      <Card className="mt-6 border-border bg-card text-card-foreground shadow-sm">
        <CardHeader>
          <CardTitle>Deposit Requests</CardTitle>
          <CardDescription>
            {role === "manager"
              ? "Review deposit requests submitted by mess members."
              : "Track the status of your deposit requests."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRequests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No deposit requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRequests.map((request) => (
                    <TableRow key={request.id} className="border-border hover:bg-muted/30">
                      <TableCell>
                        <div className="font-medium">
                          {request.userName || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {request.userEmail || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>{request.amount}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {request.note || "No note provided"}
                      </TableCell>
                      <TableCell>{request.date}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {role === "manager" && request.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => handleReview(request.id, "rejected")}
                              disabled={processingId === request.id}
                            >
                              {processingId === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Reject"
                              )}
                            </Button>
                            <Button
                              onClick={() => setApproveConfirmRequest(request)}
                              disabled={processingId === request.id}
                            >
                              {processingId === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Approve"
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {request.approvedAt
                              ? new Date(request.approvedAt).toLocaleString()
                              : "No action available"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openRequestsModal} onOpenChange={setOpenRequestsModal}>
        <DialogContent className="sm:max-w-112.5 p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-0 bg-muted/30">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Deposit Requests
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Review pending deposit requests for {selectedUser?.name || "member"}.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <div className="p-6 space-y-4">
              {selectedRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No deposit requests found.
                </p>
              ) : (
                selectedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-lg border border-border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {request.userName || selectedUser?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.date} • {request.method}
                        </p>
                      </div>
                      <Badge className={getStatusBadgeClass(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      Amount: <span className="font-semibold">{request.amount}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {request.note || "No note provided"}
                    </div>
                    {request.approvedAt && (
                      <div className="text-xs text-muted-foreground">
                        Processed at {new Date(request.approvedAt).toLocaleString()}
                      </div>
                    )}
                    {role === "manager" && request.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleReview(request.id, "rejected")}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Reject"
                          )}
                        </Button>
                        <Button
                          onClick={() => setApproveConfirmRequest(request)}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Approve"
                          )}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <Separator />

          <DialogFooter className="px-6 py-4 bg-muted/30 gap-2">
            <Button
              variant="secondary"
              onClick={() => setOpenRequestsModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={Boolean(approveConfirmRequest)}
        onClose={() => setApproveConfirmRequest(null)}
        onConfirm={handleApproveConfirm}
        title="Approve this deposit request?"
        description={
          approveConfirmRequest
            ? `This will add ${approveConfirmRequest.userName || "the member"}'s deposit to the deposits list and remove it from pending requests.`
            : ""
        }
        confirmText="Approve Deposit"
        cancelText="Cancel"
        variant="warning"
        isLoading={Boolean(
          approveConfirmRequest &&
            processingId === approveConfirmRequest.id,
        )}
      />
    </main>
  );
}
