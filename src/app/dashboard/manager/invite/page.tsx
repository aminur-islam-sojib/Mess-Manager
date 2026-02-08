import { getSingleMessForUser } from "@/actions/server/Mess";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import NotFoundPage from "@/app/not-found";
import InvitePage from "@/components/ManagerComponents/InvitePage";
import { UserPlus } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function InviteMember() {
  const session = await getServerSession(authOptions);

  // ❌ Not logged in → kick out
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const role = session.user.role;

  // ❌ Unknown role → show 404 (safety)
  if (role !== "user" && role !== "manager") {
    NotFoundPage();
  }

  const messData = await getSingleMessForUser(session.user.id);

  return (
    <div className="min-h-screen bg-background ">
      <div className="  mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Invite Members
              </h1>
              <p className="text-sm text-muted-foreground">
                {messData.mess?.messName}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground">
            Add members to your mess by sending email invitations or sharing the
            invite link.
          </p>
        </div>

        {messData && session && (
          <InvitePage messData={messData} session={session.user} />
        )}
      </div>
    </div>
  );
}
