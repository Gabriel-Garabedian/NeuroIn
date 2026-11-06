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
