# Chat e streaming — anatomia da interface

Resumo do que é público e verificável sobre a experiência de conversa, mais as decisões de
implementação que qualquer clone *não* deveria copiar (e que este projeto não copia).

## 1. Estrutura da tela de chat

```
┌──────────────┬───────────────────────────────────────────┐
│ sidebar      │  header (nome do agente, ações, modelo)     │
│              ├───────────────────────────────────────────┤
│ • For you    │                                           │
│ • Chat       │           mensagens (scroll)              │
│ • Notes      │   usuário ───────────────► direita        │
│ • Files      │   agente  ◄─────────────── esquerda       │
│ • Memory     │   • tool call (colapsada, com status)     │
│ • Data       │   • streaming em andamento (cursor)       │
│ • Workflows  │                                           │
│ • Channels   │                                           │
│ • Plugins    ├───────────────────────────────────────────┤
│ • Settings   │  compositor: anexo, ditado, voz, enviar    │
└──────────────┴───────────────────────────────────────────┘
```

## 2. Estados de mensagem

| Estado | Sinal visual |
|---|---|
| enviado | bolha otimista antes da confirmação |
| pensando | indicador de atividade (dots / shimmer) |
| streaming | texto crescendo token a token |
| tool running | bloco da ferramenta aberto, com nome e argumentos |
| tool done | bloco colapsado, com resultado resumido |
| erro | tarja de erro com opção de retentar |
| concluído | mensagem finalizada, ações de copiar / regenerar |

## 3. Streaming — modelo mental

- Transporte típico: SSE ou WebSocket com eventos incrementais (`token`, `tool_start`, `tool_end`, `done`).
- O texto é acumulado no cliente; a bolha cresce sem re-renderizar a lista inteira.
- Chamadas de ferramenta aparecem **no meio** do stream, então o renderizador precisa suportar
  intercalação de texto e blocos estruturados.
- Auto-scroll só quando o usuário está no fim da lista (senão ancorar a posição).
- Interrupção: o usuário pode parar a geração; o backend deve aceitar cancelamento e persistir o parcial.

## 4. Compositor

- Enter envia, Shift+Enter quebra linha.
- Anexos: arrastar e soltar, colar imagem, seletor de arquivo; preview em card antes de enviar.
- Ditado (speech-to-text) e modo voz (conversa em tempo real com compartilhamento de tela/câmera).
- Sugestões de prompt no próprio campo, no idioma da conversa.
- Comandos com barra para ações rápidas.

## 5. Saídas ricas

- Cards de arquivo (Preview / renomear / abrir em Files).
- Imagens nativas quando o canal suporta.
- Tabelas e listas renderizadas em markdown.
- Artefatos visuais embutidos (HTML/SVG em iframe sandbox).

## 6. Princípios para uma interface própria

1. **Não copiar assets, textos ou CSS do produto original.** Reimplementar do zero com identidade própria.
2. **Acessibilidade primeiro**: foco visível, navegação por teclado, `aria-live` no stream.
3. **Streaming resiliente**: reconectar e retomar de onde parou, nunca duplicar tokens.
4. **Estados explícitos**: carregando, vazio, erro, sem permissão.
5. **Markdown seguro**: sanitizar HTML vindo do modelo.
