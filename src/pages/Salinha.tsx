import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, CalendarCheck, Compass, House, Leaf, MessageCircle, UserRound } from 'lucide-react';
import { Brand } from '../components/Brand';
import AnimatedContent from '../components/AnimatedContent';
import { useApp } from '../context/AppContext';
import { scenarios } from './demoAreasData';
import './salinha.css';

const guides = [
  { icon: CalendarCheck, title: 'Planejar', description: 'Organize a situação e entenda o que dá para esperar.' },
  { icon: MessageCircle, title: 'Ensaiar', description: 'Visualize e pratique os principais passos.' },
  { icon: Compass, title: 'Me preparar', description: 'Siga com mais autonomia e segurança.' },
];
export default function Salinha() {
  const { preferences } = useApp();
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setSystemReduced(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  const [situation, setSituation] = useState<keyof typeof scenarios | ''>('');
  const [worries, setWorries] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<(typeof scenarios)[keyof typeof scenarios] | null>(null);
  const [resultVersion, setResultVersion] = useState(0);
  const resultRef = useRef<HTMLElement>(null);
  useEffect(() => { if (result) resultRef.current?.focus(); }, [result]);
  return <div className="rehearsal">
    <header className="rehearsal-top">
      <Link to="/" className="rehearsal-back" aria-label="Voltar ao início"><ArrowLeft aria-hidden="true" size={23} /></Link>
      <Link to="/" aria-label="NeuroIn — Início"><Brand /></Link>
    </header>
    <div className="rehearsal-content">
      <div className="rehearsal-banner"><span><Compass size={22} aria-hidden="true" /></span><p>Salinha de Realidade Assistida</p></div>
      <div className="rehearsal-intro"><h1 tabIndex={-1}>Vamos ensaiar juntos?</h1><p>Escolha uma situação para se preparar no seu ritmo.</p></div>
      <form className="rehearsal-form" onSubmit={event => {
        event.preventDefault();
        if (!situation) { setError('Escolha uma situação para continuar.'); return; }
        setError('');
        setResult({ ...scenarios[situation] });
        setResultVersion(version => version + 1);
      }}>
        <fieldset className="situation-field" aria-describedby={error ? 'situation-error' : undefined}>
          <legend>O que vou fazer?</legend>
          <div className="situation-options">{Object.entries(scenarios).map(([key, scenario]) => <label key={key}><input type="radio" name="situation" value={key} checked={situation === key} onChange={() => { setSituation(key as keyof typeof scenarios); setError(''); }} /><span>{scenario.option}</span></label>)}</div>
        </fieldset>
        <p id="situation-error" role="alert" className="rehearsal-error">{error}</p>
        <label htmlFor="rehearsal-worries">O que me preocupa?</label>
        <textarea id="rehearsal-worries" value={worries} onChange={event => setWorries(event.target.value)} placeholder="Não saber o que vai acontecer" />
        <p className="rehearsal-note">Seus receios ficam nesta tela. O resultado é um exemplo preparado previamente e não é personalizado.</p>
        <button className="rehearsal-submit" type="submit">Criar meu ensaio <ArrowRight aria-hidden="true" size={20} /></button>
      </form>
      {result && <AnimatedContent key={resultVersion} className="result-animation" disabled={preferences.reducedMotion || systemReduced} trigger="mount" distance={14} duration={0.5} animateOpacity={false}><section className="rehearsal-result" ref={resultRef} tabIndex={-1} aria-labelledby="result-heading">
        <p className="result-label">Roteiro de exemplo</p><h2 id="result-heading">Exemplo: {result.label}</h2>
        <p>Este roteiro foi preparado previamente. Escolha o que fizer sentido para você.</p>
        <ol>{result.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <div className="result-advice"><h3>Possíveis imprevistos</h3><p>Se houver uma espera ou mudança de planos, você pode pedir informações, consultar suas anotações ou combinar uma alternativa com alguém de confiança.</p></div>
        <div className="result-advice"><h3>Uma pausa, se precisar</h3><p>Se desejar, procure um lugar mais tranquilo e dê a si tempo para se recompor da forma que for confortável para você.</p></div>
      </section></AnimatedContent>}
      <aside className="rehearsal-encouragement"><Leaf size={26} aria-hidden="true" /><p>Você pode fazer uma etapa de cada vez.</p></aside>
      <section className="rehearsal-guide" aria-labelledby="guide-title"><h2 id="guide-title">Um passo de cada vez</h2><AnimatedContent disabled={preferences.reducedMotion || systemReduced} trigger="mount" distance={12} duration={0.45} animateOpacity={false}><div className="guide-list">{guides.map(({ icon: Icon, title, description }, index) => <article className={`guide-card guide-${index + 1}`} key={title}><span className="guide-icon"><Icon size={27} strokeWidth={1.7} aria-hidden="true" /></span><div><h3>{title}</h3><p>{description}</p></div><span className="guide-number" aria-hidden="true">0{index + 1}</span></article>)}</div></AnimatedContent></section>
    </div>
    <nav className="rehearsal-nav" aria-label="Navegação da salinha">
      <Link to="/"><House aria-hidden="true" size={21} /><span>Início</span></Link>
      <Link to="/salinha" aria-current="page"><Compass aria-hidden="true" size={21} /><span>Ensaiar</span></Link>
      <Link to="/comunicacao"><BookOpen aria-hidden="true" size={21} /><span>Recursos</span></Link>
      <Link to="/sobre-mim"><UserRound aria-hidden="true" size={21} /><span>Meu perfil</span></Link>
    </nav>

  </div>;
}
