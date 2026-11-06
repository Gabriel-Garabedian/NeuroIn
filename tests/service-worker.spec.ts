import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

type WorkerEvent = {
  data?: { json: () => unknown };
  notification?: { data: { url: string }; close: () => void };
  request?: { url: string; method: string; mode: string };
  waitUntil: (promise: Promise<unknown>) => void;
  respondWith?: () => void;
};

// Eventos e APIs do navegador simulados; executa o arquivo de SW entregue ao cliente.
function worker(existingWindow = false) {
  const handlers = new Map<string, (event: WorkerEvent) => void>();
  const shown: { title: string; options: { body: string; tag: string; data: { url: string } } }[] = [];
  const opened: string[] = [];
  const navigated: string[] = [];
  let focused = 0;
  let closed = 0;
  const client = {
    url: "https://neuroin.test/inicio",
    navigate: async (url: string) => { navigated.push(url); },
    focus: async () => { focused++; },
  };
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    URL,
    self: {
      location: { origin: "https://neuroin.test" },
      addEventListener: (name: string, handler: (event: WorkerEvent) => void) => handlers.set(name, handler),
      registration: {
        showNotification: async (title: string, options: (typeof shown)[number]["options"]) => { shown.push({ title, options }); },
      },
      clients: {
        matchAll: async () => existingWindow ? [client] : [],
        openWindow: async (url: string) => { opened.push(url); },
      },
    },
  });
  return {
    shown, opened, navigated,
    focused: () => focused,
    closed: () => closed,
    async fire(name: string, data: Partial<WorkerEvent>) {
      let done = Promise.resolve<unknown>(undefined);
      handlers.get(name)!({ ...data, waitUntil: (promise) => { done = promise; } });
      await done;
    },
    close: () => { closed++; },
  };
}

test("SW mostra a frase e abre o pedido correto no clique sem precisar de aba aberta", async () => {
  const sw = worker();
  await sw.fire("push", { data: { json: () => ({ title: "Pedido de Ana", body: "Eu preciso de água.", requestId: "67b9cff2-1ca5-47cc-b274-85d40f6069b2" }) } });
  expect(sw.shown).toEqual([{
    title: "Pedido de Ana",
    options: expect.objectContaining({
      body: "Eu preciso de água.",
      tag: "67b9cff2-1ca5-47cc-b274-85d40f6069b2",
      data: { url: "https://neuroin.test/rede?pedido=67b9cff2-1ca5-47cc-b274-85d40f6069b2" },
    }),
  }]);
  await sw.fire("notificationclick", { notification: { data: sw.shown[0].options.data, close: sw.close } });
  expect(sw.closed()).toBe(1);
  expect(sw.opened).toEqual(["https://neuroin.test/rede?pedido=67b9cff2-1ca5-47cc-b274-85d40f6069b2"]);
});

test("SW reutiliza a janela existente e impede navegação externa vinda do payload", async () => {
  const sw = worker(true);
  await sw.fire("push", { data: { json: () => ({ body: "Pedido", url: "https://outro.test/roubar" }) } });
  expect(sw.shown[0].options.data.url).toBe("https://neuroin.test/rede");
  await sw.fire("notificationclick", { notification: { data: { url: "https://outro.test/roubar" }, close: sw.close } });
  expect(sw.navigated).toEqual(["https://neuroin.test/rede"]);
  expect(sw.focused()).toBe(1);
  expect(sw.opened).toEqual([]);
});

test("SW tolera JSON inválido e nunca intercepta cache de pedidos, inscrições ou POST", async () => {
  const sw = worker();
  await sw.fire("push", { data: { json: () => { throw new SyntaxError("JSON inválido"); } } });
  expect(sw.shown[0].options.body).toBe("Há uma mensagem para consultar na rede de apoio.");
  let intercepted = false;
  for (const request of [
    { url: "https://neuroin.test/api/requests", method: "GET", mode: "cors" },
    { url: "https://neuroin.test/api/subscription", method: "GET", mode: "cors" },
    { url: "https://neuroin.test/rede", method: "POST", mode: "navigate" },
    { url: "https://outro.test/assets/private.js", method: "GET", mode: "cors" },
  ]) await sw.fire("fetch", { request, respondWith: () => { intercepted = true; } });
  expect(intercepted).toBe(false);
});
