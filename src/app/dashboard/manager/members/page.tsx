import { getMessMembers } from "@/actions/server/Mess";
import UserList from "@/components/Shared/Managers/UserList";

export default async function page() {
  const messMembers = await getMessMembers();
  const members = messMembers.success ? (messMembers.members ?? []) : [];
  const messName = messMembers.success
    ? (messMembers.messName ?? "Mess Members")
    : "Mess Members";

  return (
    <div>
      {members && messName && <UserList data={members} messName={messName} />}
    </div>
  );
}
