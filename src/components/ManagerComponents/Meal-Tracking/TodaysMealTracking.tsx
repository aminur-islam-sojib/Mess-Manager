import { useState } from "react";
import {
  Calendar,
  Users,
  Coffee,
  Sun,
  Moon,
  Utensils,
  TrendingUp,
  Download,
  Search,
  ChevronDown,
  BarChart2,
  User,
  PieChart,
} from "lucide-react";
import {
  DailyMealAttendanceProps,
  MealSummary,
  MealMember,
  GetTodayMealsResponseSuccess,
} from "@/types/MealManagementTypes";

export default function DailyMealAttendance({
  attendanceData,
}: DailyMealAttendanceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "meals">("meals");
  const [selectedView, setSelectedView] = useState<"overview" | "members">(
    "overview",
  );

  // Return empty state if no data
  if (
    !attendanceData?.success ||
    !attendanceData?.data ||
    !Array.isArray(attendanceData.data)
  ) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto text-center py-16">
          <p className="text-muted-foreground">No meal data available</p>
        </div>
      </div>
    );
  }

  const typedData = attendanceData as GetTodayMealsResponseSuccess;
  const { date, messName, data } = typedData;

  // Calculate summary from data
  const summary: MealSummary = {
    breakfast: data.reduce((sum, m) => sum + (m.breakfast || 0), 0),
    lunch: data.reduce((sum, m) => sum + (m.lunch || 0), 0),
    dinner: data.reduce((sum, m) => sum + (m.dinner || 0), 0),
    totalMeals: data.reduce((sum, m) => sum + (m.totalMeals || 0), 0),
    entries: data.length,
  };

  const dateObj = new Date(date);
  const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Filter and sort data
  const filteredData: MealMember[] = data
    .filter(
      (member) =>
        member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member._id?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "meals") return b.totalMeals - a.totalMeals;
      return a.name.localeCompare(b.name);
    });

  // Calculate percentages
  const breakfastPct =
    summary.entries > 0 ? (summary.breakfast / summary.entries) * 100 : 0;
  const lunchPct =
    summary.entries > 0 ? (summary.lunch / summary.entries) * 100 : 0;
  const dinnerPct =
    summary.entries > 0 ? (summary.dinner / summary.entries) * 100 : 0;

  // Calculate attendance rate
  const attendanceRate =
    summary.entries > 0
      ? ((summary.totalMeals / (summary.entries * 3)) * 100).toFixed(0)
      : 0;

  const avgPerMember =
    summary.entries > 0 ? (summary.totalMeals / summary.entries).toFixed(1) : 0;

  // Find top attendee
  const topMember: MealMember | null =
    data.length > 0
      ? [...data].sort((a, b) => b.totalMeals - a.totalMeals)[0]
      : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-linear-to-br from-primary via-primary/90 to-primary/80 rounded-3xl p-6 md:p-8 shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-primary-foreground/80" />
                  <span className="text-sm font-medium text-primary-foreground/80">
                    Daily Attendance
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                  {dayOfWeek}
                </h1>
                <p className="text-primary-foreground/90 text-lg">{monthDay}</p>
                <p className="text-primary-foreground/80 text-sm mt-1">
                  {messName}
                </p>
              </div>

              <button className="px-4 py-2 bg-white/20 backdrop-blur-sm text-primary-foreground rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 border border-white/20">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <Utensils className="w-5 h-5 text-primary-foreground/80 mb-2" />
                <p className="text-2xl font-bold text-primary-foreground">
                  {summary.totalMeals}
                </p>
                <p className="text-xs text-primary-foreground/80">
                  Total Meals
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <Users className="w-5 h-5 text-primary-foreground/80 mb-2" />
                <p className="text-2xl font-bold text-primary-foreground">
                  {summary.entries}
                </p>
                <p className="text-xs text-primary-foreground/80">
                  Members Present
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <TrendingUp className="w-5 h-5 text-primary-foreground/80 mb-2" />
                <p className="text-2xl font-bold text-primary-foreground">
                  {attendanceRate}%
                </p>
                <p className="text-xs text-primary-foreground/80">
                  Attendance Rate
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <BarChart2 className="w-5 h-5 text-primary-foreground/80 mb-2" />
                <p className="text-2xl font-bold text-primary-foreground">
                  {avgPerMember}
                </p>
                <p className="text-xs text-primary-foreground/80">
                  Avg per Member
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
          <button
            onClick={() => setSelectedView("overview")}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              selectedView === "overview"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PieChart className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setSelectedView("members")}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              selectedView === "members"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Members
          </button>
        </div>

        {selectedView === "overview" ? (
          <>
            {/* Meal Distribution Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Breakfast */}
              <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Coffee className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {summary.breakfast}
                    </p>
                    <p className="text-xs text-muted-foreground">members</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground mb-3">
                  Breakfast
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Attendance</span>
                    <span className="font-bold text-orange-500">
                      {breakfastPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-orange-500 to-orange-400 transition-all duration-500"
                      style={{ width: `${breakfastPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Lunch */}
              <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Sun className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {summary.lunch}
                    </p>
                    <p className="text-xs text-muted-foreground">members</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground mb-3">
                  Lunch
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Attendance</span>
                    <span className="font-bold text-yellow-500">
                      {lunchPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
                      style={{ width: `${lunchPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Dinner */}
              <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Moon className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {summary.dinner}
                    </p>
                    <p className="text-xs text-muted-foreground">members</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground mb-3">
                  Dinner
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Attendance</span>
                    <span className="font-bold text-blue-500">
                      {dinnerPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${dinnerPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution Breakdown */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Meal Distribution
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Today&apos;s breakdown
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Coffee className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-foreground">
                        Breakfast Served
                      </span>
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      {summary.breakfast}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Sun className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium text-foreground">
                        Lunch Served
                      </span>
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      {summary.lunch}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium text-foreground">
                        Dinner Served
                      </span>
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      {summary.dinner}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="text-sm font-semibold text-foreground">
                      Total Meals Today
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {summary.totalMeals}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Attendee */}
              <div className="bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Top Attendee
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Most meals today
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
                        <p className="font-bold text-foreground text-lg">
                          {topMember.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {topMember.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <Coffee className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-foreground">
                          {topMember.breakfast}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Breakfast
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <Sun className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-foreground">
                          {topMember.lunch}
                        </p>
                        <p className="text-xs text-muted-foreground">Lunch</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <Moon className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-foreground">
                          {topMember.dinner}
                        </p>
                        <p className="text-xs text-muted-foreground">Dinner</p>
                      </div>
                    </div>

                    <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total Meals Today
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {topMember.totalMeals}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Members View */
          <>
            {/* Search Bar */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "name" | "meals")
                    }
                    className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border-2 border-input bg-background text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer w-full sm:w-auto"
                  >
                    <option value="meals">Sort by Meals</option>
                    <option value="name">Sort by Name</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Today&apos;s Attendance
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Member meal records
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {filteredData.length} Members
                  </span>
                </div>
              </div>

              <div className="divide-y divide-border">
                {filteredData.map((member) => (
                  <div
                    key={member._id}
                    className="p-5 hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <span className="text-lg font-bold text-primary">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {member.name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {member.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {member.totalMeals}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              meals
                            </p>
                          </div>
                        </div>

                        {/* Meal Breakdown */}
                        <div className="grid grid-cols-3 gap-2">
                          <div
                            className={`${
                              member.breakfast > 0
                                ? "bg-orange-500/10 border-orange-500/20"
                                : "bg-muted border-border"
                            } border rounded-lg p-2.5 text-center`}
                          >
                            <Coffee
                              className={`w-4 h-4 mx-auto mb-1 ${
                                member.breakfast > 0
                                  ? "text-orange-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <p
                              className={`text-sm font-bold ${
                                member.breakfast > 0
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {member.breakfast}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Breakfast
                            </p>
                          </div>
                          <div
                            className={`${
                              member.lunch > 0
                                ? "bg-yellow-500/10 border-yellow-500/20"
                                : "bg-muted border-border"
                            } border rounded-lg p-2.5 text-center`}
                          >
                            <Sun
                              className={`w-4 h-4 mx-auto mb-1 ${
                                member.lunch > 0
                                  ? "text-yellow-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <p
                              className={`text-sm font-bold ${
                                member.lunch > 0
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {member.lunch}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Lunch
                            </p>
                          </div>
                          <div
                            className={`${
                              member.dinner > 0
                                ? "bg-blue-500/10 border-blue-500/20"
                                : "bg-muted border-border"
                            } border rounded-lg p-2.5 text-center`}
                          >
                            <Moon
                              className={`w-4 h-4 mx-auto mb-1 ${
                                member.dinner > 0
                                  ? "text-blue-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <p
                              className={`text-sm font-bold ${
                                member.dinner > 0
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {member.dinner}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Dinner
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredData.length === 0 && (
                  <div className="p-12 text-center">
                    <User className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">No members found</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
