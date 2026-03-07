import { getSingleMessForUser } from "@/actions/server/Mess";
import { getUserDashboardOverview } from "@/actions/server/UserDashboard";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import NotFoundPage from "@/app/not-found";
import NoMess from "@/components/Shared/NoMess";
import {
  Receipt,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  Utensils,
  FileText,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function UserDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const role = session.user.role;

  if (role !== "user" && role !== "manager") {
    NotFoundPage();
  }

  const messData = await getSingleMessForUser(session.user.id);

  if (!messData || !messData.success) {
    return (
      <div>
        <NoMess />
      </div>
    );
  }

  const dashboardData = await getUserDashboardOverview();

  if (!dashboardData.success) {
    return (
      <div className="min-h-screen bg-background lg:flex">
        <div className="flex-1 ">
          <main className="pb-20 lg:pb-6">
            <div className="max-w-7xl mx-auto  space-y-6">
              <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                <h3 className="font-semibold text-foreground mb-2">
                  Dashboard unavailable
                </h3>
                <p className="text-sm text-muted-foreground">
                  {dashboardData.message}
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { mess, stats, recentTransactions, mealHistory, upcomingBills, user } =
    dashboardData.data;
  const firstName = user.name.trim().split(" ").filter(Boolean)[0] || "Member";

  return (
    <div className="min-h-screen bg-background lg:flex">
      <div className="flex-1 ">
        <main className="pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto  space-y-6">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back, {firstName}!
                </h1>
                <p className="text-muted-foreground mt-1">
                  Track your meals and expenses at {mess.messName}
                </p>
              </div>
              <button className="p-3 rounded-xl hover:bg-accent transition-colors relative">
                <Bell className="w-6 h-6 text-foreground" />
                {stats.pendingPayments > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-destructive text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {stats.pendingPayments}
                  </span>
                )}
              </button>
            </div>

            {stats.currentBalance < 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Payment Due
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You have an outstanding balance of $
                    {Math.abs(stats.currentBalance).toLocaleString()}. Please
                    settle your dues.
                  </p>
                  <button className="mt-3 px-4 py-2 bg-destructive text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                    Pay Now
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign
                    className={`w-5 h-5 ${
                      stats.currentBalance >= 0
                        ? "text-primary"
                        : "text-destructive"
                    }`}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    Balance
                  </span>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    stats.currentBalance >= 0
                      ? "text-primary"
                      : "text-destructive"
                  }`}
                >
                  ${Math.abs(stats.currentBalance).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.currentBalance >= 0 ? "Credit" : "Due"}
                </p>
              </div>

              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    This Month
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  ${stats.monthlyExpense.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total expenses
                </p>
              </div>

              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Meals
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.mealsThisMonth}
                </p>
                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> On track
                </p>
              </div>

              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Pending
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.pendingPayments}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Payment due
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">
                Upcoming Bills
              </h3>
              <div className="space-y-3">
                {upcomingBills.length > 0 ? (
                  upcomingBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center gap-3 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">
                          {bill.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due:{" "}
                          {new Date(bill.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          ${bill.amount.toLocaleString()}
                        </p>
                        <button className="text-xs text-primary font-medium hover:underline mt-1">
                          Pay Now
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        No upcoming bills
                      </p>
                      <p className="text-xs text-muted-foreground">
                        You do not have any pending bill right now.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">
                  Recent Transactions
                </h3>
                <button className="text-sm text-primary font-medium hover:underline">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === "payment"
                            ? "bg-primary/10 text-primary"
                            : transaction.status === "pending"
                              ? "bg-orange-500/10 text-orange-500"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {transaction.type === "payment" ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : transaction.status === "pending" ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <Receipt className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
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
                          className={`font-semibold ${
                            transaction.amount > 0
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}$
                          {Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            transaction.status === "completed"
                              ? "text-primary"
                              : "text-orange-500"
                          }`}
                        >
                          {transaction.status === "completed"
                            ? "Completed"
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        No recent transactions
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Your payments and expenses will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">
                Recent Meals
              </h3>
              <div className="space-y-3">
                {mealHistory.length > 0 ? (
                  mealHistory.map((day, index) => (
                    <div
                      key={`${day.date}-${index}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              day.breakfast
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            Breakfast
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              day.lunch
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            Lunch
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              day.dinner
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            Dinner
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {
                            [day.breakfast, day.lunch, day.dinner].filter(
                              Boolean,
                            ).length
                          }
                          /3
                        </p>
                        <p className="text-xs text-muted-foreground">meals</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        No recent meals
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Your latest meal entries will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
