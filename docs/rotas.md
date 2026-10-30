# Rotas e áreas do produto

Legenda de confiança:

- **verificada** — a página foi aberta e observada diretamente
- **documentada** — aparece na documentação oficial, mas a URL exata não foi confirmada
- **pendente** — depende de sessão autenticada (login bloqueado nesta rodada)

## 1. Domínios

| Domínio | Função | Confiança |
|---|---|---|
| `base44.com` | site institucional, preços, templates, blog | documentada |
| `app.base44.com` | aplicação web (builder, apps, Superagents) | verificada |
| `docs.base44.com` | documentação (Docusaurus, `/llms.txt` disponível) | verificada |

## 2. Rotas públicas verificadas

| Rota | Descrição | Confiança |
|---|---|---|
| `/` | entrada da aplicação; redireciona para login quando não autenticado | verificada |
| `/login` | autenticação | verificada |

### Tela `/login` (anatomia observada)

- Painel esquerdo: logo, `< Back`, título "Welcome to Base44".
- Provedores sociais: **Google**, **Apple**, **GitHub**.
- Separador `OR` + **Continue with email**.
- Fluxo em duas etapas: e-mail → botão "Continue with email" → campo de senha + "Forgot your password?" → "Log in".
- **Cloudflare Turnstile** embutido ("Verifying…"), com erro *"Please complete the security verification"* quando o token não está pronto.
- Erro de credencial: *"Invalid email or password"*.
- Estado de carregamento: *"Logging in…"*.
- Rodapé: Terms of Service, Privacy Policy.
- Painel direito: cartão "72% Account Health" (Healthy / At Risk / Champion), headline "Turn your ideas into apps", colagem visual.
- Observação: a tentativa automatizada de login por e-mail/senha falhou nas duas senhas testadas;
  o widget anti-bot e a validação de credencial são os bloqueios.

## 3. Áreas internas (sidebar do Superagent)

Documentadas em <https://docs.base44.com/Getting-Started/ai-agent>. A URL de cada área não foi
confirmada (exige sessão).

| Área | Função |
|---|---|
| Chat | conversa principal com o agente, anexos, ditado, voz |
| Channels | WhatsApp, Telegram, iMessage, Slack, LINE, Phone |
| Plugins | connectors (Google, Slack, GitHub, Notion, HubSpot…) + skills |
| Workflows | agendados, por gatilho, atividade recente |
| Notes | espaço compartilhado, com a nota fixa "For you" |
| Files | uploads, pastas, arquivos criados pelo agente |
| Memory | fatos duráveis, contexto de trabalho, log diário |
| Data | tabelas (entidades), CRUD inline, export CSV, estrutura, restauração |
| Agent Settings | General (modelos, apps acessíveis, voz, mover, excluir), Trusted people, Sharing & access, Meetings |
| Marketplace / Skill store | catálogo curado de skills |

## 4. Superfícies fora da web

- **App mobile** iOS e Android.
- **Extensão de navegador** para o agente operar no Chrome.
- **API do agente** (conversas, mensagens, memória, envio direto).
- **Webhooks de saída** (`message.created`, `message.completed`).

## 5. Estrutura de URL típica (a confirmar)

Padrões prováveis derivados do próprio `app.base44.com/superagent/{agent_id}`:

```
/superagent/{agent_id}          chat do agente
/apps/{app_id}                  editor de app
/apps/{app_id}/entities/{name}  dados
/apps/{app_id}/workflows        automações
```

Marcadas como **pendente**: só entram no mapa como confirmadas depois de uma sessão autenticada.
