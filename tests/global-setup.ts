import { createServer } from "vite";
import { generateVAPIDKeys } from "web-push";
import { createApp } from "../server/app.js";

export default async function setup() {
  // O runner mantém os dois servidores vivos, sem processos CLI intermediários.
  // Somente o transporte externo é simulado; cookies, API e SQLite são reais.
  const keys = generateVAPIDKeys();
  const service = createApp({
    databasePath: `./output/e2e-${process.pid}-${Date.now()}.sqlite`,
    publicOrigin: "http://127.0.0.1:5173",
    vapid: { ...keys, subject: "mailto:teste@example.com" },
    sendPush: async () => undefined,
  });
  const api = service.app.listen(3002, "127.0.0.1");
  let vite: Awaited<ReturnType<typeof createServer>> | undefined;
  async function close() {
    await vite?.close();
    await new Promise<void>((resolve) => {
      api.close(() => resolve());
      api.closeIdleConnections();
    });
    await service.close();
  }
  try {
    await new Promise<void>((resolve, reject) => {
      api.once("listening", resolve);
      api.once("error", reject);
    });
    vite = await createServer({
      clearScreen: false,
      server: { host: "127.0.0.1", port: 5173, strictPort: true, proxy: { "/api": "http://127.0.0.1:3002" } },
    });
    await vite.listen();
    return close;
  } catch (error) {
    await close();
    throw error;
  }
}
