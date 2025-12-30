"use server";
import { collections, dbConnect } from "@/lib/dbConnect";
import { CreateMessPayload, SerializableMess } from "@/types/MessTypes";
import { ObjectId, Document } from "mongodb";

type RawMessDoc = Document & {
  _id: ObjectId;
  managerId: ObjectId;
  members?: ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
};

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

export const getSingleMess = async (managerId: string) => {
  if (!managerId) {
    return false;
  }

  try {
    const mess = await dbConnect(collections.MESS).findOne({
      managerId: new ObjectId(managerId),
      status: "active",
    });

    if (!mess) {
      return {
        success: false,
        message: "Mess not found",
      };
    }

    const doc = mess as RawMessDoc;
    const serial: SerializableMess = {
      ...doc,
      _id: doc._id?.toString(),
      managerId: doc.managerId?.toString(),
      members: (doc.members || []).map((m) => m?.toString()),
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    } as SerializableMess;

    return {
      success: true,
      mess: serial,
    };
  } catch (error) {
    console.error("❌ Error fetching mess:", error);
    return {
      success: false,
      message: "Failed to fetch mess",
    };
  }
};
