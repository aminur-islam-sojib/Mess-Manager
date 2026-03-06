import { getUsersCostSummary } from "@/actions/server/Deposit";
import { getMessMembers } from "@/actions/server/Mess";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import AddDeposit from "@/components/ManagerComponents/Deposits/AddDeposits";
import { DataTable } from "@/components/ManagerComponents/Deposits/data-table";
import { getServerSession } from "next-auth";
import {
  columns,
  UserLedger,
} from "@/components/ManagerComponents/Deposits/Columns";

export default async function page() {
  const session = await getServerSession(authOptions);
  const costSummery = await getUsersCostSummary();
  const messData = await getMessMembers();
  const role = session?.user.role;
  const data = costSummery.data as UserLedger[];

  const serializedMessData = messData.success
    ? {
        success: true as const,
        messId: messData.messId,
        messName: messData.messName,
        members: JSON.parse(JSON.stringify(messData.members)),
      }
    : {
        success: false as const,
        message: messData.message,
      };

  if (!role) {
    return (
      <div>
        <h1>User role needed</h1>
      </div>
    );
  }
  return (
    <main className="container mx-auto">
      <div className=" flex justify-between">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
          Financial Overview
        </h1>
        <AddDeposit messData={serializedMessData} />
      </div>
      <DataTable columns={columns} data={data} />
    </main>
  );
}
