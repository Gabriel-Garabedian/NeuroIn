import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, Check, ArrowRight } from "lucide-react";
import { painRegions, painLevels } from "../data/mockData";
import { PageHeading } from "../components/ui";
import { ConfirmationFeedback } from "../components/ConfirmationFeedback";
export default function Wellbeing() {
  const [region, setRegion] = useState("");
  const [level, setLevel] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
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
    <>
      <PageHeading
        back="/"
        title="Onde está doendo?"
        description="Você pode me contar. Uma escolha de cada vez."
      />
      <div className="flow-intro tone-coral">
        <HeartPulse size={28} />
        <p>Vamos encontrar uma forma de mostrar o que você sente.</p>
      </div>
      <fieldset>
        <legend>1. Escolha uma região</legend>
        <div className="region-grid">
          {painRegions.map((r) => (
            <button
              key={r}
              className="selection-button"
              aria-pressed={region === r}
              onClick={() => setRegion(r)}
            >
              {region === r && <Check size={17} />} {r}
            </button>
          ))}
        </div>
      </fieldset>
      {region && (
        <fieldset className="pain-selector">
          <legend>2. Quanto está incomodando?</legend>
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
            onChange={(e) => setLevel(Number(e.target.value))}
          />
          <button
            className="button button-primary full"
            disabled={level === null}
            onClick={() => setDone(true)}
          >
            Confirmar <ArrowRight size={18} />
          </button>
        </fieldset>
      )}
      <p className="disclaimer">
        Esta tela ajuda a comunicar a dor. Não faz diagnóstico nem recomenda
        tratamentos.
      </p>
    </>
  );
}
