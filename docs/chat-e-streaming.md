# Chat e streaming — anatomia observada

Baseado na interface autenticada em `/superagent/{agent_id}`.

## 1. Layout

```
┌──────────────────────┬────────────────────────────────────────┐
│ sidebar (apps)       │ header: ícone do agente + nome         │
│  Apps | Agent  ◄toggle                                          │
│  + New conversation  │  área de mensagens (scroll)            │
│  Workflows           │                                        │
│  Plugins             │   "Superagent said" + horário          │
│  Channels            │   "anonymous said" + horário           │
│  Notes               │   "Thinking..." enquanto processa      │
│  Agent Settings      │                                        │
│  More ▸              ├────────────────────────────────────────┤
│ ── Conversations ──  │  banner de créditos (quando zerado)    │
│  · título + data     │  compositor: +  Auto  🎤  wave   ▷     │
│ ── Setup card ──     │  placeholder "Type a message..."       │
│  4 of 5 complete     │                                        │
│ ── Upgrade card ──   │                                        │
│ ── user + sino ──    │                                        │
└──────────────────────┴────────────────────────────────────────┘
```

## 2. Elementos confirmados

**Sidebar**
- Toggle pílula `Apps` / `Agent` no topo (troca de contexto do workspace).
- Lista de conversas com título e data (ex.: `Oct 21, 2026`).
- Cartão de onboarding "Set up your Superagent — 4 of 5 complete" com barra de progresso e
  botão "Finish setup".
- Cartão "Upgrade your plan — Get more out of your apps" com ícone de coroa.
- Rodapé: avatar com iniciais, nome do workspace, nome do usuário, chevron e sino com badge numérico.

**Mensagens**
- Rótulo de autor por mensagem ("Superagent said", "anonymous said") acima e horário abaixo.
- Blocos de conteúdo ricos dentro da mensagem (ex.: título "Issue verificada" + corpo markdown).
- Indicador de atividade textual: `Thinking...` acompanhado de um quadrado azul.

**Créditos**
- Linha: `0 credits remaining` + `renews in 1d 21h`.
- Caixa tracejada: "You're out of monthly credits" + CTA "View plans".

**Compositor**
- `+` para anexos, seletor de modelo (`Auto`), microfone (ditado),
  ícone de onda (modo voz), placeholder "Type a message...".

## 3. Streaming — comportamento esperado

- Texto cresce incrementalmente e é intercalado com blocos de ferramenta.
- `Thinking...` cobre o intervalo entre envio e primeiro token.
- Auto-scroll só quando o usuário está no fim da lista.
- Cancelamento deve persistir o parcial.

## 4. Regras de produto que a UI revela

1. **Modelo por contexto**: "Chat" e "Automations" têm seletores independentes, ambos em
   `Automatic` por padrão (escolhe o melhor modelo por tarefa).
2. **Créditos são o gargalo visível**: o banner substitui a experiência normal de chat quando zera.
3. **Permissão por workspace**: URL de agente de outro workspace abre erro de permissão, não 404.
4. **Onboarding numerado**: o cartão "4 of 5" indica checklist com etapas mensuráveis.

## 5. Diretrizes para uma interface própria

- Nunca copiar assets, textos ou CSS do produto original.
- Acessibilidade: foco visível, navegação por teclado, `aria-live="polite"` no stream.
- Reconexão de stream sem duplicar tokens.
- Sanitizar HTML vindo do modelo.
- Estados explícitos: vazio, carregando, erro, sem permissão, sem créditos.
