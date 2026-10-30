# Rotas e áreas do produto

Mapa levantado com sessão autenticada em `app.base44.com` (workspace "Pedro's Workspace").
Legenda: **verificada** = aberta e observada · **documentada** = citada na doc oficial ·
**observada** = item visível no menu, URL não confirmada.

## 1. Domínios

| Domínio | Função |
|---|---|
| `base44.com` | site institucional, preços, templates, blog |
| `app.base44.com` | aplicação web (apps, agentes, conectores) |
| `docs.base44.com` | documentação (Docusaurus, expõe `/llms.txt`) |

## 2. Autenticação

`/login` — verificada

- Google, Apple, GitHub ou e-mail + senha.
- Fluxo em duas etapas: e-mail → "Continue with email" → senha → "Log in".
- Cloudflare Turnstile embutido ("Verifying…"); sem token aparece
  *"Please complete the security verification"*.
- Erros: *"Invalid email or password"*; estado *"Logging in…"*.
- Login por Google pede 2FA por notificação no celular ("Verify it's you").
- Redireciona para `/` depois do login.

## 3. Modo Apps (workspace)

Sidebar: Home · Search · All apps · Base Code · Templates · Community · Basecamp ·
Launchpad · Connectors · Partners · Messages · Hire a partner.

| Rota | Tela | Estado |
|---|---|---|
| `/` | Home: "Hi {nome}. What will you build next?" + seletor Auto/Build, apps recentes, templates | verificada |
| `/apps` | Lista de apps, "New folder", "Create app", filtros (owner, status, ordenação) | verificada |
| `/base-code` | Base Code | observada |
| `/app-templates` | Templates | verificada |
| `/connectors` | "Manage connectors", "Add connector", contas conectadas por serviço | verificada |
| `/community`, `/basecamp`, `/launchpad`, `/partners`, `/messages` | áreas da sidebar | observadas |

### `/connectors` (conteúdo observado)

- Cabeçalho "Manage connectors" + botão "Add connector".
- Cartões por provedor com número de contas: `GitHub API (2) — 2 accounts connected`, `Gmail — e-mail`, botão "View".

## 4. Modo Agent (Superagent)

Sidebar: New conversation · Workflows · Plugins · Channels · Notes · Agent Settings · More.

| Rota | Tela | Estado |
|---|---|---|
| `/superagent/{agent_id}` | Chat do agente | verificada |
| `/superagent/{id}/tasks` | **Workflows** (agendados, gatilhos, atividade) | verificada |
| `/superagent/{id}/integrations` | **Plugins**: abas Connectors e Skills | verificada |
| `/superagent/{id}/settings` | **Agent Settings** (modal com abas) | verificada |
| `/superagent/{id}/settings?panel=channels` | **Channels** (abre o painel dentro de settings) | verificada |
| `/superagent/{id}/notes` | Notes | verificada |
| `/superagent/{id}/library` | **Files** (menu More) | verificada |
| `/superagent/{id}/memory` | **Memory** (menu More) | verificada |
| `/superagent/{id}/data` | **Data** (menu More) | verificada |

Observação de arquitetura: **Workflows**, **Notes**, **Files**, **Memory**, **Data** e **Agent Settings**
são rotas próprias; **Channels** é um painel de `settings`. O menu *More* agrupa
Files + Memory + Data.

### Agent Settings — abas

`General` · `Trusted people` · `Credit usage` · `Meetings` · `Security` · `Developer`

Conteúdo de **General**:

- **AI models** (tag *Builder*): Chat e Automations, ambos em `Automatic` por padrão.
- **Cross-app data access**: "All workspace apps" — leitura/atualização/watch; ações interativas
  rodam com as permissões de quem conversa, watches em background rodam como o dono.
- **Voice**: seletor (padrão `Kore`) com botão de preview.
- **Public template link**: botão Share; conectores não vão no clone.
- **Delete this agent**: move para Recently deleted por 30 dias; integrações são desconectadas
  na hora e não voltam ao restaurar.

### Plugins — `/integrations`

- Botão "Add Connector"; abas **Connectors** e **Skills**.
- Cartões sugeridos: Google Calendar, Google Slides, Google Docs, Google Sheets, Google Drive,
  Instagram Business, Google Maps (New), Outlook.
- Bloco **Apps connected** (N): mostra status e escopo, ex.: `Gmail — Active · Read only`,
  `GitHub API — Active`.
- Bloco **Channels** dentro da mesma página.

### Channels — `/settings?panel=channels`

| Canal | Estados vistos |
|---|---|
| WhatsApp | Connected · número mascarado · botão Manage |
| Telegram | "We'll create a private bot for you in one click" |
| iMessage | verificação por código enviado do iPhone/Mac |
| Slack | "@Superagent em um canal e ele responde na thread" |
| Phone | New — provisiona número após verificar o seu |
| Browser extension | Install — agente usa seu navegador |

### Estados vazios observados

- **Notes**: "Create your first note" + "Add new note" + "Build from memory".
- **Files**: "Files uploaded for your agent to use and reference" + "Add New";
  árvore com `.agents`, `base44`, `conversations`.
- **Apps**: "Create your first app" + "Create app" + "Browse templates".
- **Favorites**: "No favorite apps yet. Add your apps for quick access".

### Erro de permissão

Abrir um agente de outro workspace devolve:

> Couldn't load the app — You may not have permission to access it.
> Refresh · Reach out to support

Ou seja: o roteamento é por `agent_id` e o gate de permissão é por workspace.
