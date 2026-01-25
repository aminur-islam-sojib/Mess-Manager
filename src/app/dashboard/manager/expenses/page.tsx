import { getAllExpenses } from "@/actions/server/Expense";
import { getMessMembers } from "@/actions/server/Mess";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import MessExpenseManagement from "@/components/ManagerComponents/Expense/MessExpenseManagement";
import { getServerSession } from "next-auth";
import React from "react";

export default async function ExpensePage() {
  const messData = await getMessMembers();
  const session = await getServerSession(authOptions);
  const role = session?.user.role;

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

  const allExpenses = await getAllExpenses();
  if (!role) {
    return (
      <div>
        <h1>User role needed</h1>
      </div>
    );
  }

  console.log("all", allExpenses);

  return (
    <MessExpenseManagement
      messData={serializedMessData}
      allExpenses={allExpenses}
      role={role}
    />
  );
}
