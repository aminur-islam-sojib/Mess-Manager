import { getUsersCostSummary } from "@/actions/server/Deposit";
import { getMessMembers } from "@/actions/server/Mess";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import AddDeposit from "@/components/ManagerComponents/Deposits/AddDeposits";
import LedgerPage from "@/components/ManagerComponents/Deposits/LedgerPage";
import { getServerSession } from "next-auth";

export default async function page() {
  const messData = await getMessMembers();
  const session = await getServerSession(authOptions);
  const role = session?.user.role;
  const costSummery = await getUsersCostSummary();
  console.log("costSummery", costSummery);

  // Serialize data to ensure no ObjectId or other non-serializable objects are passed
  const serializedMessData = {
    success: messData.success,
    messId: messData.messId || undefined,
    messName: messData.messName || undefined,
    members: messData.members
      ? JSON.parse(JSON.stringify(messData.members))
      : undefined,
    message: messData.message || undefined,
  };

  if (!role) {
    return (
      <div>
        <h1>User role needed</h1>
      </div>
    );
  }
  return (
    <div>
      <AddDeposit messData={serializedMessData} />
      <LedgerPage />
    </div>
  );
}
