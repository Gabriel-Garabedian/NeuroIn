import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Leaf,
  MessageCircle,
  CalendarDays,
  HeartHandshake,
  Sun,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { quickActions, routine } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { ConfirmationFeedback } from "../components/ConfirmationFeedback";
import { SectionHeader } from "../components/ui";
export default function Home() {
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
      <div className="home-topline">
        <span>
          <Sun size={16} /> Um dia de cada vez
        </span>
        <span className="demo-label">Seu espaço</span>
      </div>
      <header className="greeting">
        <p>
          Olá, Ana{" "}
          <span aria-hidden="true" className="wave">
            ☀
          </span>
        </p>
        <h1 tabIndex={-1}>O que você precisa?</h1>
        <span>Do seu jeito, no seu tempo.</span>
      </header>
      <section aria-label="Comunicação rápida" className="quick-grid">
        {actions.map((a) => {
          const Icon = a.icon;
          const content = (
            <>
              <span className="quick-icon">
                <Icon size={31} strokeWidth={1.65} />
              </span>
              <span>{a.label}</span>
              <ArrowUpRight className="quick-arrow" size={16} />
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
              onClick={() => setSelected(a)}
            >
              {content}
            </button>
          );
        })}
      </section>
      <Link to="/comunicacao" className="communication-link">
        <MessageCircle size={19} />
        <span>Mais formas de me comunicar</span>
        <ArrowRight size={18} />
      </Link>
      <Link to="/calmo" className="calm-banner">
        <span className="calm-symbol">
          <Leaf size={26} strokeWidth={1.5} />
        </span>
        <span>
          <strong>Vamos com mais calma?</strong>
          <span>Menos estímulos. Mais espaço para você.</span>
        </span>
        <span className="calm-cta">
          Modo Calmo <ArrowRight size={17} />
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
              <CalendarDays size={25} />
            </span>
            <span>
              <span className="small muted">
                Próxima atividade · {next.time}
              </span>
              <strong>{next.title}</strong>
            </span>
            <ChevronRight size={20} />
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
        <HeartHandshake size={18} />
        <span>Você tem uma rede com quem contar.</span>
        <Link to="/equipe">
          Conhecer <ArrowRight size={15} />
        </Link>
      </div>
      <p className="academic-note">
        <Sparkles size={13} /> Um protótipo acadêmico feito para acolher.
      </p>
    </>
  );
}
