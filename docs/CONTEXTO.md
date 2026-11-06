# Continuidade — NeuroIn

Atualizado em 29/10/2026. Repositório local:
`C:/Users/Antonio Pedro/NeuroIn`.

## Escopo e decisões

Segunda etapa de refinamento do protótipo existente, autorizada pelo usuário.
Não houve reconstrução da aplicação, backend, autenticação ou serviços novos.
Dados continuam fictícios; somente preferências, etapas e progresso são locais.

- Marca anterior multicolorida substituída por dois caminhos formando N; favicon
  e abertura usam a mesma identidade. Petróleo, lavanda e cores semânticas em
  `src/styles.css`; fontes locais Nunito/Poppins preservadas.
- Moldura de até 480px no desktop. Home com atalhos mais compactos, menos cores
  concorrentes e acesso destacado ao Modo Calmo.
- Dor: silhuetas por região, seleção recolhida ao avançar, intensidade,
  resumo e confirmação. Alterar região permite nova escolha e zera intensidade.
- Sensibilidades: incômodo → ajuda → confirmação, possibilidade de alterar,
  foco entre etapas e acesso ao Modo Calmo após ajuda.
- Calmo: seis ações, uma paleta, sem navegação inferior durante a pausa,
  saída explícita. Ícone de sair representa uma porta.
- Rotina: timeline com estados e atalho para a atividade atual; checklist e
  persistência preservados. Perfil pessoal, rede humana e visão de apoio
  identificada; comunicação recente permanece um mock estático, com aviso.
- Restauração existente refinada como Modo de demonstração nos Ajustes.
- Revisão de português e ícones decorativos; movimento reduzido também remove
  escala no toque. Sem novas dependências de aplicação.

Direção e roteiro: `docs/DESIGN.md`. Plano:
`docs/superpowers/plans/2026-10-29-redesign.md`.

## Verificações desta etapa

- Antes das mudanças: npm ci, lint, typecheck, build e 17 testes Playwright
  passaram; aplicação executada e Home inspecionada em navegador.
- Depois: lint, typecheck e build passaram; suite ampliada a 22 testes passou
  com `npm test -- --workers=1`. Testes novos cobrem resumo de dor, mudança de
  região/incômodo, acesso ao calmo após ajuda e moldura desktop.
- Auditoria adicional no Chromium: 11 páginas em 360/390/430/768/1440px
  (55 combinações) sem overflow; 12 auditorias axe WCAG A/AA e 2.1AA sem
  violações (11 telas em padrão e dor selecionada). Suite existente também
  verifica texto maior + alto contraste. Movimento reduzido e console conferidos.
- Screenshots revistos em duas passadas, incluindo Home, comunicação, dor,
  sensibilidades, calmo, rotina/detalhe, perfil, rede, visão de apoio e ajustes.
  Artefatos locais ignorados em `output/playwright/`, relatório `review.json`.
- Revisão independente de código não encontrou bloqueios. Último ajuste de
  dor revisado novamente; teste cobre reset de intensidade e foco.
- `py -3.13 scripts/validate_ai_setup.py`: OK, 25 skills, 283 perfis,
  catálogo e busca UI/UX. `python` é alias da Store neste Windows; usar `py`.

Ocorreram timeouts de 30s durante HMR e execução concorrente de browsers/checks;
isoladamente e na execução final sequencial passaram sem aumentar timeouts.
Para estabilidade local, evitar suites e capturas de vários agentes ao mesmo tempo.

## Limites e entrega

Sem commit, push ou deploy nesta etapa. Vite iniciado na porta 5173 nesta sessão;
para novas sessões executar `npm run dev`. Nenhum teste em aparelho físico,
leitor de tela real ou validação de reprodução de voz no dispositivo foi realizado.
Os testes de preferências de voz usam simulação; o áudio depende do navegador.
Testes automatizados e inspeção visual não equivalem a validação com usuários.
Não há pendência de implementação conhecida no escopo solicitado.

## Ajuste de cores solicitado em seguida

