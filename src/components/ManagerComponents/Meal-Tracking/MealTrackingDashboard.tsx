"use client";
import { useState, useTransition } from "react";

import {
  GetMealReportBundleResponse,
  MealReportPeriodPreset,
  GetTodayMealsResponse,
  GetMonthlyMealsResponse,
} from "@/types/MealManagementTypes";
import { getMealReportBundle } from "@/actions/server/MealReports";
import MealReportsOverview from "./MealReportsOverview";

interface TabsViewClassicProps {
  todayData?: GetTodayMealsResponse | { success: false; message: string };
  monthlyData?: GetMonthlyMealsResponse | { success: false; message: string };
  initialReport: GetMealReportBundleResponse;
}

export default function TabsViewClassic({
  initialReport,
}: TabsViewClassicProps) {
  const [selectedPeriod, setSelectedPeriod] =
    useState<MealReportPeriodPreset>("thisMonth");
  const [reportState, setReportState] =
    useState<GetMealReportBundleResponse>(initialReport);
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (period: MealReportPeriodPreset) => {
    setSelectedPeriod(period);

    startTransition(async () => {
      const next = await getMealReportBundle({ period });
      setReportState(next);
    });
  };

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card/50 p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: "today", label: "Today" },
              { key: "thisWeek", label: "This Week" },
              { key: "thisMonth", label: "This Month" },
              { key: "last30Days", label: "Last 30 Days" },
            ] as Array<{ key: MealReportPeriodPreset; label: string }>
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handlePeriodChange(item.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selectedPeriod === item.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <MealReportsOverview
        report={reportState.success ? reportState.report : undefined}
        isLoading={isPending}
      />
    </div>
  );
}
