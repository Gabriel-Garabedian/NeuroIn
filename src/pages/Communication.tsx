import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ChevronRight } from "lucide-react";
import { communicationCategories } from "../data/mockData";
import { PageHeading } from "../components/ui";
import { ConfirmationFeedback } from "../components/ConfirmationFeedback";
export default function Communication() {
  const [category, setCategory] = useState(0);
  const [phrase, setPhrase] = useState("");
  const navigate = useNavigate();
  if (phrase)
    return (
      <ConfirmationFeedback
        phrase={phrase}
        icon={MessageCircle}
        onBack={() => navigate("/")}
      />
    );
  return (
    <>
      <PageHeading
        back="/"
        title="Do meu jeito"
        description="Encontre uma frase para dizer como você está."
      />
      <div className="category-tabs" role="group" aria-label="Categorias">
        {communicationCategories.map((c, i) => (
          <button
            key={c.name}
            aria-pressed={i === category}
            onClick={() => setCategory(i)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <h2 className="subheading">{communicationCategories[category].name}</h2>
      <div className="option-list">
        {communicationCategories[category].items.map(([label, text]) => (
          <button
            className="option-button"
            key={label}
            onClick={() => setPhrase(text)}
          >
            <MessageCircle size={23} />
            <span>{label}</span>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
    </>
  );
}
