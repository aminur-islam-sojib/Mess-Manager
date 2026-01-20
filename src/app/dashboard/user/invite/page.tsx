import { getInvitationByToken } from "@/actions/server/Invitations";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import InvalidInvitation from "@/components/UserComponents/InvalidInvitations";
import UserInvitationPageClient from "@/components/UserComponents/UserInvitationPageClient";
import { getServerSession } from "next-auth";

export default async function UserInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
}) {
  const session = await getServerSession(authOptions);
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
        {invitation && session && token && (
          <UserInvitationPageClient
            invitation={invitation}
            sessionUser={session.user}
            token={token}
          />
        )}
      </div>
    </>
  );
}
