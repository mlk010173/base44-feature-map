# Inventário de ferramentas

Lista completa das ferramentas expostas ao agente, agrupadas por família. A coluna **Efeito**
diz o que a chamada mexe no mundo: `—` nada fora da conversa, `dados` grava no backend do app,
`externo` age fora da plataforma.

## 1. Dados e backend

| Ferramenta | O que faz | Efeito |
|---|---|---|
| `manage_entity_schemas` | cria, atualiza, exclui e lista schemas de entidades | dados |
| `create_entity_records` | cria um ou vários registros, inclusive em outro app | dados |
| `update_entities` | atualiza registros por filtro | dados |
| `delete_entities` | apaga registros por filtro | dados |
| `read_entities` | lê com filtro, projeção de campos, ordenação e paginação | — |
| `deploy_backend_function` | publica uma função HTTP server-side | externo |
| `test_backend_function` | executa a função publicada com um payload | externo |
| `delete_backend_function` | remove a função publicada | externo |
| `get_backend_function_logs` | lê os logs de execução | — |

## 2. Automação

| Ferramenta | O que faz | Efeito |
|---|---|---|
| `get_workflow_guide` | referência de autoria, gatilhos e atividades disponíveis | — |
| `create_or_update_workflow` | cria ou substitui a definição de um workflow | dados |
| `manage_workflow` | ativa, pausa, arquiva e restaura | dados |
| `get_workflow_run` | lista execuções e inspeciona passo a passo | — |
| `select_or_create_workflow_webhook` | devolve um listener reutilizável para fonte sem conector | dados |
| `request_webhook_sample` | registra o formato real do payload de um evento | dados |
| `configure_email_workflows` | liga o preset de rotulagem e rascunho de e-mail | externo |

## 3. Pessoas e comunicação

| Ferramenta | O que faz | Efeito |
|---|---|---|
| `manage_shared_update` | cria pedidos, colaborações, respostas, prazos e partes de trabalho | externo |
| `manage_superagent_contacts` | lista contatos, convida, responde convite e remove conexão | externo |
| `send_image` | envia imagem no canal atual | externo |
| `send_whatsapp_voice_message` | gera nota de voz no WhatsApp | externo |
| `show_channel_connection_options` | abre o cartão de conexão de canal | — |
| `make_phone_call` | liga para o dono ou contato autorizado, com meta e informações a coletar | externo |
| `manage_phone` | contatos confiáveis, histórico, transcrição, cota e setup | externo |
| `create_whatsapp_group` / `list_whatsapp_groups` | cria grupo e devolve link de convite; lista grupos operados | externo |

## 4. Apps Base44

| Ferramenta | O que faz | Efeito |
|---|---|---|
| `list_base44_apps` | lista apps do usuário com tipo e entidades | — |
| `send_message_to_builder` | manda um pedido de mudança ao builder do app | externo |
| `get_base44_app_status` | diz se o app está pronto, processando ou com erro | — |
| `call_base44_backend_function` | chama função de outro app do usuário | externo |
| `list_user_apps` | lista apps e o que existe em cada um | — |

## 5. Configuração do próprio agente

| Ferramenta | O que faz | Efeito |
|---|---|---|
| `read_agent_api` | lê ajustes, opções de modelo e colaboradores | — |
| `call_agent_api` | grava ajustes suportados e gerencia co-proprietários | dados |
| `set_agent_model` | troca o modelo principal entre as opções visíveis | dados |
| `update_identity` | reescreve `IDENTITY.md` e `USER.md` | dados |
| `save_memory` / `forget_memory` | grava e remove fatos duráveis | dados |

## 6. Conectores e OAuth

| Ferramenta | O que faz | Efeito |
|---|---|---|
| `get_connectors_info` | status de autorização, escopos e guia de uso | — |
| `get_connector_token` | injeta o token como variável de ambiente no sandbox | — |
| `enable_connector` | pede aprovação do dono para um conector gerenciado | externo |
| `request_oauth_authorization` | abre o fluxo OAuth com escopos mínimos | externo |
| `sequence_connect_oauth` | conecta a conta Sequence do app | externo |

## 7. Mídia e arquivos

| Ferramenta | O que faz | Efeito |
|---|---|---|
| `generate_image` | gera imagem a partir de prompt, com referência opcional | dados |
| `upload_file` | sobe arquivo para storage público e devolve URL | dados |
| `upload_private_file` | sobe para storage privado e devolve URI | dados |
| `create_file_signed_url` | gera link temporário para arquivo privado | — |
| `transcribe_audio` | transcreve áudio de até 25 MB | — |

## 8. Navegador

| Ferramenta | O que faz | Efeito |
|---|---|---|
| `browserbase_get_session` / `browserbase_stop_session` | estado e encerramento da sessão | — |
| `browserbase_get_live_urls` | URLs para acompanhar a sessão ao vivo | — |
| `browserbase_reset_context` | limpa cookies e login salvos | dados |
| `browserbase_navigate` | abre uma URL | externo |
| `browserbase_fast_nav` | encadeia passos mecânicos rumo a um sub-objetivo | externo |
| `browserbase_batch` | até oito passos determinísticos numa chamada | externo |
| `browserbase_observe` | acha elementos acionáveis para um objetivo | — |
| `browserbase_act` | executa uma ação descrita em linguagem natural | externo |
| `browserbase_click` / `browserbase_type` | clique e digitação por seletor | externo |
| `browserbase_get_content` / `browserbase_extract` | texto da página e extração estruturada | — |
| `browserbase_screenshot` | captura visual da página | — |

## 9. Workspace e skills

| Ferramenta | O que faz | Efeito |
|---|---|---|
| `read_file` | lê arquivo do sandbox | — |
| `write_file` | cria ou sobrescreve arquivo | dados |
| `grep` | busca conteúdo por expressão | — |
| `bash` | executa comando no sandbox | dados |
| `run_skill` | executa uma skill de `.agents/skills/` | dados |
| `activate_platform_skill` | carrega instruções detalhadas de uma capacidade | — |

## 10. Delegação e metas

| Ferramenta | O que faz | Efeito |
|---|---|---|
| `sub_agent` | abre workers em background com tarefas independentes | dados |
| `sub_agent_status` / `sub_agent_result` / `sub_agent_stop` | acompanha, lê e encerra um grupo | — |
| `manage_goal` | cria, lê e avança objetivo durável com critérios | dados |

## 11. Web, interface e utilidades

| Ferramenta | O que faz | Efeito |
|---|---|---|
| `web_search` | busca, notícias, vagas, mapas e leitura de página | — |
| `artifacts` | renderiza HTML/SVG no chat | — |
| `ask_clarifying_questions` | apresenta opções e espera a escolha | — |
| `suggest_payments_installation` | propõe a instalação de meios de pagamento | externo |
| `invite_friend` | gera link de convite do Base44 | externo |
| `vent_send_feedback` | manda um relato privado sobre a plataforma | externo |
| `search_previous_messages` | busca nesta conversa, inclusive no que saiu do contexto | — |
| `read_session_log` / `list_sessions` / `search_sessions` | histórico de conversas | — |

## Leitura de risco

- **Só leitura** é seguro rodar em paralelo e repetir.
- **Dados** muda o app: confirme o alvo e prefira operações reversíveis.
- **Externo** sai da plataforma: mensagem, ligação, cobrança, mudança em repositório. Antes de
  repetir uma chamada que falhou, verifique se ela já produziu efeito.
