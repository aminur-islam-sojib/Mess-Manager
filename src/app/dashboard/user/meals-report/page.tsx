import { getCurrentMonthCostPerMeal } from "@/actions/server/Expense";
import { getMonthlyMeals, getTodayMeals } from "@/actions/server/Meals";
import TabsViewClassic from "@/components/ManagerComponents/Meal-Tracking/MealTrackingDashboard";

export default async function page() {
  const res = await getTodayMeals();
  const now = new Date();
  const monthlyData = await getMonthlyMeals({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const currentMonthMealCostDetails = await getCurrentMonthCostPerMeal();
  return (
    <div className="p-2">
      <TabsViewClassic
        todayData={res}
        monthlyData={monthlyData}
        currentMonthMealCostDetails={currentMonthMealCostDetails}
      />
    </div>
  );
}
