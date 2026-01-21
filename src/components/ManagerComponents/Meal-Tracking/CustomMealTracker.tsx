"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import MealDateRangePicker from "./CustomMealTrackPage/MealDateRangePicker";
import DateRangeReport from "./CustomMealTrackPage/DateRangeReport";

export default function DateRangeReportPage() {
  const [reportData, setReportData] = useState<any>(null);

  return (
    <div className="bg-background p-4 md:p-6 lg:p-8 max-w-7xl   mx-auto gap-5">
      {/* Date Picker */}
      <MealDateRangePicker onData={setReportData} />

      {/* Report */}
      <div className=" mt-2 md:mt-4 lg:mt-8">
        {reportData?.success && <DateRangeReport reportData={reportData} />}
      </div>

      {/* Empty State */}
      {!reportData && (
        <div className="text-center py-16 text-muted-foreground">
          Select a date range to generate report
        </div>
      )}
    </div>
  );
}
