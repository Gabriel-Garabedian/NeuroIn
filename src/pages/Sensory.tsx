import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Leaf, ChevronRight, HeartHandshake } from "lucide-react";
import { sensoryOptions, sensoryHelp } from "../data/mockData";
import { PageHeading } from "../components/ui";
import { ConfirmationFeedback } from "../components/ConfirmationFeedback";
export default function Sensory() {
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(params.get("motivo") ?? "");
  const [help, setHelp] = useState("");
  const navigate = useNavigate();
  if (help)
    return (
      <ConfirmationFeedback
        phrase={help}
        title="Entendi. Vamos respeitar o que você precisa."
        icon={HeartHandshake}
        onBack={() => navigate("/")}
      />
    );
  return (
    <>
      <PageHeading
        back="/"
        title="O que está incomodando?"
        description="Você não precisa explicar tudo. Pode escolher aqui."
      />
      <div className="sensory-grid">
        {sensoryOptions.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="sensory-option"
            aria-pressed={selected === label}
            onClick={() => setSelected(label)}
          >
            <Icon size={26} />
            <span>{label}</span>
            {selected === label && <Check size={16} />}
          </button>
        ))}
      </div>
      {selected && (
        <section className="sensory-help">
          <p className="inline-feedback" role="status">
            <Check size={18} />
            Entendi. {selected} está incomodando.
          </p>
          <h2>O que pode ajudar?</h2>
          <div className="option-list">
            {sensoryHelp.map((h) => (
              <button
                className="option-button"
                key={h}
                onClick={() => setHelp(h)}
              >
                <span>{h}</span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </section>
      )}
      <Link to="/calmo" className="calm-banner">
        <Leaf size={25} />
        <span>
          <strong>Ir para o Modo Calmo</strong>
          <span>Uma tela com menos estímulos.</span>
        </span>
        <ChevronRight size={18} />
      </Link>
    </>
  );
}
