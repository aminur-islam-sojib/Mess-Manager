import { getSingleMessForUser } from "@/actions/server/Mess";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import AddExpensesModalHome from "@/components/ui/AddExpensesModalHome";
import InviteMemberModal from "@/components/ui/InviteMemberModal";
import { getServerSession } from "next-auth";

async function QuickActions() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return;
  }
  const messData = await getSingleMessForUser(session?.user.id);
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <InviteMemberModal messData={messData} session={session} />
        </div>
        <div>
          <AddExpensesModalHome />
        </div>
      </div>
    </div>
  );
}

export default QuickActions;
