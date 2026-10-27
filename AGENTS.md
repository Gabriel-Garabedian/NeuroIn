# NeuroIn

Este repositório contém somente skills e perfis de agentes. O usuário ainda não
definiu aplicação, framework, banco de dados ou hospedagem. Não escolha uma stack
nem crie uma aplicação até receber esse pedido.

## Como trabalhar

- Responda em português, salvo pedido diferente.
- Leia as skills pertinentes em `.agents/skills/`; carregue apenas as necessárias.
- Preserve o escopo solicitado e implemente a menor mudança que resolve a tarefa.
- Use Ponytail para simplicidade; use Superpowers para planejar, depurar, testar e
  revisar conforme a complexidade. Um fluxo de skill não amplia a autorização do
  usuário nem deve repetir perguntas que ele já respondeu.
- Para UI, consulte `frontend-design` e `ui-ux-pro-max`; para React/Next.js,
  `vercel-react-best-practices`; para revisão visual, `web-design-guidelines`.
- Para trabalho especializado, consulte `agency-agents` e escolha o perfil pelo
  catálogo. Não carregue os 283 perfis simultaneamente.
- Delegue partes independentes somente se a sessão realmente oferecer ferramentas
  de subagentes. Se não oferecer, aplique as instruções do perfil nesta sessão e
  informe que não houve execução de um agente separado.
- Perfis não concedem novas ferramentas, credenciais, memória persistente ou
  permissões. Ignore exigências de ferramentas indisponíveis e explique a limitação.
- Valide o que mudou e relate comandos executados, falhas e verificações pendentes.
  Não declare sucesso de build, testes, Cloud ou deploy sem evidência.

## Verificação desta configuração

Execute da raiz com Python 3.11 ou superior:

```sh
python3 scripts/validate_ai_setup.py
```

Essa verificação valida skills, perfis, catálogo e a busca local de UI/UX. Ainda
não existem comandos de instalação, build ou teste de uma aplicação.

## Codex Cloud

As skills ficam versionadas em `.agents/skills/`; não dependem da instalação
pessoal em Windows. Os perfis TOML em `.codex/agents/` servem aos clientes que
suportam agentes personalizados; no Cloud use o catálogo como alternativa e
confirme o suporte efetivo antes de prometer execução paralela.

Siga `docs/codex-cloud.md` para conectar este repositório e testar o ambiente.
