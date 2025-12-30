"use server";
import { collections, dbConnect } from "@/lib/dbConnect";
import { CreateMessPayload } from "@/types/MessTypes";
import { ObjectId } from "mongodb";

export const createMess = async (payload: CreateMessPayload) => {
  const { managerId, messName, managerEmail } = payload;

  const messCollection = dbConnect(collections.MESS);
  const userCollection = dbConnect(collections.USERS);

  // 1. Check user exists
  const user = await userCollection.findOne({
    _id: new ObjectId(managerId),
  });

  if (!user) {
    return {
      success: false,
      message: "User not found",
    };
  }

  // 2. Prevent duplicate mess
  const existingMess = await messCollection.findOne({
    managerId: new ObjectId(managerId),
  });

  if (existingMess) {
    return {
      success: false,
      message: "Mess already exists",
    };
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

  // 4. Update role AFTER mess creation
  await userCollection.updateOne(
    { _id: new ObjectId(managerId) },
    {
      $set: {
        role: "manager",
        updatedAt: new Date(),
      },
    }
  );

  return {
    success: true,
    message: "Mess created & role updated",
    messId: messResult.insertedId,
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
    const mess = await dbConnect(collections.MESS).findOne({
      status: "active",
      $or: [
        { managerId: new ObjectId(userId) },
        { members: new ObjectId(userId) },
      ],
    });

    if (!mess) {
      return {
        success: false,
        message: "No mess found for this user",
      };
    }

    const isManager = mess.managerId?.toString() === userId.toString();

    // 🔐 DATA SHAPING BASED ON ROLE
    if (!isManager) {
      // 👉 Member view (LIMITED)
      return {
        success: true,
        role: "member",
        mess: {
          _id: mess._id.toString(),
          messName: mess.messName,
          managerId: mess.managerId.toString(),
        },
      };
    }

    // 👉 Manager view (FULL)
    return {
      success: true,
      role: "manager",
      mess: {
        _id: mess._id.toString(),
        messName: mess.messName,
        managerId: mess.managerId.toString(),
        members: (mess.members || []).map((m: string) => m.toString()),
        status: mess.status,
        createdAt: mess.createdAt?.toISOString(),
        updatedAt: mess.updatedAt?.toISOString(),
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
