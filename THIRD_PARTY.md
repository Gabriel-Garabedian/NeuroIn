# Origens e licenças

As cópias foram obtidas das instalações locais em 27/10/2026. As licenças dos
componentes continuam pertencendo aos respectivos autores; este arquivo não
atribui uma licença única ao projeto NeuroIn.

| Conteúdo | Origem | Licença / referência |
|---|---|---|
| Frontend Design | https://github.com/anthropics/skills | Apache-2.0, arquivo LICENSE.txt na pasta da skill |
| UI/UX Pro Max | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | MIT, licenses/ui-ux-pro-max/LICENSE |
| React Best Practices | https://github.com/vercel-labs/agent-skills | MIT conforme o frontmatter original; autoria Vercel preservada |
| Web Design Guidelines | https://github.com/vercel-labs/agent-skills | Metadados originais e autoria Vercel preservados; fonte sem arquivo de licença separado |
| Superpowers | https://github.com/obra/superpowers | MIT, licenses/superpowers/LICENSE; cópia do marketplace 0722921d, manifest 6.3.0 |
| Ponytail | https://github.com/DietrichGebert/ponytail | MIT, licenses/ponytail/LICENSE; versão 5.3.2 |
| Agency Agents | https://github.com/msitarzewski/agency-agents | MIT, licenses/agency-agents/LICENSE; revisão b37b5bb33b78f2c1d6567d98e25ca818e3259219 |

## Ajustes locais

- UI/UX Pro Max: os comandos em SKILL.md usam o caminho relativo da cópia no
  repositório em vez de CLAUDE_PLUGIN_ROOT. Dados e scripts foram preservados.
- A skill agency-agents e seu catálogo foram criados para consultar os perfis
  TOML no Cloud, sem afirmar suporte a execução de subagentes personalizados.
- Perfis originais TOML foram preservados; hooks de plugins não foram copiados.
