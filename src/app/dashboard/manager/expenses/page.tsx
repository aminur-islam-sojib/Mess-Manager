import { getMessMembers } from "@/actions/server/Mess";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import MessExpenseManagement from "@/components/ManagerComponents/Expense/MessExpenseManagement";
import { getServerSession } from "next-auth";
import React from "react";

export default async function ExpensePage() {
  const messData = await getMessMembers();
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user.id;

  if (!session?.user?.id || !currentUserId) {
    return (
      <div>
        <h1>User role needed</h1>
      </div>
    );
  }

  if (!messData.success) {
    return (
      <div>
        <h1>{messData.message}</h1>
      </div>
    );
  }

  const membershipRole = messData.members.find(
    (member) => member.userId === currentUserId,
  )?.role;
  const role = membershipRole === "manager" ? "manager" : "user";

  // Serialize data to ensure no ObjectId or other non-serializable objects are passed
  const serializedMessData = {
    success: true as const,
    messId: messData.messId,
    messName: messData.messName,
    members: JSON.parse(JSON.stringify(messData.members)),
  };

  return <MessExpenseManagement messData={serializedMessData} role={role} />;
}