Em 29/10/2026, o usuário pediu mais vivacidade após comentar a preferência de
seu primo por cores intensas. A Home agora inicia com cores mais vivas nos
atalhos (azul, amarelo, verde, violeta e coral), marca azul/violeta mais presente
e fundos gerais preservados. Isso é uma opção visual, sem pressupor uma
preferência universal de pessoas autistas.

`preferences.vividColors` é booleano, padrão true, validado pelo carregador
existente e salvo na mesma chave local. Ajustes → Cores mais vivas permite
alternar para tons suaves; restauração recupera o padrão. O Modo Calmo não
recebe a classe vivid-colors, mesmo quando essa preferência está ativa.
Alto contraste também mantém a marca em tons escuros.

Lint, typecheck, build e 25 testes passaram (suite completa, um worker).
Três testes novos verificam persistência/restauração, isolamento da paleta do
Calmo e ambas as paletas em 360/390/430/768/1440px, com axe sem violações.
Capturas vivid/soft revistas em 390px, em `output/playwright/home-vivid.png`
e `home-soft.png`. Sem novas dependências, commit, push ou deploy.

## Notificações entre aparelhos — 06/11/2026

O usuário autorizou explicitamente backend mínimo para vínculos, pedidos e Web
Push, substituindo a antiga restrição sem backend somente nesse escopo. Remoto
verificado: Gabriel-Garabedian/NeuroIn. Implementação no checkout atual, sem
worktree, preservando as alterações de redesign já presentes. Sem commit/push/deploy.

- `server/app.ts`/`index.ts`: Node 24 LTS, Express, `web-push` e SQLite nativo em
  disco (`DB_PATH`, padrão `data/neuroin.sqlite`), WAL e transações. Cookie
  HttpOnly/SameSite=Strict, Secure em produção, somente hash do token no banco.
  Origem das mutações validada; proxy confiável só loopback em produção.
- Vínculo por código base32 de 10 caracteres/50 bits, uso único e expiração de
  10 minutos. Limites por dispositivo/IP persistem no SQLite. Inscrições com
  endpoint normalizado, allowlist HTTPS e validação criptográfica das chaves;
  inscrições 404/410 são removidas. Cada pedido tem destinatários derivados
  dos vínculos; `expectedPeers` protege a criação contra mudança concorrente.
- Pedido e fila ficam no banco antes do envio. Até seis tentativas automáticas,
  backoff, lease e timeout. UUID global impede duplicidade; replay de outro
  emissor/frase recebe 409. Retry não reenvia entregas já aceitas. Um envio em
  andamento não pode ser recolhido após desvincular; incerteza de transporte
  pode reapresentar a mesma notificação/tag, sem criar um segundo pedido.
- `src/notifications/`: cliente, provider de envio compartilhado e painel da
  rede. Somente handlers de escolha final enviam: Home, Comunicação, Calmo,
  confirmação de dor e ajuda sensorial. Falar, render/mount/StrictMode e reload
  não enviam pedidos. Pendentes em `neuroin-pending-requests-v1` têm retry manual
  com o mesmo UUID. Voz e frase locais preservadas. Rotina/perfil continuam locais.
- Rede permite gerar/inserir código, ativar/desativar/testar notificações,
  desvincular e consultar pedidos reais separados dos mocks. Clique abre
  `/rede?pedido=<UUID>`. Apenas Marcar como lido confirma leitura; API/serviço
  aceitar o push não comprova recebimento. Limpeza/versionamento de consultas
  evita respostas antigas após mudar vínculos. Status de voz e envio têm nomes
  acessíveis distintos.
- `public/sw.js`, manifesto e ícones PNG da marca: PWA/Web Push e cache do shell
  público (API nunca em cache). Cache atual `neuroin-shell-v1`; ao alterar o shell
  em outra entrega, revisar seu versionamento. iPhone/iPad requer iOS/iPadOS 16.4+
  e abertura pela Tela de Início; permissão só no clique Ativar notificações.
