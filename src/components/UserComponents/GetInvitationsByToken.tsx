import { getInvitationByToken } from "@/actions/server/Invitations";

export default async function GetInvitationsByToken({
  token,
}: {
  token: string;
}) {
  await getInvitationByToken(token);
  return <div>GetInvitationsByToken</div>;
}
