import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('cada situação selecionada abre o roteiro correspondente', async ({ page }) => {
  await page.goto('/salinha');
  for (const [option, title] of [['Ir ao mercado','mercado'], ['Fazer uma entrevista','entrevista'], ['Comparecer a uma consulta','consulta'], ['Usar transporte público','transporte público'], ['Participar de um encontro','encontro social'], ['Fazer uma ligação','ligação telefônica']]) {
    await page.getByRole('radio', { name: option, exact: true }).check();
    await page.getByRole('button', { name: 'Criar meu ensaio' }).click();
    await expect(page.getByRole('heading', { name: `Exemplo: ${title}`, exact: true })).toBeVisible();
    await expect(page.locator('.rehearsal-result li')).toHaveCount(4);
    await expect(page.locator('.rehearsal-result')).toBeFocused();
  }
});

test('exige escolher situação e permite informar receios opcionais', async ({ page }) => {
  await page.goto('/salinha');
  await page.getByRole('button', { name: 'Criar meu ensaio' }).click();
  await expect(page.getByText('Escolha uma situação para continuar.')).toBeVisible();
  await page.getByRole('radio', { name: 'Comparecer a uma consulta' }).check();
  await page.getByLabel('O que me preocupa?').fill('Não saber o que vai acontecer');
  await page.getByRole('button', { name: 'Criar meu ensaio' }).click();
  await expect(page.getByRole('heading', { name: 'Exemplo: consulta' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Possíveis imprevistos' })).toBeVisible();
});

test('respeita movimento reduzido e mantém acessibilidade no resultado', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/salinha');
  await page.getByRole('radio', { name: 'Comparecer a uma consulta' }).check();
  await page.getByRole('button', { name: 'Criar meu ensaio' }).click();
  await expect(page.locator('.result-animation')).not.toHaveAttribute('style', /transform/);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/ajustes');
  await page.getByLabel('Reduzir movimentos').check();
  await page.goto('/salinha');
  await page.getByRole('radio', { name: 'Ir ao mercado' }).check();
  await page.getByRole('button', { name: 'Criar meu ensaio' }).click();
  await expect(page.locator('.result-animation')).not.toHaveAttribute('style', /transform/);
});
