import { getSingleMessForUser } from "@/actions/server/Mess";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import ManagerHeader from "@/components/ManagerComponents/ManagerHeader";
import CreateMessButton from "@/components/Shared/NoMess";
import {
  Users,
  Receipt,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  UserPlus,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

// Mock data for dashboard
const mockData = {
  messName: "Sunrise Hostel Mess",
  totalMembers: 12,
  activeMembers: 10,
  monthlyExpense: 45230,
  pendingApprovals: 3,
  recentExpenses: [
    {
      id: 1,
      title: "Grocery Shopping",
      amount: 3500,
      date: "2024-12-26",
      status: "pending",
      submittedBy: "Alice Kumar",
    },
    {
      id: 2,
      title: "Vegetables & Fruits",
      amount: 1200,
      date: "2024-12-25",
      status: "approved",
      submittedBy: "Bob Singh",
    },
    {
      id: 3,
      title: "Monthly Gas Bill",
      amount: 850,
      date: "2024-12-24",
      status: "pending",
      submittedBy: "Charlie Patel",
    },
  ],
  memberStats: [
    { name: "Alice Kumar", meals: 28, balance: -450 },
    { name: "Bob Singh", meals: 30, balance: 120 },
    { name: "Charlie Patel", meals: 25, balance: -200 },
  ],
};

export default async function ManagerDashboard() {
  const session = await getServerSession(authOptions);

  // ❌ Not logged in → kick out
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const role = session.user.role;

  // ❌ Unknown role → show 404 (safety)
  if (role !== "user" && role !== "manager") {
    notFound();
  }

  const messData = await getSingleMessForUser(session.user.id);

  // If no mess exists
  if (!messData || !messData.success) {
    return <CreateMessButton />;
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <div className="flex-1 ">
        {/* Main Content */}
        <main className="pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            {/* Desktop Header - Only visible on desktop */}
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
                  {mockData.totalMembers}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {mockData.activeMembers} active
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
                  ${mockData.monthlyExpense.toLocaleString()}
                </p>
                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12% from last
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
                  {mockData.pendingApprovals}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Need approval
                </p>
              </div>

              {/* Avg Per Person */}
              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Per Person
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  ${Math.round(mockData.monthlyExpense / mockData.totalMembers)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Average cost
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                  <UserPlus className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Invite Member
                  </span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                  <Plus className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Add Expense
                  </span>
                </button>
              </div>
            </div>

            {/* Recent Expenses */}
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
                {mockData.recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        expense.status === "approved"
                          ? "bg-primary/10 text-primary"
                          : "bg-orange-500/10 text-orange-500"
                      }`}
                    >
                      {expense.status === "approved" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {expense.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By {expense.submittedBy}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ${expense.amount}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          expense.status === "approved"
                            ? "text-primary"
                            : "text-orange-500"
                        }`}
                      >
                        {expense.status === "approved" ? "Approved" : "Pending"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Members */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">
                Member Activity
              </h3>
              <div className="space-y-3">
                {mockData.memberStats.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.meals} meals
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          member.balance >= 0
                            ? "text-primary"
                            : "text-destructive"
                        }`}
                      >
                        ${Math.abs(member.balance)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.balance >= 0 ? "Credit" : "Due"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
