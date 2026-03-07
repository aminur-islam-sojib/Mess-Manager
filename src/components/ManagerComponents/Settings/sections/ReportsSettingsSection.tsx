"use client";

import { useState, useTransition } from "react";
import type { ComponentType } from "react";
import {
  CreditCard,
  Download,
  FileText,
  Loader2,
  Receipt,
  Soup,
} from "lucide-react";
import { toast } from "sonner";
import { exportMessReport } from "@/actions/server/ManagerSettings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ReportType = "deposits" | "expenses" | "meals";

type ReportCard = {
  type: ReportType;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
};

const PDF_FORMAT = "pdf" as const;

const REPORT_TYPES: ReportCard[] = [
  {
    type: "deposits",
    label: "Deposits",
    description: "Member details, amount, method, and recorder information.",
    icon: CreditCard,
    iconClassName: "bg-primary/10 text-primary",
  },
  {
    type: "expenses",
    label: "Expenses",
    description: "Payer, source, status, and report details in PDF.",
    icon: Receipt,
    iconClassName: "bg-amber-500/10 text-amber-600",
  },
  {
    type: "meals",
    label: "Meals",
    description: "Meal totals, member identity, and updated time.",
    icon: Soup,
    iconClassName: "bg-emerald-500/10 text-emerald-600",
  },
];

export default function ReportsSettingsSection({
  messName,
}: {
  messName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [activeDownload, setActiveDownload] = useState<ReportType | null>(null);

  const downloadReport = (type: ReportType) => {
    setActiveDownload(type);

    startTransition(async () => {
      try {
        const result = await exportMessReport({ type, format: PDF_FORMAT });
        if (!result.success) {
          toast.error(result.message);
          return;
        }

        const blobContent =
          result.contentEncoding === "base64"
            ? Uint8Array.from(atob(result.content), (character) =>
                character.charCodeAt(0),
              )
            : result.content;
        const blob = new Blob([blobContent], { type: result.mimeType });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${messName}-${result.filename}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
        toast.success(result.message);
      } finally {
        setActiveDownload(null);
      }
    });
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>PDF Reports</CardTitle>
            <CardDescription>
              Download deposits, expenses, and meals as polished PDF reports.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-background/70 p-4">
          <div>
            <p className="font-medium text-foreground">Export format</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Designed for review, sharing, and printing.
            </p>
          </div>
          <div className="rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium">
            PDF
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {REPORT_TYPES.map((report) => {
            const Icon = report.icon;
            const isDownloading = isPending && activeDownload === report.type;

            return (
              <div
                key={report.type}
                className="rounded-2xl border border-border bg-background/70 p-5"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-2xl p-3", report.iconClassName)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {report.label}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF report</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {report.description}
                </p>

                <Button
                  onClick={() => downloadReport(report.type)}
                  disabled={isPending}
                  className="mt-5 w-full gap-2"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isDownloading ? "Preparing PDF" : "Download PDF"}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
