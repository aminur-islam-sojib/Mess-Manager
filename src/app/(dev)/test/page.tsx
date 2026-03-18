import { getSingleMess } from "@/actions/server/Mess";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export default async function TestPage() {
  const session = await getServerSession(authOptions);
  console.log(session);

  if (session?.user.id) {
    const mess = await getSingleMess(session.user.id);
    if (mess) {
    }
  }

  try {
    const activeSession = await getServerSession(authOptions);
    const mess = await getSingleMess(activeSession?.user?.id as string);
    if (mess) {
    }
  } catch (error) {
    console.log(error);
  }

  return <div>TestPage</div>;
}
