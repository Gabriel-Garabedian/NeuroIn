import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Leaf, ChevronRight, HeartHandshake, VolumeX, DoorOpen, Moon, Hand, UserRound, UsersRound, LifeBuoy, Wind } from "lucide-react";
import { sensoryOptions, sensoryHelp } from "../data/mockData";
import { PageHeading } from "../components/ui";
import { ConfirmationFeedback } from "../components/ConfirmationFeedback";
import { useCommunication } from "../notifications/CommunicationProvider";
import "./care.css";

const helpIcons = [VolumeX, DoorOpen, Moon, Hand, UserRound, UsersRound, LifeBuoy];

function CalmLink() {
  return (
    <Link to="/calmo" className="calm-banner care-calm-link">
      <Leaf size={25} aria-hidden="true" />
      <span>
        <strong>Ir para o Modo Calmo</strong>
        <span>Uma tela com menos estímulos.</span>
      </span>
      <ChevronRight size={18} aria-hidden="true" />
    </Link>
  );
}
export default function Sensory() {
  const { choose: sendChoice } = useCommunication();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(params.get("motivo") ?? "");
  const [help, setHelp] = useState("");
  const helpHeading = useRef<HTMLHeadingElement>(null);
  const choices = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  function choose(label: string) {
    setSelected(label);
    requestAnimationFrame(() => helpHeading.current?.focus({ preventScroll: true }));
  }
  function changeSelection() {
    setSelected("");
    requestAnimationFrame(() => choices.current?.querySelector("button")?.focus({ preventScroll: true }));
  }
  if (help)
    return (
      <div className="care-page">
        <ConfirmationFeedback
          phrase={help}
          title="Entendi. Vamos respeitar o que você precisa."
          icon={HeartHandshake}
          onBack={() => navigate("/")}
        />
        <CalmLink />
      </div>
    );
  return (
    <div className="care-page care-sensory">
      <PageHeading
        back="/"
        title="O que está incomodando?"
        description="Você não precisa explicar tudo. Pode escolher aqui."
      />
      <div className="care-intro care-intro-sensory">
        <Wind size={29} aria-hidden="true" />
        <p>Seu conforto importa.<br /><strong>Escolha o que precisa mudar.</strong></p>
      </div>
      {!selected && <div ref={choices} className="sensory-grid">
        {sensoryOptions.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="sensory-option"
            aria-pressed={selected === label}
            onClick={() => choose(label)}
          >
            <Icon size={26} aria-hidden="true" />
            <span>{label}</span>
            {selected === label && <Check size={16} aria-hidden="true" />}
          </button>
        ))}
      </div>}
      {selected && (
        <section className="sensory-help">
          <div className="care-chosen">
            <p role="status"><Check size={18} aria-hidden="true" />Entendi. {selected} está incomodando.</p>
            <button onClick={changeSelection}>Alterar incômodo</button>
          </div>
          <h2 ref={helpHeading} tabIndex={-1}>O que pode ajudar?</h2>
          <div className="option-list">
            {sensoryHelp.map((h, index) => {
              const Icon = helpIcons[index];
              return (
                <button
                  className="option-button"
                  key={h}
                  onClick={() => { setHelp(h); sendChoice(`${selected} está incomodando. ${h}`); }}
                >
                  <Icon size={22} aria-hidden="true" />
                  <span>{h}</span>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>
      )}
      <CalmLink />
    </div>
  );
}
