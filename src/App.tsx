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
      className={`app-frame ${preferences.largeText ? "large-text" : ""} ${preferences.highContrast ? "high-contrast" : ""} ${preferences.reducedMotion || calm ? "reduce-motion" : ""} ${calm ? "is-calm" : ""}`}
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
            <br />
            Informação que acolhe.
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
      <nav className="bottom-navigation" aria-label="Navegação principal">
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
      </nav>
    </div>
  );
}
function Splash() {
  return (
    <div className="splash" role="status">
      <BrandMark size={95} />
      <Brand />
      <p>Comunicação, autonomia e acolhimento.</p>
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
    }, 650);
    return () => clearTimeout(id);
  }, [opening]);
  return (
    <AppProvider>
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
    </AppProvider>
  );
}
