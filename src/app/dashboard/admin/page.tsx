import { getAdminDashboardOverview } from "@/actions/server/Admin";
import { Users, ShieldCheck, Building2, Clock3, Receipt } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
};

function StatCard({ title, value, subtitle, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export default async function AdminPage() {
  const data = await getAdminDashboardOverview();

  if (!data.success) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {data.message}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-sm text-muted-foreground">
          Global platform snapshot for users, messes, and pending operations.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Users"
          value={data.stats.totalUsers}
          subtitle={`${data.stats.totalMembers} active mess memberships`}
          icon={Users}
        />
        <StatCard
          title="Managers"
          value={data.stats.totalManagers}
          subtitle="Accounts with manager access"
          icon={ShieldCheck}
        />
        <StatCard
          title="Messes"
          value={data.stats.totalMesses}
          subtitle={`${data.stats.activeMesses} currently active`}
          icon={Building2}
        />
        <StatCard
          title="Pending Ops"
          value={data.stats.pendingExpenses + data.stats.pendingInvitations}
          subtitle={`${data.stats.pendingExpenses} expenses, ${data.stats.pendingInvitations} invites`}
          icon={Clock3}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Accounts
          </h2>
          <span className="text-xs text-muted-foreground">
            Last 5 created users
          </span>
        </div>

        <div className="space-y-3">
          {data.recentUsers.map((user) => (
            <div
              key={user._id.toString()}
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
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium uppercase text-primary">
                  {user.role}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Control Focus
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Next implementation steps: member controls, global expense moderation,
          and settings governance with audit logs.
        </p>
      </section>
    </div>
  );
}
