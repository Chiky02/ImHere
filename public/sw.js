self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  event.waitUntil(handlePush(event));
});

async function handlePush(event) {
  let data = {
    type: "inbox",
    title: "Control de puntos",
    body: "Tienes un aviso",
    url: "/conductor",
  };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* ignore */
  }

  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of windows) {
    client.postMessage(data);
  }

  const focused = windows.some((c) => c.visibilityState === "visible");
  // Always notify on incoming bus so the operator hears/sees it even with the tab open.
  if (!focused || data.type === "alerta") {
    await self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      data,
      tag: data.puntoId ? `${data.type || "inbox"}-${data.puntoId}` : data.type,
      renotify: true,
    });
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/conductor";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        try {
          const path = new URL(client.url).pathname;
          if (path.startsWith(url) && "focus" in client) return client.focus();
        } catch {
          /* ignore */
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
