import { getAllExpenses } from "@/actions/server/Expense";
import { getMessMembers } from "@/actions/server/Mess";
import MessExpenseManagement from "@/components/ManagerComponents/Expense/MessExpenseManagement";

export default async function ExpensePage() {
  const messData = await getMessMembers();

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

  return (
    <MessExpenseManagement
      messData={serializedMessData}
      allExpenses={allExpenses}
    />
  );
}
