import { collections, dbConnect } from "@/lib/dbConnect";
import { MessPayloadType, SerializableMess } from "@/types/MessTypes";
import { ObjectId, Document } from "mongodb";

type RawMessDoc = Document & {
  _id: ObjectId;
  managerId: ObjectId;
  members?: ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
};

// Create Mess Function
export const createMess = async (payload: MessPayloadType) => {
  const { managerId, messName, managerEmail } = payload;

  const messInfo = {
    messName,
    managerId: new ObjectId(managerId),
    managerEmail,
    members: [new ObjectId(managerId)],
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const messCollection = dbConnect(collections.MESS);

    // One manager = one mess (business rule)
    const isMessExist = await messCollection.findOne({
      managerId: new ObjectId(managerId),
    });

    if (isMessExist) {
      const doc = isMessExist as RawMessDoc;
      const serial: SerializableMess = {
        ...doc,
        _id: doc._id?.toString(),
        managerId: doc.managerId?.toString(),
        members: (doc.members || []).map((m) => m?.toString()),
        createdAt: doc.createdAt?.toISOString(),
        updatedAt: doc.updatedAt?.toISOString(),
      } as SerializableMess;

      return {
        success: false,
        message: "Mess already exists for this manager",
        mess: serial,
      };
    }

    const result = await messCollection.insertOne(messInfo);

    return {
      success: true,
      message: "Mess created successfully",
      messId: result.insertedId,
    };
  } catch (error) {
    console.error("❌ Error creating mess:", error);
    return {
      success: false,
      message: "Failed to create mess",
    };
  }
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
