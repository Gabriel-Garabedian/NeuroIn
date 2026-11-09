import { Check, Volume2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useCommunication } from "../notifications/CommunicationProvider";
import "../notifications/notifications.css";
export function ConfirmationFeedback({
  phrase,
  title = "Entendi. Estou aqui com você.",
  icon: Icon = Check,
  onBack,
}: {
  phrase: string;
  title?: string;
  icon?: LucideIcon;
  onBack: () => void;
}) {
  const { preferences } = useApp();
  const communication = useCommunication();
  const remote = communication.feedback;
  const [feedback, setFeedback] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const supported =
    "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const { voice, confirmSpeech, volume } = preferences;
  const activeSpeech = useRef<SpeechSynthesisUtterance | null>(null);
  const cancelSpeech = useCallback(() => {
    if (activeSpeech.current) {
      activeSpeech.current.onstart = null;
      activeSpeech.current.onend = null;
      activeSpeech.current.onerror = null;
      activeSpeech.current = null;
    }
    window.speechSynthesis?.cancel();
  }, []);
  const speak = useCallback(() => {
    if (!supported || !voice) return;
    cancelSpeech();
    const utterance = new SpeechSynthesisUtterance(phrase);
    activeSpeech.current = utterance;
    utterance.lang = "pt-BR";
    utterance.volume = volume;
    utterance.rate = 0.85;
    utterance.onstart = () => setFeedback("Reproduzindo sua mensagem.");
    utterance.onend = () => setFeedback("Mensagem reproduzida.");
    utterance.onerror = () =>
      setFeedback(
        "Não foi possível reproduzir a voz. Você pode mostrar esta mensagem.",
      );
    setFeedback("Preparando sua mensagem.");
    window.speechSynthesis.speak(utterance);
  }, [cancelSpeech, phrase, supported, voice, volume]);
  useEffect(() => {
    heading.current?.focus();
    if (!confirmSpeech) speak();
    return cancelSpeech;
  }, [cancelSpeech, confirmSpeech, speak]);
  function back() {
    onBack();
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>("main h1")?.focus(),
    );
  }
  return (
    <section className="confirmation">
      <div className="confirmation-check">
        <Check size={20} aria-hidden="true" /> Mensagem selecionada
      </div>
      <div className="confirmation-icon">
        <Icon size={64} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <p>{title}</p>
      <h1 ref={heading} tabIndex={-1}>
        {phrase}
      </h1>
      <p className="muted">Você pode mostrar esta tela para alguém.</p>
      <div className="confirmation-actions">
        <button
          className="button button-primary"
          onClick={() => { speak(); communication.repeat(phrase); }}
          disabled={!supported || !voice}
        >
          <Volume2 size={20} aria-hidden="true" /> Falar
        </button>
        <button className="button button-secondary" onClick={back}>
          <ArrowLeft size={18} aria-hidden="true" />
          Voltar ao início
        </button>
      </div>
      {!supported ? (
        <p className="small">
          A voz não está disponível neste navegador. Sua mensagem continua
          visível.
        </p>
      ) : !voice ? (
        <p className="small">
          A voz está desativada.{" "}
          <Link className="text-link" to="/ajustes">
            Ativar nos ajustes
          </Link>
          .
        </p>
      ) : null}
      <p role="status" aria-label="Reprodução de voz">{feedback}</p>
      {remote && <div className="remote-feedback">
        <p role="status" aria-live="polite" aria-label="Envio à rede">{remote.message}</p>
        {remote.retry && <button className="button button-secondary" disabled={remote.busy} onClick={() => remote.id ? communication.retry(remote.id) : void communication.retrySelection()}>Tentar envio novamente</button>}
        {remote.id && !remote.busy && <button className="button button-secondary" onClick={() => void communication.checkRead()}>Consultar leitura</button>}
        <Link className="text-link" to="/rede">Aparelhos e rede de apoio</Link>
      </div>}
    </section>
  );
}
