import { useState } from 'react';
import { Heart } from 'lucide-react';
import Salinha from './Salinha';
export { Salinha };
import { PageHeading } from '../components/ui';
import { achievements, profiles, topics } from './demoAreasData';
import './demo-areas.css';

function AchievementCard({ item }: { item: typeof achievements[number] }) {
  const [supported, setSupported] = useState(false);
  const [draft, setDraft] = useState('');
  const [comments, setComments] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  return (
    <article className="demo-card achievement-card">
      <span className="demo-tag">{item.kind}</span>
      <h2>{item.title}</h2>
      <p>{item.text}</p>
      <div className="demo-comment"><strong>Comentário demonstrativo</strong><p>{item.comment}</p></div>
      {comments.map((comment, index) => <div className="demo-comment" key={index}><strong>Seu comentário</strong><p>{comment}</p></div>)}
      <button className="button demo-action support-reaction" type="button" aria-pressed={supported} onClick={() => { setSupported(!supported); setFeedback(supported ? 'Apoio retirado.' : 'Seu apoio foi registrado nesta tela.'); }}>
        <Heart key={String(supported)} className={supported ? 'reaction-heart is-supported' : 'reaction-heart'} size={19} fill={supported ? 'currentColor' : 'none'} aria-hidden="true" />
        {supported ? 'Retirar apoio' : 'Apoiar'} <span className="sr-only">{item.title}</span>
      </button>
      <form className="comment-form" onSubmit={event => { event.preventDefault(); if (!draft.trim()) { setFeedback('Escreva um comentário para continuar.'); return; } setComments([...comments, draft.trim()]); setDraft(''); setFeedback('Comentário adicionado somente nesta tela.'); }}>
        <label htmlFor={`comment-${item.kind}`}>Seu comentário</label>
        <textarea id={`comment-${item.kind}`} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Escreva uma mensagem de apoio" maxLength={500} required />
        <button className="button demo-action" type="submit">Comentar</button>
      </form>
      <p role="status" className="demo-feedback">{feedback}</p>
    </article>
  );
}
export function Mural() {
  return <div className="demo-page"><PageHeading title="Mural de conquistas" description="Cada conquista tem seu valor." back="/" /><p className="demo-note">Conteúdo fictício de demonstração. Comentários e apoios ficam somente nesta tela.</p><div className="demo-grid">{achievements.map(item => <AchievementCard key={item.title} item={item} />)}</div></div>;
}
export function Forum() {
  const [category, setCategory] = useState(topics[0].category);
  const [open, setOpen] = useState('');
  const categories = [...new Set(topics.map(topic => topic.category))];
  return <div className="demo-page"><PageHeading title="Fórum de apoio mútuo" description="Explore conversas sobre experiências e interesses." back="/" /><div className="demo-filters" aria-label="Categorias do fórum">{categories.map(name => <button type="button" key={name} aria-pressed={category === name} onClick={() => { setCategory(name); setOpen(''); }}>{name}</button>)}</div><div className="demo-grid">{topics.filter(topic => topic.category === category).map(topic => <article className="demo-card" key={topic.title}><h2><button className="demo-topic" type="button" aria-expanded={open === topic.title} onClick={() => setOpen(open === topic.title ? '' : topic.title)}>{topic.title}</button></h2><p>Toque para {open === topic.title ? 'fechar' : 'abrir'} a resposta</p>{open === topic.title && <p className="demo-comment">{topic.answer}</p>}</article>)}</div></div>;
}
export function Vitrine() {
  const [category, setCategory] = useState('Padrinhos/Tutores');
  const [feedback, setFeedback] = useState('');
  return <div className="demo-page"><PageHeading title="Vitrine de padrinhos e profissionais" description="Conheça exemplos de possibilidades de apoio." back="/" /><p className="demo-note">Todos os perfis e disponibilidades são fictícios.</p><div className="demo-filters" aria-label="Categorias de perfis">{['Padrinhos/Tutores', 'Profissionais de Saúde'].map(name => <button type="button" key={name} aria-pressed={category === name} onClick={() => { setCategory(name); setFeedback(''); }}>{name}</button>)}</div><div className="demo-grid">{profiles.filter(person => person.category === category).map(person => <article className="demo-card" key={person.name}><span className="demo-tag">Perfil fictício</span><h2>{person.name}</h2><strong>{person.area}</strong><p>{person.description}</p><p>{person.availability}</p><button className="button demo-action" type="button" onClick={() => setFeedback(person.name)}>Simular contato <span className="sr-only">com {person.name}</span></button><p role="status" className={feedback === person.name ? 'contact-feedback' : 'demo-feedback'}>{feedback === person.name && `Demonstração de contato com ${person.name}. Nenhum contato real foi iniciado.`}</p></article>)}</div></div>;
}
