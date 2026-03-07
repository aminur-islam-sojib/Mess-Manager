// app/api/init/route.ts
import {
  ensureDepositIndexes,
  ensureExpenseIndexes,
  ensureMealEntryIndexes,
} from "@/lib/dbIndexes";

export async function GET() {
  await ensureMealEntryIndexes();
  await ensureExpenseIndexes();
  await ensureDepositIndexes();
  return Response.json({ success: true });
}
