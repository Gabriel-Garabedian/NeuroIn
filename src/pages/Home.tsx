import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowRight,
  Leaf,
  MessageCircle,
  CalendarDays,
  HeartHandshake,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { quickActions, routine } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { ConfirmationFeedback } from "../components/ConfirmationFeedback";
import { SectionHeader } from "../components/ui";
import { useCommunication } from "../notifications/CommunicationProvider";
export default function Home() {
  const { choose } = useCommunication();
  const { preferences, completed } = useApp();
  const [selected, setSelected] = useState<
    (typeof quickActions)[number] | null
  >(null);
  const next = routine.find((r) => !completed.includes(r.id));
  if (selected)
    return (
      <ConfirmationFeedback
        phrase={selected.phrase}
        icon={selected.icon}
        onBack={() => setSelected(null)}
      />
    );
  const actions = preferences.fewerOptions
    ? quickActions.slice(0, 4)
    : quickActions;
  return (
    <>
      <header className="greeting">
        <p>Olá, Ana</p>
        <h1 tabIndex={-1}>O que você precisa?</h1>
        <span>Escolha para mostrar ou falar. No seu tempo.</span>
      </header>
      <section aria-label="Comunicação rápida" className="quick-grid">
        {actions.map((a) => {
          const Icon = a.icon;
          const content = (
            <>
              <span className="quick-icon">
                <Icon aria-hidden="true" size={31} strokeWidth={1.65} />
              </span>
              <span>{a.label}</span>
            </>
          );
          return a.path ? (
            <Link
              key={a.id}
              to={a.path}
              className={`quick-card tone-${a.tone}`}
            >
              {content}
            </Link>
          ) : (
            <button
              key={a.id}
              className={`quick-card tone-${a.tone}`}
              onClick={() => { setSelected(a); choose(a.phrase); }}
            >
              {content}
            </button>
          );
        })}
      </section>
      <Link to="/comunicacao" className="communication-link">
        <MessageCircle aria-hidden="true" size={19} />
        <span>Mais formas de me comunicar</span>
        <ArrowRight aria-hidden="true" size={18} />
      </Link>
      <Link to="/calmo" className="calm-banner home-calm">
        <span className="calm-symbol">
          <Leaf aria-hidden="true" size={26} strokeWidth={1.5} />
        </span>
        <span>
          <strong>Precisa de menos estímulos?</strong>
          <span className="calm-cta">Ativar Modo Calmo <ArrowRight aria-hidden="true" size={17} /></span>
        </span>
      </Link>
      <section className="home-routine">
        <SectionHeader
          title="Um passo de cada vez"
          to="/rotina"
          action="Minha rotina"
        />
        {next ? (
          <Link className="next-activity" to={`/rotina/${next.id}`}>
            <span className="next-icon">
              <CalendarDays aria-hidden="true" size={25} />
            </span>
            <span>
              <span className="small muted">
                Agora na sua rotina · {next.time}
              </span>
              <strong>{next.title}</strong>
            </span>
            <ChevronRight aria-hidden="true" size={20} />
          </Link>
        ) : (
          <p className="panel">Tudo certo. Sua rotina está concluída.</p>
        )}
        <div className="home-progress">
          <div className="progress-track">
            <span
              style={{ width: `${(completed.length / routine.length) * 100}%` }}
            />
          </div>
          <span>
            {completed.length} de {routine.length} concluídas
          </span>
        </div>
      </section>
      <div className="home-footer">
        <HeartHandshake aria-hidden="true" size={18} />
        <span>Você tem uma rede com quem contar.</span>
        <Link to="/equipe">
          Conhecer <ArrowRight aria-hidden="true" size={15} />
        </Link>
      </div>
      <p className="academic-note">
        <Sparkles aria-hidden="true" size={13} /> Protótipo acadêmico · Dados fictícios de demonstração.
      </p>
    </>
  );
}
