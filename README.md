# Base44 / Superagent — Mapa de Recursos e Rotas

Documentação independente que organiza, em um só lugar, **o que existe na plataforma Base44**:
áreas do produto, rotas públicas verificadas, plugins/connectors, skills, ferramentas do agente,
workflows, entidades de dados, canais de mensagem e o funcionamento do chat.

O site deste repositório (GitHub Pages) é uma interface própria de navegação e busca sobre esse mapa.
Ele **não** é um clone do Base44, **não** contém código proprietário e **não** reimplementa o
Superagent de IA — conforme o escopo pedido.

> Projeto não oficial, sem vínculo com a Base44. Marcas citadas pertencem aos seus donos.
> Fontes: documentação pública em <https://docs.base44.com> e observação da interface pública.

## Conteúdo

| Arquivo | O que tem |
|---|---|
| [`docs/rotas.md`](docs/rotas.md) | Rotas verificadas + mapa das áreas internas do produto |
| [`docs/habilidades.md`](docs/habilidades.md) | Inventário completo de skills, ferramentas, connectors e canais |
| [`docs/chat-e-streaming.md`](docs/chat-e-streaming.md) | Anatomia do chat do agente e do streaming de resposta |
| [`docs/workflows-e-dados.md`](docs/workflows-e-dados.md) | Gatilhos, atividades, entidades e RLS |
| [`docs/roadmap.md`](docs/roadmap.md) | Propostas de melhoria (o "pra melhorar" do pedido) |

## Site

O `index.html` é um painel estático (sem build, sem dependências) publicado via GitHub Pages:

- busca instantânea por rota, skill, ferramenta ou canal;
- filtro por camada (Produto / Agente / Integrações / Dados);
- tabela de rotas com nível de confiança;
- tema claro e escuro automático.

## Estado

- ✅ Conexão GitHub autorizada (conta `mlk010173`)
- ✅ Mapa montado a partir da documentação pública oficial
- ⚠️ Rotas internas da aplicação logada **pendentes**: o login por e-mail/senha em `app.base44.com`
  retornou `Invalid email or password` para as duas senhas informadas. Pulando essa etapa, o mapa
  interno pode ser completado em uma próxima rodada.

## Licença

MIT — veja [`LICENSE`](LICENSE).
