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
  try {
    // ❌ Invalid token
    if (!token || typeof token !== "string") {
      return {
        success: false,
        error: "Invalid invitation token",
        errorType: "invalid" as const,
        invitation: null,
      };
    }

    const invitationCollection = dbConnect(collections.INVITATIONS);
    const messCollection = dbConnect(collections.MESS);
    const userCollection = dbConnect(collections.USERS);

    // 🔍 Find invitation (without expiry filter first)
    const invitation = await invitationCollection.findOne({ token });

    if (!invitation) {
      return {
        success: false,
        error: "Invitation not found",
        errorType: "notfound" as const,
        invitation: null,
      };
    }

    // ❌ Already used
    if (invitation.status === "accepted") {
      return {
        success: false,
        error: "Invitation already used",
        errorType: "used" as const,
        invitation: null,
      };
    }

    // ❌ Expired
    if (invitation.expiresAt < new Date()) {
      return {
        success: false,
        error: "Invitation expired",
        errorType: "expired" as const,
        invitation: null,
      };
    }

    // 🔐 Optional: email-based authorization
    const session = await getServerSession(authOptions);
    if (
      session?.user?.email &&
      session.user.email !== invitation.invitedEmail
    ) {
      return {
        success: false,
        error: "Unauthorized invitation access",
        errorType: "unauthorized" as const,
        invitation: null,
      };
    }

    // 🏠 Find mess
    const mess = await messCollection.findOne({
      _id: new ObjectId(invitation.messId),
    });

    if (!mess) {
      return {
        success: false,
        error: "Mess not found",
        errorType: "general" as const,
        invitation: null,
      };
    }

    // 👤 Find manager
    const manager = await userCollection.findOne({
      _id: new ObjectId(mess.managerId),
    });

    return {
      success: true,
      invitation: {
        messName: mess.messName,
        memberCount: mess.members?.length || 0,
        inviterName: manager?.name || "Unknown",
        expiresAt: invitation.expiresAt,
      },
    };
  } catch (error) {
    console.error("❌ Invitation Preview Error:", error);
    return {
      success: false,
      error: "Failed to validate invitation",
      errorType: "general" as const,
      invitation: null,
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
