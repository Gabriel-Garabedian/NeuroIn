# NeuroIn

Comunicação, autonomia e acolhimento.

## Sobre

Protótipo navegável de alta fidelidade, mobile-first, criado para um Projeto Integrador acadêmico de Enfermagem. Ajuda a demonstrar como uma pessoa autista pode expressar necessidades, comunicar desconfortos e compartilhar preferências com sua rede de apoio, respeitando seu ritmo e sua individualidade.

## Objetivo

Conectar comunicação, acolhimento, autonomia e bem-estar. O aplicativo funciona com dados fictícios de Ana, sem backend, autenticação ou envio de mensagens. Não realiza triagem nem recomenda medicamentos ou tratamentos.

## Funcionalidades

- Comunicação rápida com cartões e frases ampliadas; categorias de necessidades, emoções, ambiente e interação.
- Voz opcional via navegador, volume e confirmação antes de falar; mensagem visual funciona sem áudio.
- Fluxo de dor com região e intensidade de 0 a 10, apenas para comunicação.
- Sensibilidades e indicação do que pode ajudar; Modo Calmo com seis opções essenciais.
- Rotina com sete atividades, checklist de etapas e progresso persistido.
- Sobre Mim como guia de acolhimento; equipe com pedidos explicitamente simulados.
- Visão da rede com perfil, rotina, preferências e registros fictícios (não são um histórico real).
- Texto maior, alto contraste, movimento reduzido e menos opções; restauração da demonstração com confirmação.
- Navegação por teclado, foco visível, link para pular ao conteúdo e respeito a `prefers-reduced-motion`.

## Tecnologias

React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Lucide. CSS com tokens e componentes reutilizáveis. Poppins e Nunito servidas localmente via Fontsource. Playwright e axe-core para validação.

## Executando localmente

Requisitos: Node.js 22+ e npm. Python 3.11+ somente para validar o catálogo de skills/agentes.

```sh
npm ci
npm run dev
```

Abra o endereço informado pelo Vite. Para testar o build:

```sh
npm run lint
npm run typecheck
npm run build
npm run preview
```

Testes de navegador:

```sh
npx playwright install chromium
npm test
```

No Cloud, o Chromium do sistema em `/usr/bin/chromium` é usado automaticamente; em outros sistemas o Playwright usa seu navegador instalado. Opcional: defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para outro executável. Os testes iniciam seu próprio Vite na porta 5173 quando necessário.

```sh
python3 scripts/validate_ai_setup.py
```

## Estrutura

- `src/pages/`: telas e fluxos, separados por responsabilidade.
- `src/components/`: identidade, títulos, confirmação e elementos compartilhados.
- `src/data/mockData.ts`: dados fictícios centralizados.
- `src/context/`: preferências, rotina e etapas.
- `src/utils/storage.ts`: persistência validada com fallback em memória.
- `src/styles.css`: tokens, layout, estados e responsividade.
- `tests/flows.spec.ts`: fluxos funcionais, armazenamento, teclado e acessibilidade.
- `.agents/skills/`, `.codex/agents/`: base original de 25 skills e 283 perfis, preservada. Consulte `docs/codex-cloud.md` e `THIRD_PARTY.md` para origens e licenças.

## Demonstração

1. **Comunicação:** Início → Água → mostrar a frase → Falar (opcional) → voltar.
2. **Dor:** Início → Dor → Barriga → intensidade → confirmar e mostrar resumo.
3. **Sensorial:** Início → Barulho → Quero silêncio; voltar → Modo Calmo → escolher uma necessidade → sair do modo.
4. **Rotina:** Rotina → detalhes de Almoço → marcar etapas → concluir atividade → conferir progresso.
5. **Rede:** Sobre Mim → Equipe → Ajustes → Rede de apoio → consultar rotina, sensibilidades e registros de exemplo → voltar à visão pessoal.

Para repetir a apresentação: Ajustes → Restaurar demonstração → Sim, restaurar.

## Persistência e limites

Somente preferências e progresso são guardados no `localStorage`, na chave `neuroin-demo-v1`. A restauração não remove dados de outros aplicativos. Se o armazenamento estiver bloqueado, o aplicativo continua em memória e informa a limitação em Ajustes. Não insira dados pessoais reais. A voz depende do suporte, das vozes e das permissões do navegador/dispositivo; não é necessária para demonstrar os fluxos. Pedidos à equipe não enviam mensagens.

## Observação

Este projeto é um protótipo acadêmico demonstrativo e não substitui avaliação, diagnóstico, orientação ou acompanhamento realizado por profissionais de saúde.
