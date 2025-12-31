"use server";

import { collections, dbConnect } from "@/lib/dbConnect";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const acceptInvitation = async (token: string, userId: string) => {
  if (!token || !userId) {
    return {
      success: false,
      message: "Token and userId required",
    };
  }

  try {
    const invitationCollection = await dbConnect(collections.INVITATIONS);
    const messCollection = await dbConnect(collections.MESS);

    // 1️⃣ Find invitation
    const invitation = await invitationCollection.findOne({
      token,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      return {
        success: false,
        message: "Invalid or expired invitation",
      };
    }

    const messId = invitation.messId;
    const userObjectId = new ObjectId(userId);

    // 2️⃣ Add user to mess (prevent duplicate)
    const messUpdateResult = await messCollection.updateOne(
      {
        _id: messId,
        members: { $ne: userObjectId },
      },
      {
        $addToSet: { members: userObjectId },
        $set: { updatedAt: new Date() },
      }
    );

    if (messUpdateResult.matchedCount === 0) {
      return {
        success: false,
        message: "User already in mess or mess not found",
      };
    }

    // 3️⃣ Mark invitation as accepted
    await invitationCollection.updateOne(
      { _id: invitation._id },
      {
        $set: {
          status: "accepted",
          acceptedBy: userObjectId,
          acceptedAt: new Date(),
        },
      }
    );

    return {
      success: true,
      message: "Successfully joined the mess",
      messId: messId.toString(),
    };
  } catch (error) {
    console.error("❌ Accept Invitation Error:", error);
    return {
      success: false,
      message: "Failed to accept invitation",
    };
  }
};

export const getInvitationByToken = async (token: string) => {
  if (!token) {
    return { success: false };
  }

  try {
    const invitationCollection = await dbConnect(collections.INVITATIONS);
    const messCollection = await dbConnect(collections.MESS);

    const invitation = await invitationCollection.findOne({
      token,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      return {
        success: false,
        message: "Invalid or expired invitation",
      };
    }

    const mess = await messCollection.findOne({
      _id: invitation.messId,
    });

    if (!mess) {
      return {
        success: false,
        message: "Mess not found",
      };
    }

    return {
      success: true,
      invitation: {
        messName: mess.messName,
        expiresAt: invitation.expiresAt,
      },
    };
  } catch (error) {
    console.error("❌ Invitation Preview Error:", error);
    return {
      success: false,
      message: "Failed to load invitation",
    };
  }
};

export async function sendInvitationAction(invitedEmail: string) {
  // 🔐 Logged-in check
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }

  const managerId = session.user.id;

  // 🔍 Check manager's mess
  const mess = await dbConnect(collections.MESS).findOne({
    managerId: new ObjectId(managerId),
    status: "active",
  });

  if (!mess) {
    return { success: false, message: "Mess not found" };
  }

  // 🔐 Generate secure token
  const token = crypto.randomBytes(32).toString("hex");

  // ⏳ Expiry (24 hours)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // 📨 Save invitation
  await dbConnect(collections.INVITATIONS).insertOne({
    messId: mess._id,
    messName: mess.messName,
    managerId: new ObjectId(managerId),
    invitedEmail,
    token,
    status: "pending",
    expiresAt,
    createdAt: new Date(),
  });

  // 🔗 Invitation Link
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/user/invite?token=${token}`;

  return {
    success: true,
    inviteLink,
  };
}
