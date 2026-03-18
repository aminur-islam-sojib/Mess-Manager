import {
  getDepositRequests,
  getDepositRequestsForManager,
  getUsersCostSummary,
} from "@/actions/server/Deposit";
import { getMessMembers } from "@/actions/server/Mess";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import DepositsDashboard from "@/components/ManagerComponents/Deposits/DepositsDashboard";
import { AppRole } from "@/types/auth";
import { getServerSession } from "next-auth";

type DepositsDashboardPageProps = {
  viewer: AppRole;
};

export default async function DepositsDashboardPage({
  viewer,
}: DepositsDashboardPageProps) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return (
      <div>
        <h1>User role needed</h1>
      </div>
    );
  }

  const depositRequestsPromise =
    viewer === "manager"
      ? getDepositRequestsForManager()
      : getDepositRequests();

  const [costSummary, messData, depositRequests] = await Promise.all([
    getUsersCostSummary(),
    getMessMembers(),
    depositRequestsPromise,
  ]);

  if (!messData.success) {
    return (
      <div>
        <h1>{messData.message}</h1>
      </div>
    );
  }

  if (!costSummary.success) {
    return (
      <div>
        <h1>{costSummary.message}</h1>
      </div>
    );
  }

  if (!depositRequests.success) {
    return (
      <div>
        <h1>{depositRequests.message}</h1>
      </div>
    );
  }

  const serializedMessData = {
    success: true as const,
    messId: messData.messId,
    messName: messData.messName,
    members: JSON.parse(JSON.stringify(messData.members)),
  };

  return (
    <DepositsDashboard
      role={costSummary.role}
      messData={serializedMessData}
      ledgerData={costSummary.data}
      currentUserId={currentUserId}
      depositRequests={depositRequests.requests}
    />
  );
}
