"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  Copy,
  Edit,
  Trash,
  Eye,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DepositPageRole, UserLedger } from "@/types/Deposit";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const getColumns = (role: DepositPageRole): ColumnDef<UserLedger>[] => [
  {
    accessorKey: "name",
    header: "User",
    cell: ({ row }) => (
      <div className="font-medium capitalize">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "totalDeposit",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total Deposit
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const deposit = Number(row.getValue("totalDeposit"));
      return (
        <div className="pl-4">
          {deposit > 0 ? (
            <Badge
              variant="default"
              className="bg-primary text-primary-foreground"
            >
              {currencyFormatter.format(deposit)}
            </Badge>
          ) : (
            <span className="text-muted-foreground">
              {currencyFormatter.format(deposit)}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      const pendingCount = user.pendingRequestCount ?? 0;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(user.userId);
                toast.success("User ID copied to clipboard");
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy User ID
            </DropdownMenuItem>
            {role === "manager" ? (
              <DropdownMenuItem
                onSelect={() =>
                  window.dispatchEvent(
                    new CustomEvent("open-deposit-requests-dialog", {
                      detail: user,
                    }),
                  )
                }
                disabled={pendingCount === 0}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Review Requests
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() =>
                  window.dispatchEvent(
                    new CustomEvent("open-deposit-requests-dialog", {
                      detail: user,
                    }),
                  )
                }
              >
                <CheckCircle className="mr-2 h-4 w-4" /> View Requests
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() =>
                window.dispatchEvent(
                  new CustomEvent("open-edit-dialog", { detail: user }),
                )
              }
            >
              <Edit className="mr-2 h-4 w-4" /> Edit User
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/profile/${user.userId}`}>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" /> View Ledger
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
