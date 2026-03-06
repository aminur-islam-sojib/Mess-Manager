import { getUsersCostSummary } from "@/actions/server/Deposit";
import { getColumns } from "./Columns";
import { DataTable } from "./data-table";
import type { UserLedger } from "@/types/Deposit";

export default async function LedgerPage() {
  const costSummery = await getUsersCostSummary();
  const data = costSummery.success ? (costSummery.data as UserLedger[]) : [];
  return (
    <main className="container mx-auto py-10">
      <div>
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
          Financial Overview
        </h1>
      </div>
      <DataTable columns={getColumns("manager")} data={data} />
    </main>
  );
}
