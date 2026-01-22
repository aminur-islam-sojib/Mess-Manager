/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Filter,
  ArrowUpDown,
  ChevronDown,
  Activity,
  Target,
  BarChart3,
  Clock,
} from "lucide-react";

interface MemberRangeData {
  _id: string;
  name: string;
  email: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  totalMeals: number;
  entries: number;
}

interface DateRangeReportData {
  success: boolean;
  from: string;
  to: string;
  messId: string;
  messName: string;
  summary: {
    breakfast: number;
    lunch: number;
    dinner: number;
    totalMeals: number;
    entries: number;
  };
  data: MemberRangeData[];
}

interface DateRangeReportProps {
  reportData?: any;
}

export default function DateRangeReport({ reportData }: DateRangeReportProps) {
  const [sortBy, setSortBy] = useState<"meals" | "name">("meals");
  const [filterMealType, setFilterMealType] = useState<
    "all" | "breakfast" | "lunch" | "dinner"
  >("all");
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards");

  // Return empty state if no data
  if (
    !reportData?.success ||
    !reportData?.data ||
    !Array.isArray(reportData.data)
  ) {
    return (
      <div className="max-w-7xl mx-auto text-center py-16">
        <p className="text-muted-foreground">No meal data available</p>
      </div>
    );
  }

  const { from, to, messName, data } = reportData;

  // Calculate summary from data
  const summary = {
    breakfast: data.reduce(
      (sum: number, m: any) => sum + (m.breakfast || 0),
      0,
    ),
    lunch: data.reduce((sum: number, m: any) => sum + (m.lunch || 0), 0),
    dinner: data.reduce((sum: number, m: any) => sum + (m.dinner || 0), 0),
    totalMeals: data.reduce(
      (sum: number, m: any) => sum + (m.totalMeals || 0),
      0,
    ),
    entries: data.length,
  };

  // Format dates
  const startDate = new Date(from);
  const endDate = new Date(to);
  const daysDiff =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Sort and filter members
  const processedData = [...data]
    .filter((member: any) => {
      if (filterMealType === "all") return true;
      return member[filterMealType] > 0;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "meals") return b.totalMeals - a.totalMeals;
      return a.name?.localeCompare(b.name || "") || 0;
    });

  // Calculate statistics
  const avgMealsPerDay = daysDiff > 0 ? summary.totalMeals / daysDiff : 0;
  const avgMealsPerMember =
    data.length > 0 ? summary.totalMeals / data.length : 0;
  const breakfastPct =
    summary.totalMeals > 0 ? (summary.breakfast / summary.totalMeals) * 100 : 0;
  const lunchPct =
    summary.totalMeals > 0 ? (summary.lunch / summary.totalMeals) * 100 : 0;
  const dinnerPct =
    summary.totalMeals > 0 ? (summary.dinner / summary.totalMeals) * 100 : 0;

  // Find most active member
  const mostActive =
    data.length > 0
      ? [...data].sort((a: any, b: any) => b.totalMeals - a.totalMeals)[0]
      : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-linear-to-br from-primary via-primary/95 to-primary/90 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-primary-foreground/80" />
                <span className="text-sm font-medium text-primary-foreground/90">
                  Date Range Report
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
                {formatDate(startDate)} - {formatDate(endDate)}
              </h1>
              <div className="flex items-center gap-3 text-primary-foreground/90">
                <span className="text-sm">{messName}</span>
                <span className="text-sm">•</span>
                <span className="text-sm">
                  {daysDiff} {daysDiff === 1 ? "day" : "days"}
                </span>
              </div>
            </div>

            <button className="px-4 py-2 bg-white/20 backdrop-blur-sm text-primary-foreground rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 border border-white/20">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Utensils className="w-5 h-5 text-primary-foreground/80 mb-2" />
              <p className="text-2xl font-bold text-primary-foreground">
                {summary.totalMeals}
              </p>
              <p className="text-xs text-primary-foreground/80">Total Meals</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Activity className="w-5 h-5 text-primary-foreground/80 mb-2" />
              <p className="text-2xl font-bold text-primary-foreground">
                {avgMealsPerDay.toFixed(1)}
              </p>
              <p className="text-xs text-primary-foreground/80">Avg per Day</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Users className="w-5 h-5 text-primary-foreground/80 mb-2" />
              <p className="text-2xl font-bold text-primary-foreground">
                {data.length}
              </p>
              <p className="text-xs text-primary-foreground/80">Members</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Target className="w-5 h-5 text-primary-foreground/80 mb-2" />
              <p className="text-2xl font-bold text-primary-foreground">
                {avgMealsPerMember.toFixed(1)}
              </p>
              <p className="text-xs text-primary-foreground/80">
                Avg per Member
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Coffee className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {summary.breakfast}
                </p>
                <p className="text-xs text-muted-foreground">Breakfast</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-orange-500">
                {breakfastPct.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">of total</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-orange-500 to-orange-400 transition-all duration-500"
              style={{ width: `${breakfastPct}%` }}
            ></div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Avg {(summary.breakfast / daysDiff).toFixed(1)} per day
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Sun className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {summary.lunch}
                </p>
                <p className="text-xs text-muted-foreground">Lunch</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-yellow-500">
                {lunchPct.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">of total</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
              style={{ width: `${lunchPct}%` }}
            ></div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Avg {(summary.lunch / daysDiff).toFixed(1)} per day
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Moon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {summary.dinner}
                </p>
                <p className="text-xs text-muted-foreground">Dinner</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-500">
                {dinnerPct.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">of total</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-500 to-blue-400 transition-all duration-500"
              style={{ width: `${dinnerPct}%` }}
            ></div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Avg {(summary.dinner / daysDiff).toFixed(1)} per day
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Active Member */}
        <div className="bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Most Active</h3>
              <p className="text-xs text-muted-foreground">
                Highest meal count
              </p>
            </div>
          </div>

          {mostActive && (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                  <span className="text-xl font-bold text-primary">
                    {mostActive.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">
                    {mostActive.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {mostActive.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-orange-500/10 rounded-lg p-2 text-center border border-orange-500/20">
                  <p className="text-lg font-bold text-foreground">
                    {mostActive.breakfast}
                  </p>
                  <p className="text-xs text-muted-foreground">Breakfast</p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-2 text-center border border-yellow-500/20">
                  <p className="text-lg font-bold text-foreground">
                    {mostActive.lunch}
                  </p>
                  <p className="text-xs text-muted-foreground">Lunch</p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-2 text-center border border-blue-500/20">
                  <p className="text-lg font-bold text-foreground">
                    {mostActive.dinner}
                  </p>
                  <p className="text-xs text-muted-foreground">Dinner</p>
                </div>
              </div>

              <div className="bg-card/50 rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Meals
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {mostActive.totalMeals}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Period Overview */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Period Overview</h3>
              <p className="text-xs text-muted-foreground">Key statistics</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Duration</span>
              </div>
              <span className="font-semibold text-foreground">
                {daysDiff} {daysDiff === 1 ? "day" : "days"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Daily Average
                </span>
              </div>
              <span className="font-semibold text-foreground">
                {avgMealsPerDay.toFixed(1)} meals
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Per Member Avg
                </span>
              </div>
              <span className="font-semibold text-foreground">
                {avgMealsPerMember.toFixed(1)} meals
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Total Consumed
                </span>
              </div>
              <span className="font-bold text-primary text-lg">
                {summary.totalMeals}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter */}
            <div className="relative">
              <select
                value={filterMealType}
                onChange={(e) => setFilterMealType(e.target.value as any)}
                className="appearance-none pl-4 pr-10 py-2 rounded-xl border-2 border-input bg-background text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer text-sm"
              >
                <option value="all">All Meals</option>
                <option value="breakfast">Breakfast Only</option>
                <option value="lunch">Lunch Only</option>
                <option value="dinner">Dinner Only</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-4 pr-10 py-2 rounded-xl border-2 border-input bg-background text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer text-sm"
              >
                <option value="meals">Sort by Meals</option>
                <option value="name">Sort by Name</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "cards"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "compact"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-foreground">
            Member Activity ({processedData.length})
          </h3>
        </div>

        {viewMode === "cards" ? (
          <div className="divide-y divide-border">
            {processedData.map((member) => (
              <div
                key={member._id}
                className="p-5 hover:bg-accent transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center  shrink-0 font-bold text-primary">
                    {member.name.charAt(0).toUpperCase()}
                  </div>

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
                        <p className="text-xs text-muted-foreground">total</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
                        <Coffee className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                        <p className="text-sm font-bold text-foreground">
                          {member.breakfast}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Breakfast
                        </p>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
                        <Sun className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                        <p className="text-sm font-bold text-foreground">
                          {member.lunch}
                        </p>
                        <p className="text-xs text-muted-foreground">Lunch</p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
                        <Moon className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                        <p className="text-sm font-bold text-foreground">
                          {member.dinner}
                        </p>
                        <p className="text-xs text-muted-foreground">Dinner</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {processedData.map((member) => (
              <div
                key={member._id}
                className="p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate text-sm">
                        {member.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Coffee className="w-3 h-3 text-orange-500" />
                      <span className="font-medium text-foreground">
                        {member.breakfast}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Sun className="w-3 h-3 text-yellow-500" />
                      <span className="font-medium text-foreground">
                        {member.lunch}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Moon className="w-3 h-3 text-blue-500" />
                      <span className="font-medium text-foreground">
                        {member.dinner}
                      </span>
                    </div>
                    <div className="pl-2 sm:pl-4 border-l border-border">
                      <p className="text-lg font-bold text-primary">
                        {member.totalMeals}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {processedData.length === 0 && (
          <div className="p-12 text-center">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              No members match the current filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
