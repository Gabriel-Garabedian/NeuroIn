import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
test("comunica água e retorna ao início", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "O que você precisa?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Água", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Eu preciso de água." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await expect(
    page.getByRole("heading", { name: "O que você precisa?" }),
  ).toBeVisible();
});
test("registra localização e intensidade da dor sem orientação clínica", async ({
  page,
}) => {
  await page.getByRole("link", { name: "Dor", exact: true }).click();
  await page.getByRole("button", { name: "Barriga", exact: true }).click();
  await page.getByRole("button", { name: "5 Moderada", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(
    page.getByText("Dor na região: Barriga — intensidade 5/10."),
  ).toBeVisible();
  await expect(page.getByText("Obrigado por me contar.")).toBeVisible();
});
test("barulho permite comunicar ajuda e entrar e sair do modo calmo", async ({
  page,
}) => {
  await page.getByRole("link", { name: "Barulho", exact: true }).click();
  await expect(
    page.getByText("Entendi. Barulho está incomodando."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Quero silêncio", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Quero silêncio" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await page
    .getByRole("link", { name: /Modo Calmo/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Um pouco mais de calma." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair do Modo Calmo" }).click();
  await expect(
    page.getByRole("heading", { name: "O que você precisa?" }),
  ).toBeVisible();
});
test("rotina e etapas persistem após recarregar", async ({ page }) => {
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Rotina" })
    .click();
  await page.getByRole("link", { name: /Almoço/ }).click();
  await page.getByLabel("Lavar as mãos").check();
  await page.reload();
  await expect(page.getByLabel("Lavar as mãos")).toBeChecked();
  await page.getByRole("button", { name: /Concluir atividade/ }).click();
  await page.goto("/rotina");
  await expect(page.getByText("3 de 7 atividades concluídas")).toBeVisible();
});
test("perfil equipe e visão da rede são navegáveis", async ({ page }) => {
  await page.goto("/sobre-mim");
  await expect(page.getByText("Ana Souza")).toBeVisible();
  await page.goto("/equipe");
  await expect(page.getByText("Dra. Helena", { exact: true })).toBeVisible();
  await page.goto("/ajustes");
  await page.getByLabel("Rede de apoio", { exact: true }).check();
  await expect(
    page.getByRole("heading", { name: /Ana|apoio/i }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Informou desconforto com barulho."),
  ).toBeVisible();
});
test("ajustes persistem e reset restaura apenas a demonstração", async ({
  page,
}) => {
  await page.goto("/ajustes");
  await page.getByLabel("Texto maior", { exact: true }).check();
  await page.reload();
  await expect(page.getByLabel("Texto maior", { exact: true })).toBeChecked();
  await page.evaluate(() => localStorage.setItem("unrelated", "keep"));
  await page
    .getByRole("button", { name: "Restaurar demonstração", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Sim, restaurar", exact: true })
    .click();
  await page.goto("/ajustes");
  await expect(
    page.getByLabel("Texto maior", { exact: true }),
  ).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("unrelated"))).toBe(
    "keep",
  );
});
test("armazenamento corrompido ou bloqueado não impede o uso", async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem("neuroin-demo-v1", '{"preferences":null}'),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "O que você precisa?" }),
  ).toBeVisible();
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
    Storage.prototype.getItem = () => {
      throw new Error("blocked");
    };
  });
  await page.reload();
  await page.getByRole("button", { name: "Água", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Eu preciso de água." }),
  ).toBeVisible();
});
for (const width of [360, 390, 430, 768, 1440])
  test(`sem overflow e acessível em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/comunicacao",
      "/bem-estar",
      "/sensibilidades",
      "/calmo",
      "/rotina",
      "/sobre-mim",
      "/equipe",
      "/rede",
      "/ajustes",
    ]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.goto("/");
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  });
test("teclado, movimento reduzido e console", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "O que você precisa?" }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Ir para o conteúdo" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("body")).toBeVisible();
  expect(errors).toEqual([]);
});
test("confirmação recebe foco e volta ao conteúdo por teclado", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Água", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Eu preciso de água." }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await expect(
    page.getByRole("heading", { name: "O que você precisa?" }),
  ).toBeFocused();
});
test("texto grande e alto contraste preservam todas as telas e acessibilidade", async ({
  page,
}) => {
  await page.goto("/ajustes");
  await page.getByLabel("Texto maior", { exact: true }).check();
  await page.getByLabel("Alto contraste", { exact: true }).check();
  for (const path of [
    "/",
    "/comunicacao",
    "/bem-estar",
    "/sensibilidades",
    "/calmo",
    "/rotina",
    "/rotina/escola",
    "/sobre-mim",
    "/equipe",
    "/rede",
    "/ajustes",
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      path,
    ).toEqual([]);
  }
});
test("preferências controlam voz automática, confirmação e voz desativada", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speak: (u: SpeechSynthesisUtterance) => {
          document.documentElement.dataset.spoken = u.text;
        },
        cancel: () => {},
      },
    });
  });
  await page.reload();
  await page.getByRole("button", { name: "Água", exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-spoken");
  await page.getByRole("button", { name: "Falar", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-spoken",
    "Eu preciso de água.",
  );
  await page.goto("/ajustes");
  await page.getByLabel("Confirmar antes de falar", { exact: true }).uncheck();
  await page.goto("/");
  await page.getByRole("button", { name: "Fome", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-spoken",
    "Eu preciso comer.",
  );
  await page.goto("/ajustes");
  await page.getByLabel("Leitura em voz alta", { exact: true }).uncheck();
  await page.goto("/");
  await page.getByRole("button", { name: "Água", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Falar", exact: true }),
  ).toBeDisabled();
});

test('sem suporte a voz a mensagem visual continua utilizável', async ({page}) => {
 await page.addInitScript(() => {
  let target: object | null = window;
  while(target){if(Object.hasOwn(target,'speechSynthesis'))Reflect.deleteProperty(target,'speechSynthesis');target=Object.getPrototypeOf(target);}
 });
 await page.reload();
 await page.getByRole('button',{name:'Água',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Eu preciso de água.'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Falar',exact:true})).toBeDisabled();
 await expect(page.getByText(/A voz não está disponível/)).toBeVisible();
});
