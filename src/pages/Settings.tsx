import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Eye,
  HeartHandshake,
  RotateCcw,
  SlidersHorizontal,
  Volume2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Preferences } from "../context/types";
import { PageHeading } from "../components/ui";
import "./settings.css";

type ToggleKey = Exclude<keyof Preferences, "volume" | "view">;

function PreferenceToggle({
  name,
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  name: ToggleKey;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`settings-toggle${disabled ? " settings-toggle-disabled" : ""}`}
    >
      <span className="settings-toggle-copy">
        <span className="settings-toggle-title">{title}</span>
        <span id={`settings-${name}-description`} className="muted">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={title}
        aria-describedby={`settings-${name}-description`}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export default function Settings() {
  const { preferences, updatePreferences, reset, storageError } = useApp();
  const navigate = useNavigate();
  const resetDialog = useRef<HTMLDialogElement>(null);
  const speechSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  function toggle(name: ToggleKey, checked: boolean) {
    updatePreferences({ [name]: checked });
    if (name === "voice" && !checked) window.speechSynthesis?.cancel();
    if (name === "calm" && checked) navigate("/calmo");
  }

  function changeView(view: Preferences["view"]) {
    updatePreferences({ view });
    navigate(view === "support" ? "/rede" : "/");
  }

  function resetDemo() {
    reset();
    resetDialog.current?.close();
    navigate("/", {
      state: {
        resetMessage:
          "Demonstração reiniciada. Seus ajustes e atividades voltaram ao início.",
      },
    });
  }

  return (
    <div className="settings-page">
      <PageHeading
        title="Ajustes"
        description="Deixe o NeuroIn mais confortável para você."
      />
      <div className="settings-save-note" role="status" hidden={storageError}>
        <Check size={18} aria-hidden="true" /> Suas escolhas são salvas
        automaticamente neste dispositivo.
      </div>
      {storageError && (
        <div className="info-card settings-storage-warning" role="alert">
          <strong>Não foi possível salvar neste dispositivo.</strong>
          <p>
            Seus ajustes funcionam enquanto esta página estiver aberta.
            Verifique se o navegador permite o armazenamento de dados.
          </p>
        </div>
      )}

      <section
        className="panel settings-section"
        aria-labelledby="settings-appearance"
      >
        <h2 id="settings-appearance">
          <Eye size={22} aria-hidden="true" /> Leitura e aparência
        </h2>
        <PreferenceToggle
          name="largeText"
          title="Texto maior"
          description="Aumenta o tamanho dos textos para facilitar a leitura."
          checked={preferences.largeText}
          onChange={(checked) => toggle("largeText", checked)}
        />
        <PreferenceToggle
          name="highContrast"
          title="Alto contraste"
          description="Destaca textos, botões e limites dos elementos."
          checked={preferences.highContrast}
          onChange={(checked) => toggle("highContrast", checked)}
        />
        <PreferenceToggle
          name="reducedMotion"
          title="Reduzir movimentos"
          description="Diminui animações e transições na tela."
          checked={preferences.reducedMotion}
          onChange={(checked) => toggle("reducedMotion", checked)}
        />
      </section>

      <section
        className="panel settings-section"
        aria-labelledby="settings-speech"
      >
        <h2 id="settings-speech">
          <Volume2 size={22} aria-hidden="true" /> Voz e comunicação
        </h2>
        <PreferenceToggle
          name="voice"
          title="Leitura em voz alta"
          description={
            speechSupported
              ? "Permite ouvir os textos e cartões de comunicação."
              : "A leitura em voz alta não está disponível neste navegador. Você pode continuar usando os textos e cartões."
          }
          checked={speechSupported && preferences.voice}
          disabled={!speechSupported}
          onChange={(checked) => toggle("voice", checked)}
        />
        <div className="settings-volume">
          <div className="settings-volume-label">
            <label htmlFor="settings-volume">Volume da voz</label>
            <output htmlFor="settings-volume">
              {Math.round(preferences.volume * 100)}%
            </output>
          </div>
          <input
            id="settings-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={preferences.volume}
            disabled={!speechSupported}
            aria-describedby="settings-volume-description"
            aria-valuetext={`${Math.round(preferences.volume * 100)} por cento`}
            onChange={(event) =>
              updatePreferences({ volume: Number(event.target.value) })
            }
          />
          <p id="settings-volume-description" className="muted">
            Ajusta apenas a voz do NeuroIn. O volume do dispositivo também
            influencia o som.
          </p>
        </div>
        <PreferenceToggle
          name="confirmSpeech"
          title="Confirmar antes de falar"
          description="Pede sua confirmação antes de ler um cartão de comunicação."
          checked={preferences.confirmSpeech}
          disabled={!speechSupported}
          onChange={(checked) => toggle("confirmSpeech", checked)}
        />
      </section>

      <section
        className="panel settings-section"
        aria-labelledby="settings-experience"
      >
        <h2 id="settings-experience">
          <SlidersHorizontal size={22} aria-hidden="true" /> Seu ritmo
        </h2>
        <PreferenceToggle
          name="fewerOptions"
          title="Menos opções por vez"
          description="Mostra menos opções para ajudar você a escolher com tranquilidade."
          checked={preferences.fewerOptions}
          onChange={(checked) => toggle("fewerOptions", checked)}
        />
        <PreferenceToggle
          name="calm"
          title="Modo calmo"
          description="Abre um espaço com menos estímulos para fazer uma pausa."
          checked={preferences.calm}
          onChange={(checked) => toggle("calm", checked)}
        />
      </section>

      <section
        className="panel settings-section"
        aria-labelledby="settings-view"
      >
        <h2 id="settings-view">
          <HeartHandshake size={22} aria-hidden="true" /> Como você usa o
          NeuroIn
        </h2>
        <fieldset className="settings-view-options">
          <legend>Escolha sua visão</legend>
          <label className="settings-view-option">
            <input
              type="radio"
              name="settings-view"
              value="self"
              aria-label="Meu espaço"
              checked={preferences.view === "self"}
              onChange={() => changeView("self")}
            />
            <span>
              <strong>Meu espaço</strong>
              <span className="muted">
                Minha rotina, minha comunicação e minhas escolhas.
              </span>
            </span>
          </label>
          <label className="settings-view-option">
            <input
              type="radio"
              name="settings-view"
              value="support"
              aria-label="Rede de apoio"
              checked={preferences.view === "support"}
              onChange={() => changeView("support")}
            />
            <span>
              <strong>Rede de apoio</strong>
              <span className="muted">
                Acompanhar e apoiar alguém com respeito à autonomia.
              </span>
            </span>
          </label>
        </fieldset>
      </section>

      <section
        className="info-card settings-reset"
        aria-labelledby="settings-reset-heading"
      >
        <h2 id="settings-reset-heading">Recomeçar a demonstração</h2>
        <p className="muted">
          Restaura os ajustes iniciais e apaga o progresso das atividades neste
          dispositivo.
        </p>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => resetDialog.current?.showModal()}
        >
          <RotateCcw size={18} aria-hidden="true" /> Restaurar demonstração
        </button>
      </section>

      <dialog
        ref={resetDialog}
        className="settings-reset-dialog"
        aria-labelledby="settings-dialog-title"
        aria-describedby="settings-dialog-description"
      >
        <h2 id="settings-dialog-title">Restaurar a demonstração?</h2>
        <p id="settings-dialog-description">
          Seus ajustes e o progresso das atividades voltarão ao início. Esta
          ação não pode ser desfeita.
        </p>
        <div className="settings-dialog-actions">
          <button
            type="button"
            className="button button-secondary"
            autoFocus
            onClick={() => resetDialog.current?.close()}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={resetDemo}
          >
            Sim, restaurar
          </button>
        </div>
      </dialog>
    </div>
  );
}
