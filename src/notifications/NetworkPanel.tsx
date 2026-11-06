import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bell, Link2 } from "lucide-react";
import { useCommunication } from "./CommunicationProvider";
import { api } from "./api";
import type { NetworkRequest } from "./api";
import { pushRequirement, subscribe } from "./push";
import "./notifications.css";

export function NetworkPanel() {
  const { session, sessionError, refresh, pending, retry, discard, feedback } = useCommunication();
  const [code, setCode] = useState("");
  const [generated, setGenerated] = useState<{ code: string; expiresAt: string }>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [requestError, setRequestError] = useState("");
  const [params] = useSearchParams();
  const requestedId = params.get("pedido");
  const selected = useRef<HTMLLIElement>(null);
  const focusedRequest = useRef<string | null>(null);
  const requestsVersion = useRef(0);
  const role = session?.device?.role;
  const peersKey = session?.peers.map((peer) => peer.id).sort().join();
  const requirement = pushRequirement();
  useEffect(() => {
    setRequests([]);
    focusedRequest.current = null;
  }, [role, peersKey]);
  const loadRequests = useCallback(async () => {
    if (role !== "support") return;
    const version = ++requestsVersion.current;
    try {
      const result = await api<{ requests: NetworkRequest[] }>("/requests");
      if (requestedId && !result.requests.some((r) => r.id === requestedId)) {
        const detail = await api<{ request: NetworkRequest }>(`/requests/${encodeURIComponent(requestedId)}`);
        result.requests.unshift(detail.request);
      }
      if (version === requestsVersion.current) {
        setRequests(result.requests);
        setRequestError("");
      }
    } catch (error) {
      if (version === requestsVersion.current) setRequestError((error as Error).message);
    }
  // A mudança dos vínculos invalida consultas iniciadas na rede anterior.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, requestedId, peersKey]);
  useEffect(() => {
    void loadRequests();
    const update = () => {
      if (document.visibilityState === "visible") {
        void refresh().catch(() => {});
        void loadRequests();
      }
    };
    const interval = window.setInterval(update, 15000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      // É um contador de consultas, não uma referência a um nó do DOM.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestsVersion.current++;
      clearInterval(interval);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
    // refresh só consulta sessão; a identidade não altera o agendamento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadRequests]);
  useEffect(() => {
    if (requestedId && focusedRequest.current !== requestedId && requests.some((r) => r.id === requestedId)) {
      selected.current?.focus();
      focusedRequest.current = requestedId;
    }
  }, [requestedId, requests]);
  async function act(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try { await action(); }
    catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  async function generate() {
    await api("/devices", "POST", { role: "support", name: "Responsável" });
    setGenerated(await api("/pairings", "POST", {}));
    await refresh();
    setMessage("No aparelho de Ana, abra Rede de apoio e informe este código. Ele só pode ser usado uma vez.");
  }
  async function redeem() {
    await api("/devices", "POST", { role: "communicator", name: "Ana" });
    await api("/pairings/redeem", "POST", { code: code.trim().toUpperCase() });
    setCode("");
    await refresh();
    setMessage("Aparelhos vinculados. As escolhas de comunicação agora serão enviadas a esta rede.");
  }
  async function enable() {
    if (requirement) throw new Error(requirement);
    if (!session?.publicKey) throw new Error("O serviço ainda precisa configurar as chaves de notificações. Consulte quem hospeda o NeuroIn.");
    const subscription = await subscribe(session.publicKey);
    await api("/subscription", "PUT", subscription.toJSON());
    await refresh();
    setMessage("Notificações ativadas neste aparelho. Envie uma notificação de teste para conferir.");
  }
  async function disable() {
    // A remoção no servidor impede novos envios mesmo se o navegador falhar depois.
    await api("/subscription", "DELETE");
    await refresh();
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
    }
    setMessage("Notificações desativadas neste aparelho. Os pedidos continuam disponíveis na rede.");
  }
  async function testPush() {
    const result = await api<{ accepted: number; failed: number }>("/push/test", "POST", {});
    await refresh();
    setMessage(result.accepted > 0
      ? "O serviço aceitou a notificação de teste. Confira se ela apareceu neste aparelho; isso confirma o recebimento."
      : "O serviço não aceitou o teste. Confira as permissões e ative as notificações novamente.");
  }
  async function markRead(id: string) {
    await api(`/requests/${id}/read`, "POST", {});
    await loadRequests();
    setMessage("Pedido marcado como lido.");
  }
  return <>
    <section className="network-panel" aria-labelledby="devices-title">
      <h2 id="devices-title"><Link2 size={22} aria-hidden="true" /> Aparelhos e notificações</h2>
      <p>Conecte o aparelho de quem comunica ao de quem recebe os pedidos.</p>
      {sessionError && <p role="status">{sessionError} A comunicação local continua disponível.</p>}
      {!session && <button className="button button-secondary" disabled={busy} onClick={() => void act(async () => { await refresh(); })}>Tentar conexão</button>}
      {session && <>
        {session.peers.length ? <ul className="network-peers">{session.peers.map((peer) => <li key={peer.id}>
          <span>Vinculado a {peer.name}</span>
          <button className="button button-secondary" disabled={busy} onClick={() => void act(async () => {
            requestsVersion.current++;
            await api(`/links/${peer.id}`, "DELETE");
            requestsVersion.current++;
            setRequests([]);
            await refresh();
            setMessage("Aparelho desvinculado. Novos pedidos não serão compartilhados com ele.");
          })}>Desvincular {peer.name}</button>
        </li>)}</ul> : <p>Este aparelho ainda não está vinculado.</p>}
        {role !== "communicator" && <>
          <p><strong>No aparelho da responsável:</strong> gere o código para vincular o aparelho de Ana.</p>
          <button className="button button-primary" disabled={busy} onClick={() => void act(generate)}>Vincular dispositivo</button>
          {generated && <div className="pairing-code">
            <p>Código de uso único</p>
            <strong data-testid="pairing-code">{generated.code}</strong>
            <p>Expira em <time dateTime={generated.expiresAt}>{new Date(generated.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time>. Gerar outro código invalida o anterior.</p>
          </div>}
        </>}
        {role !== "support" && <form onSubmit={(event) => { event.preventDefault(); void act(redeem); }}>
          <p><strong>No aparelho de Ana:</strong> informe o código gerado pela responsável.</p>
          <label htmlFor="pairing-input">Código de vinculação</label>
          <input id="pairing-input" name="pairing-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={32} required />
          <button className="button button-primary" disabled={busy || !code.trim()}>Confirmar vínculo</button>
          {role === "communicator" && <Link className="button button-secondary" to="/inicio">Ir para a comunicação</Link>}
        </form>}
        {role === "support" && <div className="notification-controls">
          <h3><Bell size={20} aria-hidden="true" /> Receber notificações neste aparelho</h3>
          <p>{session.subscribed ? "Há uma inscrição de notificações neste aparelho." : "As notificações estão desativadas neste aparelho."}</p>
          {requirement && <p>{requirement}</p>}
          <div className="network-buttons">
            <button className="button button-primary" disabled={busy} onClick={() => void act(enable)}>{session.subscribed ? "Reativar notificações" : "Ativar notificações"}</button>
            {session.subscribed && <>
              <button className="button button-secondary" disabled={busy} onClick={() => void act(testPush)}>Enviar notificação de teste</button>
              <button className="button button-secondary" disabled={busy} onClick={() => void act(disable)}>Desativar notificações</button>
            </>}
          </div>
        </div>}
      </>}
      <p className="network-message" role="status" aria-live="polite">{busy ? "Aguarde…" : message}</p>
      <details className="push-help">
        <summary>Como receber no Android ou iPhone</summary>
        <p>Use o endereço HTTPS publicado do NeuroIn nos dois aparelhos, com conexão à internet.</p>
        <p>Android: use um navegador atualizado com suporte a Web Push e permita notificações no navegador e no sistema.</p>
        <p>iPhone/iPad: é necessário iOS/iPadOS 16.4 ou posterior. No Safari, use Compartilhar → Adicionar à Tela de Início. Abra pelo ícone instalado e toque em Ativar notificações.</p>
        <p>A entrega e o som dependem da conexão, das permissões, do modo Foco e das configurações do sistema. A frase não será falada automaticamente. O envio pode atrasar.</p>
        <p>O código concede acesso aos pedidos. Compartilhe somente com sua rede. A frase pode aparecer na tela bloqueada; ajuste a privacidade das notificações no sistema se necessário.</p>
      </details>
    </section>
    {pending.length > 0 && <section className="network-panel" aria-labelledby="pending-title">
      <h2 id="pending-title">Envios para tentar novamente</h2>
      <p>Não reenviamos ao recarregar. Use o mesmo pedido para evitar duplicidade.</p>
      <ul className="network-requests">{pending.map((item) => <li key={item.id}>
        <p>{item.phrase}</p>
        <div className="network-buttons">
          <button className="button button-secondary" disabled={feedback?.busy && feedback.id === item.id} onClick={() => retry(item.id)}>Tentar envio novamente</button>
          <button className="button button-secondary" disabled={feedback?.busy && feedback.id === item.id} onClick={() => discard(item.id)}>Descartar tentativa</button>
        </div>
      </li>)}</ul>
      <p role="status">{feedback?.message}</p>
    </section>}
    {role === "support" && <section className="network-panel" aria-labelledby="real-requests-title">
      <h2 id="real-requests-title">Pedidos reais</h2>
      <p>Mensagens enviadas pelos aparelhos vinculados. Marcar como lido confirma a consulta para quem enviou.</p>
      <button className="button button-secondary" disabled={busy} onClick={() => void act(loadRequests)}>Atualizar pedidos</button>
      {requestError && <p role="status">{requestError}</p>}
      {!requests.length && <p>Nenhum pedido disponível. Os registros de demonstração abaixo são fictícios.</p>}
      <ul className="network-requests">{requests.map((request) => <li key={request.id} ref={request.id === requestedId ? selected : undefined} tabIndex={request.id === requestedId ? -1 : undefined} className={request.id === requestedId ? "request-selected" : ""}>
        <p><strong>{request.senderName || "Ana"}</strong></p>
        <p>{request.phrase}</p>
        <time dateTime={request.createdAt}>{new Date(request.createdAt).toLocaleString("pt-BR")}</time>
        {request.readAt ? <p>Lido em {new Date(request.readAt).toLocaleString("pt-BR")}</p> : <button className="button button-secondary" disabled={busy} onClick={() => void act(() => markRead(request.id))}>Marcar como lido</button>}
        <Link className="text-link" to={`/rede?pedido=${request.id}`}>Abrir pedido</Link>
      </li>)}</ul>
      {requests.length >= 100 && <p>Exibindo os 100 pedidos mais recentes. Pedidos anteriores continuam acessíveis pelo link da notificação.</p>}
    </section>}
  </>;
}
