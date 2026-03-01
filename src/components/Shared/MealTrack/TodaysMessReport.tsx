"use client";
import { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  Coffee,
  Sun,
  Moon,
  Utensils,
  TrendingUp,
  Download,
  Award,
  ChevronRight,
  DollarSign,
  PieChart,
  BarChart2,
} from "lucide-react";
import {
  DailyMealAttendanceProps,
  MealSummary,
  GetTodayMealsResponseSuccess,
} from "@/types/MealManagementTypes";
import { getMonthlyExpensesSummary } from "@/actions/server/Expense";
import StatCard from "./StatCard";
import MealCard from "./MealCard";
import CostRow from "./CostRow";
import MiniStat from "./MiniStat";
import MemberRow from "./MemberRow";
import ToggleButton from "./ToggleButton";

export default function TodaysMessReport2({
  attendanceData,
  costPerMeal = 50,
}: DailyMealAttendanceProps & { costPerMeal?: number }) {
  const [selectedView, setSelectedView] = useState<"overview" | "members">(
    "overview",
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getMonthlyExpensesSummary();
        console.log("Monthly Summary:", res);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Return empty state if no data
  if (
    !attendanceData?.success ||
    !attendanceData?.data ||
    !Array.isArray(attendanceData.data)
  ) {
    return (
      <div className="min-h-screen bg-background  flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <Utensils className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">
            No meal data available for today.
          </p>
        </div>
      </div>
    );
  }

  const typedData = attendanceData as GetTodayMealsResponseSuccess;
  const { messName, date, data } = typedData;

  // Calculate Summary
  const summary: MealSummary = {
    breakfast: data.reduce((sum, m) => sum + (m.breakfast || 0), 0),
    lunch: data.reduce((sum, m) => sum + (m.lunch || 0), 0),
    dinner: data.reduce((sum, m) => sum + (m.dinner || 0), 0),
    totalMeals: data.reduce((sum, m) => sum + (m.totalMeals || 0), 0),
    entries: data.length,
  };

  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalCost = summary.totalMeals * costPerMeal;

  // Sorting logic for Rankings
  const sortedMembers = [...data].sort((a, b) => b.totalMeals - a.totalMeals);
  const topMember = sortedMembers[0] || null;

  // Percentages for the Progress Bars
  const getPct = (val: number) =>
    summary.totalMeals > 0 ? (val / summary.totalMeals) * 100 : 0;
  const breakfastPct = getPct(summary.breakfast);
  const lunchPct = getPct(summary.lunch);
  const dinnerPct = getPct(summary.dinner);

  return (
    <div className="min-h-screen bg-background my-5">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* --- HEADER SECTION --- */}
        <header className="relative overflow-hidden bg-linear-to-br from-primary via-primary/90 to-primary/80 rounded-3xl p-6 md:p-8 shadow-2xl text-primary-foreground">
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Today&apos;s Report
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {formattedDate}
                </h1>
                <p className="opacity-90">{messName}</p>
              </div>
              <button className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 border border-white/20">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Utensils />}
                label="Total Meals"
                value={summary.totalMeals}
              />
              <StatCard icon={<Users />} label="Members" value={data.length} />
              <StatCard
                icon={<DollarSign />}
                label="Total Cost"
                value={`$${totalCost.toLocaleString()}`}
              />
              <StatCard
                icon={<TrendingUp />}
                label="Avg/Member"
                value={(summary.totalMeals / (data.length || 1)).toFixed(1)}
              />
            </div>
          </div>
        </header>

        {/* --- VIEW TOGGLE --- */}
        <nav className="flex items-center gap-2 bg-muted rounded-xl p-1">
          <ToggleButton
            active={selectedView === "overview"}
            onClick={() => setSelectedView("overview")}
            icon={<PieChart className="w-4 h-4" />}
            label="Overview"
          />
          <ToggleButton
            active={selectedView === "members"}
            onClick={() => setSelectedView("members")}
            icon={<Users className="w-4 h-4" />}
            label="Members"
          />
        </nav>

        {selectedView === "overview" ? (
          <div className="space-y-6">
            {/* Meal Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MealCard
                icon={<Coffee />}
                color="orange"
                label="Breakfast"
                count={summary.breakfast}
                pct={breakfastPct}
              />
              <MealCard
                icon={<Sun />}
                color="yellow"
                label="Lunch"
                count={summary.lunch}
                pct={lunchPct}
              />
              <MealCard
                icon={<Moon />}
                color="blue"
                label="Dinner"
                count={summary.dinner}
                pct={dinnerPct}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Summary */}
              <section className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <DollarSign className="text-primary" />
                  <h3 className="font-semibold">Financial Summary</h3>
                </div>
                <div className="space-y-4">
                  <CostRow
                    label="Breakfast"
                    amount={summary.breakfast * costPerMeal}
                    icon={<Coffee className="text-orange-500" />}
                  />
                  <CostRow
                    label="Lunch"
                    amount={summary.lunch * costPerMeal}
                    icon={<Sun className="text-yellow-500" />}
                  />
                  <CostRow
                    label="Dinner"
                    amount={summary.dinner * costPerMeal}
                    icon={<Moon className="text-blue-500" />}
                  />
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl">
                      <span className="font-bold">Total Daily Cost</span>
                      <span className="text-2xl font-extrabold text-primary">
                        ${totalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* EXACT TOP CONTRIBUTOR SECTION */}
              <section className="bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Top Contributor
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Highest meal count
                    </p>
                  </div>
                </div>

                {topMember && (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary/30">
                        <span className="text-2xl font-bold text-primary">
                          {topMember.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{topMember.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {topMember.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <MiniStat
                        icon={<Coffee />}
                        count={topMember.breakfast}
                        label="Breakfast"
                        color="orange"
                      />
                      <MiniStat
                        icon={<Sun />}
                        count={topMember.lunch}
                        label="Lunch"
                        color="yellow"
                      />
                      <MiniStat
                        icon={<Moon />}
                        count={topMember.dinner}
                        label="Dinner"
                        color="blue"
                      />
                    </div>

                    <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total Meals
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {topMember.totalMeals}
                        </span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-muted-foreground">
                          Estimated Cost
                        </span>
                        <span className="text-lg font-bold">
                          $
                          {(
                            topMember.totalMeals * costPerMeal
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>
        ) : (
          /* MEMBERS RANKING VIEW */
          <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b bg-muted/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BarChart2 className="text-primary w-5 h-5" />
                <h3 className="font-semibold">Member Rankings</h3>
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                {data.length} Members
              </span>
            </div>
            <div className="divide-y divide-border">
              {sortedMembers.map((member, index) => (
                <MemberRow
                  key={member._id}
                  member={member}
                  rank={index}
                  costPerMeal={costPerMeal}
                />
              ))}
            </div>
          </section>
        )}

        {/* Footer Action */}
        <footer className="bg-linear-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-bold text-lg">Need detailed analytics?</h3>
            <p className="text-sm opacity-80">
              Export this report or view historical trends
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-primary rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2">
            View Reports <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </div>
    </div>
  );
}
