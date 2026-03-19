"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";

type UploadKind = "avatar" | "mess";

type ImageUploadResult =
  | {
      success: true;
      message: string;
      url: string;
      displayUrl: string;
      deleteUrl?: string;
    }
  | {
      success: false;
      message: string;
    };

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function estimateBase64Size(base64Data: string) {
  const padding = base64Data.endsWith("==")
    ? 2
    : base64Data.endsWith("=")
      ? 1
      : 0;
  return Math.floor((base64Data.length * 3) / 4) - padding;
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/,
  );

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    base64Data: match[2],
  };
}

export async function uploadImageToImgBB(params: {
  dataUrl: string;
  kind: UploadKind;
}): Promise<ImageUploadResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    if (
      params.kind === "mess" &&
      session.user.role !== "manager" &&
      session.user.role !== "admin"
    ) {
      return {
        success: false,
        message: "You are not authorized to upload mess images",
      };
    }

    const parsed = parseDataUrl(params.dataUrl || "");

    if (!parsed) {
      return {
        success: false,
        message: "Invalid image format. Please upload jpg, png, or webp.",
      };
    }

    if (!ALLOWED_MIME_TYPES.has(parsed.mimeType)) {
      return {
        success: false,
        message: "Only jpg, png, and webp images are allowed",
      };
    }

    const imageSize = estimateBase64Size(parsed.base64Data);
    if (imageSize <= 0 || imageSize > MAX_IMAGE_BYTES) {
      return {
        success: false,
        message: "Image size must be less than or equal to 3MB",
      };
    }

    const key = process.env.IMGBB_KEY;
    if (!key) {
      return {
        success: false,
        message: "Image upload is not configured",
      };
    }

    const body = new URLSearchParams();
    body.set("image", parsed.base64Data);
    body.set("name", `${params.kind}-${Date.now()}`);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
      method: "POST",
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Image upload failed. Please try again.",
      };
    }

    const payload = (await response.json()) as {
      success?: boolean;
      data?: {
        url?: string;
        display_url?: string;
        delete_url?: string;
      };
    };

    const finalUrl = payload.data?.url || payload.data?.display_url;
    if (!payload.success || !finalUrl) {
      return {
        success: false,
        message: "Image upload failed. Invalid upload response.",
      };
    }

    return {
      success: true,
      message: "Image uploaded successfully",
      url: finalUrl,
      displayUrl: payload.data?.display_url || finalUrl,
      deleteUrl: payload.data?.delete_url,
    };
  } catch (error) {
    console.error("Image upload error:", error);
    return {
      success: false,
      message: "Image upload failed. Please try again.",
    };
  }
}
