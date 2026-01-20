import { getTodayMeals } from "@/actions/server/Meals";
import TabsViewClassic from "@/components/ManagerComponents/Meal-Tracking/MealTrackingDashboard";

export default async function page() {
  const res = await getTodayMeals();

  return (
    <div className="p-2">
      <TabsViewClassic todayData={res} />
    </div>
  );
}
