import { getUserProfileFinancialSummary } from "@/actions/server/Profile";
import { UserFinancialSummaryCard } from "@/components/Shared/Profile/Profile";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const param = await params;

  const userFinanceSummery = await getUserProfileFinancialSummary(param.id);

  if (!userFinanceSummery.success) {
    return (
      <div className="p-4 text-sm text-destructive">
        {userFinanceSummery.message}
      </div>
    );
  }

  if (!userFinanceSummery.success) {
    return <div> data not found</div>;
  }

  return <UserFinancialSummaryCard data={userFinanceSummery.data} />;
}
