"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { collections, dbConnect } from "@/lib/dbConnect";
import type { PendingInvitation } from "@/types/ManagerSettings";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { sendInvitationEmail } from "./email";

type ActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

type ManagerContext = {
  userId: ObjectId;
  sessionUser: {
    name?: string | null;
    email?: string | null;
  };
  mess: {
    _id: ObjectId;
    messName?: string;
    managerId: ObjectId;
    managerEmail?: string;
    [key: string]: unknown;
  };
};

type InvitationDocument = {
  _id: ObjectId;
  messId: ObjectId;
  email?: string;
  invitedEmail?: string;
  status: string;
  token?: string;
  createdAt: Date;
};

const SETTINGS_REVALIDATE_PATHS = [
  "/dashboard/manager",
  "/dashboard/manager/settings",
  "/dashboard/manager/members",
  "/dashboard/manager/invite",
  "/dashboard/manager/deposits",
  "/dashboard/manager/expenses",
  "/dashboard/manager/meals",
  "/dashboard/user",
];

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

const parseObjectId = (value: string | null | undefined): ObjectId | null => {
  if (!value) return null;

  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
};

const trimText = (value: string | null | undefined) => value?.trim() ?? "";
const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const revalidateInvitationPaths = () => {
  for (const path of SETTINGS_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
};

const serializeInvitation = (
  invitation: InvitationDocument,
): PendingInvitation => ({
  id: invitation._id.toString(),
  email: invitation.email ?? invitation.invitedEmail ?? "",
  status: invitation.status,
  createdAt: invitation.createdAt.toISOString(),
  inviteLink: invitation.token
    ? `${APP_URL}/dashboard/user/invite?token=${invitation.token}`
    : "",
});

async function getManagerContext(): Promise<ManagerContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "manager") {
    throw new Error("You are not authorized");
  }

  const userId = new ObjectId(session.user.id);

  const mess = await dbConnect(collections.MESS).findOne({
    managerId: userId,
    status: "active",
  });

  if (!mess) {
    throw new Error("No active mess found for this manager");
  }

  return {
    userId,
    sessionUser: {
      name: session.user.name,
      email: session.user.email,
    },
    mess: {
      ...mess,
      _id: mess._id as ObjectId,
      managerId: mess.managerId as ObjectId,
    },
  };
}

