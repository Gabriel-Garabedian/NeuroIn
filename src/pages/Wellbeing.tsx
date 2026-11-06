import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, Check, ArrowRight } from "lucide-react";
import { painRegions, painLevels } from "../data/mockData";
import { PageHeading } from "../components/ui";
import { ConfirmationFeedback } from "../components/ConfirmationFeedback";
import { useCommunication } from "../notifications/CommunicationProvider";
import "./care.css";

const bodyPoints: Record<string, [number, number]> = {
  Cabeça: [24, 8], Boca: [24, 12], Peito: [24, 25], Barriga: [24, 35],
  Costas: [24, 29], Braços: [10, 30], Pernas: [18, 53], Outro: [37, 12],
};

function BodyRegion({ region }: { region: string }) {
  const [x, y] = bodyPoints[region];
  return (
    <svg className="care-body" width="42" height="54" viewBox="0 0 48 64" fill="none" aria-hidden="true">
      <circle cx="24" cy="9" r="7" />
      <path d="M16 20C12 21 10 25 9 36M32 20C36 21 38 25 39 36M16 21V39L14 59M32 21V39L34 59M16 39H32M24 41V59" />
      <circle className="care-body-point" cx={x} cy={y} r="4" />
    </svg>
  );
}
export default function Wellbeing() {
  const { choose } = useCommunication();
  const [region, setRegion] = useState("");
  const [level, setLevel] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const intensity = useRef<HTMLLegendElement>(null);
  const regions = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  function chooseRegion(value: string) {
    setRegion(value);
    setLevel(null);
    requestAnimationFrame(() => intensity.current?.focus({ preventScroll: true }));
  }
  function changeRegion() {
    setRegion("");
    requestAnimationFrame(() => regions.current?.querySelector("button")?.focus({ preventScroll: true }));
  }
  if (done)
    return (
      <ConfirmationFeedback
        title="Obrigado por me contar."
        phrase={`Dor na região: ${region} — intensidade ${level}/10.`}
        icon={HeartPulse}
        onBack={() => navigate("/")}
      />
    );
  return (
    <div className="care-page care-wellbeing">
      <PageHeading
        back="/"
        title="Onde está doendo?"
        description="Você pode me contar. Uma escolha de cada vez."
      />
      <div className="care-intro">
        <HeartPulse size={29} aria-hidden="true" />
        <p>Seu corpo, sua voz.<br /><strong>Vamos mostrar o que você sente.</strong></p>
      </div>
      {!region && <fieldset>
        <legend>1. Escolha uma região</legend>
        <div ref={regions} className="region-grid">
          {painRegions.map((r) => (
            <button
              key={r}
              className="selection-button"
              aria-pressed={region === r}
              onClick={() => chooseRegion(r)}
            >
              <BodyRegion region={r} />
              <span>{r}</span>
              {region === r && <Check className="care-selected-check" size={17} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </fieldset>}
      {region && <div className="care-chosen">
        <p><Check size={18} aria-hidden="true" /> Local selecionado: <strong>{region}</strong></p>
        <button onClick={changeRegion}>Alterar região</button>
      </div>}
      {region && (
        <fieldset className="pain-selector">
          <legend ref={intensity} tabIndex={-1}>2. Quanto está incomodando?</legend>
          <div className="pain-levels">
            {painLevels.map((l) => (
              <button
                key={l.value}
                className="pain-level"
                aria-pressed={level === l.value}
                onClick={() => setLevel(l.value)}
              >
                <strong>{l.value}</strong>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
          <label className="range-label" htmlFor="pain-range">
            Ou ajuste a intensidade: <strong>{level ?? 0}/10</strong>
          </label>
          <input
            id="pain-range"
            type="range"
            min="0"
            max="10"
            value={level ?? 0}
            aria-valuetext={`${level ?? 0} de 10`}
            onChange={(e) => setLevel(Number(e.target.value))}
          />
          {level !== null && (
            <section className="care-summary" aria-labelledby="pain-summary-title">
              <h2 id="pain-summary-title">Você informou</h2>
              <div><strong>{region}</strong><span>Intensidade <strong>{level}/10</strong></span></div>
              <p>Confira sua escolha antes de mostrar a mensagem.</p>
            </section>
          )}
          <button
            className="button button-primary full"
            disabled={level === null}
            onClick={() => {
              setDone(true);
              choose(`Dor na região: ${region} — intensidade ${level}/10.`);
            }}
          >
            Confirmar <ArrowRight size={18} />
          </button>
        </fieldset>
      )}
      <p className="disclaimer">
        Esta tela ajuda a comunicar a dor. Não faz diagnóstico nem recomenda
        tratamentos.
      </p>
    </div>
  );
}
