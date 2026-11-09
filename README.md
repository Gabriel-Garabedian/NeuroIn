# NeuroIn

Comunicação, autonomia e acolhimento.

Aplicativo publicado: [neuroin-psi.vercel.app](https://neuroin-psi.vercel.app).
Para conectar os dois celulares, abra [Rede de apoio](https://neuroin-psi.vercel.app/rede)
e siga o roteiro de notificações abaixo. O recebimento em aparelho físico precisa
ser conferido nos próprios celulares; os testes publicados descritos abaixo não o comprovam.

Identidade colorida com logo de quatro pétalas ao redor de um coração (a rede de apoio
em volta da pessoa), paleta azul, amarelo, verde e coral, tela de abertura animada e
layout próprio para computador (menu lateral e grades em colunas); no celular ocupa a
largura disponível. Estilos de computador em `src/desktop.css`; cores em `src/styles.css`.
Roteiro de apresentação em [docs/DESIGN.md](docs/DESIGN.md) (a direção visual descrita
lá é da etapa anterior); continuidade e verificações em [docs/CONTEXTO.md](docs/CONTEXTO.md).

## Sobre

Protótipo navegável de alta fidelidade, mobile-first, criado para um Projeto Integrador acadêmico de Enfermagem. Ajuda a demonstrar como uma pessoa autista pode expressar necessidades, comunicar desconfortos e compartilhar preferências com sua rede de apoio, respeitando seu ritmo e sua individualidade.

## Objetivo

Conectar comunicação, acolhimento, autonomia e bem-estar. O perfil acadêmico usa dados fictícios de Ana. A comunicação local funciona sem conta; o vínculo entre aparelhos e o envio de pedidos reais usam uma API pequena com SQLite e Web Push. Não realiza triagem nem recomenda medicamentos ou tratamentos.

## Funcionalidades

- Comunicação rápida com cartões e frases ampliadas; categorias de necessidades, emoções, ambiente e interação.
- Voz opcional via navegador, volume e confirmação antes de falar; mensagem visual funciona sem áudio.
- Fluxo de dor com região e intensidade de 0 a 10, apenas para comunicação.
- Sensibilidades e indicação do que pode ajudar; Modo Calmo com seis opções essenciais.
- Rotina com sete atividades, checklist de etapas e progresso persistido.
- Sobre Mim como guia de acolhimento; equipe com pedidos explicitamente simulados.
- Visão da rede com perfil, rotina, preferências e registros fictícios (não são um histórico real).
- Vínculo seguro por código temporário, notificações reais e pedidos persistidos em seção separada da demonstração.
- Texto maior, alto contraste, movimento reduzido e menos opções; restauração da demonstração com confirmação.
- Navegação por teclado, foco visível, link para pular ao conteúdo e respeito a `prefers-reduced-motion`.

## Tecnologias

React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Lucide. CSS com tokens e componentes reutilizáveis. Poppins e Nunito servidas localmente via Fontsource. Node.js 24, Express, SQLite local ou Turso remoto e web-push atendem aos vínculos e notificações. Playwright e axe-core para validação.

## Executando localmente

Requisitos: Node.js 24 LTS e npm. Python 3.11+ somente para validar o catálogo de skills/agentes. O SQLite é fornecido pelo Node, sem instalação separada.

```sh
npm ci
cp .env.example .env
npm run dev:server
```

Em outro terminal, na mesma pasta:

```sh
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

No Cloud, o Chromium do sistema em `/usr/bin/chromium` é usado automaticamente; em outros sistemas o Playwright usa seu navegador instalado. Opcional: defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para outro executável. O setup dos testes mantém Vite (5173) e uma API exclusiva (3002) no próprio executor; deixe essas portas livres. Somente o transporte externo de push é simulado; API, cookies, vínculos e consultas são reais.

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

Para organizar a fala da equipe, os limites e as pendências acadêmicas, consulte
o [guia de apresentação do PI](docs/APRESENTACAO.md).

1. **Comunicação:** Início → Água → mostrar a frase → Falar (opcional) → voltar.
2. **Dor:** Início → Dor → Barriga → intensidade → confirmar e mostrar resumo.
3. **Sensorial:** Início → Barulho → Quero silêncio → Modo Calmo → escolher uma necessidade → sair do modo.
4. **Rotina:** Rotina → detalhes de Almoço → marcar etapas → concluir atividade → conferir progresso.
5. **Rede:** Sobre Mim → Equipe → Ajustes → Rede de apoio → consultar rotina, sensibilidades e registros de exemplo → voltar à visão pessoal.

Para repetir a apresentação: Ajustes → Restaurar demonstração → Sim, restaurar.

## Persistência e limites

Preferências e progresso são guardados no `localStorage`, na chave `neuroin-demo-v1`. Tentativas pendentes de envio ficam em `neuroin-pending-requests-v1`, sem reenvio automático ao recarregar. A restauração da demonstração não apaga vínculos, pedidos do servidor ou dados de outros aplicativos. Se o armazenamento estiver bloqueado, mantenha a aba aberta para tentar enviar novamente. A voz continua local e depende do navegador/dispositivo. Os botões de ajuda a profissionais da equipe continuam demonstrativos; as escolhas de comunicação enviam pedidos reais quando este aparelho está vinculado.

## Notificações entre dois celulares

### Configuração do servidor

Copie `.env.example` para `.env` (no PowerShell, `Copy-Item .env.example .env`). Configure:

| Variável | Uso |
| --- | --- |
| `PORT` | Porta interna da API, padrão 3001. |
| `DB_PATH` | Arquivo SQLite, padrão `./data/neuroin.sqlite`. Use caminho absoluto em produção. |
| `TURSO_DATABASE_URL` | URL `libsql://…` do banco remoto. Quando configurada, substitui o arquivo local. Obrigatória na Vercel. |
| `TURSO_AUTH_TOKEN` | Credencial do banco remoto, somente no servidor. Obrigatória na Vercel. |
| `PUBLIC_ORIGIN` | Origem exata do app. Em desenvolvimento: `http://127.0.0.1:5173`; em produção: `https://seu-dominio`, sem barra final. |
| `VAPID_SUBJECT` | Contato do operador (`mailto:contato@seu-dominio`). |
| `VAPID_PUBLIC_KEY` | Chave pública gerada para Web Push. |
| `VAPID_PRIVATE_KEY` | Chave privada, exclusivamente no servidor. |

Gere o par com `npm run vapid:generate` e copie para `.env`. O comando exibe a chave privada: execute em terminal privado, não copie a saída para commits ou relatórios. Não use prefixo `VITE_` em nenhum segredo. `.env`, banco e build do servidor são ignorados pelo Git. Preserve o par VAPID entre reinícios; trocar as chaves exige reativar inscrições nos aparelhos.

Sem chaves, os pedidos continuam consultáveis na rede, mas não há envio de push. O app informa a ausência de configuração ao ativar notificações.

O proxy do Vite encaminha `/api` para `http://127.0.0.1:3001`. `API_PROXY_TARGET` permite mudar o destino para desenvolvimento/teste. `vite preview` serve apenas o build estático; para testar aplicação e API juntas em produção, use o servidor abaixo.

### Vincular e conferir o recebimento

1. Publique frontend e API no mesmo endereço HTTPS, acessível pela internet nos dois celulares.
2. No celular da mãe, abra **Ajustes → Rede de apoio**, ou `/rede`, e toque em **Vincular dispositivo**. O código é de uso único e expira em 10 minutos; gerar outro invalida o anterior.
3. No celular de Ana, abra `/rede`, informe o **Código de vinculação** e toque em **Confirmar vínculo**. Confira a indicação de aparelho vinculado. Abra **Ir para a comunicação**.
4. No celular da mãe, toque em **Ativar notificações** e autorize a solicitação do navegador. A permissão nunca é solicitada só por abrir a página.
5. Toque em **Enviar notificação de teste**. Confira a notificação do sistema no próprio celular. Uma resposta de sucesso da API significa apenas que o serviço de push aceitou o envio.
6. No aparelho de Ana, selecione **Água**. O pedido é salvo e enviado à rede vinculada. Cada toque em **Falar** reproduz a voz nesse aparelho e envia um novo pedido com a mesma frase, gerando outra notificação para a rede, mesmo que o anterior já tenha sido lido.
7. Na mãe, confira a notificação **Novo pedido de Ana / Eu preciso de água.** Toque nela para abrir `/rede?pedido=…` e consultar o pedido real destacado. **Marcar como lido** registra a confirmação; apenas listar os pedidos não confirma leitura.
8. No aparelho de Ana, **Consultar leitura** mostra somente a evidência registrada pela rede. Use **Tentar envio novamente** quando necessário; a mesma tentativa mantém o identificador, evitando criar outro pedido.

Dor envia apenas depois da confirmação de região/intensidade. Sensibilidades envia apenas a escolha final de ajuda. Abrir telas, atualizar a página, React StrictMode e a reprodução automática da voz não enviam pedidos extras. Cada toque manual em **Falar** cria um pedido independente; **Tentar envio novamente** preserva o identificador do pedido que falhou. O limite existente de 60 tentativas de envio por aparelho a cada 10 minutos continua valendo. Falhas preservam a mensagem local; tentativas pendentes podem ser consultadas em `/rede`. Sem rede, nenhuma entrega é prometida.

**Android:** navegador atualizado com Push API, Service Worker e Notifications API; permitir notificações no navegador e nas configurações do sistema. A instalação pelo menu do navegador é opcional onde Web Push funciona em abas.

**iPhone/iPad:** iOS/iPadOS 16.4 ou posterior, app adicionado à Tela de Início. No Safari: **Compartilhar → Adicionar à Tela de Início**. Abra pelo ícone instalado, faça o vínculo nesse app e toque em **Ativar notificações**. A identificação do app instalado pode ser diferente da aba do navegador: faça os passos no mesmo contexto. Requisitos documentados pela [Apple/WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

Permissão negada exige liberar o site nas configurações. Navegadores incompatíveis e HTTP comum mostram orientações no app. `localhost` é exceção de desenvolvimento ao requisito de contexto seguro; `http://IP-da-rede` no celular não é essa exceção. Entrega, atraso, som e visibilidade dependem da conexão, permissões, economia de bateria, modo Foco e configurações do sistema. Não há fala remota, integração WhatsApp, som garantido ou garantia de entrega instantânea.

**Desativar notificações** remove a inscrição daquele aparelho. **Desvincular** encerra o compartilhamento entre os aparelhos; o servidor não aceita consultas aos pedidos de uma rede desvinculada. Os outros vínculos continuam independentes. Compartilhe o código somente com pessoas autorizadas. O conteúdo pode aparecer na tela bloqueada; a privacidade de prévias é controlada pelo sistema.

### Hospedagem e persistência

```sh
npm ci
npm run build
# Configure .env e NODE_ENV=production no ambiente de hospedagem.
npm start
```

O build cria `dist/` (app) e `dist-server/` (API compilada). O servidor serve os dois no mesmo domínio. Use um processo Node 24 LTS permanente, monitorado por um gerenciador de serviços, atrás de proxy reverso com certificado HTTPS no mesmo host. A API escuta em `127.0.0.1:PORT`; proxy e Node precisam compartilhar o acesso a esse endereço. Configure `PUBLIC_ORIGIN` para a origem pública exata; não exponha diretamente a porta interna. O proxy deve encaminhar todas as rotas, inclusive `/api`, ao processo e preencher `X-Forwarded-For` com o IP real do cliente (sobrescrever o valor recebido ou anexar o IP observado, nunca confiar apenas no valor enviado pelo cliente). O servidor confia somente em proxy de loopback para identificar o IP em produção. Ele valida a origem das operações e usa cookie HttpOnly, SameSite e Secure em produção.

Monte um volume persistente no diretório de `DB_PATH`. O banco contém identidades de dispositivos (hash de token), vínculos, inscrições, códigos temporários, pedidos, confirmações e fila de entrega. Arquivos SQLite auxiliares `-wal`/`-shm` fazem parte do funcionamento; para backup consistente use a API de backup SQLite ou pare o processo antes de copiar o conjunto. Proteja banco e backups no host. Uma única instância Node com disco local é suficiente; não use disco efêmero nem compartilhe o arquivo por rede entre réplicas.

Inscrições que retornam 404/410 são invalidadas e precisam ser reativadas. Falhas transitórias mantêm o pedido para consulta e a fila em disco, com até seis tentativas automáticas e esperas progressivas. A tentativa explícita pode recuperar envios que continuam falhos. Retries de transporte podem reapresentar a mesma notificação após uma interrupção em ponto incerto; o identificador/tag permanece o mesmo e nenhum segundo pedido é criado. A API não consegue provar que o sistema exibiu a notificação: só a confirmação explícita de leitura registra esse estado.

Para proteger os códigos, o resgate permite 10 tentativas por aparelho e 30 por IP a cada 10 minutos; a emissão permite 5 por aparelho nesse intervalo. A criação de identidades permite 30 por IP por hora. Esses limites ficam no SQLite e sobrevivem a reinícios. Compartilhar uma conexão pode compartilhar parte desses limites; ao receber o aviso, aguarde o intervalo indicado. Há também limites para pedidos e teste de notificação.

Não há contas ou recuperação de identidade. Apagar os dados do navegador perde a identificação daquele aparelho e exige novo vínculo. Use **Desvincular** antes de abandonar um aparelho. O protótipo não tem painel administrativo de retenção; planeje a guarda e limpeza do banco antes de coletar dados pessoais reais.

GitHub Pages e hospedagem apenas estática não executam esta API. Um Vite aberto no computador também não fornece disponibilidade permanente aos celulares. Ao encerrar o servidor local/Codex, o recebimento remoto depende de um backend publicado e ativo.

### Vercel com Turso

O repositório inclui as Functions em `api/`, cliente HTTP libSQL e um consumidor Vercel Queues para retries. Não usa disco temporário nem timers contínuos na Vercel. App e API são servidos no mesmo domínio HTTPS; o banco mantém identidades, vínculos, inscrições, pedidos e entregas entre reinícios e deploys.

1. Importe este repositório como projeto Vite, Node **24.x**, build `npm run build`, instalação `npm ci` e saída `dist`.
2. No Marketplace, conecte um banco Turso ao projeto. Configure `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` nas variáveis de produção. O esquema é criado automaticamente no primeiro acesso, sem apagar os dados existentes.
3. Configure as três variáveis `VAPID_*` e `PUBLIC_ORIGIN=https://<domínio-do-projeto>`, sem barra final. Não coloque segredos em variáveis `VITE_*`. Se `PUBLIC_ORIGIN` estiver ausente, o adaptador usa o domínio de produção fornecido em `VERCEL_PROJECT_PRODUCTION_URL`.
4. Mantenha OIDC habilitado no projeto para o SDK de Queues. `vercel.json` registra o tópico `neuroin-push`; a plataforma invoca o consumidor interno, sem uma rota pública de disparo. Não é necessário criar um processo permanente ou Cron.
5. Faça o deploy de produção. Consulte `/api/session`: deve retornar JSON com `device: null` em um navegador novo e a chave VAPID pública. Depois siga o roteiro de vínculo e recebimento acima, no mesmo endereço em ambos os aparelhos.

Depois de persistir o pedido, a API publica o job durável e aguarda o envio inicial. Falhas transitórias entram em novas tentativas pela fila, limitadas a seis tentativas de transporte e mensagem de fila com validade de dez minutos; pedidos continuam consultáveis mesmo se o agendamento falhar. A fila reconsulta destinatários e vínculos atuais e não reenvia uma entrega já aceita. O app oferece retry explícito. A aceitação pela API, fila ou provedor de push não comprova exibição nem leitura no celular.

O banco remoto deve ter backups e retenção configurados no provedor. Preserve banco e chaves VAPID ao atualizar o projeto. Para previews, use banco e origem próprios se quiser testar alterações sem compartilhar dados de produção. O plano gratuito está sujeito a limites de banco, Functions e [operações de Queues](https://vercel.com/docs/queues/pricing); exceder cotas pode interromper o serviço. Não use um SQLite em `/tmp` como banco de produção ([documentação oficial](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel)).

### Verificação

```sh
npm run lint
npm run typecheck
npm run build
npm run test:server
npm test -- --workers=1
```

Testes de backend usam SQLite temporário e transporte Web Push injetado. Os de integração iniciam API e frontend juntos por `tests/global-setup.ts`, com contextos de navegador independentes e banco próprio por execução em `output/e2e-<execução>.sqlite`; não representam entrega em aparelho físico. O setup e seu transporte simulado não entram no build de produção. Para comprovar o recebimento real, siga o roteiro acima em dois celulares e observe a notificação do sistema com o site em segundo plano, inclusive após reiniciar o backend.

Na publicação de 06/11/2026, o smoke HTTPS com Turso real passou em contextos
independentes: vínculo por UI, código de uso único, duas redes isoladas, Água,
consulta, leitura explícita, envio concorrente deduplicado, voz/reload sem novo
pedido, Service Worker e recuperação em nova sessão. A fila real também foi
exercitada com uma inscrição sintética inválida: o retry automático chegou ao
provedor, a rejeição invalidou a inscrição e o vínculo de teste foi removido.
Isso verifica transporte e tratamento de falha, sem comprovar notificação ou som
em celular físico. Os testes locais passaram: 23 backend e 42 Playwright.

## Observação

Este projeto é um protótipo acadêmico demonstrativo e não substitui avaliação, diagnóstico, orientação ou acompanhamento realizado por profissionais de saúde.
