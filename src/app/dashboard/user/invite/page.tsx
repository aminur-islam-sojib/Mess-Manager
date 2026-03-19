import { redirect } from "next/navigation";

export default async function UserInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const next = token ? `/invite?token=${encodeURIComponent(token)}` : "/invite";
  redirect(next);
}
