import { test, expect } from "@playwright/test";

test("desktop usa menu lateral, ocupa a tela e mantém os atalhos de comunicação", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "O que você precisa?" })).toBeVisible();
  const frame = await page.locator(".app-frame").boundingBox();
  expect(frame?.width).toBeGreaterThan(1300);
  const nav = await page.getByRole("navigation", { name: "Navegação principal" }).boundingBox();
  const main = await page.locator("main").boundingBox();
  expect(nav!.x + nav!.width).toBeLessThanOrEqual(main!.x);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.locator(".quick-card").count()).toBe(8);
  await page.getByRole("link", { name: /Ativar Modo Calmo/ }).click();
  await expect(page.getByRole("heading", { name: "Um pouco mais de calma." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toHaveCount(0);
  await page.getByRole("button", { name: "Sair do Modo Calmo" }).click();
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
});
