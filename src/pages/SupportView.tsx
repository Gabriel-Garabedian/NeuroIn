import {
  ArrowRight,
  Check,
  Clock3,
  Heart,
  Info,
  MessageCircle,
  SlidersHorizontal,
  Volume2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeading, ProfileInfoCard, SectionHeader } from "../components/ui";
import { useApp } from "../context/AppContext";
import { demoRecords, routine, user } from "../data/mockData";
import "./support.css";

export default function SupportView() {
  const { completed, preferences, updatePreferences } = useApp();
  const navigate = useNavigate();
  const completedToday = routine.filter((item) => completed.includes(item.id));
  return (
    <div className="support-page">
      <PageHeading
        title="Rede de apoio"
        description={`Um olhar atento para o dia de ${user.name}, com respeito à sua autonomia.`}
        back="/ajustes"
      />
      <section
        className="support-profile support-profile-compact"
        aria-label="Resumo do perfil"
      >
        <span
          className="support-avatar support-avatar-large"
          aria-hidden="true"
        >
          {user.name.slice(0, 1)}
        </span>
        <div>
          <h2>{user.fullName}</h2>
          <p>Comunicação, preferências e acolhimento.</p>
          <Link to="/sobre-mim">
            Conhecer o perfil de {user.name}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <div className="support-view-grid">
        <section className="support-routine-card">
          <SectionHeader
            title="Rotina de hoje"
            to="/rotina"
            action="Ver rotina"
          />
          <p className="support-progress-text">
            {completedToday.length} de {routine.length} atividades concluídas
          </p>
          <div
            className="support-progress-track"
            role="progressbar"
            aria-label="Atividades da rotina concluídas"
            aria-valuemin={0}
            aria-valuemax={routine.length}
            aria-valuenow={completedToday.length}
          >
            <span
              style={{
                width: `${(completedToday.length / routine.length) * 100}%`,
              }}
            />
          </div>
          <ul className="support-routine-list">
            {routine.map((item) => {
              const done = completed.includes(item.id);
              return (
                <li key={item.id}>
                  <span
                    className={
                      done ? "support-done-icon" : "support-pending-icon"
                    }
                  >
                    {done ? (
                      <Check size={17} aria-hidden="true" />
                    ) : (
                      <Clock3 size={17} aria-hidden="true" />
                    )}
                  </span>
                  <div>
                    <span>{item.title}</span>
                    <small>
                      {item.time} · {done ? "Concluída" : "Pendente"}
                    </small>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
        <div className="support-side-stack">
          <ProfileInfoCard title="Como apoiar agora">
            <MessageCircle
              className="support-card-icon"
              size={22}
              aria-hidden="true"
            />
            <p>{user.communication}</p>
            <Link className="support-inline-link" to="/equipe">
              Conhecer a equipe
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </ProfileInfoCard>
          <ProfileInfoCard title="Preferências sensoriais">
            <Volume2
              className="support-card-icon"
              size={22}
              aria-hidden="true"
            />
            <p>
              Ambiente tranquilo, menos barulho e cuidado com a luz e o toque.
            </p>
            <ul className="support-list">
              {user.helps.slice(0, 3).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="support-inline-link" to="/sobre-mim">
              Ver todas as preferências
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </ProfileInfoCard>
        </div>
      </div>
      <section className="support-records" aria-labelledby="records-heading">
        <div className="support-records-heading">
          <h2 id="records-heading">Registros de exemplo</h2>
          <span className="support-demo-label">Demonstração</span>
        </div>
        <p className="support-demo-note">
          <Info size={18} aria-hidden="true" /> Dados fictícios para conhecer o
          protótipo. As interações desta sessão não são registradas aqui.
        </p>
        <ul>
          {demoRecords.map((record) => (
            <li key={`${record.time}-${record.text}`}>
              <span className="support-record-dot" aria-hidden="true" />
              <div>
                <p>{record.text}</p>
                <small>{record.time}</small>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <div className="support-settings-note">
        <SlidersHorizontal size={21} aria-hidden="true" />
        <p>
          Texto {preferences.largeText ? "ampliado" : "padrão"} ·{" "}
          {preferences.highContrast
            ? "Alto contraste ativado"
            : "Contraste padrão"}{" "}
          · {preferences.voice ? "Voz ativada" : "Voz desativada"}
        </p>
        <Link to="/ajustes">Ajustar preferências</Link>
      </div>
      <section className="support-return">
        <Heart size={26} aria-hidden="true" />
        <div>
          <h2>O espaço de {user.name} continua sendo dela.</h2>
          <p>
            Volte à visão pessoal para comunicar necessidades e seguir a rotina.
          </p>
        </div>
        <button
          type="button"
          className="support-own-view"
          onClick={() => {
            updatePreferences({ view: "self" });
            navigate("/");
          }}
        >
          Voltar para minha visão
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
