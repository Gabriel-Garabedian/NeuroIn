import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";
import { createECDH, randomBytes, randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";

type RequestRecord = { id: string; phrase: string; readAt: string | null };
type Network = { mother: BrowserContext; child: BrowserContext; momPage: Page; childPage: Page };
const pendingKey = "neuroin-pending-requests-v1";
const origin = "http://127.0.0.1:5173";

// Apenas PushManager e permissão são simulados; o SW, a aplicação e a API são reais.
async function simulateBrowserPush(context: BrowserContext) {
  const key = createECDH("prime256v1");
  key.generateKeys();
  await context.addInitScript((json) => {
    let current: PushSubscription | null = null;
    Object.defineProperty(Notification, "permission", { get: () => "granted" });
    Notification.requestPermission = async () => "granted";
    PushManager.prototype.getSubscription = async () => current;
    PushManager.prototype.subscribe = async (options) => {
      if (!options?.userVisibleOnly || !options.applicationServerKey) throw new Error("Inscrição inválida");
      current = {
        endpoint: json.endpoint,
        expirationTime: null,
        options,
        getKey: () => null,
        toJSON: () => json,
        unsubscribe: async () => { current = null; return true; },
      } as PushSubscription;
      return current;
    };
  }, {
    endpoint: `https://fcm.googleapis.com/fcm/send/${randomUUID()}`,
    expirationTime: null,
    keys: { p256dh: key.getPublicKey().toString("base64url"), auth: randomBytes(16).toString("base64url") },
  });
}

async function openWithSession(page: Page, path: string) {
  await Promise.all([
    page.waitForResponse((response) => new URL(response.url()).pathname === "/api/session" && response.ok()),
    page.goto(path),
  ]);
}

async function requests(context: BrowserContext): Promise<RequestRecord[]> {
  const response = await context.request.get("/api/requests");
  expect(response.ok()).toBeTruthy();
  return (await response.json()).requests;
}

const test = base.extend<{ network: Network }>({
  network: async ({ browser }, use) => {
    const mother = await browser.newContext({ baseURL: origin });
    const child = await browser.newContext({ baseURL: origin });
    const momPage = await mother.newPage();
    const childPage = await child.newPage();
    try {
      await openWithSession(momPage, "/rede");
      await momPage.getByRole("button", { name: "Vincular dispositivo", exact: true }).click();
      const code = await momPage.getByTestId("pairing-code").innerText();
      await openWithSession(childPage, "/rede");
      await childPage.getByLabel("Código de vinculação").fill(code);
      await childPage.getByRole("button", { name: "Confirmar vínculo", exact: true }).click();
      await expect(childPage.getByText("Vinculado a Responsável", { exact: true })).toBeVisible();
      await openWithSession(momPage, "/rede");
      await expect(momPage.getByText("Vinculado a Ana", { exact: true })).toBeVisible();
      await use({ mother, child, momPage, childPage });
    } finally {
      await mother.close();
      await child.close();
    }
  },
});

test("desvinculação pelo outro aparelho remove o pedido aberto e preserva acessibilidade", async ({ network }) => {
  const { mother, child, momPage, childPage } = network;
  await openWithSession(childPage, "/inicio");
  await childPage.getByRole("button", { name: "Água", exact: true }).click();
  await expect(childPage.getByText(/Pedido salvo na rede/)).toBeVisible();
  const [sent] = await requests(mother);
  await openWithSession(momPage, `/rede?pedido=${sent.id}`);
  const list = momPage.getByRole("region", { name: "Pedidos reais" });
  await expect(list.getByText("Eu preciso de água.", { exact: true })).toBeVisible();
  for (const width of [390, 1440]) {
    await momPage.setViewportSize({ width, height: 900 });
    expect(await momPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page: momPage }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  }
  await momPage.screenshot({ path: "output/playwright/push-support.png", fullPage: true });
  const session = await (await child.request.get("/api/session")).json();
  const response = await child.request.delete(`/api/links/${session.peers[0].id}`, {
    headers: { Origin: "http://127.0.0.1:5173" },
  });
  expect(response.ok()).toBeTruthy();
  await momPage.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(momPage.getByText("Este aparelho ainda não está vinculado.", { exact: true })).toBeVisible();
  await expect(list.getByText("Eu preciso de água.", { exact: true })).toHaveCount(0);
});

test("dois aparelhos enviam, consultam e confirmam leitura sem reenviar ao falar ou recarregar", async ({ network, browser }) => {
  const { mother, child, momPage, childPage } = network;
  const posts: string[] = [];
  childPage.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/requests" && request.method() === "POST") posts.push(request.postDataJSON().id);
  });
  await openWithSession(childPage, "/inicio");
  await expect(childPage.getByRole("heading", { name: "O que você precisa?" })).toBeVisible();
  expect(posts).toEqual([]);
  await childPage.getByRole("button", { name: "Água", exact: true }).click();
  await expect(childPage.getByRole("heading", { name: "Eu preciso de água." })).toBeVisible();
  await expect(childPage.getByText(/Pedido salvo na rede/)).toBeVisible();
  await childPage.getByRole("button", { name: "Falar", exact: true }).click();
  await momPage.getByRole("button", { name: "Atualizar pedidos", exact: true }).click();
  const list = momPage.getByRole("region", { name: "Pedidos reais" });
  await expect(list.getByText("Eu preciso de água.", { exact: true })).toHaveCount(1);
  const [sent] = await requests(mother);
  expect(sent.phrase).toBe("Eu preciso de água.");
  expect(posts).toEqual([sent.id]);
  await list.getByRole("link", { name: "Abrir pedido", exact: true }).click();
  await expect(momPage).toHaveURL(`/rede?pedido=${sent.id}`);
  await expect(list.getByRole("listitem")).toBeFocused();
  await list.getByRole("button", { name: "Marcar como lido", exact: true }).click();
  await expect(list.getByText(/Lido em/)).toBeVisible();
  await childPage.getByRole("button", { name: "Consultar leitura", exact: true }).click();
  await expect(childPage.getByText(/A rede marcou como lido em/)).toBeVisible();
  await openWithSession(childPage, "/inicio");
  await expect(childPage.getByRole("heading", { name: "O que você precisa?" })).toBeVisible();
  expect(posts).toEqual([sent.id]);

  const stranger = await browser.newContext({ baseURL: origin });
  try {
    expect((await stranger.request.post("/api/devices", { headers: { Origin: origin }, data: { role: "support", name: "Outra rede" } })).ok()).toBeTruthy();
    expect(await requests(stranger)).toEqual([]);
    expect((await stranger.request.get(`/api/requests/${sent.id}`)).status()).toBe(404);
    expect((await stranger.request.post(`/api/requests/${sent.id}/read`, { headers: { Origin: origin }, data: {} })).status()).toBe(404);
    const strangerPage = await stranger.newPage();
    await openWithSession(strangerPage, `/rede?pedido=${sent.id}`);
    await expect(strangerPage.getByRole("region", { name: "Pedidos reais" }).getByText("Eu preciso de água.", { exact: true })).toHaveCount(0);
  } finally { await stranger.close(); }

  await momPage.getByRole("button", { name: "Desvincular Ana", exact: true }).click();
  await expect(momPage.getByText("Este aparelho ainda não está vinculado.", { exact: true })).toBeVisible();
  expect((await mother.request.get(`/api/requests/${sent.id}`)).status()).toBe(404);
  await openWithSession(childPage, "/inicio");
  await childPage.getByRole("button", { name: "Água", exact: true }).click();
  await expect(childPage.getByText(/vincule este aparelho à rede de apoio/)).toBeVisible();
  expect(posts).toEqual([sent.id]);
  expect((await child.request.get(`/api/requests/${sent.id}`)).ok()).toBeTruthy();
});

