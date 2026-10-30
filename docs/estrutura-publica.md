# Estrutura pública do Base44

O que dá para mapear sem login: páginas institucionais, autenticação, links públicos de agente e
template, e o índice completo da documentação. Rotas internas do produto estão em
[`rotas.md`](rotas.md); aqui fica a camada pública.

## 1. Domínios

| Domínio | Função | Acesso |
|---|---|---|
| `base44.com` | site institucional: produto, preços, templates, blog | público |
| `app.base44.com` | aplicação: apps, agentes, conectores, conta | login, exceto login e links compartilhados |
| `docs.base44.com` | documentação | público, com `/llms.txt` |

## 2. Páginas públicas

| Rota | O que tem |
|---|---|
| `/` | proposta do produto, exemplos e CTA de criação |
| `/pricing` | planos, créditos e limites |
| `/templates` | galeria de templates da comunidade |
| `/blog` | artigos e novidades |
| `/login` | Google, Apple, GitHub ou e-mail + senha, com Turnstile |
| `/signup` | criação de conta, com créditos de convite |
| `/superagent/{agent_id}` | chat compartilhado de um agente |
| `/template/{slug}` | template público gerado em Agent Settings |
| `/docs` | documentação, 971 páginas |

## 3. Índice da documentação

O `/llms.txt` publica o mapa completo da documentação em Markdown. Aqui ele é lido e guardado como
dado, em [`../data/docs.json`](../data/docs.json) e no pacote do site (`assets/dados.js`):

- **61 seções**, **971 páginas**;
- seções por área: Apps (12), Superagents (3), Integrations (4), Developers (25), Conta e cobrança (5), Enterprise (5);
- cada página traz título, caminho, URL `.md` e resumo de uma linha.

Seções mais úteis para quem está mapeando o Superagente:

| Seção | Páginas | Por que importa |
|---|---|---|
| `Superagents: Getting started` | 2 | o que é um agente e como criar |
| `Superagents: Using your Superagent` | 5 | chat, canais, arquivos e memória |
| `Managing Superagents` | 3 | modelos, ajustes e exclusão |
| `Integrations: Connectors` | 8 | OAuth e catálogo de conectores |
| `Integrations: MCP` | 2 | extensões por MCP |
| `Developers: APIs — Superagents API` | 15 | superfície HTTP do agente |
| `Developers: CLI — Commands` | 57 | comandos e automação local |

O mapa navegável fica em `#/mapa`: busca em todas as rotas e em todas as páginas, com filtro por
seção e abertura do documento original.

## 4. Ferramentas e lógica de habilidades

- Lista completa de ferramentas, por família e com efeito de cada uma: [`ferramentas.md`](ferramentas.md).
- Catálogo de skills e de famílias: [`habilidades.md`](habilidades.md).
- Anatomia de uma skill, mercado e distribuição: [`skills-marketplace.md`](skills-marketplace.md).
- Versão interativa com busca e risco: `#/skills`.

A lógica, em uma frase: o agente não carrega todas as instruções de uma vez. Ele começa pelo
índice de capacidades, carrega a instrução do domínio que o pedido toca, e só então decide qual
ferramenta chamar. Instrução é contexto; ferramenta é ação; conector é acesso. As três camadas são
independentes, e é por isso que uma skill pode existir sem nenhuma ferramenta nova.

## 5. O que não é extraível sem login

- conteúdo de áreas autenticadas: telas de apps, dados de conta, painéis internos;
- textos de interface do produto, logos, assets, folhas de estilo e animações;
- qualquer estrutura de banco de dados que não esteja descrita na documentação pública.

Esses itens não entram neste repositório. O que sustenta a fidelidade visual aqui é a medição de
valores públicos — documentada em [`design-tokens.md`](design-tokens.md) — e a reimplementação
autoral do comportamento.
