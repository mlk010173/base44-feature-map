# Interface do Superagente

Interface funcional (HTML, CSS e JavaScript puros, sem build) que reproduz a experiência do
Superagente da Base44 com tudo o que foi mapeado: chat com streaming simulado, workflows,
plugins, canais, notas, arquivos, memória, dados e configurações.

**Demo:** https://mlk010173.github.io/base44-feature-map/

Não é cópia: o visual, o texto e o código são próprios, escritos a partir do mapa de
rotas e da anatomia da interface documentados aqui. Nenhum asset, CSS ou código do produto
original foi usado.

## Sistema visual e backend

- `docs/interface-visual.md`: paleta, tipografia, medidas e componentes da interface padrão,
  com a tradução aplicada aqui (azul conduz navegação e ação, laranja é reservado a créditos)
- `docs/api-e-backend.md`: superfície de API documentada (entidades, conversas, mensagens,
  memória, webhooks, créditos) e o que a demonstração local simula

## Fidelidade visual

O layout segue a interface padrão: sidebar de 250 px com rodapé fixo, barra superior de 52 px,
chat centralizado em 760 px, compositor arredondado de 18 px, tabelas com cabeçalho discreto
e alternador Apps/Agente. Marca, textos, ícones e código são próprios: nada de asset ou
string copiada do produto original.

## O que funciona de verdade

- Chat com envio, indicador de pensamento, passos de ferramenta e texto em streaming
- Habilidades: catálogo com 68 capacidades (skills, famílias de ferramentas, conectores, canais e
  mercado), busca, filtro por camada, leitura de risco e liga/desliga por item
- Streaming: laboratório que reproduz a sequência de quadros entre envio e resposta
  (`message.start` → `thinking` → `step.start` → `step.end` → `delta` → `message.end`)
- Mapa: 34 rotas mapeadas em cinco grupos, mais as 971 páginas da documentação pública em 61
  seções, com busca, filtro por seção e abertura do documento original
- Consumo de créditos, banner de créditos esgotados e simulação de upgrade
- Nova conversa e troca entre conversas, com histórico por conversa
- Workflows: criar, ativar, pausar, excluir e executar, com histórico de execuções
- Plugins: aba de conectores (conectar e desconectar) e de skills (ligar e desligar)
- Canais: conectar, gerenciar e desconectar, incluindo WhatsApp com número mascarado
- Notas, arquivos, memória e tabelas de dados com criação e exclusão
- Configurações: modelos, acesso entre apps, voz, template, pessoas de confiança,
  uso de créditos, reuniões, segurança e área de desenvolvedor
- Tema claro e escuro, estado persistido no `localStorage`, layout responsivo

## Estrutura

- `index.html`: shell da aplicação (sidebar, topo, área de visão, modal, toasts)
- `assets/styles.css`: tokens de design, layout e componentes
- `assets/app.js`: estado, roteador por hash, nove views e o motor de streaming
- `docs/rotas.md`: mapa de rotas verificado no produto
- `docs/chat-e-streaming.md`: anatomia do chat e do compositor
- `docs/mapa.html`: mapa navegável de rotas e capacidades
- `docs/ferramentas.md`: inventário de ferramentas por família
- `docs/skills-marketplace.md`: anatomia de skill e distribuição
- `assets/dados.js`: rotas e índice de documentação, gerados de `data/*.json`
- `data/rotas.json` e `data/docs.json`: os mesmos dados em JSON, para reuso

## Rodar local

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

---

## Conteúdo

| Arquivo | O que tem |
|---|---|
| [`docs/rotas.md`](docs/rotas.md) | Rotas verificadas + mapa das áreas internas do produto |
| [`docs/habilidades.md`](docs/habilidades.md) | Inventário completo de skills, ferramentas, connectors e canais |
| [`docs/chat-e-streaming.md`](docs/chat-e-streaming.md) | Anatomia do chat do agente e do streaming de resposta |
| [`docs/workflows-e-dados.md`](docs/workflows-e-dados.md) | Gatilhos, atividades, entidades e RLS |
| [`docs/ferramentas.md`](docs/ferramentas.md) | Inventário completo das ferramentas por família, com efeito de cada uma |
| [`docs/skills-marketplace.md`](docs/skills-marketplace.md) | Anatomia de uma skill, mercado, distribuição por GitHub e catálogo sugerido |
| [`docs/estrutura-publica.md`](docs/estrutura-publica.md) | Domínios, páginas públicas, índice da documentação e o que não é extraível |
| [`docs/design-tokens.md`](docs/design-tokens.md) | Tokens medidos no site público, tipografia, movimento e o mapa entre os dois sistemas |
| [`docs/roadmap.md`](docs/roadmap.md) | Propostas de melhoria (o "pra melhorar" do pedido) |

## Site

O `index.html` é um painel estático (sem build, sem dependências) publicado via GitHub Pages:

- busca instantânea por rota, skill, ferramenta ou canal;
- filtro por camada (Produto / Agente / Integrações / Dados);
- tabela de rotas com nível de confiança;
- tema claro e escuro automático.

## Estado

- ✅ Conexão GitHub autorizada (conta `mlk010173`)
- ✅ Login em `app.base44.com` concluído (conta informada), incluindo 2FA por notificação no celular
- ✅ 13 rotas internas confirmadas, incluindo `/superagent/{id}/tasks`, `/integrations`, `/settings`,
  `/notes`, `/library`, `/memory` e `/data`
- ✅ Anatomia do chat, do compositor e da tela de Plugins/Channels documentada
- ⚠️ A conta usada tem **0 créditos**, então não foi possível exercitar uma resposta de agente
  em streaming do início ao fim; o comportamento de streaming está descrito a partir da UI e da
  documentação, não de uma captura de tokens ao vivo

## Licença

MIT — veja [`LICENSE`](LICENSE).
