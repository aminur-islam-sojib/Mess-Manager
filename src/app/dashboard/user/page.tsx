import { getSingleMessForUser } from "@/actions/server/Mess";
import { getUserHomeInsights } from "@/actions/server/UserDashboard";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import NotFoundPage from "@/app/not-found";
import NoMess from "@/components/Shared/NoMess";
import UserHomeInsights from "@/components/UserComponents/Home/UserHomeInsights";
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

  const dashboardData = await getUserHomeInsights();

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

  return <UserHomeInsights data={dashboardData.data} />;
}
