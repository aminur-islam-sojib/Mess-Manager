import { getInvitationByToken } from "@/actions/server/Invitations";
import InvalidInvitation from "@/components/UserComponents/InvalidInvitations";
import UserInvitationPageClient from "@/components/UserComponents/UserInvitationPageClient";

export default async function UserInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
}) {
  const { token } = await searchParams;

  const result = await getInvitationByToken(token);
  if (!result.success) {
    return (
      <InvalidInvitation
        errorType={result.errorType}
        errorMessage={result.error}
      />
    );
  }

  const invitation = result.invitation;

  return (
    <>
      <div>
        {invitation && <UserInvitationPageClient invitation={invitation} />}
      </div>
    </>
  );
}
