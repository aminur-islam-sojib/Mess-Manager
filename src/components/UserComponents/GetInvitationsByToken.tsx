import { getInvitationByToken } from "@/actions/server/Invitations";

export default async function GetInvitationsByToken({
  token,
}: {
  token: string;
}) {
  const res = await getInvitationByToken(token);
  console.log(res);
  return <div>GetInvitationsByToken</div>;
}
