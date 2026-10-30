# Habilidades, ferramentas e integrações

Inventário organizado por camada. A fonte é a documentação pública e a lista de capacidades
exposta pela plataforma — nada aqui é código copiado.

## 1. Skills de plataforma (capacidades instrucionais)

| Skill | Para que serve |
|---|---|
| capabilities | índice de capacidades e roteamento entre sub-skills |
| sub-agents | delegação para workers em background |
| chat-experience | compositor, anexos, importação do Drive, sugestões, navegador ao vivo |
| editor-settings | modelo, segurança, docs de dev, clonar/mover/excluir agente |
| sharing | compartilhar chat, colaboração, clone, template público |
| contacting-people | achar contatos, rotas disponíveis, enviar mensagens e convites |
| agent-api | API externa de conversas, mensagens e memória |
| owner-management-api | modelo principal, memória, colaboradores |
| agent-webhooks | webhooks de saída de mensagens |
| automations | automações agendadas, por entidade e por connector |
| workflows | autoria e debug de workflows |
| goals | objetivos duráveis, multi-turno, com aceitação explícita |
| channel-connections | WhatsApp, Telegram, iMessage, Slack, LINE, Phone |
| whatsapp-groups | criação de grupos e link de convite (até 8 números) |
| connectors | OAuth de terceiros |
| workspace | arquivos, bash, regras, secrets, MCP |
| secrets | captura segura de credenciais e env vars |
| knowledge-library | biblioteca de conhecimento, uploads, previews |
| memory-identity | identidade, memória, checkpoints, logs de sessão |
| tool-permissions | auto-aprovação de ferramentas sensíveis |
| data-entities | schemas e CRUD de registros |
| backend-functions | funções HTTP server-side |
| base44-apps | listar, editar, checar e chamar apps do usuário |
| media-files | geração de imagem, upload, URLs assinadas, transcrição |
| voice | ligações em tempo real, seleção de voz, TTS |
| payments / stripe-payments | cobrança, produtos, preços, checkout |
| purchases | compras via Link, cartões temporários, status de pedido |
| browser | automação de navegador (sessão, ações, extração) |
| skills / skill-store | criar, rodar e descobrir skills |
| browser (CDP) | navegação, clique, digitação, screenshots, live view |

## 2. Ferramentas do agente (por família)

**Dados e backend**
- `manage_entity_schemas`, `create_entity_records`, `update_entities`, `delete_entities`, `read_entities`
- `deploy_backend_function`, `test_backend_function`, `delete_backend_function`, `get_backend_function_logs`

**Automação**
- `get_workflow_guide`, `create_or_update_workflow`, `manage_workflow`, `get_workflow_run`
- `configure_email_workflows`, `select_or_create_workflow_webhook`, `request_webhook_sample`

**Comunicação**
- `manage_shared_update`, `manage_superagent_contacts`, `send_message_to_builder`
- `send_image`, `send_whatsapp_voice_message`, `make_phone_call`, `manage_phone`

**Integrações**
- `get_connectors_info`, `get_connector_token`, `enable_connector`, `request_oauth_authorization`
- `call_base44_backend_function`, `call_agent_api`, `read_agent_api`, `set_agent_model`

**Mídia**
- `generate_image`, `upload_file`, `upload_private_file`, `create_file_signed_url`, `transcribe_audio`

**Navegador**
- `navigate`, `click`, `type`, `act`, `observe`, `extract`, `get_content`, `screenshot`, `batch`, `fast_nav`

**Conhecimento**
- `save_memory`, `forget_memory`, `update_identity`, `read_session_log`, `list_sessions`, `search_sessions`, `search_previous_messages`

**Objetivos**
- `manage_goal` (create/read/update/add_tasks), com política `all`, `first_success`, `sequential_fail_fast`, `consensus`

## 3. Connectors (OAuth)

Google (Gmail, Calendar, Drive), Slack, GitHub, Notion, HubSpot, LinkedIn, Outlook, Stripe, entre outros.
Detalhe importante: connector ≠ gatilho. Para **iniciar** um workflow a partir de um evento externo é
preciso um *connector trigger* ou um *webhook*; a maioria dos connectors serve para ações.

## 4. Canais de mensagem

| Canal | Observações |
|---|---|
| WhatsApp | DM e grupos operados pelo agente, modo "smart reply" ou "mention only" |
| Telegram | setup por deep link |
| iMessage | via ponte do sistema |
| Slack | user connector ou instalação de channel |
| LINE | canal de mensagem |
| Phone | número dedicado; limites de 20 ligações/dia e 5/hora |

## 5. Sub-agents

Workers em background, paralelos (até 12 por conversa). Trabalham com escopo restrito: pesquisa,
leitura, análise, escrita de arquivos. Ações de plataforma (builder, entidades, deploys, payments)
ficam com o agente principal.
