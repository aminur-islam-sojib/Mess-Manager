import { useState } from "react";
import {
  Calendar,
  Users,
  Coffee,
  Sun,
  Moon,
  TrendingUp,
  ChevronDown,
  Download,
  Search,
  Filter,
  BarChart3,
  User,
} from "lucide-react";

interface MemberData {
  _id: string;
  name: string;
  email: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  totalMeals: number;
  entries: number;
}

interface AttendanceData {
  success: boolean;
  date: string;
  messId: string;
  messName: string;
  summary: {
    breakfast: number;
    lunch: number;
    dinner: number;
    totalMeals: number;
    entries: number;
  };
  data: MemberData[];
}

interface DailyMealAttendanceProps {
  attendanceData: AttendanceData;
}

export default function DailyMealAttendance({
  attendanceData,
}: DailyMealAttendanceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "meals">("meals");
  const [showFilters, setShowFilters] = useState(false);
  const { date, messName, summary, data } = attendanceData;

  // Format date
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Filter and sort data
  const filteredData = data
    .filter(
      (member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "meals") return b.totalMeals - a.totalMeals;
      return a.name.localeCompare(b.name);
    });

  // Calculate percentages
  const breakfastPercentage =
    summary.entries > 0 ? (summary.breakfast / summary.entries) * 100 : 0;
  const lunchPercentage =
    summary.entries > 0 ? (summary.lunch / summary.entries) * 100 : 0;
  const dinnerPercentage =
    summary.entries > 0 ? (summary.dinner / summary.entries) * 100 : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Daily Attendance
                </h1>
                <p className="text-sm text-muted-foreground">{messName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{formattedDate}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-xl border-2 border-border bg-card text-foreground hover:bg-accent transition-all flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 rounded-xl border-2 border-border bg-card text-foreground hover:bg-accent transition-all flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Members */}
          <div className="bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {summary.entries}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              Active Members
            </p>
          </div>

          {/* Breakfast */}
          <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Coffee className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full">
                {breakfastPercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {summary.breakfast}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              Breakfast
            </p>
          </div>

          {/* Lunch */}
          <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Sun className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
                {lunchPercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {summary.lunch}
            </p>
            <p className="text-xs text-muted-foreground font-medium">Lunch</p>
          </div>

          {/* Dinner */}
          <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Moon className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">
                {dinnerPercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {summary.dinner}
            </p>
            <p className="text-xs text-muted-foreground font-medium">Dinner</p>
          </div>
        </div>

        {/* Visual Summary Bar */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Meal Distribution</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-foreground">
                    Breakfast
                  </span>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {summary.breakfast}/{summary.entries}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-orange-500 to-orange-400 transition-all duration-500"
                  style={{ width: `${breakfastPercentage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-foreground">
                    Lunch
                  </span>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {summary.lunch}/{summary.entries}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
                  style={{ width: `${lunchPercentage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-foreground">
                    Dinner
                  </span>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {summary.dinner}/{summary.entries}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-blue-400 transition-all duration-500"
                  style={{ width: `${dinnerPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
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

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "meals")}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border-2 border-input bg-background text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer"
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
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Member Attendance ({filteredData.length})
            </h3>
          </div>

          <div className="divide-y divide-border">
            {filteredData.map((member) => (
              <div
                key={member._id}
                className="p-5 hover:bg-accent transition-colors group"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Member Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <span className="text-lg font-bold text-primary">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {member.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  {/* Meal Badges */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                        member.breakfast > 0
                          ? "bg-orange-500/10 border border-orange-500/20"
                          : "bg-muted border border-border"
                      }`}
                    >
                      <Coffee
                        className={`w-4 h-4 ${
                          member.breakfast > 0
                            ? "text-orange-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`text-sm font-bold ${
                          member.breakfast > 0
                            ? "text-orange-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {member.breakfast}
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                        member.lunch > 0
                          ? "bg-yellow-500/10 border border-yellow-500/20"
                          : "bg-muted border border-border"
                      }`}
                    >
                      <Sun
                        className={`w-4 h-4 ${
                          member.lunch > 0
                            ? "text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`text-sm font-bold ${
                          member.lunch > 0
                            ? "text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {member.lunch}
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                        member.dinner > 0
                          ? "bg-blue-500/10 border border-blue-500/20"
                          : "bg-muted border border-border"
                      }`}
                    >
                      <Moon
                        className={`w-4 h-4 ${
                          member.dinner > 0
                            ? "text-blue-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`text-sm font-bold ${
                          member.dinner > 0
                            ? "text-blue-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {member.dinner}
                      </span>
                    </div>

                    {/* Total */}
                    <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-xs font-medium text-muted-foreground">
                        Total
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {member.totalMeals}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Total */}
                <div className="sm:hidden mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Meals
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {member.totalMeals}
                  </span>
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

        {/* Summary Footer */}
        <div className="bg-linear-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-foreground mb-1">
                {summary.totalMeals}
              </p>
              <p className="text-sm text-muted-foreground">
                Total Meals Served
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground mb-1">
                {summary.entries}
              </p>
              <p className="text-sm text-muted-foreground">Members Present</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground mb-1">
                {((summary.totalMeals / (summary.entries * 3)) * 100).toFixed(
                  0
                )}
                %
              </p>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground mb-1">
                {(summary.totalMeals / summary.entries).toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">Avg per Member</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
