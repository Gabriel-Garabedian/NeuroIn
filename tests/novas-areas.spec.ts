import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('mural aceita comentário local e permite apoiar', async ({ page }) => {
  await page.goto('/mural');
  const card = page.locator('article').first();
  await card.getByRole('button', { name: /Apoiar/ }).click();
  await expect(card.getByRole('button', { name: /Retirar apoio/ })).toHaveAttribute('aria-pressed', 'true');
  await card.getByLabel('Seu comentário').fill('Parabéns pela conquista!');
  await card.getByRole('button', { name: 'Comentar' }).click();
  await expect(card.getByText('Parabéns pela conquista!')).toBeVisible();
  await expect(card.getByRole('status')).toContainText('somente nesta tela');
});

test('contato simulado aparece junto ao perfil escolhido', async ({ page }) => {
  await page.goto('/vitrine');
  await page.getByRole('button', { name: 'Profissionais de Saúde' }).click();
  const card = page.locator('article').first();
  await card.getByRole('button', { name: /Simular contato/ }).click();
  await expect(card.getByRole('status')).toContainText('Nenhum contato real');
});

test('fórum oferece várias perguntas e salinha oferece novas situações', async ({ page }) => {
  await page.goto('/forum');
  for (const category of ['Trabalho e Estudos', 'Sobrecarga Sensorial', 'Hiperfocos', 'Vida Social']) {
    await page.getByRole('button', { name: category, exact: true }).click();
    expect(await page.locator('article').count()).toBeGreaterThanOrEqual(3);
    await page.locator('article').first().getByRole('button').click();
    await expect(page.locator('article').first().locator('.demo-comment')).toBeVisible();
  }
  await page.goto('/salinha');
  await page.getByRole('radio', { name: 'Usar transporte público' }).check();
  await page.getByRole('button', { name: 'Criar meu ensaio' }).click();
  await expect(page.getByRole('heading', { name: 'Exemplo: transporte público' })).toBeVisible();
  await expect(page.locator('.rehearsal-result li')).toHaveCount(4);
});

test('blocos da página inicial não se sobrepõem no desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const links = await page.locator('.demo-links').boundingBox();
  const footer = await page.locator('.home-footer').boundingBox();
  const note = await page.locator('.academic-note').boundingBox();
  expect(links && footer && note).toBeTruthy();
  expect(links!.y + links!.height).toBeLessThanOrEqual(footer!.y);
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(note!.y);
});

for (const width of [390, 1280]) {
  test(`novas áreas têm navegação e acessibilidade em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/mural', '/forum', '/vitrine', '/salinha']) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
    await page.getByRole('radio', { name: 'Ir ao mercado' }).check();
    await page.getByLabel('O que me preocupa?').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Criar meu ensaio' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Exemplo: mercado' })).toBeVisible();
  });
}

test('orienta quando comentário contém apenas espaços', async ({ page }) => {
  await page.goto('/mural');
  const card = page.locator('article').first();
  await card.getByLabel('Seu comentário').fill('   ');
  await card.getByRole('button', { name: 'Comentar' }).click();
  await expect(card.getByRole('status')).toContainText('Escreva um comentário');
});
