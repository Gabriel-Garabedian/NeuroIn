import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("cores vivas são opcionais, persistem e voltam com a restauração", async ({ page }) => {
  await page.goto("/");
  const water = page.getByRole("button", { name: "Água", exact: true });
  await expect(water).toBeVisible();
  const vivid = await water.evaluate(element => getComputedStyle(element).backgroundColor);
  await page.goto("/ajustes");
  await page.getByLabel("Cores mais vivas", { exact: true }).uncheck();
  await page.reload();
  await expect(page.getByLabel("Cores mais vivas", { exact: true })).not.toBeChecked();
  await page.goto("/");
  expect(await water.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(vivid);
  await page.goto("/ajustes");
  await page.getByRole("button", { name: "Restaurar demonstração", exact: true }).click();
  await page.getByRole("button", { name: "Sim, restaurar", exact: true }).click();
  await expect(water).toBeVisible();
  expect(await water.evaluate(element => getComputedStyle(element).backgroundColor)).toBe(vivid);
});

test("Modo Calmo preserva sua paleta mesmo com cores vivas", async ({ page }) => {
  await page.goto("/calmo");
  await expect(page.locator(".app-frame")).not.toHaveClass(/vivid-colors/);
  const calmColor = await page.locator(".brand svg path").first().evaluate(element => getComputedStyle(element).stroke);
  await page.getByRole("button", { name: "Sair do Modo Calmo" }).click();
  await page.goto("/ajustes");
  await page.getByLabel("Cores mais vivas", { exact: true }).uncheck();
  await page.goto("/calmo");
  expect(await page.locator(".brand svg path").first().evaluate(element => getComputedStyle(element).stroke)).toBe(calmColor);
});

test("ambas as paletas preservam contraste e layout", async ({ page }) => {
  for (const vividColors of [true, false]) {
    await page.goto("/ajustes");
    await page.getByLabel("Cores mais vivas", { exact: true }).setChecked(vividColors);
    for (const width of [360, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/inicio");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations).toEqual([]);
  }
});
