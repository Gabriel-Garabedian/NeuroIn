import { useState } from "react";
import { HeartHandshake, Info, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeading } from "../components/ui";
import { supportPeople, user } from "../data/mockData";
import "./support.css";

export default function SupportNetwork() {
  const [feedback, setFeedback] = useState("");
  return (
    <div className="support-page">
      <PageHeading
        title="Minha equipe de apoio"
        description="Pessoas que me conhecem e caminham comigo."
        back="/"
      />
      <div className="support-welcome">
        <span className="support-welcome-icon">
          <HeartHandshake size={30} aria-hidden="true" />
        </span>
        <div>
          <h2>Você tem com quem contar, {user.name}.</h2>
          <p>
            Cada pessoa pode ajudar de um jeito, sempre respeitando o seu tempo.
          </p>
        </div>
      </div>
      <p className="support-demo-note">
        <Info size={19} aria-hidden="true" /> Estes contatos são fictícios. Os
        pedidos de ajuda são apenas uma simulação.
      </p>
      <div className="support-people-grid">
        {supportPeople.map((person) => (
          <article className="support-person" key={person.id}>
            <div className="support-person-heading">
              <span
                className={`support-avatar support-avatar-${person.tone}`}
                aria-hidden="true"
              >
                {person.initials}
              </span>
              <div>
                <h2>{person.name}</h2>
                <p>{person.role}</p>
              </div>
            </div>
            <span className="support-person-type">{person.description}</span>
            <button
              className="support-help-button"
              type="button"
              aria-label={`Pedir ajuda a ${person.name} (simulação)`}
              onClick={() =>
                setFeedback(
                  `Demonstração: pedido de ajuda para ${person.name} simulado. Nenhuma mensagem foi enviada.`,
                )
              }
            >
              <MessageCircle size={19} aria-hidden="true" />
              Pedir ajuda <span>(simulação)</span>
            </button>
          </article>
        ))}
      </div>
      <div
        className={`support-feedback${feedback ? " support-feedback-visible" : ""}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback}
      </div>
      <section className="support-quiet-note">
        <HeartHandshake size={25} aria-hidden="true" />
        <div>
          <h2>Acolher começa por conhecer</h2>
          <p>
            Meu perfil reúne o que me ajuda, o que me incomoda e como prefiro me
            comunicar.
          </p>
          <Link to="/sobre-mim">Ver meu perfil</Link>
        </div>
      </section>
    </div>
  );
}
