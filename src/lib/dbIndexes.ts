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

export const ensureExpenseIndexes = async () => {
  const collection = dbConnect(collections.EXPENSES);

  await collection.createIndex({ messId: 1, expenseDate: -1 });
  await collection.createIndex({ messId: 1, status: 1, expenseDate: -1 });
  await collection.createIndex({
    messId: 1,
    paymentSource: 1,
    status: 1,
    expenseDate: -1,
  });
  await collection.createIndex({ messId: 1, addedBy: 1, expenseDate: -1 });
  await collection.createIndex({ messId: 1, paidBy: 1, expenseDate: -1 });

  console.log("✅ Expense indexes ensured");
};

export const ensureDepositIndexes = async () => {
  const depositCollection = dbConnect(collections.DEPOSITS);
  const depositRequestCollection = dbConnect(collections.DEPOSIT_REQUESTS);

  await depositCollection.createIndex({ messId: 1, userId: 1, date: -1 });
  await depositCollection.createIndex({ messId: 1, addedBy: 1, createdAt: -1 });

  await depositRequestCollection.createIndex({
    messId: 1,
    userId: 1,
    status: 1,
    createdAt: -1,
  });
  await depositRequestCollection.createIndex({
    messId: 1,
    requestedBy: 1,
    createdAt: -1,
  });

  console.log("✅ Deposit indexes ensured");
};
