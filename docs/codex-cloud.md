# Usar NeuroIn no Codex Cloud

## Conectar

1. Envie estes arquivos para uma branch do repositório
   `Gabriel-Garabedian/NeuroIn` no GitHub.
2. No Codex, escolha Cloud e crie um ambiente para esse repositório.
   Autorize o GitHub na interface caso seja solicitado.
3. Durante a preparação, peça para executar da raiz do repositório:

   ```sh
   python3 scripts/validate_ai_setup.py
   ```

   O ambiente precisa de Python 3.11+. Não instale Node ou dependências de uma
   aplicação: este repositório ainda não possui uma aplicação.
4. Verifique o resultado, publique o ambiente e inicie uma tarefa com a branch
   que contém esta configuração. Atualizações de arquivos exigem que a tarefa
   esteja usando a revisão correta; a preparação publicada não atualiza tarefas
   antigas automaticamente.
5. Na primeira tarefa, use o pedido de verificação abaixo. Confirme as skills
   efetivamente expostas e a capacidade de delegação da sessão.

## Pedido de verificação

> Leia AGENTS.md e execute python3 scripts/validate_ai_setup.py. Localize a skill
> agency-agents, consulte o catálogo e identifique os perfis Frontend Developer,
> Code Reviewer e Test Automation Engineer. Informe se esta sessão realmente
> oferece ferramentas para iniciar subagentes. Não crie uma aplicação, não
> instale frameworks e não altere arquivos.

## Skills e perfis

As 25 skills estão em `.agents/skills/`, com seus dados e referências. A cópia
da UI/UX Pro Max usa caminhos relativos ao repositório em vez da variável de
plugin do Claude. Seus scripts usam somente a biblioteca padrão do Python.

Os 283 perfis originais estão em `.codex/agents/`. Clientes locais que suportam
agentes personalizados podem carregá-los como TOML. O suporte a esses perfis
como agentes executáveis no Cloud precisa ser confirmado na sessão. A skill
`agency-agents` permite consultar e aplicar as instruções mesmo sem esse suporte.

Nenhum hook ou servidor MCP dos plugins locais foi transferido. As skills de
Ponytail e Superpowers foram incluídas como instruções, com os recursos locais
das pastas de skills; instalar um plugin no PC não o conecta ao Cloud.

## Rede e celular

A validação desta base não precisa de internet. A skill Web Design Guidelines
consulta `raw.githubusercontent.com` para buscar as regras atuais: permita esse
host se for usar essa consulta. Outras tarefas podem precisar de destinos próprios.

Uma tarefa iniciada no Cloud pode continuar com o PC desligado. No celular,
abra a mesma conta/workspace, escolha o ambiente e reabra a tarefa. Acesso remoto
ao PC é outro modo e exige que ele continue ligado.

## Referências oficiais

- https://learn.chatgpt.com/docs/environments/cloud-environments
- https://learn.chatgpt.com/docs/build-skills
- https://learn.chatgpt.com/docs/agent-configuration/subagents
