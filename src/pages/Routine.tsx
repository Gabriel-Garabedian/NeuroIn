import {
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeading, SectionHeader } from "../components/ui";
import { useApp } from "../context/AppContext";
import { routine } from "../data/mockData";
import "./routine.css";

export default function Routine() {
  const { completed, toggleCompleted } = useApp();
  const current = routine.find((activity) => !completed.includes(activity.id));
  const completedCount = routine.filter((activity) =>
    completed.includes(activity.id),
  ).length;
  const date = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="routine-page">
      <PageHeading
        title="Minha rotina"
        description="Um passo de cada vez, no seu ritmo."
      />
      <section
        className="routine-overview panel"
        aria-label="Progresso da rotina de hoje"
      >
        <div className="routine-date">
          <CalendarDays size={21} aria-hidden="true" />
          <span>Hoje, {date}</span>
        </div>
        <div className="routine-progress-label">
          <strong>Seu dia está acontecendo</strong>
          <span aria-live="polite">
            {completedCount} de {routine.length} atividades concluídas
          </span>
        </div>
        <progress
          className="routine-progress"
          value={completedCount}
          max={routine.length}
          aria-label="Atividades concluídas"
        />
        <p className="routine-progress-note">
          <Sparkles size={16} aria-hidden="true" />
          {current
            ? "Cada pequeno passo conta. Você pode fazer uma pausa quando precisar."
            : "Você concluiu sua rotina de hoje. Agora, aproveite seu descanso."}
        </p>
      </section>
      <SectionHeader title="Atividades de hoje" />
      <ol className="routine-timeline">
        {routine.map((activity) => {
          const done = completed.includes(activity.id);
          const active = current?.id === activity.id;
          const Icon = activity.icon;
          return (
            <li
              className={`routine-item${done ? " is-complete" : ""}${active ? " is-current" : ""}`}
              key={activity.id}
            >
              <div className="routine-rail" aria-hidden="true">
                <span className="routine-dot">
                  {done ? <Check size={15} /> : active ? <span /> : null}
                </span>
              </div>
              <article
                className="routine-activity panel"
                aria-label={`${activity.title}, ${done ? "concluída" : active ? "atividade atual" : "próxima atividade"}`}
              >
                <div className="routine-activity-top">
                  <time>{activity.time}</time>
                  <span
                    className={`routine-status ${done ? "complete" : active ? "current" : "upcoming"}`}
                  >
                    {done ? (
                      <>
                        <Check size={14} aria-hidden="true" />
                        Concluída
                      </>
                    ) : active ? (
                      <>
                        <Clock3 size={14} aria-hidden="true" />
                        Agora
                      </>
                    ) : (
                      "Em seguida"
                    )}
                  </span>
                </div>
                <div className="routine-activity-body">
                  <span className="routine-activity-icon">
                    <Icon size={27} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{activity.title}</h3>
                    <p>{activity.description}</p>
                  </div>
                </div>
                <div className="routine-activity-actions">
                  <Link
                    className="routine-detail-link"
                    to={`/rotina/${activity.id}`}
                    aria-label={`Ver detalhes de ${activity.title}`}
                  >
                    Ver detalhes
                    <ChevronRight size={17} aria-hidden="true" />
                  </Link>
                  <button
                    className={`button ${active ? "button-primary" : "button-secondary"} routine-complete-button`}
                    type="button"
                    onClick={() => toggleCompleted(activity.id)}
                    aria-label={`${done ? "Desmarcar conclusão de" : "Marcar como concluída:"} ${activity.title}`}
                    aria-pressed={done}
                  >
                    {done ? (
                      <Check size={17} aria-hidden="true" />
                    ) : (
                      <Circle size={17} aria-hidden="true" />
                    )}
                    {done ? "Concluída" : "Concluir"}
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
      <aside className="routine-kind-note">
        <span className="routine-note-icon">
          <Clock3 size={21} aria-hidden="true" />
        </span>
        <p>
          <strong>Tudo bem ajustar o ritmo.</strong>
          <br />
          Os horários são um guia. Você pode seguir no seu tempo.
        </p>
      </aside>
    </div>
  );
}
