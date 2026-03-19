"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Receipt,
  TrendingUp,
  Utensils,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type UserHomeInsightsData = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "user" | "manager" | "admin";
    image: string | null;
  };
  mess: {
    id: string;
    messName: string;
  };
  summary: {
    currentBalance: number;
    monthlyExpense: number;
    monthlyDeposits: number;
    mealsThisMonth: number;
    pendingPayments: number;
    projectedMonthEndBalance: number;
  };
  trends: {
    financial14: Array<{
      date: string;
      label: string;
      dailyCost: number;
      dailyDeposit: number;
      cumulativeCost: number;
      cumulativeDeposit: number;
    }>;
    meals14: Array<{
      date: string;
      label: string;
      breakfast: number;
      lunch: number;
      dinner: number;
      totalMeals: number;
    }>;
  };
  progress: {
    depositCoveragePct: number;
    mealConsistencyPct: number;
    stableBalancePct: number;
  };
  alerts: Array<{
    id: string;
    title: string;
    description: string;
    severity: "info" | "warning" | "critical";
    actionLabel: string;
    actionHref: string;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    href: string;
  }>;
  recentTransactions: Array<{
    id: string;
    title: string;
    amount: number;
    date: string;
    type: "bill" | "payment" | "expense";
    status: "pending" | "completed";
  }>;
  mealHistory: Array<{
    date: string;
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  }>;
  upcomingBills: Array<{
    id: string;
    title: string;
    amount: number;
    dueDate: string;
    status: "pending";
  }>;
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "danger";
}) {
  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardContent className=" ">
        <div className="mb-3 flex items-center justify-between">
          <Icon
            className={`h-4 w-4 ${tone === "danger" ? "text-destructive" : "text-primary"}`}
          />
          <span className="text-xs font-semibold    text-muted-foreground">
            {title}
          </span>
        </div>
        <p
          className={`text-2xl font-bold ${tone === "danger" ? "text-destructive" : "text-foreground"}`}
        >
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function ProgressBlock({
  title,
  value,
  helper,
}: {
  title: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </p>
        <span className="text-xs font-semibold text-foreground">
          {value.toFixed(1)}%
        </span>
      </div>
      <Progress value={value} />
      <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

export default function UserHomeInsights({
  data,
}: {
  data: UserHomeInsightsData;
}) {
  const firstName =
    data.user.name.trim().split(" ").filter(Boolean)[0] || "Member";

  return (
    <div className="min-h-screen bg-background lg:flex">
      <div className="flex-1">
        <main className="pb-20 lg:pb-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="rounded-2xl border border-border bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
                    Welcome back, {firstName}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your meal and money health at {data.mess.messName}.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      data.summary.currentBalance >= 0
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {data.summary.currentBalance >= 0
                      ? "Healthy balance"
                      : "Action needed"}
                  </Badge>
                  {data.quickActions.map((action) => (
                    <Button
                      key={action.id}
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <Link href={action.href}>
                        {action.label}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                title="Current Balance"
                value={`$${Math.abs(data.summary.currentBalance).toLocaleString()}`}
                subtitle={
                  data.summary.currentBalance >= 0
                    ? "Available credit"
                    : "Outstanding due"
                }
                icon={DollarSign}
                tone={data.summary.currentBalance >= 0 ? "default" : "danger"}
              />
              <StatCard
                title="Month Expense"
                value={`$${data.summary.monthlyExpense.toLocaleString()}`}
                subtitle="Estimated personal costs"
                icon={Receipt}
              />
              <StatCard
                title="Month Deposits"
                value={`$${data.summary.monthlyDeposits.toLocaleString()}`}
                subtitle="Your top-ups this month"
                icon={TrendingUp}
              />
              <StatCard
                title="Meals This Month"
                value={String(data.summary.mealsThisMonth)}
                subtitle={`${data.summary.pendingPayments} pending payment item(s)`}
                icon={Utensils}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <Card className="rounded-2xl border-border shadow-sm lg:col-span-7">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    14-Day Financial Momentum
                  </CardTitle>
                  <CardDescription>
                    Cumulative accrued cost versus cumulative deposits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-70">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.trends.financial14}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="costGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#dc2626"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="#dc2626"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="depGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#16a34a"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="#16a34a"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        minTickGap={16}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="cumulativeCost"
                        name="Accrued Cost"
                        stroke="#dc2626"
                        fill="url(#costGrad)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulativeDeposit"
                        name="Deposits"
                        stroke="#16a34a"
                        fill="url(#depGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border shadow-sm lg:col-span-5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Progress Health</CardTitle>
                  <CardDescription>
                    Convenient indicators to track your month.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ProgressBlock
                    title="Deposit Coverage"
                    value={data.progress.depositCoveragePct}
                    helper="How much of current month cost is already covered by deposits."
                  />
                  <ProgressBlock
                    title="Meal Consistency"
                    value={data.progress.mealConsistencyPct}
                    helper="Days with at least 2 meals logged this month."
                  />
                  <ProgressBlock
                    title="Balance Stability"
                    value={data.progress.stableBalancePct}
                    helper={`Projected month-end balance: $${data.summary.projectedMonthEndBalance.toLocaleString()}`}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <Card className="rounded-2xl border-border shadow-sm lg:col-span-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Meal Pattern (14 Days)
                  </CardTitle>
                  <CardDescription>
                    Breakfast, lunch, and dinner completion by day.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-70">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.trends.meals14}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        minTickGap={16}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="breakfast"
                        stackId="meal"
                        name="Breakfast"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="lunch"
                        stackId="meal"
                        name="Lunch"
                        fill="#0ea5e9"
                      />
                      <Bar
                        dataKey="dinner"
                        stackId="meal"
                        name="Dinner"
                        fill="#16a34a"
                        radius={[0, 0, 4, 4]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border shadow-sm lg:col-span-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Alerts and Upcoming Bills
                  </CardTitle>
                  <CardDescription>
                    Actionable items to keep your account healthy.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.alerts.length === 0 &&
                  data.upcomingBills.length === 0 ? (
                    <div className="rounded-xl border border-border p-3 text-sm text-muted-foreground">
                      No urgent alerts. Keep tracking consistently.
                    </div>
                  ) : null}

                  {data.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`rounded-xl border p-3 ${
                        alert.severity === "critical"
                          ? "border-destructive/30 bg-destructive/10"
                          : alert.severity === "warning"
                            ? "border-orange-500/30 bg-orange-500/10"
                            : "border-primary/20 bg-primary/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {alert.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {alert.description}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={alert.actionHref}>
                            {alert.actionLabel}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}

                  {data.upcomingBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <div className="rounded-full bg-orange-500/10 p-2 text-orange-500">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {bill.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due{" "}
                          {new Date(bill.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        ${bill.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <Card className="rounded-2xl border-border shadow-sm lg:col-span-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.recentTransactions.length > 0 ? (
                    data.recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center gap-3 rounded-xl border border-border p-3"
                      >
                        <div
                          className={`rounded-full p-2 ${
                            transaction.type === "payment"
                              ? "bg-primary/10 text-primary"
                              : transaction.status === "pending"
                                ? "bg-orange-500/10 text-orange-500"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {transaction.type === "payment" ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : transaction.status === "pending" ? (
                            <Clock className="h-4 w-4" />
                          ) : (
                            <Receipt className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {transaction.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${transaction.amount > 0 ? "text-primary" : "text-foreground"}`}
                          >
                            {transaction.amount > 0 ? "+" : ""}$
                            {Math.abs(transaction.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {transaction.status}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-border p-3 text-sm text-muted-foreground">
                      No recent transactions yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border shadow-sm lg:col-span-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Meals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.mealHistory.length > 0 ? (
                    data.mealHistory.map((day, index) => (
                      <div
                        key={`${day.date}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-border p-3"
                      >
                        <div className="rounded-full bg-primary/10 p-2 text-primary">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {new Date(day.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {day.breakfast ? "Breakfast " : ""}
                            {day.lunch ? "Lunch " : ""}
                            {day.dinner ? "Dinner" : ""}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {
                            [day.breakfast, day.lunch, day.dinner].filter(
                              Boolean,
                            ).length
                          }
                          /3
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-border p-3 text-sm text-muted-foreground">
                      No recent meals yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {data.summary.currentBalance < 0 && (
              <Card className="rounded-2xl border-destructive/25 bg-destructive/10 shadow-sm">
                <CardContent className="flex items-start gap-3 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Payment Due</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your current outstanding balance is $
                      {Math.abs(data.summary.currentBalance).toLocaleString()}.
                    </p>
                  </div>
                  <Button asChild variant="destructive" size="sm">
                    <Link href="/dashboard/user/deposits">Settle now</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
