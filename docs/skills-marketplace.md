# Skills: anatomia, catálogo e distribuição

Uma skill é uma pasta com instruções e, opcionalmente, um script executável. O agente carrega a
instrução quando o pedido combina com a descrição, e roda o script quando precisa de shell de
verdade.

## 1. Anatomia de uma skill

```
.agents/skills/<nome>/
  SKILL.md          # quando usar, o que faz, limites
  scripts/
    run.sh          # ou run.py / run.js
  references/       # opcional: tabelas, exemplos, esquemas
```

Casos simples dispensam pasta: um arquivo solto em `.agents/skills/<nome>.sh` já é uma skill.
A chamada é `run_skill` com o nome, e os argumentos chegam como uma string única.

O `SKILL.md` precisa responder quatro coisas, nesta ordem: **quando usar**, **o que espera de
entrada**, **o que devolve**, e **o que não fazer**. Sem isso a skill é escolhida na hora errada.

## 2. Skills de plataforma (instrucionais)

Não têm script: são instruções que mudam como o agente trabalha. Trinta delas estão mapeadas em
[`habilidades.md`](habilidades.md). O roteamento começa em `capabilities`, que é o índice: quando
a tarefa é de um domínio específico, é ele que aponta qual das outras carregar.

## 3. Mercado

Três origens de skill convivem:

| Origem | Como chega | Quando vale |
|---|---|---|
| Skill store | catálogo público, instalação por nome | tarefa comum, sem código próprio |
| Skill própria | pasta autoral no workspace | processo do usuário, com detalhe que só ele tem |
| Repositório | clone ou script de instalação a partir do Git | versão compartilhada, com histórico e licença |

O critério prático: se a skill precisa de credencial, ela vive no workspace e recebe o segredo por
variável de ambiente; nunca no corpo do `SKILL.md`.

## 4. Distribuir por GitHub

O caminho mais simples e o que este repositório usa:

1. pasta `skills/<nome>/` versionada junto do resto do projeto;
2. `SKILL.md` com front-matter de nome e resumo;
3. `scripts/run.sh` idempotente, com `set -euo pipefail`;
4. instalação por `git clone` + link simbólico em `.agents/skills/`;
5. licença no topo do repositório, para deixar claro o que pode ser reaproveitado.

Checklist antes de publicar:

- roda com argumento vazio e devolve erro claro, não stack trace;
- não imprime segredo em log;
- informa o que vai mudar antes de mudar;
- tem um exemplo de entrada e a saída esperada no `SKILL.md`.

## 5. Catálogo sugerido para este projeto

Skills que valem existir aqui, na ordem em que dão retorno:

| Skill | Entrada | Saída |
|---|---|---|
| `map-routes` | URL inicial | tabela de rotas com estado de verificação |
| `capture-ui` | seletor ou tela | HTML estrutural anonimizado + medidas |
| `diff-visual` | duas capturas | lista de divergências de layout |
| `publish-pages` | branch | confirmação de publicação e URL |
| `budget-report` | período | uso de créditos por dia e por origem |

Todas são de leitura ou de publicação do próprio site: nenhuma toca conta de terceiro, e nenhuma
reproduz conteúdo do produto original.

## 6. O que não entra em skill

- credencial, token ou senha;
- conteúdo de terceiro sem licença;
- passo que depende de login em conta que não é do dono;
- cópia de código, texto ou asset de produto alheio.
