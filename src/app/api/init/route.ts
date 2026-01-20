// app/api/init/route.ts
import { ensureMealEntryIndexes } from "@/lib/dbIndexes";

export async function GET() {
  await ensureMealEntryIndexes();
  return Response.json({ success: true });
}
