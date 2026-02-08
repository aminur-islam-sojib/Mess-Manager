import { columns, UserLedger } from "./Columns";
import { DataTable } from "./data-table";

async function getData(): Promise<UserLedger[]> {
  // In a real scenario, this is a DB call: await db.user.findMany()
  return [
    {
      userId: "usr_01J2",
      name: "alex rivera",
      email: "alex@enterprise.com",
      totalCost: 1250.5,
      totalDeposit: 500.0,
    },
    {
      userId: "usr_09K3",
      name: "sarah chen",
      email: "sarah.c@techcorp.io",
      totalCost: 3400.0,
      totalDeposit: 0,
    },
  ];
}

export default async function LedgerPage() {
  const data = await getData();

  return (
    <main className="container mx-auto py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
        Financial Overview
      </h1>
      <DataTable columns={columns} data={data} />
    </main>
  );
}
