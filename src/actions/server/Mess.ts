"use server";
import { collections, dbConnect } from "@/lib/dbConnect";
import { CreateMessPayload } from "@/types/MessTypes";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";

export const createMess = async (payload: CreateMessPayload) => {
  const { managerId, messName, managerEmail } = payload;

  const messCollection = dbConnect(collections.MESS);
  const userCollection = dbConnect(collections.USERS);

  // 1. Check user exists
  const user = await userCollection.findOne({
    _id: new ObjectId(managerId),
  });

  if (!user) {
    return { success: false, message: "User not found" };
  }

  // 2. Prevent duplicate mess
  const existingMess = await messCollection.findOne({
    managerId: new ObjectId(managerId),
  });

  if (existingMess) {
    return { success: false, message: "Mess already exists" };
  }

  // 3. Create mess
  const messResult = await messCollection.insertOne({
    messName,
    managerId: new ObjectId(managerId),
    managerEmail,
    members: [new ObjectId(managerId)],
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 4. Update role
  await userCollection.updateOne(
    { _id: new ObjectId(managerId) },
    {
      $set: {
        role: "manager",
        updatedAt: new Date(),
      },
    }
  );

  // 🔥 5. REVALIDATE DASHBOARD CACHE
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/manager");
  revalidatePath("/dashboard/user");

  return {
    success: true,
    message: "Mess created & role updated",
    messId: messResult.insertedId.toString(),
  };
};

export const getSingleMessForUser = async (userId: string) => {
  if (!userId) {
    return {
      success: false,
      message: "User id required",
    };
  }

  try {
    const messCollection = dbConnect(collections.MESS);
    const memberCollection = dbConnect(collections.MESS_MEMBERS);

    const userObjectId = new ObjectId(userId);

    // 1️⃣ Check if user is MANAGER
    const managedMess = await messCollection.findOne({
      managerId: userObjectId,
      status: "active",
    });

    if (managedMess) {
      return {
        success: true,
        role: "manager",
        mess: {
          _id: managedMess._id.toString(),
          messName: managedMess.messName,
          managerId: managedMess.managerId.toString(),
          status: managedMess.status,
          createdAt: managedMess.createdAt?.toISOString(),
          updatedAt: managedMess.updatedAt?.toISOString(),
        },
      };
    }

    // 2️⃣ Check if user is MEMBER
    const membership = await memberCollection.findOne({
      userId: userObjectId,
      status: "active",
    });

    if (!membership) {
      return {
        success: false,
        message: "No mess found for this user",
      };
    }

    // 3️⃣ Fetch mess info
    const mess = await messCollection.findOne({
      _id: new ObjectId(membership.messId),
      status: "active",
    });

    if (!mess) {
      return {
        success: false,
        message: "Mess not found",
      };
    }

    // 👉 Member view (LIMITED DATA)
    return {
      success: true,
      role: membership.role || "member",
      mess: {
        _id: mess._id.toString(),
        messName: mess.messName,
        managerId: mess.managerId.toString(),
      },
    };
  } catch (error) {
    console.error("❌ Error fetching mess:", error);
    return {
      success: false,
      message: "Failed to fetch mess",
    };
  }
};

// Backwards-compatible alias for code that imports `getSingleMess`
export const getSingleMess = getSingleMessForUser;

export const getMessMember = async (userid: string) => {};
