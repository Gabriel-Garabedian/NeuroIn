const CACHE = "neuroin-shell-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    const shell = await fetch("/", { cache: "reload" });
    if (!shell.ok) throw new Error("Shell indisponível");
    const html = await shell.clone().text();
    await cache.put("/", shell);
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((match) => match[1]);
    await cache.addAll(["/manifest.webmanifest", "/icons/icon-192.png", ...assets]);
  }));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("neuroin-shell-") && key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Somente o shell público entra no cache; pedidos e inscrições nunca entram.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(async () => (await caches.match("/")) || Response.error()));
  } else if (url.pathname.startsWith("/assets/")) {
    event.respondWith(caches.open(CACHE).then(async (cache) => {
      const saved = await cache.match(event.request);
      if (saved) return saved;
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    }));
  }
});
self.addEventListener("push", (event) => {
  let payload;
  try { payload = event.data?.json(); } catch { /* Notificação genérica para payload inválido. */ }
  const requestId = payload?.requestId || payload?.id;
  const target = new URL(payload?.url || (requestId ? `/rede?pedido=${encodeURIComponent(requestId)}` : "/rede"), self.location.origin);
  const url = target.origin === self.location.origin && target.pathname === "/rede" ? target.href : new URL("/rede", self.location.origin).href;
  event.waitUntil(self.registration.showNotification(payload?.title || "NeuroIn", {
    body: payload?.body || "Há uma mensagem para consultar na rede de apoio.",
    icon: "/icons/icon-192.png",
    tag: requestId || "neuroin-test",
    data: { url },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/rede", self.location.origin);
  const url = target.origin === self.location.origin && target.pathname === "/rede" ? target.href : new URL("/rede", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
    const client = clients.find((item) => new URL(item.url).origin === self.location.origin);
    if (client) {
      await client.navigate(url);
      return client.focus();
    }
    return self.clients.openWindow(url);
  }));
});
