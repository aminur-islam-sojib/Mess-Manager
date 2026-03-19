import { getMyNotifications } from "@/actions/server/Notifications";
import NotificationFeed from "@/components/Shared/notifications/NotificationFeed";

export default async function UserNotificationsPage() {
  const data = await getMyNotifications(40);

  if (!data.success) {
    return <div className="text-sm text-destructive">{data.message}</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <NotificationFeed
        items={data.items}
        unreadCount={data.unreadCount}
        pageLimit={40}
      />
    </div>
  );
}