export async function acceptInvitation(token: string, userId: string) {
  if (!token || !userId) {
    return { success: false, message: "Token and userId required" };
  }

  try {
    const invitationCol = dbConnect(collections.INVITATIONS);
    const messMemberCol = dbConnect(collections.MESS_MEMBERS);

    const invitation = await invitationCol.findOne({
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

    const messId = new ObjectId(invitation.messId);
    const userObjectId = new ObjectId(userId);

    const existingMember = await messMemberCol.findOne({
      messId,
      userId: userObjectId,
      status: "active",
    });

    if (existingMember) {
      return {
        success: false,
        message: "User already a member of this mess",
      };
    }

    await messMemberCol.insertOne({
      messId,
      userId: userObjectId,
      role: "member",
      status: "active",
      joinDate: new Date(),
      createdAt: new Date(),
    });

    await invitationCol.updateOne(
      { _id: invitation._id },
      {
        $set: {
          status: "accepted",
          acceptedBy: userObjectId,
          acceptedAt: new Date(),
        },
      },
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/user");
    revalidatePath("/dashboard/manager");

    return {
      success: true,
      message: "Successfully joined the mess",
      messId: messId.toString(),
    };
  } catch (error) {
    console.error("Accept Invitation Error:", error);
    return {
      success: false,
      message: "Failed to accept invitation",
    };
  }
}

export const getInvitationByToken = async (token: string) => {
  try {
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

    const invitation = await invitationCollection.findOne({ token });

    if (!invitation) {
      return {
        success: false,
        error: "Invitation not found",
        errorType: "notfound" as const,
        invitation: null,
      };
    }

    if (invitation.status === "accepted") {
      return {
        success: false,
        error: "Invitation already used",
        errorType: "used" as const,
        invitation: null,
      };
    }

    if (invitation.expiresAt < new Date()) {
      return {
        success: false,
        error: "Invitation expired",
        errorType: "expired" as const,
        invitation: null,
      };
    }

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

    const manager = await userCollection.findOne({
      _id: new ObjectId(mess.managerId),
    });

    const memberCount = await dbConnect(
      collections.MESS_MEMBERS,
    ).countDocuments({
      messId: mess._id,
      status: "active",
    });

    return {
      success: true,
      invitation: {
        messName: mess.messName,
        memberCount,
        inviterName: manager?.name || "Unknown",
        expiresAt: invitation.expiresAt,
      },
    };
  } catch (error) {
    console.error("Invitation Preview Error:", error);
    return {
      success: false,
      error: "Failed to validate invitation",
      errorType: "general" as const,
      invitation: null,
    };
  }
};

export async function sendMessInvitation(payload: {
  email: string;
}): Promise<ActionResult & { inviteLink?: string }> {
  try {
    const { mess, sessionUser } = await getManagerContext();
    const email = trimText(payload.email).toLowerCase();

    if (!isValidEmail(email)) {
      return { success: false, message: "A valid email address is required" };
    }

    const existingUser = await dbConnect(collections.USERS).findOne({ email });
    if (existingUser) {
      const membership = await dbConnect(collections.MESS_MEMBERS).findOne({
        messId: mess._id,
        userId: existingUser._id,
        status: "active",
      });

      if (membership) {
        return {
          success: false,
          message: "This user is already a member of your mess",
        };
      }
    }

    const invitationCollection = dbConnect(collections.INVITATIONS);
    const existingPending = await invitationCollection.findOne({
      messId: mess._id,
      $or: [{ email }, { invitedEmail: email }],
      status: "pending",
    });

    if (existingPending) {
      return {
        success: false,
        message: "A pending invitation already exists for this email",
      };
    }

    const token = crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await invitationCollection.insertOne({
      messId: mess._id,
      messName: mess.messName,
      managerId: mess.managerId,
      email,
      invitedEmail: email,
      token,
      status: "pending",
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const inviteLink = `${APP_URL}/dashboard/user/invite?token=${token}`;

    await sendInvitationEmail(
      email,
      inviteLink,
      typeof mess.messName === "string" ? mess.messName : "your mess",
      sessionUser.name ?? "Manager",
    );

    revalidateInvitationPaths();

    return {
      success: true,
      message: "Invitation sent successfully",
      inviteLink,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to send invitation",
    };
  }
}

export async function sendInvitationAction(invitedEmail: string) {
  const result = await sendMessInvitation({ email: invitedEmail });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return {
    success: true,
    inviteLink: result.inviteLink,
  };
}

export async function getPendingInvitations(): Promise<
  | { success: true; invitations: PendingInvitation[] }
  | { success: false; message: string }
> {
  try {
    const { mess } = await getManagerContext();
    const invitations = await dbConnect(collections.INVITATIONS)
      .find({
        messId: mess._id,
        status: "pending",
      })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      success: true,
      invitations: (invitations as InvitationDocument[]).map(
        serializeInvitation,
      ),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch pending invitations",
    };
  }
}

export async function cancelInvitation(
  invitationId: string,
): Promise<ActionResult> {
  try {
    const { mess } = await getManagerContext();
    const invitationObjectId = parseObjectId(invitationId);

    if (!invitationObjectId) {
      return { success: false, message: "Invalid invitation ID" };
    }

    const result = await dbConnect(collections.INVITATIONS).updateOne(
      {
        _id: invitationObjectId,
        messId: mess._id,
        status: "pending",
      },
      {
        $set: {
          status: "cancelled",
          updatedAt: new Date(),
          cancelledAt: new Date(),
        },
      },
    );

    if (!result.matchedCount) {
      return { success: false, message: "Invitation not found" };
    }

    revalidateInvitationPaths();
    return { success: true, message: "Invitation cancelled" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to cancel invitation",
    };
  }
}
