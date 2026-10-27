# NeuroIn

Base de skills e agentes para desenvolvimento futuro com Codex local ou Cloud.
Nenhuma aplicação ou stack foi definida.

## Incluído

- 4 skills de design/front-end: Frontend Design, UI/UX Pro Max, React Best
  Practices e Web Design Guidelines.
- 14 skills do Superpowers e 6 do Ponytail.
- 283 perfis do Agency Agents, com uma skill de consulta e catálogo.
- Instruções do projeto em `AGENTS.md` e validação com Python 3.11+.

Total: **25 skills e 283 perfis de agentes**. Disponibilidade de perfis não
garante que o ambiente ofereça execução de subagentes.

## Verificar

```sh
python3 scripts/validate_ai_setup.py
```

Não há dependências de aplicação para instalar. A verificação usa somente a
biblioteca padrão do Python e faz uma busca de exemplo nos dados de UI/UX.

Leia [a configuração do Codex Cloud](docs/codex-cloud.md),
[o catálogo de agentes](.agents/skills/agency-agents/references/catalog.md) e
[as origens e licenças](THIRD_PARTY.md).
