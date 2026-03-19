import { getInvitationByToken } from "@/actions/invitations";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import {
  InvalidInvitation,
  UserInvitationPageClient,
} from "@/components/features/invitations";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <InvalidInvitation
        errorType="invalid"
        errorMessage="Invitation token is missing from the link."
      />
    );
  }

  const result = await getInvitationByToken(token);
  if (!result.success) {
    return (
      <InvalidInvitation
        errorType={result.errorType}
        errorMessage={result.error}
      />
    );
  }

  if (!result.invitation) {
    return (
      <InvalidInvitation
        errorType="general"
        errorMessage="Invitation details are unavailable right now."
      />
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const callbackUrl = encodeURIComponent(`/invite?token=${token}`);
    redirect(`/auth/login?callbackUrl=${callbackUrl}`);
  }

  return (
    <UserInvitationPageClient
      invitation={result.invitation}
      sessionUser={session.user}
      token={token}
    />
  );
}
