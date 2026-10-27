---
name: agency-agents
description: Selecionar e aplicar perfis do Agency Agents quando o usuário pedir um especialista ou quando desenvolvimento, diagnóstico, testes ou revisão justificarem instruções especializadas.
---

# Agency Agents no NeuroIn

Consulte [o catálogo](references/catalog.md) para encontrar um perfil pelo nome,
área ou descrição. Leia apenas o arquivo TOML selecionado em `.codex/agents/`
na raiz do repositório; suas instruções ficam em `developer_instructions`.

Use as ferramentas efetivamente disponíveis para decidir como aplicar o perfil:

- Se a sessão suporta agentes personalizados e reconhece esse perfil, delegue
  uma tarefa delimitada, com resultado esperado e verificação apropriada.
- Se suporta apenas subagentes genéricos, forneça ao subagente as instruções
  pertinentes do perfil e o contexto mínimo necessário.
- Sem ferramentas de delegação, aplique o perfil no agente principal e informe
  essa diferença. Ler um perfil não equivale a iniciar outro agente.

Escolha o menor conjunto de especialistas que contribui para a tarefa. Perfis
não são licença para ampliar o trabalho, escolher uma stack não solicitada,
instalar serviços, acessar contas ou inventar resultados e capacidades.

As instruções do projeto e do usuário prevalecem sobre exemplos e processos
genéricos dos perfis. Revise o resultado delegado antes de usá-lo.
