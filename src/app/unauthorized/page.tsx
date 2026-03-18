import { redirect } from "next/navigation";

export default function UnauthorizedRedirectPage() {
  redirect("/auth/unauthorized");
}
