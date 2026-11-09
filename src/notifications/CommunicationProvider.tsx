import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api } from "./api";
import type { NetworkRequest, Session } from "./api";

type Pending = { id: string; phrase: string; peers: string[] };
type Feedback = { id?: string; phrase: string; message: string; busy?: boolean; retry?: boolean };
const storageKey = "neuroin-pending-requests-v1";
function loadPending(): Pending[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(saved) ? saved.filter((p): p is Pending =>
      p && typeof p.id === "string" && /^[0-9a-f-]{36}$/i.test(p.id) &&
      typeof p.phrase === "string" && p.phrase.length > 0 && p.phrase.length <= 500 &&
      Array.isArray(p.peers) && p.peers.every((id: unknown) => typeof id === "string"),
    ) : [];
  } catch { return []; }
}
type CommunicationState = {
  session: Session | undefined;
  sessionError: string;
  refresh: () => Promise<Session>;
  choose: (phrase: string) => void;
  repeat: (phrase: string) => void;
  retry: (id: string) => void;
  retrySelection: () => Promise<void>;
  discard: (id: string) => void;
  pending: Pending[];
  feedback: Feedback | null;
  checkRead: () => Promise<void>;
};
const Context = createContext<CommunicationState | null>(null);
export function CommunicationProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>();
  const [sessionError, setSessionError] = useState("");
  const sessionVersion = useRef(0);
  const [pending, setPending] = useState(loadPending);
  const pendingRef = useRef(pending);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const sending = useRef(new Set<string>());
  const retryingSelection = useRef(false);
  const lastChoice = useRef({ phrase: "", at: 0 });
  const storageFailed = useRef(false);
  function persist(items: Pending[]) {
    pendingRef.current = items;
    setPending(items);
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
      storageFailed.current = false;
    } catch { storageFailed.current = true; }
  }
  async function refresh() {
    const version = ++sessionVersion.current;
    try {
      const next = await api<Session>("/session");
      if (version === sessionVersion.current) {
        setSession(next);
        setSessionError("");
      }
      return next;
    } catch (error) {
      if (version === sessionVersion.current) setSessionError((error as Error).message);
      throw error;
    }
  }
  useEffect(() => {
    void refresh().catch(() => {});
  }, []);
  async function send(item: Pending) {
    if (sending.current.has(item.id)) return;
    sending.current.add(item.id);
    setFeedback({ ...item, message: "Enviando pedido à rede…", busy: true });
    try {
      const current = await refresh();
      if (current.device?.role !== "communicator" || !current.peers.length) {
        throw new Error("Vincule este aparelho à rede de apoio antes de enviar.");
      }
      if (item.peers.slice().sort().join() !== current.peers.map((p) => p.id).sort().join()) {
        throw new Error("O vínculo mudou. Descarte este envio e selecione a mensagem novamente.");
      }
      const result = await api<{
        request: NetworkRequest;
        push: { accepted: number; failed: number; pending: number };
      }>("/requests", "POST", { id: item.id, phrase: item.phrase, expectedPeers: item.peers });
      const needsRetry = result.push.failed > 0 || result.push.pending > 0 || result.push.accepted === 0;
      if (!needsRetry) persist(pendingRef.current.filter((p) => p.id !== item.id));
      const nextFeedback = { ...item, retry: needsRetry, message:
        "Pedido salvo na rede. " + (result.request.readAt
          ? "A rede marcou este pedido como lido."
          : result.push.accepted > 0
            ? "O serviço de notificações aceitou o envio; a leitura ainda não foi confirmada."
            : "A notificação ainda não foi aceita. A rede pode consultar o pedido no aplicativo.") +
        (needsRetry && result.push.accepted > 0 ? " Há notificações pendentes para outros aparelhos." : ""),
      };
      setFeedback((current) => current?.id === item.id ? nextFeedback : current);
    } catch (error) {
      setFeedback((current) => current?.id === item.id ? { ...item, retry: true, message: `${(error as Error).message} A mensagem local continua disponível.${storageFailed.current ? " O armazenamento está bloqueado: mantenha esta aba aberta para tentar novamente." : ""}` } : current);
    } finally { sending.current.delete(item.id); }
  }
  function queue(phrase: string, knownSession: Session | undefined) {
    if (!window.isSecureContext) {
      setFeedback({ phrase, message: "Abra o NeuroIn por HTTPS para enviar à rede. A mensagem local continua disponível." });
      return;
    }
    if (!knownSession) {
      setFeedback({ phrase, retry: true, message: "Não foi possível consultar o vínculo. Confira a conexão e tente enviar novamente. A mensagem local continua disponível." });
      return;
    }
    if (!knownSession.device || knownSession.device.role !== "communicator" || !knownSession.peers.length) {
      setFeedback({ phrase, message: "Para enviar esta mensagem, vincule este aparelho à rede de apoio." });
      return;
    }
    const item = { id: crypto.randomUUID(), phrase, peers: knownSession.peers.map((p) => p.id) };
    persist([...pendingRef.current, item]);
    void send(item);
  }
  function choose(phrase: string) {
    if (lastChoice.current.phrase === phrase && Date.now() - lastChoice.current.at < 1500) return;
    lastChoice.current = { phrase, at: Date.now() };
    queue(phrase, session);
  }
  async function retrySelection() {
    if (!feedback || feedback.id || retryingSelection.current) return;
    retryingSelection.current = true;
    const phrase = feedback.phrase;
    const choice = lastChoice.current;
    setFeedback({ phrase, busy: true, message: "Consultando vínculo…" });
    try {
      const current = await refresh();
      if (lastChoice.current === choice) queue(phrase, current);
    }
    catch (error) {
      setFeedback((current) => current?.phrase === phrase && !current.id
        ? { phrase, retry: true, message: `${(error as Error).message} A mensagem local continua disponível.` }
        : current);
    } finally { retryingSelection.current = false; }
  }
  function retry(id: string) {
    const item = pendingRef.current.find((p) => p.id === id);
    if (item) void send(item);
  }
  function discard(id: string) {
    if (!sending.current.has(id)) persist(pendingRef.current.filter((p) => p.id !== id));
  }
  async function checkRead() {
    if (!feedback?.id) return;
    try {
      const { request } = await api<{ request: NetworkRequest }>(`/requests/${feedback.id}`);
      setFeedback((current) => current && current.id === feedback.id ? { ...current, message: request.readAt
        ? `A rede marcou como lido em ${new Date(request.readAt).toLocaleString("pt-BR")}.`
        : "Pedido salvo na rede. A leitura ainda não foi confirmada." } : current);
    } catch (error) { setFeedback((current) => current && current.id === feedback.id ? { ...current, message: (error as Error).message } : current); }
  }
  return <Context.Provider value={{ session, sessionError, refresh, choose, repeat: (phrase) => queue(phrase, session), retry, retrySelection, discard, pending, feedback, checkRead }}>{children}</Context.Provider>;
}
// O estado e os handlers compartilham este módulo pequeno.
// eslint-disable-next-line react-refresh/only-export-components
export function useCommunication() {
  const context = useContext(Context);
  if (!context) throw new Error("CommunicationProvider ausente");
  return context;
}
