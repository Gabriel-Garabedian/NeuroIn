export function pushRequirement(): string | null {
  if (!window.isSecureContext) return "As notificações precisam de HTTPS. Abra o endereço seguro do NeuroIn.";
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone;
  if (ios && !standalone) return "No iPhone/iPad com iOS/iPadOS 16.4 ou posterior, adicione o NeuroIn à Tela de Início e abra pelo ícone para ativar notificações.";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "Este navegador não oferece notificações Web Push. Use um navegador compatível e atualizado.";
  }
  if (Notification.permission === "denied") return "As notificações foram bloqueadas. Libere o NeuroIn nas configurações do navegador ou do sistema e tente novamente.";
  return null;
}
export async function subscribe(publicKey: string) {
  // A permissão é solicitada diretamente pelo clique, antes de esperar pela rede.
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Você não autorizou notificações. Pode ativá-las quando quiser nas configurações do navegador.");
  await navigator.serviceWorker.register("/sw.js");
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) await existing.unsubscribe();
  const decoded = atob(publicKey.replace(/-/g, "+").replace(/_/g, "/"));
  const key = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
}
