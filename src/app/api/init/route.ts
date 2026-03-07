// app/api/init/route.ts
import {
  ensureDepositIndexes,
  ensureExpenseIndexes,
  ensureMealEntryIndexes,
  ensureNotificationIndexes,
} from "@/lib/dbIndexes";

export async function GET() {
  await ensureMealEntryIndexes();
  await ensureExpenseIndexes();
  await ensureDepositIndexes();
  await ensureNotificationIndexes();
  return Response.json({ success: true });
}
