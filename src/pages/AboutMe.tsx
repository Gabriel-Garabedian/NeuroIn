import {
  Heart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  Hand,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeading, ProfileInfoCard } from "../components/ui";
import { user } from "../data/mockData";
import "./support.css";

export default function AboutMe() {
  return (
    <div className="support-page">
      <PageHeading
        title="Sobre mim"
        description="Um pouco sobre mim e sobre como me acolher."
        back="/"
      />
      <section className="support-profile" aria-label="Meu perfil">
        <span
          className="support-avatar support-avatar-large"
          aria-hidden="true"
        >
          {user.name.slice(0, 1)}
        </span>
        <div>
          <h2>{user.fullName}</h2>
          <p>Cada pessoa tem seu jeito. Este é o meu.</p>
          <span className="support-demo-label">Perfil de demonstração</span>
        </div>
        <Heart className="support-profile-heart" size={36} aria-hidden="true" />
      </section>

      <div className="support-profile-grid">
        <ProfileInfoCard title="Como eu me comunico">
          <MessageCircle
            className="support-card-icon"
            size={24}
            aria-hidden="true"
          />
          <p>{user.communication}</p>
          <p className="support-soft-note">
            Dê tempo para eu responder. Minha forma de me comunicar pode mudar
            ao longo do dia.
          </p>
        </ProfileInfoCard>
        <ProfileInfoCard title="O que me ajuda">
          <Sparkles
            className="support-card-icon"
            size={24}
            aria-hidden="true"
          />
          <ul className="support-list support-list-help">
            {user.helps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ProfileInfoCard>
        <ProfileInfoCard title="O que me incomoda">
          <Hand className="support-card-icon" size={24} aria-hidden="true" />
          <ul className="support-list">
            {user.discomforts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ProfileInfoCard>
        <ProfileInfoCard title="Prefiro que evitem">
          <ShieldCheck
            className="support-card-icon"
            size={24}
            aria-hidden="true"
          />
          <ul className="support-list">
            {user.avoid.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ProfileInfoCard>
      </div>

      <section className="support-academic" aria-labelledby="academic-title">
        <GraduationCap size={24} aria-hidden="true" />
        <div>
          <h2 id="academic-title">Um perfil para conhecer o NeuroIn</h2>
          <p>
            Os dados deste perfil são fictícios e fazem parte de um protótipo
            acadêmico.
          </p>
        </div>
      </section>
      <div className="support-footer-link">
        <Heart size={20} aria-hidden="true" />
        <p>Conheça quem está ao meu lado.</p>
        <Link to="/equipe">Minha equipe de apoio</Link>
      </div>
    </div>
  );
}