test("ativa e desativa inscrição real na API com PushManager e transporte externo simulados", async ({ network }) => {
  const { mother, momPage, childPage } = network;
  await simulateBrowserPush(mother);
  await openWithSession(momPage, "/rede");
  await momPage.getByRole("button", { name: "Ativar notificações", exact: true }).click();
  await expect(momPage.getByText("Há uma inscrição de notificações neste aparelho.", { exact: true })).toBeVisible();
  expect((await (await mother.request.get("/api/session")).json()).subscribed).toBe(true);
  await momPage.getByRole("button", { name: "Enviar notificação de teste", exact: true }).click();
  await expect(momPage.getByText(/O serviço aceitou a notificação de teste/)).toBeVisible();
  await openWithSession(childPage, "/inicio");
  await childPage.getByRole("button", { name: "Água", exact: true }).click();
  await expect(childPage.getByText(/O serviço de notificações aceitou o envio/)).toBeVisible();
  await expect.poll(() => childPage.evaluate((key) => JSON.parse(localStorage.getItem(key) || "[]").length, pendingKey)).toBe(0);
  await momPage.getByRole("button", { name: "Desativar notificações", exact: true }).click();
  await expect(momPage.getByText("As notificações estão desativadas neste aparelho.", { exact: true })).toBeVisible();
  expect((await (await mother.request.get("/api/session")).json()).subscribed).toBe(false);
  expect(await requests(mother)).toHaveLength(1);
});

