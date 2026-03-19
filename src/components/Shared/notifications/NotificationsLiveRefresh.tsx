"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotificationsLiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");

    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;

    const onMessage = () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      refreshTimeout = setTimeout(() => {
        router.refresh();
      }, 250);
    };

    eventSource.addEventListener("message", onMessage);

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      eventSource.removeEventListener("message", onMessage);
      eventSource.close();
    };
  }, [router]);

  return null;
}
