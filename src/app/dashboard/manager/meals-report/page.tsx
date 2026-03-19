import { getMealReportBundle } from "@/actions/server/MealReports";
import { getMonthlyMeals, getTodayMeals } from "@/actions/server/Meals";
import TabsViewClassic from "@/components/ManagerComponents/Meal-Tracking/MealTrackingDashboard";

export default async function page() {
  const res = await getTodayMeals();
  const now = new Date();
  const monthlyData = await getMonthlyMeals({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const initialReport = await getMealReportBundle({ period: "thisMonth" });

  return (
    <div>
      <TabsViewClassic
        todayData={res}
        monthlyData={monthlyData}
        initialReport={initialReport}
      />
    </div>
  );
}
