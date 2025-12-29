import { collections, dbConnect } from "@/lib/dbConnect";
import { MessPayloadType } from "@/types/MessTypes";
import { ObjectId } from "mongodb";

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
      return {
        success: false,
        message: "Mess already exists for this manager",
        mess: isMessExist,
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

    return {
      success: true,
      mess,
    };
  } catch (error) {
    console.error("❌ Error fetching mess:", error);
    return {
      success: false,
      message: "Failed to fetch mess",
    };
  }
};
