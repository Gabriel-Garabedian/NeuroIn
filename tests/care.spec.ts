import { test, expect } from "@playwright/test";

test("mantém acesso ao Modo Calmo depois de comunicar uma ajuda sensorial", async ({ page }) => {
  await page.goto("/sensibilidades?motivo=Barulho");
  await page.getByRole("button", { name: "Quero silêncio", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Quero silêncio" })).toBeVisible();
  await page.getByRole("link", { name: /Ir para o Modo Calmo/ }).click();
  await expect(page.getByRole("heading", { name: "Um pouco mais de calma." })).toBeVisible();
});

test("permite revisar região e intensidade antes de comunicar a dor", async ({ page }) => {
  await page.goto("/bem-estar");
  await page.getByRole("button", { name: "Barriga", exact: true }).click();
  await page.getByRole("slider").fill("7");
  const summary = page.getByRole("region", { name: "Você informou" });
  await expect(summary).toContainText("Barriga");
  await expect(summary).toContainText("7/10");
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dor na região: Barriga — intensidade 7/10." })).toBeVisible();
});

test("permite trocar o incômodo antes de escolher o que ajuda", async ({ page }) => {
  await page.goto("/sensibilidades?motivo=Barulho");
  await page.getByRole("button", { name: "Alterar incômodo" }).click();
  await page.getByRole("button", { name: "Luz", exact: true }).click();
  await expect(page.getByText("Entendi. Luz está incomodando.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "O que pode ajudar?" })).toBeVisible();
});

test("prioriza a intensidade após escolher uma região e permite alterá-la", async ({ page }) => {
  await page.goto("/bem-estar");
  await page.getByRole("button", { name: "Barriga", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cabeça", exact: true })).toHaveCount(0);
  await page.getByRole("slider").fill("5");
  await page.getByRole("button", { name: "Alterar região" }).click();
  await page.getByRole("button", { name: "Cabeça", exact: true }).click();
  await expect(page.getByText("2. Quanto está incomodando?", { exact: true })).toBeFocused();
  await expect(page.getByRole("button", { name: "Confirmar", exact: true })).toBeDisabled();
  await page.getByRole("slider").fill("7");
  await expect(page.getByRole("region", { name: "Você informou" })).toContainText("Cabeça");
});
