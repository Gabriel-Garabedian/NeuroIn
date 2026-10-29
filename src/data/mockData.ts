import {
  Droplets,
  Utensils,
  Toilet,
  HeartPulse,
  Brain,
  Volume2,
  Hand,
  HeartHandshake,
  Sun,
  Users,
  Wind,
  Thermometer,
  MessageCircle,
  Coffee,
  School,
  UtensilsCrossed,
  Palette,
  Moon,
  BedDouble,
} from "lucide-react";
export const user = {
  name: "Ana",
  fullName: "Ana Souza",
  communication:
    "Falo normalmente, mas em momentos de ansiedade posso preferir imagens ou frases curtas.",
  helps: [
    "Ambiente tranquilo",
    "Instruções simples",
    "Avisar antes de mudanças",
    "Música calma",
  ],
  discomforts: [
    "Barulho intenso",
    "Luz muito forte",
    "Toque inesperado",
    "Muitas pessoas falando ao mesmo tempo",
  ],
  avoid: [
    "Falar muito rápido",
    "Tocar sem avisar",
    "Mudar a rotina sem explicar",
  ],
};
export const quickActions = [
  {
    id: "agua",
    label: "Água",
    phrase: "Eu preciso de água.",
    icon: Droplets,
    tone: "blue",
  },
  {
    id: "fome",
    label: "Fome",
    phrase: "Eu preciso comer.",
    icon: Utensils,
    tone: "yellow",
  },
  {
    id: "banheiro",
    label: "Banheiro",
    phrase: "Eu preciso ir ao banheiro.",
    icon: Toilet,
    tone: "green",
  },
  {
    id: "dor",
    label: "Dor",
    phrase: "Estou com dor.",
    icon: HeartPulse,
    tone: "coral",
    path: "/bem-estar",
  },
  {
    id: "ansiedade",
    label: "Ansiedade",
    phrase: "Estou ansiosa. Preciso de um momento tranquilo.",
    icon: Brain,
    tone: "purple",
    path: "/sensibilidades?motivo=Ansiedade",
  },
  {
    id: "barulho",
    label: "Barulho",
    phrase: "O barulho está me incomodando.",
    icon: Volume2,
    tone: "sky",
    path: "/sensibilidades?motivo=Barulho",
  },
  {
    id: "contato",
    label: "Não quero contato",
    phrase: "Não quero ser tocada agora.",
    icon: Hand,
    tone: "peach",
  },
  {
    id: "alguem",
    label: "Preciso de alguém",
    phrase: "Preciso de alguém comigo.",
    icon: HeartHandshake,
    tone: "pink",
  },
];
export const communicationCategories = [
  {
    name: "Necessidades",
    items: [
      ["Água", "Eu preciso de água."],
      ["Comida", "Eu preciso comer."],
      ["Banheiro", "Eu preciso ir ao banheiro."],
      ["Descansar", "Eu quero descansar."],
      ["Quero sair", "Eu quero sair daqui."],
    ],
  },
  {
    name: "Emoções",
    items: [
      ["Estou bem", "Eu estou bem."],
      ["Estou ansioso", "Eu estou ansiosa."],
      ["Estou triste", "Eu estou triste."],
      ["Estou irritado", "Eu estou irritada."],
      ["Estou com medo", "Eu estou com medo."],
    ],
  },
  {
    name: "Ambiente",
    items: [
      ["Está barulhento", "O barulho está me incomodando."],
      ["A luz está forte", "A luz está muito forte."],
      ["Tem muitas pessoas", "Tem muitas pessoas aqui."],
      ["Quero um lugar tranquilo", "Eu quero um lugar tranquilo."],
    ],
  },
  {
    name: "Interação",
    items: [
      ["Não quero conversar", "Não quero conversar agora."],
      ["Não quero contato", "Não quero ser tocada agora."],
      ["Preciso de alguém", "Preciso de alguém comigo."],
      ["Quero ficar sozinho", "Eu quero ficar sozinha por um momento."],
    ],
  },
];
export const sensoryOptions = [
  { label: "Barulho", icon: Volume2 },
  { label: "Luz", icon: Sun },
  { label: "Toque", icon: Hand },
  { label: "Muitas pessoas", icon: Users },
  { label: "Cheiro", icon: Wind },
  { label: "Temperatura", icon: Thermometer },
  { label: "Outro", icon: MessageCircle },
];
export const sensoryHelp = [
  "Quero silêncio",
  "Quero sair daqui",
  "Quero menos luz",
  "Não quero ser tocado",
  "Quero ficar sozinho",
  "Quero meu responsável",
  "Preciso de ajuda",
];
export const painRegions = [
  "Cabeça",
  "Boca",
  "Peito",
  "Barriga",
  "Costas",
  "Braços",
  "Pernas",
  "Outro",
];
export const painLevels = [
  { value: 0, label: "Sem dor" },
  { value: 2, label: "Leve" },
  { value: 5, label: "Moderada" },
  { value: 8, label: "Forte" },
  { value: 10, label: "Muito forte" },
];
export const routine = [
  {
    id: "cafe",
    time: "07:30",
    title: "Café da manhã",
    icon: Coffee,
    description: "Começar o dia com tranquilidade.",
    steps: ["Sentar à mesa", "Tomar o café da manhã", "Guardar os utensílios"],
  },
  {
    id: "escola",
    time: "08:30",
    title: "Escola",
    icon: School,
    description: "Um passo de cada vez para ir à escola.",
    steps: [
      "Vestir uniforme",
      "Organizar mochila",
      "Pegar garrafa de água",
      "Ir para o transporte",
    ],
  },
  {
    id: "almoco",
    time: "12:30",
    title: "Almoço",
    icon: Utensils,
    description: "Uma pausa para comer e descansar.",
    steps: ["Lavar as mãos", "Almoçar", "Descansar um pouco"],
  },
  {
    id: "terapia",
    time: "14:00",
    title: "Terapia",
    icon: HeartHandshake,
    description: "Um momento com minha rede de apoio.",
    steps: [
      "Separar o que preciso",
      "Ir ao encontro",
      "Conversar no meu ritmo",
    ],
  },
  {
    id: "livre",
    time: "16:00",
    title: "Tempo livre",
    icon: Palette,
    description: "Escolher uma atividade de que gosto.",
    steps: ["Escolher uma atividade", "Aproveitar meu tempo"],
  },
  {
    id: "jantar",
    time: "19:00",
    title: "Jantar",
    icon: UtensilsCrossed,
    description: "Uma refeição para encerrar o dia.",
    steps: ["Lavar as mãos", "Jantar", "Organizar a mesa"],
  },
  {
    id: "dormir",
    time: "21:30",
    title: "Preparar para dormir",
    icon: Moon,
    description: "Diminuir o ritmo para descansar.",
    steps: ["Escovar os dentes", "Vestir o pijama", "Deitar para descansar"],
  },
];
export const initialCompleted = ["cafe", "escola"];
export const supportPeople = [
  {
    id: "maria",
    name: "Maria",
    role: "Mãe",
    description: "Responsável",
    initials: "MA",
    tone: "pink",
  },
  {
    id: "joao",
    name: "João",
    role: "Pai",
    description: "Responsável",
    initials: "JO",
    tone: "blue",
  },
  {
    id: "helena",
    name: "Dra. Helena",
    role: "Terapeuta ocupacional",
    description: "Rede de apoio",
    initials: "HE",
    tone: "green",
  },
  {
    id: "camila",
    name: "Enf. Camila",
    role: "Profissional de saúde",
    description: "Rede de apoio",
    initials: "CA",
    tone: "purple",
  },
];
export const demoRecords = [
  { time: "Hoje, 10:32", text: "Informou desconforto com barulho." },
  { time: "Hoje, 09:10", text: "Rotina: Escola concluída." },
  { time: "Ontem, 15:20", text: "Informou ansiedade." },
];
export const calmActions = [
  { label: "Barulho", phrase: "O barulho está me incomodando.", icon: Volume2 },
  { label: "Luz", phrase: "Quero menos luz.", icon: Sun },
  {
    label: "Não quero contato",
    phrase: "Não quero ser tocada agora.",
    icon: Hand,
  },
  { label: "Quero sair", phrase: "Quero sair daqui.", icon: BedDouble },
  {
    label: "Quero ficar sozinho",
    phrase: "Quero ficar sozinha por um momento.",
    icon: Moon,
  },
  {
    label: "Preciso de alguém",
    phrase: "Preciso de alguém comigo.",
    icon: HeartHandshake,
  },
];
