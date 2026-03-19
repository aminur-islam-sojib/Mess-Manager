"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Building2,
  Clock3,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type TrendPoint = {
  date: string;
  newUsers: number;
  newMesses: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  expiredInvitations: number;
  pendingOperations: number;
};

type ProgressMetric = {
  label: string;
  percentage: number;
  current: number;
  total: number;
  helper: string;
};

type AdminHomeInsightsData = {
  generatedAt: Date | string;
  windowDays: number;
  summary: {
    totalUsers: number;
    totalManagers: number;
    totalMembers: number;
    totalMesses: number;
    activeMesses: number;
    pendingInvitations: number;
    pendingExpenses: number;
    pendingDepositRequests: number;
    totalPendingOperations: number;
    newUsersInWindow: number;
    newUsersPreviousWindow: number;
    newMessesInWindow: number;
    newMessesPreviousWindow: number;
    userGrowthDeltaPct: number;
    messGrowthDeltaPct: number;
    managersPerActiveMess: number;
    averageMembersPerActiveMess: number;
    invitationsAcceptedInWindow: number;
    invitationsExpiredInWindow: number;
    operationsOpenedInWindow: number;
    operationsClearedInWindow: number;
  };
  progress: {
    activationRate: ProgressMetric;
    managerCoverage: ProgressMetric;
    operationsClearance: ProgressMetric;
  };
  trends: TrendPoint[];
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date | string;
  }>;
};

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
};

function StatCard({ title, value, subtitle, icon: Icon }: StatCardProps) {
  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </span>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function formatPercent(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatDay(date: string) {
  const d = new Date(`${date}T00:00:00.000Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function InsightProgress({ metric }: { metric: ProgressMetric }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {metric.label}
        </span>
        <span className="text-xs font-semibold text-foreground">
          {metric.percentage.toFixed(1)}%
        </span>
      </div>
      <Progress value={metric.percentage} />
      <p className="mt-2 text-xs text-muted-foreground">
        {metric.current} / {metric.total} - {metric.helper}
      </p>
    </div>
  );
}

export default function AdminHomeAnalytics({
  data,
}: {
  data: AdminHomeInsightsData;
}) {
  const growthTrend = data.trends.map((point) => ({
    ...point,
    dayLabel: formatDay(point.date),
  }));

  const invitationTrend = data.trends.map((point) => ({
    dayLabel: formatDay(point.date),
    pending: point.pendingInvitations,
    accepted: point.acceptedInvitations,
    expired: point.expiredInvitations,
  }));

  const operationsTrend = data.trends.map((point, index, source) => {
    const window = source.slice(Math.max(0, index - 6), index + 1);
    const avg =
      window.reduce((sum, item) => sum + item.pendingOperations, 0) /
      Math.max(window.length, 1);

    return {
      dayLabel: formatDay(point.date),
      pendingOperations: point.pendingOperations,
      movingAvg: Number(avg.toFixed(2)),
    };
  });

  const generatedAt = new Date(data.generatedAt).toLocaleString();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-2xl border border-border bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Admin Overview
            </h1>
            <p className="text-sm text-muted-foreground">
              Growth-first snapshot for the last {data.windowDays} days, with
              operational risk indicators.
            </p>
          </div>
          <Badge variant="secondary">Updated {generatedAt}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={data.summary.totalUsers}
          subtitle={`${data.summary.newUsersInWindow} joined in ${data.windowDays}d`}
          icon={Users}
        />
        <StatCard
          title="User Growth"
          value={formatPercent(data.summary.userGrowthDeltaPct)}
          subtitle={`${data.summary.newUsersPreviousWindow} in previous window`}
          icon={TrendingUp}
        />
        <StatCard
          title="Messes"
          value={data.summary.totalMesses}
          subtitle={`${data.summary.activeMesses} active now`}
          icon={Building2}
        />
        <StatCard
          title="Pending Ops"
          value={data.summary.totalPendingOperations}
          subtitle={`${data.summary.pendingExpenses} expenses, ${data.summary.pendingDepositRequests} deposits, ${data.summary.pendingInvitations} invites`}
          icon={Clock3}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="rounded-2xl border-border shadow-sm lg:col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Growth Trend: New Users vs New Messes
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Tracks adoption velocity over time to detect growth acceleration
              or slowdowns.
            </p>
          </CardHeader>
          <CardContent className="h-70">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={growthTrend}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="usersGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient
                    id="messesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 11 }}
                  minTickGap={16}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="newUsers"
                  name="New Users"
                  stroke="#2563eb"
                  fill="url(#usersGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="newMesses"
                  name="New Messes"
                  stroke="#16a34a"
                  fill="url(#messesGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Actionable Progress</CardTitle>
            <p className="text-xs text-muted-foreground">
              Health ratios tied to admin outcomes.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <InsightProgress metric={data.progress.activationRate} />
            <InsightProgress metric={data.progress.managerCoverage} />
            <InsightProgress metric={data.progress.operationsClearance} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="rounded-2xl border-border shadow-sm lg:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Invitation Funnel Trend</CardTitle>
            <p className="text-xs text-muted-foreground">
              Pending, accepted, and expired invitations by day reveal
              conversion friction.
            </p>
          </CardHeader>
          <CardContent className="h-70">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={invitationTrend}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 11 }}
                  minTickGap={16}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar
                  stackId="invites"
                  dataKey="accepted"
                  name="Accepted"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  stackId="invites"
                  dataKey="pending"
                  name="Pending"
                  fill="#f59e0b"
                />
                <Bar
                  stackId="invites"
                  dataKey="expired"
                  name="Expired"
                  fill="#dc2626"
                  radius={[0, 0, 4, 4]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm lg:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Operations Backlog Trend
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Daily pending operations with a 7-day smoothing line.
            </p>
          </CardHeader>
          <CardContent className="h-70">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={operationsTrend}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 11 }}
                  minTickGap={16}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="pendingOperations"
                  name="Pending Ops"
                  fill="#0ea5e9"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="movingAvg"
                  name="7d Avg"
                  stroke="#111827"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="rounded-2xl border-border shadow-sm lg:col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Accounts</CardTitle>
            <p className="text-xs text-muted-foreground">
              Newest 5 accounts for moderation and onboarding checks.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between rounded-xl border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <Badge variant="secondary" className="uppercase">
                    {user.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Admin Quick Focus</CardTitle>
            <p className="text-xs text-muted-foreground">
              Jump to the workflow that can move current metrics.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              asChild
              variant="outline"
              className="w-full justify-between"
            >
              <Link href="/dashboard/admin/users">
                Manage users and roles
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-between"
            >
              <Link href="/dashboard/admin/mess-management">
                Improve mess activation
                <ShieldCheck className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-between"
            >
              <Link href="/dashboard/admin/finances-report">
                Clear pending finance operations
                <Clock3 className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