- Scripts e proxy Vite documentados no README, `.env.example` sem credenciais.
  Gerar VAPID uma vez e guardar somente no servidor. Sem chaves a API aceita e
  preserva pedidos, mas não envia push. Node escuta em 127.0.0.1; produção requer
  proxy HTTPS no mesmo host, X-Forwarded-For confiável, domínio e volume permanente.

Verificações finais:

- `npm run lint`, `npm run typecheck`, `npm run build`: passaram.
- `npm run test:server`: 15/15, incluindo vínculo válido/inválido/expirado,
  reuso, força bruta persistente, isolamento, inscrições/SSRF, falha/backoff,
  concorrência/dedupe, leitura explícita, restart e cookie/origem de produção.
- `npm test -- --workers=1`: 42/42 na execução final (3,2min). Frontend e API
  reais juntos, contextos independentes; transporte externo e APIs de push do
  navegador simulados nos casos indicados. Inclui leitor remoto não autorizado,
  remoção remota de vínculo, retry offline, foco e axe em 390/1440px da rede conectada.
- Ajuste da infraestrutura: processos CLI separados do Vite encerraram durante
  algumas rodadas Windows, gerando ERR_ABORTED/CONNECTION_REFUSED. Tentativas com
  CI/TTY não bastaram. `tests/global-setup.ts` agora mantém API e Vite no próprio
  runner e encerra ambos no teardown; a suíte completa passou nesse formato.
  Não há entry ou modo de transporte simulado no build de produção.
- Smoke do servidor compilado: app, deep link, SW, manifesto, ícones, sessão
  sem VAPID, cookie Secure e bloqueio de origem passaram. Biblioteca web-push
  real gerou payload criptografado/VAPID válido e CLI de chaves validada sem
  exibir segredos; nenhum envio ao provedor foi feito nesses smokes.
- Smoke PWA do build no Chromium local: SW realmente ativo, JS/CSS no cache,
  ausência de API no cache, abertura offline em `/inicio`, Água visual e retry
  passaram. Capturas revistas/geradas em `output/playwright/push-support.png`
  e `push-mobile.png` (ignoradas). Validador de 25 skills/283 perfis e diff-check passaram.

Pendências externas: não há hospedagem de backend configurada neste repositório,
domínio HTTPS ou chaves VAPID de produção provisionados nesta entrega. Nenhum
recebimento em celular físico, som do sistema, Safari/iOS real, HTTPS público,
Cloud ou deploy foi validado. Para usar entre celulares após encerrar o Codex,
publicar um serviço Node 24 permanente com volume SQLite, configurar as variáveis
do README e observar a notificação real nos dois aparelhos. Pages/hosting
somente estático não executa esta API. A configuração pessoal global só aponta
para este registro; as informações anteriores de app totalmente local são históricas.

### Pedido de commit e deploy na Vercel

O usuário autorizou commit, envio ao GitHub e deploy, pedindo o mínimo de ações
manuais. Acesso de escrita ao repositório confirmado pelo conector GitHub;
main remota ainda em `851b684` antes do envio. Vercel CLI 65.12.1 respondeu
`Logged out`; não há `.vercel`, sessão CLI ou variáveis de infraestrutura
disponíveis neste checkout. Foi oferecida conexão do plugin Vercel, ainda sem
confirmação no momento deste registro.

A documentação atual da Vercel confirma que SQLite em arquivo local não tem
persistência garantida nas Functions. Para deploy completo ali, precisa de banco
remoto (Turso é uma opção no Marketplace) e adaptação do driver/fila ao ciclo de
Functions. Não foi publicado um frontend isolado como se as notificações já
funcionassem, nem criado um deploy temporário/expirável sem autenticação.

