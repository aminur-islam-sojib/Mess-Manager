"use client";

import { useState, useTransition } from "react";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReportFormat = "csv" | "json";
type ReportType = "deposits" | "expenses" | "meals";

const REPORT_TYPES: Array<{
  type: ReportType;
  label: string;
  description: string;
}> = [
  {
    type: "deposits",
    label: "Deposit data",
    description: "Export recorded deposits for the current mess.",
  },
  {
    type: "expenses",
    label: "Expense data",
    description: "Export approved and pending mess expenses.",
  },
  {
    type: "meals",
    label: "Meal data",
    description: "Export meal entries and meal breakdown records.",
  },
];

export default function ReportsSettingsSection({
  messName,
}: {
  messName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [format, setFormat] = useState<ReportFormat>("csv");

  const downloadReport = (type: ReportType) => {
    startTransition(async () => {
      const result = await exportMessReport({ type, format });
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      const blob = new Blob([result.content], { type: result.mimeType });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${messName}-${result.filename}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success(result.message);
    });
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>
              Download current mess records in CSV or JSON format.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="max-w-xs space-y-2">
          <p className="text-sm font-medium text-foreground">Export format</p>
          <Select
            value={format}
            onValueChange={(value) => setFormat(value as ReportFormat)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {REPORT_TYPES.map((report) => (
            <div
              key={report.type}
              className="rounded-2xl border border-border bg-background/70 p-5"
            >
              <div className="flex items-center gap-2">
                {format === "csv" ? (
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                ) : (
                  <FileJson className="h-5 w-5 text-sky-600" />
                )}
                <p className="font-medium text-foreground">{report.label}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {report.description}
              </p>
              <Button
                onClick={() => downloadReport(report.type)}
                disabled={isPending}
                className="mt-4 w-full gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export {format.toUpperCase()}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