test("falha offline preserva frase e UUID, exige tentativa explícita e não duplica pedido", async ({ network }) => {
  const { child, childPage, mother } = network;
  await openWithSession(childPage, "/inicio");
  await child.setOffline(true);
  await childPage.getByRole("button", { name: "Água", exact: true }).click();
  await expect(childPage.getByRole("heading", { name: "Eu preciso de água." })).toBeVisible();
  await expect(childPage.getByRole("button", { name: "Tentar envio novamente", exact: true })).toBeVisible();
  const pending = await childPage.evaluate((key) => JSON.parse(localStorage.getItem(key) || "[]"), pendingKey);
  expect(pending).toHaveLength(1);
  expect(pending[0].id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(await requests(mother)).toEqual([]);
  await child.setOffline(false);
  await openWithSession(childPage, "/rede");
  const retry = childPage.getByRole("button", { name: "Tentar envio novamente", exact: true });
  await expect(retry).toBeVisible();
  expect(await requests(mother)).toEqual([]);
  await retry.click();
  await expect(childPage.getByText(/Pedido salvo na rede/)).toBeVisible();
  expect(await requests(mother)).toMatchObject([{ id: pending[0].id, phrase: "Eu preciso de água." }]);
  await retry.click();
  await expect(childPage.getByText(/Pedido salvo na rede/)).toBeVisible();
  expect(await requests(mother)).toHaveLength(1);
  expect((await requests(mother))[0].id).toBe(pending[0].id);
});

test("falha ao carregar a sessão mantém a escolha e recupera o envio após tentativa explícita", async ({ network }) => {
  const { childPage, mother } = network;
  // Apenas a interrupção de rede é simulada; o cookie e a sessão recuperada são reais.
  await childPage.route("**/api/session", (route) => route.abort("failed"));
  await childPage.goto("/inicio");
  await childPage.getByRole("button", { name: "Água", exact: true }).click();
  await expect(childPage.getByRole("heading", { name: "Eu preciso de água." })).toBeVisible();
  await expect(childPage.getByRole("button", { name: "Tentar envio novamente", exact: true })).toBeVisible();
  expect(await requests(mother)).toEqual([]);
  await childPage.unroute("**/api/session");
  await childPage.getByRole("button", { name: "Tentar envio novamente", exact: true }).click();
  await expect(childPage.getByText(/Pedido salvo na rede/)).toBeVisible();
  expect(await requests(mother)).toMatchObject([{ phrase: "Eu preciso de água." }]);
});

test("dor e incômodo só compartilham a escolha final confirmada", async ({ network }) => {
  const { childPage, mother } = network;
  await openWithSession(childPage, "/bem-estar");
  await childPage.getByRole("button", { name: "Cabeça", exact: true }).click();
  await childPage.getByRole("slider").fill("4");
  expect(await requests(mother)).toEqual([]);
  await childPage.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(childPage.getByText(/Pedido salvo na rede/)).toBeVisible();
  expect(await requests(mother)).toMatchObject([{ phrase: "Dor na região: Cabeça — intensidade 4/10." }]);
  await openWithSession(childPage, "/sensibilidades");
  await childPage.getByRole("button", { name: "Barulho", exact: true }).click();
  await expect(childPage.getByRole("heading", { name: "O que pode ajudar?" })).toBeVisible();
  expect(await requests(mother)).toHaveLength(1);
  await childPage.getByRole("button", { name: "Quero silêncio", exact: true }).click();
  await expect(childPage.getByText(/Pedido salvo na rede/)).toBeVisible();
  expect((await requests(mother)).map((request) => request.phrase)).toContain("Barulho está incomodando. Quero silêncio");
  expect(await requests(mother)).toHaveLength(2);
});

for (const choice of [
  { route: "/comunicacao", button: "Água", phrase: "Eu preciso de água." },
  { route: "/calmo", button: "Barulho", phrase: "O barulho está me incomodando." },
]) {
  test(`escolha explícita em ${choice.route} envia à rede`, async ({ network }) => {
    await openWithSession(network.childPage, choice.route);
    expect(await requests(network.mother)).toEqual([]);
    await network.childPage.getByRole("button", { name: choice.button, exact: true }).click();
    await expect(network.childPage.getByText(/Pedido salvo na rede/)).toBeVisible();
    expect(await requests(network.mother)).toMatchObject([{ phrase: choice.phrase }]);
  });
}

for (const limitation of [
  { mode: "denied", explanation: /As notificações foram bloqueadas/ },
  { mode: "unsupported", explanation: /Este navegador não oferece notificações Web Push/ },
  { mode: "insecure", explanation: /As notificações precisam de HTTPS/ },
  { mode: "ios-browser", explanation: /adicione o NeuroIn à Tela de Início e abra pelo ícone/ },
]) {
  test(`orienta ${limitation.mode} sem registrar uma inscrição`, async ({ page, context }) => {
    await context.addInitScript((mode) => {
      if (mode === "denied") Object.defineProperty(Notification, "permission", { get: () => "denied" });
      if (mode === "unsupported") Reflect.deleteProperty(window, "PushManager");
      if (mode === "insecure") Object.defineProperty(window, "isSecureContext", { value: false });
      if (mode === "ios-browser") Object.defineProperty(navigator, "userAgent", { value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" });
    }, limitation.mode);
    expect((await context.request.post("/api/devices", { headers: { Origin: origin }, data: { role: "support", name: "Responsável" } })).ok()).toBeTruthy();
    await openWithSession(page, "/rede");
    await expect(page.getByText(limitation.explanation).first()).toBeVisible();
    await page.getByRole("button", { name: "Ativar notificações", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: limitation.explanation })).toBeVisible();
    expect((await (await context.request.get("/api/session")).json()).subscribed).toBe(false);
  });
}