Recurso e interface enviados à main no commit `91383da` em 06/11/2026;
hash remoto conferido após `git push`. Checkout estava limpo após o envio.
Lint, typecheck, build, 15 testes backend e 42 Playwright foram reexecutados
com sucesso antes do commit. Nenhuma chave privada ou banco entrou no Git.
Ainda não existe deploy Vercel confirmado: a CLI está sem login e a integração
oferecida continua sem conexão confirmada. Próxima ação necessária do usuário:
adicionar/autorizar Vercel; depois configurar persistência remota e adaptar a API
para publicar a funcionalidade completa. Não há status de deploy no commit GitHub.

### Vercel instalada; ferramentas ainda ausentes nesta conversa

Após o usuário responder "conectei", a consulta ao catálogo confirmou
`installed: true` para Vercel. Não pedir outra instalação/conexão com base no
estado anterior. Contudo, a lista efetiva de ferramentas desta conversa não
contém Vercel (nem por nome nem por descrição/capacidades de deploy), e o host
não recebeu arquivo de autenticação CLI ou variáveis Vercel/Turso. Não foi
possível consultar a conta, criar banco ou publicar usando esta conversa.

Próxima tentativa: abrir uma nova conversa no projeto NeuroIn para carregar a
integração recém-instalada; mencionar Vercel no pedido. Ler este registro e
continuar o deploy já autorizado, usando o checkout atual. O código e os testes
estão nos commits anteriores; não refazer a implementação nem pedir ao usuário
que repita os requisitos. Primeiro verificar ferramentas e conta disponíveis;
depois resolver persistência remota e ciclo da fila antes de declarar o app
com notificações publicado. Instalação confirmada não comprova deploy nem
recebimento físico. Nenhum recurso pago foi criado ou autorizado nesta etapa.

### Adaptação para Vercel — 06/11/2026

A integração Vercel está funcional nesta sessão. A equipe autorizada é Voryn
(`team_0fDPokRDzboxsb3U1uN3tjgv`); Voryn é o workspace da conta. O aplicativo
Voryn existente não foi alterado. Criado projeto separado `neuroin`,
`prj_g5HARp9oQLHzDnNgEmMu1ADTVNJX`, Node 24.x, domínio reservado
`neuroin-psi.vercel.app`, acesso público e OIDC habilitado. O usuário conectou
Turso pelo Marketplace, plano Starter gratuito ($0/mês), e as variáveis
TURSO_DATABASE_URL/TURSO_AUTH_TOKEN chegaram ao projeto. VAPID e PUBLIC_ORIGIN
foram configurados exclusivamente no ambiente do projeto, sem segredos no Git.

- `createApp` agora assíncrono. Mantém SQLite nativo local e usa libSQL HTTP
  para Turso remoto. Callers, fixtures e setup Playwright ajustados. Transações
  remotas usam a mesma conexão via AsyncLocalStorage; operações/transações locais
  são serializadas por arquivo. Exclusão de vínculo apaga entregas explicitamente.
- `serverless/`, `api/`, `vercel.json`: sem SQLite temporário nem intervalos na
  Vercel. Job Queues publicado depois do commit e antes do envio inicial; consumidor
  reconsulta banco/vínculos, respeita backoff/lease e seis tentativas. Mensagem
  dura dez minutos. Claim compara attempts para proteger snapshots concorrentes.
  Reativar inscrição pode publicar novo job; dedupe de transporte está no banco,
  não em chave do broker que impediria a recuperação dentro do TTL.
- Revisão separada encontrou e corrigiu dedupe indevido da republicação e
  agendamento tardio. README e .env.example incluem deploy, banco e fila.
- `npm ci` final passou. Durante diagnóstico houve falha Windows EPERM ao
  remover DLL aberta por testes antigos; encerrados somente os processos de
  teste identificados desta tarefa e instalação refeita. Driver local libSQL
  retinha arquivo no Windows após close em reprodução isolada; mantido driver
  nativo local para preservar funcionamento e migração sem perda.
- Lint/typecheck/build passaram. Backend ampliado de 15 para 23 testes;
  Playwright 42/42 passou (3,8 min), API/frontend juntos com transporte externo
  simulado. `py -3 scripts/validate_ai_setup.py` passou (25 skills/283 perfis).
