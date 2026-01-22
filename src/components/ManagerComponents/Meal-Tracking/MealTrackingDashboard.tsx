/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { AnimatePresence, motion, cubicBezier } from "framer-motion";
import DailyMealAttendance from "./TodaysMealTracking";
import MonthlyMessReport from "./MonthlyMealTracingDashboard";
import { CalendarCog, CalendarDaysIcon, Timer } from "lucide-react";
import DateRangeReport from "./CustomMealTracker";

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

export default function TabsViewClassic({
  todayData,
  monthlyData,
}: {
  todayData?: any;
  monthlyData?: any;
}) {
  const [selectedView, setSelectedView] = useState<
    "daily" | "monthly" | "custom"
  >("daily");
  console.log("todaysData", todayData, "monthlyData", monthlyData);
  return (
    <div>
      <div className="relative flex items-center gap-1 bg-muted rounded-xl p-1">
        {views.map(({ key, label, icon: Icon }) => {
          const isActive = selectedView === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedView(key)}
              className="relative flex-1 px-4 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 z-10"
            >
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="activeViewTab"
                  className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}

              <span
                className={`relative flex items-center gap-2 transition-colors ${
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Animated Content */}
      <div className="relative ">
        <AnimatePresence mode="wait">
          {selectedView === "daily" && (
            <motion.div
              key="daily"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <DailyMealAttendance attendanceData={todayData} />
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
              <MonthlyMessReport reportData={monthlyData} />
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
      </div>
    </div>
  );
}
