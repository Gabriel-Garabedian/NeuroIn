import { Check, Volume2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
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
  const [feedback, setFeedback] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const supported =
    "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const { voice, confirmSpeech, volume } = preferences;
  useEffect(() => {
    heading.current?.focus();
    if (!supported || !voice || confirmSpeech) return;
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "pt-BR";
    utterance.volume = volume;
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [phrase, supported, voice, confirmSpeech, volume]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  function speak() {
    if (!supported || !voice) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "pt-BR";
    utterance.volume = volume;
    utterance.rate = 0.85;
    utterance.onerror = () =>
      setFeedback(
        "Não foi possível reproduzir a voz. Você pode mostrar esta mensagem.",
      );
    window.speechSynthesis.speak(utterance);
    setFeedback("Reproduzindo sua mensagem.");
  }
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
          onClick={speak}
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
      <p role="status">{feedback}</p>
    </section>
  );
}
