import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  House,
  CalendarDays,
  Heart,
  UsersRound,
  Settings as SettingsIcon,
  HeartHandshake,
  Leaf,
} from "lucide-react";
import { Brand, BrandMark } from "./components/Brand";
import { AppProvider, useApp } from "./context/AppContext";
import Home from "./pages/Home";
import Communication from "./pages/Communication";
import Wellbeing from "./pages/Wellbeing";
import Sensory from "./pages/Sensory";
import CalmMode from "./pages/CalmMode";
import Routine from "./pages/Routine";
import RoutineDetail from "./pages/RoutineDetail";
import AboutMe from "./pages/AboutMe";
import SupportNetwork from "./pages/SupportNetwork";
import SupportView from "./pages/SupportView";
import Settings from "./pages/Settings";
import { CommunicationProvider } from "./notifications/CommunicationProvider";
const nav = [
  { to: "/", label: "Início", icon: House },
  { to: "/rotina", label: "Rotina", icon: CalendarDays },
  { to: "/sobre-mim", label: "Sobre Mim", icon: Heart },
  { to: "/equipe", label: "Equipe", icon: UsersRound },
  { to: "/ajustes", label: "Ajustes", icon: SettingsIcon },
];
function Start() {
  const { preferences } = useApp();
  if (preferences.calm) return <Navigate to="/calmo" replace />;
  if (preferences.view === "support") return <Navigate to="/rede" replace />;
  return <Home />;
}
function Layout() {
  const { preferences } = useApp();
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  const lastPath = useRef(location.pathname);
  const calm = location.pathname === "/calmo";
  useEffect(() => {
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;
    window.scrollTo(0, 0);
    const heading = main.current?.querySelector<HTMLElement>("h1");
    heading?.focus({ preventScroll: true });
  }, [location.pathname]);
  return (
    <div
      className={`app-frame ${preferences.vividColors && !calm ? "vivid-colors" : ""} ${preferences.largeText ? "large-text" : ""} ${preferences.highContrast ? "high-contrast" : ""} ${preferences.reducedMotion || calm ? "reduce-motion" : ""} ${calm ? "is-calm" : ""}`}
    >
      <a className="skip-link" href="#main">
        Ir para o conteúdo
      </a>
      <header className="app-header">
        <Link to="/" className="brand-link" aria-label="NeuroIn — Início">
          <Brand />
        </Link>
        <div className="header-actions">
          <span className="header-tagline">
            Conexão que cuida.
          </span>
          <Link
            to="/equipe"
            className="support-shortcut"
            aria-label="Minha rede de apoio"
          >
            <HeartHandshake size={22} />
          </Link>
          <Link to="/sobre-mim" className="avatar" aria-label="Perfil de Ana">
            A<span />
          </Link>
        </div>
      </header>
      <main ref={main} id="main" tabIndex={-1}>
        {location.state?.resetMessage && (
          <p className="inline-feedback" role="status">
            {location.state.resetMessage}
          </p>
        )}
        <Outlet />
      </main>
      {!calm && <nav className="bottom-navigation" aria-label="Navegação principal">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `nav-item ${isActive || (to === "/" && ["/inicio", "/rede", "/calmo"].includes(location.pathname)) ? "selected" : ""}`
            }
          >
            <span>
              <Icon size={22} strokeWidth={1.7} />
            </span>
            {label}
          </NavLink>
        ))}
        <Link to="/calmo" className="side-calm">
          <Leaf aria-hidden="true" size={22} strokeWidth={1.6} />
          <span>Modo Calmo<small>Menos estímulos, agora</small></span>
        </Link>
      </nav>}
    </div>
  );
}
function Splash() {
  const { preferences } = useApp();
  return (
    <div className={`splash ${preferences.vividColors && !preferences.calm ? "vivid-colors" : ""} ${preferences.highContrast ? "high-contrast" : ""}`} role="status">
      <BrandMark size={112} className="splash-mark" />
      <Brand />
      <p>Conexão que cuida.<br />Informação que acolhe.</p>
      <svg className="splash-waves" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 120C60 80 120 90 190 120S330 150 400 90V200H0Z" fill="var(--logo-blue, #1f56c4)" />
        <path d="M0 150C70 110 140 130 210 150S340 170 400 130V200H0Z" fill="var(--logo-yellow, #ffc933)" />
        <path d="M120 200C180 140 260 120 330 150S390 170 400 160V200Z" fill="var(--logo-coral, #e5484d)" />
        <path d="M0 175C60 160 130 170 200 185S330 195 400 180V200H0Z" fill="var(--logo-green, #2a9d5c)" />
      </svg>
    </div>
  );
}
export default function App() {
  const [opening, setOpening] = useState(() => {
    try {
      return !sessionStorage.getItem("neuroin-opened");
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!opening) return;
    const id = setTimeout(() => {
      setOpening(false);
      try {
        sessionStorage.setItem("neuroin-opened", "1");
      } catch {
        /* still usable without storage */
      }
    }, 1400);
    return () => clearTimeout(id);
  }, [opening]);
  return (
    <AppProvider>
      <CommunicationProvider>
      <BrowserRouter>
        {opening ? (
          <Splash />
        ) : (
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Start />} />
              <Route path="inicio" element={<Home />} />
              <Route path="comunicacao" element={<Communication />} />
              <Route path="bem-estar" element={<Wellbeing />} />
              <Route path="sensibilidades" element={<Sensory />} />
              <Route path="calmo" element={<CalmMode />} />
              <Route path="rotina" element={<Routine />} />
              <Route path="rotina/:id" element={<RoutineDetail />} />
              <Route path="sobre-mim" element={<AboutMe />} />
              <Route path="equipe" element={<SupportNetwork />} />
              <Route path="rede" element={<SupportView />} />
              <Route path="ajustes" element={<Settings />} />
              <Route
                path="*"
                element={
                  <div className="empty-state">
                    <h1>Página não encontrada</h1>
                    <p>Vamos voltar ao seu espaço.</p>
                    <Link className="button button-primary" to="/">
                      Ir ao início
                    </Link>
                  </div>
                }
              />
            </Route>
          </Routes>
        )}
      </BrowserRouter>
      </CommunicationProvider>
    </AppProvider>
  );
}
