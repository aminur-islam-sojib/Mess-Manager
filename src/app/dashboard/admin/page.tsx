import { getAdminHomeInsights } from "@/actions/server/Admin";
import AdminHomeAnalytics from "@/components/Shared/Admin/AdminHomeAnalytics";

export default async function AdminPage() {
  const data = await getAdminHomeInsights({ days: 30 });

  if (!data.success) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {data.message}
      </div>
    );
  }

  return (
    <AdminHomeAnalytics
      data={{
        ...data,
        recentUsers: data.recentUsers.map((user) => ({
          ...user,
          _id: user._id.toString(),
        })),
      }}
    />
  );
}
