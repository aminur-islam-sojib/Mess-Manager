"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useNotifications } from "@/components/Notifications/NotificationProvider";
import type { NotificationSerialized } from "@/types/Notification";

const prettyLabel = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatMetadataValue = (value: unknown) => {
  if (value === null || value === undefined) return "N/A";

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return JSON.stringify(value);
};

export default function NotificationDetailClient({
  notification,
}: {
  notification: NotificationSerialized;
}) {
  const { markAsRead } = useNotifications();

  useEffect(() => {
    if (!notification.isRead) {
      void markAsRead(notification.id);
    }
  }, [markAsRead, notification.id, notification.isRead]);

  const metadataEntries = Object.entries(notification.metadata).filter(
    ([key]) => key !== "targetPath",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/notifications"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to notifications
        </Link>

        {notification.targetPath && (
          <Link
            href={notification.targetPath}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open related page
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </div>

      <section className="rounded-[2rem] border border-border/80 bg-card/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-medium text-primary">
          {prettyLabel(notification.category)}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-foreground">
          {notification.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {format(new Date(notification.createdAt), "PPP 'at' p")}
        </p>
        <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
          <p className="text-sm leading-7 text-foreground">
            {notification.message}
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/80 bg-card/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <h2 className="text-lg font-semibold text-foreground">Details</h2>

        {metadataEntries.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No additional metadata was attached to this notification.
          </p>
        ) : (
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            {metadataEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-4xl border border-border/70 bg-background/70 p-4"
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {prettyLabel(key)}
                </dt>
                <dd className="mt-2 text-sm text-foreground">
                  {formatMetadataValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  );
}
