// app/api/init/route.ts
import { ensureExpenseIndexes, ensureMealEntryIndexes } from "@/lib/dbIndexes";

export async function GET() {
  await ensureMealEntryIndexes();
  await ensureExpenseIndexes();
  return Response.json({ success: true });
}
