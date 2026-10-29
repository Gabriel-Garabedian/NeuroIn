import { ArrowLeft, ChevronRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
export function PageHeading({
  title,
  description,
  back,
}: {
  title: string;
  description?: string;
  back?: string;
}) {
  return (
    <header className="page-heading">
      {back && (
        <Link className="back-link" to={back}>
          <ArrowLeft size={18} /> Voltar
        </Link>
      )}
      <h1 tabIndex={-1}>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  );
}
export function SectionHeader({
  title,
  to,
  action,
}: {
  title: string;
  to?: string;
  action?: string;
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {to && (
        <Link to={to}>
          {action ?? "Ver tudo"}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function ProfileInfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="info-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Check size={30} />
      <h2>{title}</h2>
      {children}
    </div>
  );
}
