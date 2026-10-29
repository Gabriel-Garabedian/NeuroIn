import { Check, Clock3, ListChecks, RotateCcw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PageHeading, SectionHeader } from "../components/ui";
import { useApp } from "../context/AppContext";
import { routine } from "../data/mockData";
import "./routine.css";

export default function RoutineDetail() {
  const { id } = useParams();
  const { completed, toggleCompleted, steps, toggleStep } = useApp();
  const activity = routine.find((item) => item.id === id);

  if (!activity) {
    return (
      <div className="routine-page">
        <PageHeading
          title="Atividade não encontrada"
          description="Esta atividade não está na sua rotina. Volte para escolher uma atividade de hoje."
          back="/rotina"
        />
        <Link to="/rotina" className="button button-primary">
          Ver minha rotina
        </Link>
      </div>
    );
  }

  const Icon = activity.icon;
  const done = completed.includes(activity.id);
  const checkedSteps = steps[activity.id] ?? [];
  const stepCount = activity.steps.filter((_, index) =>
    checkedSteps.includes(index),
  ).length;

  return (
    <div className="routine-page routine-detail-page">
      <PageHeading
        title={activity.title}
        description={activity.description}
        back="/rotina"
      />
      <section
        className="routine-detail-intro panel"
        aria-label="Informações da atividade"
      >
        <span className="routine-detail-icon">
          <Icon size={36} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div>
          <span className="routine-detail-time">
            <Clock3 size={17} aria-hidden="true" />
            <time>{activity.time}</time>
          </span>
          <p>
            Faça uma etapa de cada vez.
            <br />
            Não precisa ter pressa.
          </p>
        </div>
        {done && (
          <span className="routine-status complete">
            <Check size={14} aria-hidden="true" />
            Concluída
          </span>
        )}
      </section>
      <section className="routine-checklist panel" aria-label="Passo a passo">
        <SectionHeader title="Passo a passo" />
        <p className="muted routine-step-instruction">
          Marque cada etapa quando terminar.
        </p>
        <div className="routine-step-progress">
          <ListChecks size={19} aria-hidden="true" />
          <span aria-live="polite">
            {stepCount} de {activity.steps.length} etapas concluídas
          </span>
        </div>
        <ol className="routine-step-list">
          {activity.steps.map((step, index) => (
            <li key={step}>
              <label
                className={`routine-step${checkedSteps.includes(index) ? " is-checked" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checkedSteps.includes(index)}
                  onChange={() => toggleStep(activity.id, index)}
                />
                <span className="routine-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <span>{step}</span>
              </label>
            </li>
          ))}
        </ol>
      </section>
      <div className="routine-finish">
        <button
          type="button"
          className={`button ${done ? "button-secondary" : "button-primary"} routine-finish-button`}
          onClick={() => toggleCompleted(activity.id)}
          aria-pressed={done}
        >
          {done ? (
            <RotateCcw size={20} aria-hidden="true" />
          ) : (
            <Check size={21} aria-hidden="true" />
          )}
          {done ? "Desmarcar atividade concluída" : "Concluir atividade"}
        </button>
        <p className="muted" role="status">
          {done
            ? "Atividade concluída. Você pode voltar à sua rotina."
            : "Você pode concluir a atividade quando estiver pronta."}
        </p>
      </div>
      <Link className="routine-return-link" to="/rotina">
        Voltar para minha rotina
      </Link>
    </div>
  );
}
