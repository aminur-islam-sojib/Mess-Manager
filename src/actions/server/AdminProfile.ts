"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";

import { AuthorizationError, requireAdminRole } from "@/lib/auth.utils";
import { collections, dbConnect } from "@/lib/dbConnect";
import { normalizeProfileImage } from "@/lib/profileImage";

type AdminOwnProfileResult =
  | {
      success: true;
      message: string;
      data: {
        id: string;
        name: string;
        email: string;
        phone: string;
        image: string | null;
      };
    }
  | {
      success: false;
      message: string;
    };

const trimText = (value: string | null | undefined) => value?.trim() ?? "";

const isValidPhone = (value: string) =>
  value === "" || /^[0-9+()\-\s]{7,20}$/.test(value);

const isTrustedImageUrl = (value: string) => {
  if (!value) return true;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return false;
    }

    const host = url.hostname.toLowerCase();
    return host === "i.ibb.co" || host.endsWith(".i.ibb.co");
  } catch {
    return false;
  }
};

export async function getAdminOwnProfile(): Promise<AdminOwnProfileResult> {
  try {
    const session = await requireAdminRole();
    const adminId = new ObjectId(session.user.id);

    const user = await dbConnect(collections.USERS).findOne({ _id: adminId });

    if (!user) {
      return {
        success: false,
        message: "Admin profile not found",
      };
    }

    return {
      success: true,
      message: "Admin profile loaded",
      data: {
        id: user._id.toString(),
        name: String(user.name || session.user.name || "Admin"),
        email: String(user.email || session.user.email || ""),
        phone: String(user.phone || ""),
        image: typeof user.image === "string" ? user.image : null,
      },
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error("Admin profile load error:", error);
    return {
      success: false,
      message: "Failed to load admin profile",
    };
  }
}

export async function updateAdminOwnProfile(payload: {
  name: string;
  phone: string;
  image?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await requireAdminRole();
    const adminId = new ObjectId(session.user.id);

    const name = trimText(payload.name);
    const phone = trimText(payload.phone);
    const image = trimText(payload.image) || null;
    const normalizedImage = normalizeProfileImage(image);

    if (name.length < 2) {
      return {
        success: false,
        message: "Name must be at least 2 characters",
      };
    }

    if (!isValidPhone(phone)) {
      return {
        success: false,
        message: "Phone number format is invalid",
      };
    }

    if (image && !isTrustedImageUrl(image)) {
      return {
        success: false,
        message: "Profile image must be a valid ImgBB URL",
      };
    }

    await dbConnect(collections.USERS).updateOne(
      { _id: adminId },
      {
        $set: {
          name,
          phone,
          image: normalizedImage.image,
          imageUploadedAt: normalizedImage.imageUploadedAt,
          updatedAt: new Date(),
        },
      },
    );

    revalidatePath("/dashboard/admin/settings");
    revalidatePath("/dashboard/admin");

    return {
      success: true,
      message: "Admin profile updated successfully",
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error("Admin profile update error:", error);
    return {
      success: false,
      message: "Failed to update admin profile",
    };
  }
}
