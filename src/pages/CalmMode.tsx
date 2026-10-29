import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { calmActions } from "../data/mockData";
import { ConfirmationFeedback } from "../components/ConfirmationFeedback";
export default function CalmMode() {
  const { updatePreferences } = useApp();
  const [selected, setSelected] = useState<(typeof calmActions)[number] | null>(
    null,
  );
  const navigate = useNavigate();
  useEffect(() => {
    updatePreferences({ calm: true });
  }, [updatePreferences]);

  return (
    <div className="calm-page">
      {selected ? (
        <ConfirmationFeedback
          phrase={selected.phrase}
          icon={selected.icon}
          onBack={() => setSelected(null)}
        />
      ) : (
        <>
          <div className="calm-page-symbol">
            <Leaf size={38} />
          </div>
          <header className="page-heading">
            <p>Modo Calmo</p>
            <h1 tabIndex={-1}>Um pouco mais de calma.</h1>
            <p>Sem pressa. Escolha o que você precisa agora.</p>
          </header>
          <div className="calm-grid">
            {calmActions.map((a) => (
              <button key={a.label} onClick={() => setSelected(a)}>
                <a.icon size={29} />
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
      <button
        className="button button-secondary full calm-exit"
        onClick={() => {
          updatePreferences({ calm: false });
          navigate("/");
        }}
      >
        <ArrowLeft size={18} />
        Sair do Modo Calmo
      </button>
    </div>
  );
}
