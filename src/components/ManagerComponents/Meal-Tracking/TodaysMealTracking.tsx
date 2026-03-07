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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DailyMealAttendanceProps,
  MealSummary,
  MealMember,
  GetTodayMealsResponseSuccess,
} from "@/types/MealManagementTypes";
import { getMonthlyExpensesSummary } from "@/actions/server/Expense";
import { downloadMealReportPdf } from "@/lib/meal-report-pdf";

// ====== PROPER TYPE DEFINITIONS FOR COMPONENTS ======

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

interface MealCardProps {
  icon: React.ReactNode;
  color: "orange" | "yellow" | "blue";
  label: string;
  count: number;
  pct: number;
}

interface CostRowProps {
  label: string;
  amount: number;
  icon: React.ReactNode;
}

interface MiniStatProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  color: "orange" | "yellow" | "blue";
}

interface MemberRowProps {
  member: MealMember;
  rank: number;
  costPerMeal: number;
}

interface MemberMealStatProps {
  icon: React.ReactNode;
  val: number;
  label: string;
  color: "orange" | "yellow" | "blue";
}

export default function TodaysMessReport({
  attendanceData,
  costPerMeal = 50,
}: DailyMealAttendanceProps & { costPerMeal?: number }) {
  const [selectedView, setSelectedView] = useState<"overview" | "members">(
    "overview",
  );
  const [isExporting, setIsExporting] = useState(false);

  // Fix: Added dependency array [] to prevent infinite re-renders
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
      <div className="min-h-screen bg-background lg:p-8 flex items-center justify-center">
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
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  // Sorting logic for Rankings
  const sortedMembers = [...data].sort((a, b) => b.totalMeals - a.totalMeals);
  const topMember = sortedMembers[0] || null;

  // Percentages for the Progress Bars
  const getPct = (val: number) =>
    summary.totalMeals > 0 ? (val / summary.totalMeals) * 100 : 0;
  const breakfastPct = getPct(summary.breakfast);
  const lunchPct = getPct(summary.lunch);
  const dinnerPct = getPct(summary.dinner);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      await downloadMealReportPdf({
        title: "Today's Meal Report",
        periodLabel: formattedDate,
        messName,
        summary: [
          { label: "Total Meals", value: String(summary.totalMeals) },
          { label: "Members", value: String(data.length) },
          { label: "Cost per Meal", value: formatCurrency(costPerMeal) },
          { label: "Total Cost", value: formatCurrency(totalCost) },
        ],
        members: sortedMembers,
        filename: `${messName}-${date}-today-meal-report.pdf`,
        costPerMeal,
      });

      toast.success("Today's meal report downloaded");
    } catch (error) {
      console.error("Failed to export today's meal report", error);
      toast.error("Failed to export today's meal report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background lg:p-8">
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
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 border border-white/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {isExporting ? "Exporting..." : "Export PDF"}
                </span>
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

/** * HELPER SUB-COMPONENTS
 * (In a real app, move these to separate files or keep at bottom)
 */

const StatCard = ({ icon, label, value }: StatCardProps) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
    <div className="text-primary-foreground/80 mb-2">{icon}</div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs opacity-80 uppercase tracking-wider font-medium">
      {label}
    </p>
  </div>
);

const ToggleButton = ({ active, onClick, icon, label }: ToggleButtonProps) => (
  <button
    onClick={onClick}
    className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
  >
    {icon} {label}
  </button>
);

const MealCard = ({ icon, color, label, count, pct }: MealCardProps) => (
  <div className="bg-card border border-border rounded-2xl p-6">
    <div className="flex justify-between items-start mb-4">
      <div
        className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-500`}
      >
        {icon}
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold">{count}</p>
        <p className="text-xs text-muted-foreground">meals</p>
      </div>
    </div>
    <p className="text-sm font-medium mb-3">{label}</p>
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div
        className={`h-full bg-${color}-500 transition-all duration-500`}
        style={{ width: `${pct}% `, backgroundColor: "red" }}
      />
    </div>
    <p className="text-[10px] mt-2 text-right font-bold text-muted-foreground">
      {pct.toFixed(1)}% of total
    </p>
  </div>
);

const CostRow = ({ label, amount, icon }: CostRowProps) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm font-medium">{label} Cost</span>
    </div>
    <span className="font-bold">${amount.toLocaleString()}</span>
  </div>
);

const MiniStat = ({ icon, count, label, color }: MiniStatProps) => (
  <div
    className={`text-center p-3 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}
  >
    <div className={`text-${color}-500 flex justify-center mb-1`}>{icon}</div>
    <p className="text-lg font-bold">{count}</p>
    <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
  </div>
);

const MemberRow = ({ member, rank, costPerMeal }: MemberRowProps) => (
  <div className="p-5 hover:bg-accent/50 transition-colors group">
    <div className="flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${rank === 0 ? "bg-yellow-500/20 text-yellow-600 border-2 border-yellow-500/30" : rank === 1 ? "bg-gray-400/20 text-gray-600 border-2 border-gray-400/30" : rank === 2 ? "bg-orange-600/20 text-orange-700 border-2 border-orange-600/30" : "bg-muted text-muted-foreground"}`}
      >
        {rank === 0
          ? "🥇"
          : rank === 1
            ? "🥈"
            : rank === 2
              ? "🥉"
              : `#${rank + 1}`}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold">{member.name}</p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-primary">
              {member.totalMeals}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground font-bold">
              Total Meals
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MemberMealStat
            icon={<Coffee />}
            val={member.breakfast}
            label="B"
            color="orange"
          />
          <MemberMealStat
            icon={<Sun />}
            val={member.lunch}
            label="L"
            color="yellow"
          />
          <MemberMealStat
            icon={<Moon />}
            val={member.dinner}
            label="D"
            color="blue"
          />
        </div>
        <div className="mt-3 flex justify-between p-2 rounded-lg bg-muted/30 text-sm">
          <span className="text-muted-foreground">Daily Bill</span>
          <span className="font-bold">
            ${(member.totalMeals * costPerMeal).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  </div>
);

const MemberMealStat = ({ icon, val, color }: MemberMealStatProps) => (
  <div
    className={`bg-${color}-500/5 border border-${color}-500/10 rounded-lg p-2 text-center`}
  >
    <div className={`text-${color}-500 flex justify-center scale-75`}>
      {icon}
    </div>
    <p className="text-xs font-bold">{val}</p>
  </div>
);
