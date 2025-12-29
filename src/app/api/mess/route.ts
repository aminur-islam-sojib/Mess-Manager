import { NextResponse } from "next/server";
import { createMess } from "@/actions/server/Mess";
import { MessPayloadType } from "@/types/MessTypes";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messName, managerId, managerEmail } = body as MessPayloadType;

    if (!messName || !managerId || !managerEmail) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const payload: MessPayloadType = {
      messName: messName.trim(),
      managerId,
      managerEmail,
    };

    const result = await createMess(payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error("/api/mess error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
