import { getManagerDashboardOverview } from "@/actions/server/Admin";
import { getCurrentMonthCostPerMeal } from "@/actions/server/Expense";
import { getSingleMessForUser } from "@/actions/server/Mess";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import ManagerHeader from "@/components/ManagerComponents/ManagerHeader";
import QuickActions from "@/components/Shared/Managers/Overview";
import CreateMessButton from "@/components/Shared/NoMess";
import { Users, Receipt, Clock, CheckCircle, DollarSign } from "lucide-react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

export default async function ManagerDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const role = session.user.role;
  if (role !== "user" && role !== "manager") {
    notFound();
  }

  const messData = await getSingleMessForUser(session.user.id);

  if (!messData || !messData.success) {
    return <CreateMessButton />;
  }

  // Fetching your real data
  const managerData = await getManagerDashboardOverview();

  // Safety check if data fails to load
  if (!managerData.success) {
    return (
      <div className="p-10 text-center text-red-500">{managerData.message}</div>
    );
  }
  const currentMonthCostPerMeal = await getCurrentMonthCostPerMeal();
  console.log(currentMonthCostPerMeal);
  return (
    <div className="min-h-screen bg-background lg:flex">
      <div className="flex-1 ">
        <main className="lg:pb-6">
          <div className="max-w-7xl mx-auto  space-y-6">
            {messData && <ManagerHeader messData={messData} />}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Members */}
              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Members
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {managerData.stats.totalMembers}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {managerData.stats.activeMembers} active
                </p>
              </div>

              {/* Monthly Expense */}
              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    This Month
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  ৳{managerData.stats.totalCostThisMonth}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last month: ৳{managerData.stats.totalCostLastMonth}
                </p>
              </div>

              {/* Pending Approvals */}
              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Pending
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {managerData.stats.pendingExpenses}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Need approval
                </p>
              </div>

              {/* Avg Daily Cost */}
              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Daily Avg
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  ৳{managerData.stats.averageDailyCost.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Per day cost
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <QuickActions />

            {/* Recent Expenses - Mapping from real Array(3) */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">
                  Recent Expenses
                </h3>
                <button className="text-sm text-primary font-medium hover:underline">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {managerData.recentExpenses.map((expense) => {
                  const expenseId =
                    typeof expense._id === "string"
                      ? expense._id
                      : expense._id.toString();
                  return (
                    <div
                      key={expenseId}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {expense.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Verified Transaction
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          ৳{expense.amount || 0}
                        </p>
                        <p className="text-xs font-medium text-primary">
                          Completed
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
