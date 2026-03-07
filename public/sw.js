self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.notification?.title || payload.title || "Mess Manager";
  const body =
    payload.notification?.message ||
    payload.message ||
    "You have a new notification.";
  const href =
    payload.notification?.href ||
    payload.notification?.targetPath ||
    payload.href ||
    "/dashboard/notifications";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/mess-manager.png",
      badge: "/mess-manager.png",
      data: {
        href,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const href = event.notification.data?.href || "/dashboard/notifications";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(href);
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(href);
        }

        return undefined;
      }),
  );
});
