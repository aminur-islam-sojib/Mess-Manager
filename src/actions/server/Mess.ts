"use server";
import { collections, dbConnect } from "@/lib/dbConnect";
import { CreateMessPayload } from "@/types/MessTypes";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const createMess = async (payload: CreateMessPayload) => {
  const { managerId, messName, managerEmail } = payload;

  const messCollection = dbConnect(collections.MESS);
  const userCollection = dbConnect(collections.USERS);
  const memberCollection = dbConnect(collections.MESS_MEMBERS);

  const managerObjectId = new ObjectId(managerId);

  // 1️⃣ Check user exists
  const user = await userCollection.findOne({ _id: managerObjectId });
  if (!user) {
    return { success: false, message: "User not found" };
  }

  // 2️⃣ Prevent duplicate mess
  const existingMess = await messCollection.findOne({
    managerId: managerObjectId,
  });

  if (existingMess) {
    return { success: false, message: "Mess already exists" };
  }

  // 3️⃣ Create mess
  const messResult = await messCollection.insertOne({
    messName,
    managerId: managerObjectId,
    managerEmail,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const messId = messResult.insertedId;

  // 4️⃣ Insert MANAGER into mess_members 🔥
  await memberCollection.insertOne({
    messId,
    userId: managerObjectId,
    role: "manager",
    status: "active",
    joinDate: new Date(),
    createdAt: new Date(),
  });

  // 5️⃣ Update user role
  await userCollection.updateOne(
    { _id: managerObjectId },
    {
      $set: {
        role: "manager",
        updatedAt: new Date(),
      },
    }
  );

  // 6️⃣ Revalidate cache
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/manager");
  revalidatePath("/dashboard/user");

  return {
    success: true,
    message: "Mess created & manager added",
    messId: messId.toString(),
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

export const getMessMembers = async () => {
  try {
    // 🔐 Auth check
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    const managerId = new ObjectId(session.user.id);

    const messCollection = dbConnect(collections.MESS);
    const memberCollection = dbConnect(collections.MESS_MEMBERS);
    const userCollection = dbConnect(collections.USERS);

    // 1️⃣ Find manager's mess
    const mess = await messCollection.findOne({
      managerId,
      status: "active",
    });

    if (!mess) {
      return {
        success: false,
        message: "No active mess found for this manager",
      };
    }

    // 2️⃣ Get all active members of the mess
    const messMembers = await memberCollection
      .find({
        messId: mess._id,
        status: "active",
      })
      .toArray();

    if (messMembers.length === 0) {
      return {
        success: true,
        members: [],
      };
    }

    // 3️⃣ Get user details
    const userIds = messMembers.map((m) => m.userId);

    const users = await userCollection
      .find(
        { _id: { $in: userIds } },
        { projection: { password: 0 } } // 🔐 Never expose password
      )
      .toArray();

    // 4️⃣ Merge member + user data
    const members = messMembers.map((member) => {
      const user = users.find(
        (u) => u._id.toString() === member.userId.toString()
      );

      return {
        userId: member.userId.toString(),
        name: user?.name || "Unknown",
        email: user?.email || "Unknown",
        role: member.role,
        status: member.status,
        joinDate: member.joinDate?.toISOString(),
      };
    });

    return {
      success: true,
      messId: mess._id.toString(),
      messName: mess.messName,
      members,
    };
  } catch (error) {
    console.error("❌ Error fetching mess users:", error);
    return {
      success: false,
      message: "Failed to fetch mess users",
    };
  }
};
