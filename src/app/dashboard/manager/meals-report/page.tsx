import { getMonthlyMeals, getTodayMeals } from "@/actions/server/Meals";
import TabsViewClassic from "@/components/ManagerComponents/Meal-Tracking/MealTrackingDashboard";

export default async function page() {
  const res = await getTodayMeals();
  const monthlyData = await getMonthlyMeals({ month: 1, year: 2026 });
  return (
    <div>
      <TabsViewClassic todayData={res} monthlyData={monthlyData} />
    </div>
  );
}
