// lib/dbIndexes.ts
import { dbConnect, collections } from "@/lib/dbConnect";

export const ensureMealEntryIndexes = async () => {
  const collection = dbConnect(collections.MEAL_ENTRIES);

  await collection.createIndex(
    { messId: 1, userId: 1, date: 1 },
    { unique: true }
  );

  console.log("✅ Meal entry index ensured");
};
