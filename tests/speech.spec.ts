import { test, expect } from "@playwright/test";

for (const automatic of [false, true]) {
  test(`voz ${automatic ? "automática" : "manual"} informa falha e conclusão`, async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "speechSynthesis", {
        value: {
          speak: (utterance: SpeechSynthesisUtterance) => {
            Object.assign(window, { testUtterance: utterance });
          },
          cancel: () => {},
        },
      });
    });
    await page.goto("/ajustes");
    if (automatic) await page.getByLabel("Confirmar antes de falar", { exact: true }).uncheck();
    await page.goto("/");
    await page.getByRole("button", { name: "Água", exact: true }).click();
    if (!automatic) await page.getByRole("button", { name: "Falar", exact: true }).click();
    await page.evaluate(() => {
      const utterance = (window as unknown as { testUtterance: SpeechSynthesisUtterance }).testUtterance;
      utterance.dispatchEvent(new SpeechSynthesisErrorEvent("error", { error: "network", utterance }));
    });
    await expect(page.getByRole("status", { name: "Reprodução de voz" })).toContainText("Não foi possível reproduzir");
    await page.getByRole("button", { name: "Falar", exact: true }).click();
    await page.evaluate(() => {
      const utterance = (window as unknown as { testUtterance: SpeechSynthesisUtterance }).testUtterance;
      utterance.dispatchEvent(new SpeechSynthesisEvent("end", { utterance }));
    });
    await expect(page.getByRole("status", { name: "Reprodução de voz" })).toHaveText("Mensagem reproduzida.");
  });
}