- npm audit reporta dependências transitivas do SDK Queues (minimatch e caminho
  CLI/OIDC/zod), além de dev dependencies. Nenhum downgrade forçado ou upgrade
  incompatível aplicado. Não há glob ou coleção Zod fornecida pelo usuário nas
  rotas do aplicativo; atualizar SDK quando correções compatíveis estiverem disponíveis.

Neste ponto o deploy e o smoke HTTPS/Turso ainda estão pendentes; conferir
o registro posterior antes de declarar publicação ou entrega real em celular.

### Deploy concluído e smoke público — 06/11/2026

Publicado em **https://neuroin-psi.vercel.app**, rede em `/rede`. Backend e frontend
no mesmo domínio HTTPS, banco Turso remoto e Vercel Queues. O serviço não depende
do computador/Codex aberto. Apenas o projeto NeuroIn foi alterado na equipe Voryn.
Plano Turso Starter gratuito confirmado; nenhum plano pago contratado.

- Código publicado: commit `09654c50504a766f2f9ffa7f2bfbef2538c8ff5a`, deployment
  `dpl_5GaZZM4Hzm1eZ6YKnMMP7af2156u`, estado READY confirmado pela Vercel.
  Build remoto passou com Node 24. Commits anteriores de diagnóstico/adaptação:
  `d3d17a0`, `2f85985`, `d294016`; todos enviados à main. Commits posteriores
  de documentação não alteram o aplicativo publicado.
- Primeiro smoke encontrou SERVER_ERROR na inicialização SQL. Separar os
  PRAGMAs locais do esquema remoto resolveu; `/api/session` passou a responder
  JSON 200, sem revelar chaves privadas. Diagnóstico registra somente erro
  sanitizado e presença de configuração, sem tokens ou URL do banco.
- Segundo smoke encontrou 404 da plataforma nas rotas com múltiplos segmentos.
  Substituído catch-all de arquivo por `api/index.ts` e rewrite explícito
  `/api/:path*` para `/api`; app recebe o caminho original. Rotas profundas
  confirmadas como JSON da API, não página 404 nem HTML de SPA.
- Smoke Playwright real no endereço público passou: vínculo por UI, reuso de
  código rejeitado, dois pares/redes isolados, Água transmitida/persistida,
  consulta remota e leitura explícita, mesmo UUID concorrente cria um pedido,
  Falar/reload não enviam, SW e manifesto públicos. Sem erros JS capturados.
- Nova sessão de API recuperou pedido e readAt; também consultado pelo hostname
  independente do deployment com credencial somente do dispositivo de teste.
  Captura revista em `output/playwright/cloud-support.png`; scripts e estados
  temporários de teste ficam ignorados em `output/playwright/`, fora do Git.
- Teste de Queues real: inscrição sintética com chave válida e endpoint FCM
  inexistente; ativação reprogramou pedidos falhos. Sem disparo manual de pedido
  ou teste de push, a inscrição foi invalidada em menos de dez segundos pelo
  consumidor automático após rejeição do provedor. Isso comprova worker/retry,
  transporte web-push e limpeza 404/410, não recebimento físico. Ao terminar,
  inscrição e vínculo de teste removidos; consulta ao pedido pela ex-rede deu404.
- Lint e typecheck passaram após as correções; build remoto final passou.
  Última suíte backend:23/23; frontend/API locais:42/42; validador de setup passou.
  Nenhum segredo ou banco entrou no Git. VAPID e credenciais de banco somente
  nas variáveis do projeto Vercel; preservar ao atualizar/republicar.

Pendente: observar recebimento, clique e eventual som em Android/iPhone físicos.
Nos celulares usar sempre o domínio canônico acima; mãe gera vínculo em `/rede`,
filho confirma código, mãe ativa notificações e testa. iPhone precisa instalar
na Tela de Início e abrir pelo ícone. Entrega/som dependem do sistema, permissões
e conexão. Não afirmar recebimento real só pelo sucesso de API, SDK ou fila.
