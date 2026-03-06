import { getMessMembers } from "@/actions/server/Mess";
import MessMembersDashboard from "@/components/Shared/Managers/MessMembersDashboard";

export default async function page() {
  const messMembers = await getMessMembers();
  const members = messMembers.success ? (messMembers.members ?? []) : [];
  const messName = messMembers.success
    ? (messMembers.messName ?? "Mess Members")
    : "Mess Members";

  return (
    <div>
      <MessMembersDashboard members={members} messName={messName} />
    </div>
  );
}
