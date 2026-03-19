"use client";
import { useMemo, useState, useTransition } from "react";
import { cubicBezier } from "framer-motion";
import { CalendarCog, CalendarDaysIcon, Timer } from "lucide-react";
import {
  GetMealReportBundleResponse,
  MealReportPeriodPreset,
  GetTodayMealsResponse,
  GetMonthlyMealsResponse,
} from "@/types/MealManagementTypes";
import { getMealReportBundle } from "@/actions/server/MealReports";
import MealReportsOverview from "./MealReportsOverview";

const views = [
  { key: "daily", label: "Daily", icon: Timer },
  { key: "monthly", label: "Monthly", icon: CalendarDaysIcon },
  { key: "custom", label: "Custom", icon: CalendarCog },
] as const;
const contentVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: cubicBezier(0.25, 0.46, 0.45, 0.94),
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.25,
      ease: cubicBezier(0.17, 0.67, 0.83, 0.67),
    },
  },
};

interface TabsViewClassicProps {
  todayData?: GetTodayMealsResponse | { success: false; message: string };
  monthlyData?: GetMonthlyMealsResponse | { success: false; message: string };
  initialReport: GetMealReportBundleResponse;
}

export default function TabsViewClassic({
  todayData,
  monthlyData,
  initialReport,
}: TabsViewClassicProps) {
  const [selectedView, setSelectedView] = useState<
    "daily" | "monthly" | "custom"
  >("daily");
  const [selectedPeriod, setSelectedPeriod] =
    useState<MealReportPeriodPreset>("thisMonth");
  const [reportState, setReportState] =
    useState<GetMealReportBundleResponse>(initialReport);
  const [isPending, startTransition] = useTransition();

  const costPerMeal = useMemo(() => {
    if (!reportState.success) {
      return 0;
    }
    return reportState.report.overview.costPerMeal;
  }, [reportState]);

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

      {/* Animated Content */}
      {/* <div className="relative ">
        <AnimatePresence mode="wait">
          {selectedView === "daily" && (
            <motion.div
              key="daily"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <TodaysMessReport2
                attendanceData={todayData}
                costPerMeal={costPerMeal}
              />
            </motion.div>
          )}

          {selectedView === "monthly" && (
            <motion.div
              key="monthly"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <MonthlyMessReport
                reportData={monthlyData}
                costPerMeal={costPerMeal}
              />
            </motion.div>
          )}

          {selectedView === "custom" && (
            <motion.div
              key="custom"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <DateRangeReport />
            </motion.div>
          )}
        </AnimatePresence>
      </div> */}
    </div>
  );
}
