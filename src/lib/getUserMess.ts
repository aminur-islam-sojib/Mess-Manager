import { ObjectId } from "mongodb";
import { collections, dbConnect } from "@/lib/dbConnect";

export const getUserMess = async (userId: ObjectId) => {
  const messCollection = dbConnect(collections.MESS);
  const memberCollection = dbConnect(collections.MESS_MEMBERS);

  // 1️⃣ Check manager
  const mess = await messCollection.findOne({
    managerId: userId,
    status: "active",
  });

  if (mess) return mess;

  // 2️⃣ Check member
  const membership = await memberCollection.findOne({
    userId,
    status: "active",
  });

  if (!membership) return null;

  // 3️⃣ Resolve mess
  return await messCollection.findOne({
    _id: membership.messId,
    status: "active",
  });
};
