import { collections, dbConnect } from "@/lib/dbConnect";
import { ObjectId } from "mongodb";

/**
 * Find a user by email (single source of truth)
 */
export async function findUserByEmail(email: string) {
  if (!email) return null;

  const usersCollection = dbConnect(collections.USERS);

  return await usersCollection.findOne({ email });
}

/**
 * Create OAuth user (Google, GitHub, etc.)
 * Role is written ONCE
 */
export async function createOAuthUser({
  name,
  email,
  image,
  role = "user",
  provider,
}: {
  name?: string;
  email: string;
  image?: string;
  role?: "user" | "manager";
  provider: string;
}) {
  if (!email) {
    throw new Error("Email is required to create OAuth user");
  }

  const usersCollection = dbConnect(collections.USERS);

  const userDoc = {
    name: name || null,
    email,
    image: image || null,
    role,
    provider,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await usersCollection.insertOne(userDoc);

  return {
    ...userDoc,
    _id: result.insertedId as ObjectId,
  };
}
