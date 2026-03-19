"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  Flame,
  TrendingUp,
  Users,
  CalendarRange,
} from "lucide-react";
import { MealReportBundle } from "@/types/MealManagementTypes";
import { motion } from "framer-motion";

const statCards = (report: MealReportBundle) => [
  {
    title: "Total Meals",
    value: report.overview.totalMeals.toLocaleString(),
    icon: <Flame className="h-5 w-5 text-orange-500" />,
    helper: report.range.label,
  },
  {
    title: "Total Expenses",
    value: `$${report.overview.totalExpenses.toLocaleString()}`,
    icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
    helper: "Approved expenses",
  },
  {
    title: "Cost Per Meal",
    value: `$${report.overview.costPerMeal.toFixed(2)}`,
    icon: <TrendingUp className="h-5 w-5 text-primary" />,
    helper: "Auto computed",
  },
  {
    title: "Active Members",
    value: report.overview.activeMembers.toLocaleString(),
    icon: <Users className="h-5 w-5 text-sky-500" />,
    helper: `Avg ${report.overview.avgMealsPerMember.toFixed(1)} meals/member`,
  },
];

export default function MealReportsOverview({
  report,
  isLoading,
}: {
  report?: MealReportBundle;
  isLoading?: boolean;
}) {
  if (!report) {
    return null;
  }

  const topMembers = report.memberRanking.slice(0, 8).map((member) => ({
    name: member.name,
    meals: member.totalMeals,
  }));

  return (
    <div className="space-y-5 my-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Meal Insights
          </h2>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            {report.range.label}
          </p>
        </div>
        {isLoading ? <Badge variant="outline">Refreshing...</Badge> : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards(report).map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
          >
            <Card className="rounded-2xl border border-border/70 p-4 bg-card/80">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-2xl font-black tracking-tight text-foreground">
                    {item.value}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-2">{item.icon}</div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {item.helper}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl border border-border/70 p-4">
          <p className="text-sm font-semibold text-foreground mb-4">
            Daily Meals Trend
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.trend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={16} />
                <YAxis tick={{ fontSize: 11 }} width={30} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="totalMeals"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl border border-border/70 p-4">
          <p className="text-sm font-semibold text-foreground mb-4">
            Meal Type Distribution
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={report.trend}
                stackOffset="none"
                margin={{ left: 0, right: 8, top: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={16} />
                <YAxis tick={{ fontSize: 11 }} width={30} />
                <Tooltip />
                <Bar
                  dataKey="breakfast"
                  stackId="a"
                  fill="#f97316"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="lunch"
                  stackId="a"
                  fill="#eab308"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="dinner"
                  stackId="a"
                  fill="#3b82f6"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border border-border/70 p-4">
        <p className="text-sm font-semibold text-foreground mb-4">
          Top Members by Meals
        </p>
        <div className="space-y-2">
          {topMembers.map((member, idx) => (
            <div
              key={`${member.name}-${idx}`}
              className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
            >
              <p className="text-sm font-medium text-foreground">
                {member.name}
              </p>
              <Badge variant="outline">{member.meals} meals</Badge>
            </div>
          ))}
          {topMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No meal records in this period.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
