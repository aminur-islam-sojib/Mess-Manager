/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
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
  Award,
  ChevronRight,
  DollarSign,
  PieChart,
  BarChart2,
} from "lucide-react";

interface MonthlyReportProps {
  reportData?: any;
  costPerMeal?: number;
}

export default function MonthlyMessReport({
  reportData,
  costPerMeal = 50,
}: MonthlyReportProps) {
  const [selectedView, setSelectedView] = useState<"overview" | "members">(
    "overview",
  );

  // Return empty state if no data
  if (
    !reportData?.success ||
    !reportData?.data ||
    !Array.isArray(reportData.data)
  ) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto text-center py-16">
          <p className="text-muted-foreground">No meal data available</p>
        </div>
      </div>
    );
  }

  const { messName, month, year, data } = reportData;

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

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentMonth = monthNames[month - 1];

  // Calculate costs
  const totalCost = summary.totalMeals * costPerMeal;
  const avgCostPerMember = data.length > 0 ? totalCost / data.length : 0;

  // Find top contributor
  const topMember =
    data.length > 0
      ? [...data].sort((a: any, b: any) => b.totalMeals - a.totalMeals)[0]
      : null;

  // Calculate meal percentages
  const breakfastPct =
    summary.totalMeals > 0 ? (summary.breakfast / summary.totalMeals) * 100 : 0;
  const lunchPct =
    summary.totalMeals > 0 ? (summary.lunch / summary.totalMeals) * 100 : 0;
  const dinnerPct =
    summary.totalMeals > 0 ? (summary.dinner / summary.totalMeals) * 100 : 0;

  // Sort members by total meals
  const sortedMembers = [...data].sort((a, b) => b.totalMeals - a.totalMeals);

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
                    Monthly Report
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                  {currentMonth} {year}
                </h1>
                <p className="text-primary-foreground/90">{messName}</p>
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
                  {data.length}
                </p>
                <p className="text-xs text-primary-foreground/80">Members</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <DollarSign className="w-5 h-5 text-primary-foreground/80 mb-2" />
                <p className="text-2xl font-bold text-primary-foreground">
                  ${totalCost.toLocaleString()}
                </p>
                <p className="text-xs text-primary-foreground/80">Total Cost</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <TrendingUp className="w-5 h-5 text-primary-foreground/80 mb-2" />
                <p className="text-2xl font-bold text-primary-foreground">
                  {(summary.totalMeals / data.length).toFixed(1)}
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
                    <p className="text-xs text-muted-foreground">meals</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground mb-3">
                  Breakfast
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Distribution</span>
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
                    <p className="text-xs text-muted-foreground">meals</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground mb-3">
                  Lunch
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Distribution</span>
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
                    <p className="text-xs text-muted-foreground">meals</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground mb-3">
                  Dinner
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Distribution</span>
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

            {/* Financial Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Breakdown */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Financial Summary
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Cost breakdown
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Coffee className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-foreground">
                        Breakfast Cost
                      </span>
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      ${(summary.breakfast * costPerMeal).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Sun className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium text-foreground">
                        Lunch Cost
                      </span>
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      ${(summary.lunch * costPerMeal).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium text-foreground">
                        Dinner Cost
                      </span>
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      ${(summary.dinner * costPerMeal).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="text-sm font-semibold text-foreground">
                      Total Monthly Cost
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      ${totalCost.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                    <span className="text-sm font-medium text-muted-foreground">
                      Per Member Average
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      ${avgCostPerMember.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Contributor */}
              <div className="bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
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
                          Total Meals
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {topMember.totalMeals}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-muted-foreground">
                          Estimated Cost
                        </span>
                        <span className="text-lg font-bold text-foreground">
                          $
                          {(
                            topMember.totalMeals * costPerMeal
                          ).toLocaleString()}
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
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Member Rankings
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Sorted by total meals
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {data.length} Members
                </span>
              </div>
            </div>

            <div className="divide-y divide-border">
              {sortedMembers.map((member, index) => (
                <div
                  key={member._id}
                  className="p-5 hover:bg-accent transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    {/* Rank Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center  shrink-0 font-bold ${
                        index === 0
                          ? "bg-yellow-500/20 text-yellow-600 border-2 border-yellow-500/30"
                          : index === 1
                            ? "bg-gray-400/20 text-gray-600 border-2 border-gray-400/30"
                            : index === 2
                              ? "bg-orange-600/20 text-orange-700 border-2 border-orange-600/30"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : `#${index + 1}`}
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
                          <p className="text-xs text-muted-foreground">meals</p>
                        </div>
                      </div>

                      {/* Meal Breakdown */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2.5 text-center">
                          <Coffee className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                          <p className="text-sm font-bold text-foreground">
                            {member.breakfast}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Breakfast
                          </p>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5 text-center">
                          <Sun className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                          <p className="text-sm font-bold text-foreground">
                            {member.lunch}
                          </p>
                          <p className="text-xs text-muted-foreground">Lunch</p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 text-center">
                          <Moon className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                          <p className="text-sm font-bold text-foreground">
                            {member.dinner}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Dinner
                          </p>
                        </div>
                      </div>

                      {/* Cost */}
                      <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">
                          Estimated Cost
                        </span>
                        <span className="text-lg font-bold text-foreground">
                          ${(member.totalMeals * costPerMeal).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Card */}
        <div className="bg-linear-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">
                Need detailed analytics?
              </h3>
              <p className="text-sm text-primary-foreground/80">
                Export this report or view historical trends
              </p>
            </div>
            <button className="px-6 py-3 bg-white text-primary rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2">
              View Reports
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
