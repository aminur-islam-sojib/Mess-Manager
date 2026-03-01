import { getMessMembers } from "@/actions/server/Mess";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import MessExpenseManagement from "@/components/ManagerComponents/Expense/MessExpenseManagement";
import { getServerSession } from "next-auth";

export default async function ExpensePage() {
  const messData = await getMessMembers();
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user.id;
  const membershipRole = messData.members?.find(
    (member) => member.userId === currentUserId,
  )?.role;
  const role = membershipRole === "manager" ? "manager" : "user";

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

  if (!session?.user?.id) {
    return (
      <div>
        <h1>User role needed</h1>
      </div>
    );
  }

  return <MessExpenseManagement messData={serializedMessData} role={role} />;
}
