"use client";
import { useRouter } from "next/navigation";

export default function PushRole({ role }: { role: string }) {
  const router = useRouter();
  if (role) {
    router.push(`/dashboard?role=${role}`);
  } else {
    return <></>;
  }
}
