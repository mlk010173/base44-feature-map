/* Superagente · interface funcional (SPA sem build, estado local no navegador) */
(() => {
'use strict';

/* ============ utilitários ============ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
const brlFull = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

function toast(msg) {
  const root = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; }, 2200);
  setTimeout(() => el.remove(), 2600);
}

function openModal({ title, body, foot = '', onMount }) {
  const root = $('#modalRoot');
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = body;
  $('#modalFoot').innerHTML = foot;
  root.hidden = false;
  document.body.style.overflow = 'hidden';
  if (onMount) onMount(root);
  return root;
}
function closeModal() {
  $('#modalRoot').hidden = true;
  document.body.style.overflow = '';
}

/* ============ estado ============ */
const STORAGE = 'superagente.interface.v1';
let state;
let streaming = false;
let abortFlag = false;
let moreOpen = false;

function seed() {
  const now = Date.now();
  const conv1 = {
    id: 'conv_map', title: 'Mapeamento do Superagente', created: now - 864e5, updated: now - 36e5,
    messages: [
      { id: uid('m'), role: 'user', ts: now - 4e6, text: 'Mapeia as rotas do Superagente e monta o inventário.' },
      { id: uid('m'), role: 'agent', ts: now - 3.9e6, steps: [{ name: 'ler_documentacao', status: 'ok', output: '12 páginas' }],
        text: 'Mapeei 13 rotas. As principais: /superagent/{id} para o chat, /tasks para workflows, /integrations para plugins, /settings para configuração, além de /notes, /library, /memory e /data.\n\nO painel de canais fica dentro de settings, não é rota própria.' },
    ],
  };
  const conv2 = {
    id: 'conv_resumo', title: 'Resumo do dia', created: now - 2 * 864e5, updated: now - 2 * 864e5,
    messages: [
      { id: uid('m'), role: 'user', ts: now - 2 * 864e5, text: 'Resume o que ficou pendente hoje.' },
      { id: uid('m'), role: 'agent', ts: now - 2 * 864e5 + 6e4, steps: [],
        text: 'Três pendências: revisar a issue #81, confirmar o horário da reunião de sexta e publicar o relatório semanal.' },
    ],
  };

  return {
    version: 1,
    dismissed: { setup: false },
    user: { name: 'Bilogao G', initials: 'BG', workspace: 'Meu workspace', notifications: 2 },
    agent: {
      name: 'Superagente',
      models: { chat: 'auto', automations: 'auto' },
      voice: 'Kore',
      crossApp: 'all',
      templateLink: null,
      credits: { total: 25, used: 18 },
    },
    conversations: [conv1, conv2],
    activeConversation: 'conv_map',
    workflows: [
      { id: 'wf1', name: 'Resumo diário do Gmail', trigger: 'Agenda', detail: 'Todos os dias às 08:00', active: true, runs: [{ id: uid('r'), ts: now - 36e5, status: 'ok', ms: 4200 }] },
      { id: 'wf2', name: 'Ronda de issues no GitHub', trigger: 'Agenda', detail: 'Seg a sex, 09:00 e 18:00', active: true, runs: [{ id: uid('r'), ts: now - 72e5, status: 'ok', ms: 8100 }, { id: uid('r'), ts: now - 9e7, status: 'ok', ms: 7600 }] },
      { id: 'wf3', name: 'Relatório semanal', trigger: 'Agenda', detail: 'Sexta às 17:00', active: false, runs: [] },
    ],
    connectors: [
      { id: 'github', name: 'GitHub API', desc: 'Repositórios, issues e pull requests', status: 'active', scope: 'leitura e escrita' },
      { id: 'gmail', name: 'Gmail', desc: 'Ler e enviar e-mail', status: 'active', scope: 'somente leitura' },
      { id: 'gcal', name: 'Google Calendar', desc: 'Agenda e eventos', status: 'off', scope: '' },
      { id: 'gdrive', name: 'Google Drive', desc: 'Arquivos e pastas', status: 'off', scope: '' },
      { id: 'gsheets', name: 'Google Sheets', desc: 'Planilhas', status: 'off', scope: '' },
      { id: 'slack', name: 'Slack', desc: 'Mensagens e canais', status: 'off', scope: '' },
      { id: 'outlook', name: 'Outlook', desc: 'E-mail e calendário', status: 'off', scope: '' },
    ],
    skills: [
      { id: 'sk1', name: 'resumo-de-email', desc: 'Agrupa threads não lidas por prioridade.', on: true },
      { id: 'sk2', name: 'relatorio-semanal', desc: 'Monta o relatório de sexta a partir das notas.', on: true },
      { id: 'sk3', name: 'publicar-no-repo', desc: 'Commit e push de arquivos gerados.', on: true },
      { id: 'sk4', name: 'conferir-issues', desc: 'Compara IDs de agentes em issues abertas.', on: false },
      { id: 'sk5', name: 'transcrever-audio', desc: 'Converte áudio recebido em texto.', on: false },
    ],
    channels: [
      { id: 'whatsapp', name: 'WhatsApp', desc: 'Atende e responde direto no aplicativo.', status: 'connected', detail: '+55 27 9••••-4558' },
      { id: 'telegram', name: 'Telegram', desc: 'Cria um bot privado em um clique.', status: 'off', detail: '' },
      { id: 'imessage', name: 'iMessage', desc: 'Conversa a partir de qualquer aparelho Apple.', status: 'off', detail: '' },
      { id: 'slack', name: 'Slack', desc: 'Responde na thread quando é mencionado.', status: 'off', detail: '' },
      { id: 'phone', name: 'Telefone', desc: 'Número dedicado para ligações.', status: 'off', detail: '' },
      { id: 'browser', name: 'Extensão de navegador', desc: 'Usa o seu navegador para navegar e preencher formulários.', status: 'off', detail: '' },
    ],
    notes: [
      { id: 'n1', title: 'Rotas do Superagente', body: 'Chat: /superagent/{id}\nWorkflows: /tasks\nPlugins: /integrations\nConfigurações: /settings (canais são um painel dentro dela)', updated: now - 864e5 },
      { id: 'n2', title: 'Backlog da semana', body: '1. Fechar o inventário de rotas\n2. Publicar o relatório\n3. Revisar créditos do plano', updated: now - 36e5 },
    ],
    files: [
      { id: 'f1', path: '.agents/rules', name: 'estilo-de-resposta.md', size: '2,1 kB' },
      { id: 'f2', path: '.agents/skills', name: 'resumo-de-email.sh', size: '880 B' },
      { id: 'f3', path: 'base44/entities', name: 'Contatos.jsonc', size: '420 B' },
      { id: 'f4', path: 'conversations', name: 'README.md', size: '310 B' },
    ],
    memories: [
      { id: 'mem1', category: 'Pessoas', text: 'Prefere respostas curtas e diretas, sem rodeios.' },
      { id: 'mem2', category: 'Trabalho', text: 'Mantém um repositório de documentação no GitHub (mlk010173).' },
      { id: 'mem3', category: 'Rotina', text: 'Costuma trabalhar à noite, fuso America/Sao_Paulo.' },
      { id: 'mem4', category: 'Preferências', text: 'Gosta de tabelas comparativas quando há muitas opções.' },
    ],
    entities: [
      { id: 'e1', name: 'Contatos', fields: ['nome', 'canal', 'contato'], records: [
        { id: uid('rec'), nome: 'Ana Prado', canal: 'WhatsApp', contato: '+55 27 99999-1122' },
        { id: uid('rec'), nome: 'Diego Lima', canal: 'E-mail', contato: 'diego@exemplo.com' },
      ] },
      { id: 'e2', name: 'Tarefas', fields: ['titulo', 'status', 'prazo'], records: [
        { id: uid('rec'), titulo: 'Revisar issue #81', status: 'em andamento', prazo: '30/10' },
        { id: uid('rec'), titulo: 'Publicar relatório', status: 'pendente', prazo: '31/10' },
        { id: uid('rec'), titulo: 'Fechar inventário', status: 'concluída', prazo: '29/10' },
      ] },
    ],
    trusted: [
      { id: 't1', name: 'Ana Prado', contact: '+55 27 99999-1122', channel: 'WhatsApp' },
      { id: 't2', name: 'Diego Lima', contact: 'diego@exemplo.com', channel: 'E-mail' },
    ],
    meetings: [{ id: 'mt1', title: 'Alinhamento semanal', when: 'Sexta, 16:00', duration: '30 min' }],
    security: { requireApproval: true, blockPayments: true, logActions: true },
    developer: { apiKey: null },
    usage: [{ d: 'Seg', n: 3 }, { d: 'Ter', n: 5 }, { d: 'Qua', n: 2 }, { d: 'Qui', n: 4 }, { d: 'Sex', n: 4 }],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return seed();
    const parsed = JSON.parse(raw);
    return Object.assign(seed(), parsed);
  } catch { return seed(); }
}
function save() {
  try {
    state.ui = { moreOpen };
    localStorage.setItem(STORAGE, JSON.stringify(state));
  } catch {}
}
const creditsLeft = () => Math.max(0, state.agent.credits.total - state.agent.credits.used);
const activeConv = () => state.conversations.find((c) => c.id === state.activeConversation) || state.conversations[0];

/* ============ sidebar ============ */
function computeSetup() {
  const steps = [
    !!state.channels.find((c) => c.status === 'connected'),
    state.connectors.some((c) => c.status === 'active'),
    state.workflows.some((w) => w.active),
    state.notes.length > 0,
    state.agent.models.chat !== 'auto' || state.agent.voice !== 'Kore' || state.agent.crossApp !== 'all',
  ];
  return { done: steps.filter(Boolean).length, total: steps.length };
}

function renderChrome() {
  const left = creditsLeft();
  $('#userName').textContent = state.user.name;
  $('#userInitials').textContent = state.user.initials;
  $('#userWorkspace').textContent = state.user.workspace;
  $('#bellCount').textContent = state.user.notifications;
  $('#bellCount').style.display = state.user.notifications ? '' : 'none';

  $('#countTasks').textContent = state.workflows.filter((w) => w.active).length;
  $('#countPlugins').textContent = state.connectors.filter((c) => c.status === 'active').length;
  $('#countNotes').textContent = state.notes.length;
  $('#countFiles').textContent = state.files.length;
  $('#countMemory').textContent = state.memories.length;
  $('#countData').textContent = state.entities.reduce((a, e) => a + e.records.length, 0);

  const pill = $('#creditPill');
  pill.textContent = left === 0 ? 'sem créditos' : left + (left === 1 ? ' crédito' : ' créditos');
  pill.className = 'pill' + (left === 0 ? ' out' : left <= 5 ? ' low' : '');

  $('#planLine').textContent = state.agent.credits.used + ' de ' + state.agent.credits.total + ' usados';
  $('#planBar').style.width = Math.min(100, (state.agent.credits.used / state.agent.credits.total) * 100) + '%';

  const st = computeSetup();
  $('#setupProgressText').textContent = st.done + ' de ' + st.total + ' concluídos';
  $('#setupBar').style.width = (st.done / st.total) * 100 + '%';
  $('#setupCard').style.display = state.dismissed.setup ? 'none' : '';

  const list = state.conversations
    .slice()
    .sort((a, b) => b.updated - a.updated)
    .map((c) => `<button class="conv ${c.id === state.activeConversation ? 'on' : ''}" data-act="openConv" data-id="${c.id}" role="listitem">
        <b>${esc(c.title)}</b><span>${brl.format(c.updated)}</span>
      </button>`)
    .join('');
  $('#conversations').innerHTML = list || '<p class="empty-mini">Nenhuma conversa ainda.</p>';

  $$('.nav-item').forEach((b) => {
    const v = b.dataset.view;
    if (v) b.classList.toggle('on', currentView() === v && !b.dataset.new);
  });
  if (state.ui) { moreOpen = !!state.ui.moreOpen; syncMore(); }
}

/* ============ roteador ============ */
const views = {};
const TITLES = {
  chat: ['Superagente', 'Pronto para ajudar'],
  tasks: ['Workflows', 'Agendamentos, gatilhos e execuções'],
  integrations: ['Plugins', 'Conectores e skills do agente'],
  channels: ['Canais', 'Onde o agente atende'],
  notes: ['Notas', 'Conhecimento compartilhado'],
  library: ['Arquivos', 'Arquivos do agente'],
  memory: ['Memória', 'Fatos que o agente guarda'],
  data: ['Dados', 'Tabelas do agente'],
  settings: ['Configurações do agente', 'Modelos, permissões e plano'],
};
function currentView() {
  const h = location.hash.replace('#/', '').split('?')[0];
  return views[h] ? h : 'chat';
}
function go(view) {
  if (location.hash !== '#/' + view) location.hash = '#/' + view;
  else render();
}
function render() {
  const v = currentView();
  const [t, s] = TITLES[v] || TITLES.chat;
  $('#pageTitle').textContent = t;
  $('#pageSub').textContent = s;
  renderChrome();
  views[v]();
}

/* ============ view: chat ============ */
function chatEmptyHTML() {
  return `<div class="chat-empty">
    <h2>Como posso ajudar hoje?</h2>
    <p>Pergunte sobre o seu workspace, peça um resumo do dia ou peça para eu executar um workflow.</p>
    <div class="suggestions">
      <button class="suggestion" data-act="suggest" data-text="Resume o que está pendente para hoje.">Resume as pendências de hoje</button>
      <button class="suggestion" data-act="suggest" data-text="Quais conectores estão ativos e com qual escopo?">Quais conectores estão ativos?</button>
      <button class="suggestion" data-act="suggest" data-text="Cria uma nota com o plano da semana.">Cria uma nota com o plano da semana</button>
    </div>
  </div>`;
}

views.chat = function () {
  const conv = activeConv();
  const msgs = conv ? conv.messages : [];
  $('#view').innerHTML = `
    <div class="chat">
      <div class="chat-scroll" id="chatScroll">
        <div class="chat-inner" id="messages">
          ${msgs.length ? '' : chatEmptyHTML()}
        </div>
      </div>
      <div class="composer-wrap">
        <div id="creditsBanner"></div>
        <form class="composer" id="composer">
          <textarea id="input" rows="1" placeholder="Escreva uma mensagem..." aria-label="Mensagem para o agente"></textarea>
          <div class="composer-bar">
            <button type="button" class="icon-round" data-act="attach" title="Anexar arquivo" aria-label="Anexar arquivo">
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <select class="model-select" id="modelSel" aria-label="Modelo de chat" title="Modelo de chat">
              <option value="auto">Auto</option>
              <option value="rapido">Rápido</option>
              <option value="avancado">Avançado</option>
              <option value="raciocinio">Raciocínio</option>
            </select>
            <button type="button" class="icon-round" data-act="mic" title="Ditado por voz" aria-label="Ditado por voz">
              <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
            </button>
            <button type="button" class="icon-round" data-act="voice" title="Modo voz" aria-label="Modo voz">
              <svg viewBox="0 0 24 24"><path d="M4 12h2M8 8v8M12 5v14M16 8v8M20 12h-2"/></svg>
            </button>
            <button type="submit" class="send" id="sendBtn">
              <span id="sendLabel">Enviar</span>
              <svg viewBox="0 0 24 24"><path d="M5 12h13M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </form>
        <p class="hint">Enter envia · Shift + Enter quebra a linha · interface local de demonstração</p>
      </div>
    </div>`;

  $('#modelSel').value = state.agent.models.chat;
  $('#modelSel').addEventListener('change', (e) => {
    state.agent.models.chat = e.target.value;
    save();
    toast('Modelo de chat: ' + e.target.options[e.target.selectedIndex].text);
    renderChrome();
  });

  const form = $('#composer');
  const input = $('#input');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (streaming) { abortFlag = true; return; }
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    sendMessage(text);
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(180, input.scrollHeight) + 'px';
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  renderMessages(true);
  renderBanner();
  if (msgs.length) requestAnimationFrame(() => { const s = $('#chatScroll'); s.scrollTop = s.scrollHeight; });
};

function renderBanner() {
  const box = $('#creditsBanner');
  if (!box) return;
  const left = creditsLeft();
  if (left > 0) { box.innerHTML = ''; return; }
  box.innerHTML = `<div class="credits-banner">
      <div>
        <strong>Você está sem créditos</strong>
        <span>O plano renova em 3 dias. Faça upgrade para liberar créditos agora.</span>
      </div>
      <button class="btn primary tiny" data-act="upgrade">Ver planos</button>
    </div>`;
}

function messageHTML(m) {
  const isUser = m.role === 'user';
  const steps = (m.steps || []).map((s) => `
    <div class="step ${s.status === 'running' ? 'running' : 'ok'}">
      <i class="dot"></i><span>${esc(s.name)}</span>${s.output ? `<span style="opacity:.7">· ${esc(s.output)}</span>` : ''}
    </div>`).join('');
  return `<article class="msg ${isUser ? 'user' : 'agent'}">
      <div class="msg-head">
        <span class="who-badge">${isUser ? esc(state.user.initials) : 'S'}</span>
        <b>${isUser ? esc(state.user.name) : esc(state.agent.name)}</b>
        <span>· ${hora.format(new Date(m.ts))}</span>
      </div>
      ${steps ? `<div class="steps">${steps}</div>` : ''}
      <div class="msg-body">${esc(m.text)}${m.cursor ? '<i class="caret"></i>' : ''}</div>
    </article>`;
}

function renderMessages(force) {
  const box = $('#messages');
  if (!box) return;
  const conv = activeConv();
  if (!conv || !conv.messages.length) { box.innerHTML = chatEmptyHTML(); return; }
  const scroll = $('#chatScroll');
  const nearBottom = !scroll || scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 140;
  box.innerHTML = conv.messages.map(messageHTML).join('') + (streaming && !streamingHasText() ? thinkingHTML() : '');
  if (nearBottom || force) scrollToBottom();
}
function streamingHasText() {
  const conv = activeConv();
  const last = conv && conv.messages[conv.messages.length - 1];
  return !!(last && last.role === 'agent' && last.text);
}
function thinkingHTML() {
  return `<div class="thinking"><i class="spin"></i> Pensando...</div>`;
}
function scrollToBottom() {
  const s = $('#chatScroll');
  if (s) s.scrollTop = s.scrollHeight;
}

function setSendState() {
  const btn = $('#sendBtn');
  const label = $('#sendLabel');
  if (!btn) return;
  btn.classList.toggle('stop', streaming);
  label.textContent = streaming ? 'Parar' : 'Enviar';
}

function composeReply(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('pendência') || p.includes('pendente') || p.includes('hoje')) {
    return 'Três coisas para hoje:\n\n1. Revisar a issue #81 e confirmar se apareceu algum ID novo de agente.\n2. Fechar o inventário de rotas no repositório.\n3. Confirmar o horário do alinhamento de sexta, às 16h.\n\nQuer que eu já execute o workflow de ronda do GitHub?';
  }
  if (p.includes('conector') || p.includes('plugin')) {
    const on = state.connectors.filter((c) => c.status === 'active');
    const linhas = on.map((c) => '- ' + c.name + ' (' + c.scope + ')').join('\n');
    return `Estão ativos ${on.length} conectores:\n\n${linhas}\n\nOs demais aparecem como disponíveis em Plugins e eu só uso depois que você autorizar.`;
  }
  if (p.includes('nota') || p.includes('plano')) {
    state.notes.unshift({ id: uid('n'), title: 'Plano da semana', body: 'Segunda: revisar issues\nQuarta: consolidar relatório\nSexta: enviar resumo', updated: Date.now() });
    save();
    renderChrome();
    return 'Criei a nota "Plano da semana" com três blocos: revisão de issues, consolidação do relatório e envio do resumo na sexta. Ela já está em Notas para você editar.';
  }
  if (p.includes('workflow') || p.includes('agenda')) {
    const ativos = state.workflows.filter((w) => w.active).length;
    return `Você tem ${ativos} workflow(s) ativos. O de resumo do Gmail roda todo dia às 08:00 e o de ronda do GitHub roda em dias úteis às 09:00 e às 18:00. O relatório semanal está pausado: posso reativar quando quiser.`;
  }
  return 'Entendi. Consigo agir em quatro frentes por aqui: consultar o que está salvo (notas, memória, dados), executar workflows, falar com pessoas pelos canais conectados e montar documentos.\n\nMe diga o resultado que você quer e eu escolho o caminho.';
}

async function sendMessage(text) {
  if (creditsLeft() <= 0) {
    toast('Sem créditos para enviar. Abra os planos para continuar.');
    renderBanner();
    return;
  }
  const conv = activeConv();
  conv.messages.push({ id: uid('m'), role: 'user', ts: Date.now(), text });
  if (conv.title === 'Nova conversa') conv.title = text.slice(0, 46);
  conv.updated = Date.now();
  state.agent.credits.used = Math.min(state.agent.credits.total, state.agent.credits.used + 1);
  save();
  renderChrome();
  renderMessages(true);
  renderBanner();
  await streamReply(conv, text);
}

async function streamReply(conv, prompt) {
  streaming = true;
  abortFlag = false;
  setSendState();
  const msg = { id: uid('m'), role: 'agent', ts: Date.now(), text: '', steps: [], cursor: true };
  conv.messages.push(msg);
  renderMessages();

  await sleep(650);
  if (abortFlag) return finishStream(conv, msg, 'Interrompido.');

  const step = { name: 'buscar_contexto', status: 'running' };
  msg.steps.push(step);
  renderMessages();
  await sleep(950);
  if (abortFlag) return finishStream(conv, msg, 'Interrompido.');
  step.status = 'ok';
  step.output = 'notas e memória';
  renderMessages();

  const reply = composeReply(prompt);
  for (const chunk of reply.match(/(\S+\s*|\s+)/g) || []) {
    if (abortFlag) break;
    msg.text += chunk;
    renderMessages();
    await sleep(22 + Math.random() * 30);
  }

  if (!abortFlag) {
    msg.steps.push({ name: 'responder', status: 'ok', output: 'concluído' });
  }
  finishStream(conv, msg);
}

function finishStream(conv, msg, forced) {
  if (forced) msg.text = msg.text ? msg.text + '\n\n' + forced : forced;
  msg.cursor = false;
  streaming = false;
  abortFlag = false;
  conv.updated = Date.now();
  save();
  setSendState();
  renderMessages();
  renderChrome();
}

/* ============ view: workflows ============ */
views.tasks = function () {
  const rows = state.workflows.map((w) => `
    <div class="row">
      <div class="stack">
        <b>${esc(w.name)}</b>
        <span>${esc(w.trigger)} · ${esc(w.detail)}</span>
        <span>${w.runs.length ? 'Última execução ' + brl.format(w.runs[0].ts) + ' · ' + (w.runs[0].ms / 1000).toFixed(1) + 's' : 'Nunca executado'}</span>
      </div>
      <div class="side">
        <span class="badge ${w.active ? 'ok' : 'off'}">${w.active ? 'ativo' : 'pausado'}</span>
        <button class="toggle ${w.active ? 'on' : ''}" data-act="toggleWorkflow" data-id="${w.id}" aria-label="Ativar ou pausar ${esc(w.name)}"><i></i></button>
        <button class="btn tiny" data-act="runWorkflow" data-id="${w.id}">Executar</button>
        <button class="btn tiny ghost" data-act="delWorkflow" data-id="${w.id}" aria-label="Excluir ${esc(w.name)}">Excluir</button>
      </div>
    </div>`).join('');

  $('#view').innerHTML = `<div class="view-inner">
      <div class="section-head">
        <div><h2>Workflows</h2><p>Agendamentos e gatilhos que executam sozinhos. ${state.workflows.filter((w) => w.active).length} ativos.</p></div>
        <button class="btn primary" data-act="newWorkflow">Novo workflow</button>
      </div>
      <div class="list">${rows || '<div class="empty"><strong>Nenhum workflow</strong><p>Crie o primeiro para o agente trabalhar sozinho.</p></div>'}</div>
      <div class="card" style="margin-top:16px">
        <h3>Últimas execuções</h3>
        <p class="sub">Histórico das execuções registradas.</p>
        <div class="table-wrap" style="margin-top:10px">
          <table><thead><tr><th>Workflow</th><th>Quando</th><th>Status</th><th>Duração</th></tr></thead><tbody>
          ${state.workflows.flatMap((w) => w.runs.map((r) => `<tr><td>${esc(w.name)}</td><td>${brlFull.format(r.ts)} ${hora.format(r.ts)}</td><td><span class="badge ok">${r.status}</span></td><td>${(r.ms / 1000).toFixed(1)}s</td></tr>`)).join('') || '<tr><td colspan="4" style="color:var(--muted)">Nada por aqui ainda.</td></tr>'}
          </tbody></table>
        </div>
      </div>
    </div>`;
};

/* ============ view: plugins ============ */
let pluginsTab = 'connectors';
views.integrations = function () {
  const conn = state.connectors.map((c) => `
    <div class="row">
      <div class="stack"><b>${esc(c.name)}</b><span>${esc(c.desc)}${c.status === 'active' ? ' · ' + esc(c.scope) : ''}</span></div>
      <div class="side">
        <span class="badge ${c.status === 'active' ? 'ok' : 'off'}">${c.status === 'active' ? 'ativo' : 'disponível'}</span>
        ${c.status === 'active'
          ? `<button class="btn tiny" data-act="disconnect" data-id="${c.id}">Desconectar</button>`
          : `<button class="btn tiny primary" data-act="connect" data-id="${c.id}">Conectar</button>`}
      </div>
    </div>`).join('');

  const skills = state.skills.map((s) => `
    <div class="row">
      <div class="stack"><b>${esc(s.name)}</b><span>${esc(s.desc)}</span></div>
      <div class="side"><button class="toggle ${s.on ? 'on' : ''}" data-act="toggleSkill" data-id="${s.id}" aria-label="Ativar ${esc(s.name)}"><i></i></button></div>
    </div>`).join('');

  $('#view').innerHTML = `<div class="view-inner">
      <div class="section-head">
        <div><h2>Plugins</h2><p>${state.connectors.filter((c) => c.status === 'active').length} conectores ativos · ${state.skills.filter((s) => s.on).length} skills ligadas</p></div>
        <button class="btn primary" data-act="addConnector">Adicionar conector</button>
      </div>
      <div class="tabs">
        <button class="tab ${pluginsTab === 'connectors' ? 'on' : ''}" data-act="pluginsTab" data-tab="connectors">Conectores</button>
        <button class="tab ${pluginsTab === 'skills' ? 'on' : ''}" data-act="pluginsTab" data-tab="skills">Skills</button>
      </div>
      <div class="list">${pluginsTab === 'connectors' ? conn : skills}</div>
      <div class="card" style="margin-top:16px">
        <h3>Como o agente usa isso</h3>
        <p class="sub">Conectores dão acesso a serviços externos. Skills são rotinas próprias que o agente executa quando precisa. Ações que mudam algo fora daqui sempre pedem a sua confirmação.</p>
      </div>
    </div>`;
};

/* ============ view: canais ============ */
views.channels = function () {
  const rows = state.channels.map((c) => `
    <div class="row">
      <div class="stack"><b>${esc(c.name)}</b><span>${esc(c.desc)}</span>${c.detail ? `<span class="mono">${esc(c.detail)}</span>` : ''}</div>
      <div class="side">
        <span class="badge ${c.status === 'connected' ? 'ok' : 'off'}">${c.status === 'connected' ? 'conectado' : 'desconectado'}</span>
        ${c.status === 'connected'
          ? `<button class="btn tiny" data-act="chanManage" data-id="${c.id}">Gerenciar</button>`
          : `<button class="btn tiny primary" data-act="chanConnect" data-id="${c.id}">Conectar</button>`}
      </div>
    </div>`).join('');
  $('#view').innerHTML = `<div class="view-inner">
      <div class="section-head"><div><h2>Canais</h2><p>Onde o agente atende as pessoas. Um canal conectado já pode receber e responder mensagens.</p></div></div>
      <div class="list">${rows}</div>
    </div>`;
};

/* ============ view: notas ============ */
let noteQuery = '';
views.notes = function () {
  const q = noteQuery.toLowerCase();
  const list = state.notes.filter((n) => !q || (n.title + ' ' + n.body).toLowerCase().includes(q));
  $('#view').innerHTML = `<div class="view-inner">
      <div class="section-head">
        <div><h2>Notas</h2><p>Conhecimento compartilhado entre você e o agente.</p></div>
        <button class="btn primary" data-act="newNote">Nova nota</button>
      </div>
      <div class="toolbar">
        <input type="text" id="noteSearch" placeholder="Buscar nas notas" value="${esc(noteQuery)}" style="max-width:280px">
      </div>
      ${list.length ? `<div class="note-list">${list.map((n) => `
        <button class="note" data-act="openNote" data-id="${n.id}">
          <b>${esc(n.title)}</b>
          <p>${esc(n.body)}</p>
          <span>${brlFull.format(n.updated)}</span>
        </button>`).join('')}</div>`
      : `<div class="empty"><strong>${q ? 'Nada encontrado' : 'Crie a primeira nota'}</strong>
          <p>${q ? 'Tente outro termo.' : 'Escreva você mesmo ou peça ao agente para montar a partir da memória.'}</p>
          ${q ? '' : '<button class="btn primary tiny" data-act="newNote">Nova nota</button>'}</div>`}
    </div>`;
  const inp = $('#noteSearch');
  if (inp) inp.addEventListener('input', (e) => { noteQuery = e.target.value; views.notes(); setTimeout(() => { const i = $('#noteSearch'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); });
};

/* ============ view: arquivos ============ */
views.library = function () {
  const dirs = [...new Set(state.files.map((f) => f.path))];
  const tree = dirs.map((d) => `
    <div class="dir"><b>${esc(d)}</b>
      ${state.files.filter((f) => f.path === d).map((f) => `
        <div class="file">
          <svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/></svg>
          <span class="name">${esc(f.name)}</span>
          <span class="size">${esc(f.size)}</span>
          <button class="icon-btn bare" data-act="delFile" data-id="${f.id}" aria-label="Remover ${esc(f.name)}">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>`).join('')}
    </div>`).join('');
  $('#view').innerHTML = `<div class="view-inner">
      <div class="section-head">
        <div><h2>Arquivos</h2><p>Arquivos que o agente pode abrir e citar. ${state.files.length} itens.</p></div>
        <button class="btn primary" data-act="addFile">Adicionar arquivo</button>
      </div>
      ${state.files.length ? `<div class="card tree">${tree}</div>`
      : `<div class="empty"><strong>Nenhum arquivo</strong><p>Adicione regras, skills ou documentos para o agente consultar.</p></div>`}
    </div>`;
};

/* ============ view: memória ============ */
let memQuery = '';
views.memory = function () {
  const q = memQuery.toLowerCase();
  const cats = [...new Set(state.memories.map((m) => m.category))];
  const groups = cats.map((c) => {
    const items = state.memories.filter((m) => m.category === c && (!q || m.text.toLowerCase().includes(q)));
    if (!items.length) return '';
    return `<div class="card">
      <h3>${esc(c)}</h3>
      <div class="list" style="margin-top:10px">
        ${items.map((m) => `<div class="row" style="border:0;padding:8px 0;background:transparent">
          <div class="stack"><span style="color:var(--text);font-size:13.5px">${esc(m.text)}</span></div>
          <button class="icon-btn bare" data-act="delMemory" data-id="${m.id}" aria-label="Esquecer">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
  $('#view').innerHTML = `<div class="view-inner">
      <div class="section-head">
        <div><h2>Memória</h2><p>Fatos que sobrevivem entre conversas. ${state.memories.length} registros.</p></div>
        <button class="btn primary" data-act="addMemory">Adicionar fato</button>
      </div>
      <div class="toolbar"><input type="text" id="memSearch" placeholder="Buscar na memória" value="${esc(memQuery)}" style="max-width:280px"></div>
      ${groups || `<div class="empty"><strong>Nada na memória</strong><p>Fale um fato ou adicione manualmente.</p></div>`}
    </div>`;
  const inp = $('#memSearch');
  if (inp) inp.addEventListener('input', (e) => { memQuery = e.target.value; views.memory(); setTimeout(() => { const i = $('#memSearch'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); });
};

/* ============ view: dados ============ */
let entityId = null;
views.data = function () {
  const ent = state.entities.find((e) => e.id === entityId) || state.entities[0];
  if (ent) entityId = ent.id;
  const table = ent ? `
    <div class="table-wrap">
      <table>
        <thead><tr><th style="width:40px"></th>${ent.fields.map((f) => `<th>${esc(f)}</th>`).join('')}</tr></thead>
        <tbody>
          ${ent.records.map((r) => `<tr>
            <td><button class="icon-btn bare" data-act="delRecord" data-ent="${ent.id}" data-id="${r.id}" aria-label="Excluir registro">
              <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></td>
            ${ent.fields.map((f) => `<td>${esc(r[f] ?? '')}</td>`).join('')}
          </tr>`).join('') || `<tr><td colspan="${ent.fields.length + 1}" style="color:var(--muted)">Sem registros.</td></tr>`}
        </tbody>
      </table>
    </div>` : '<div class="empty"><strong>Nenhuma tabela</strong><p>Crie uma tabela para guardar dados do agente.</p></div>';

  $('#view').innerHTML = `<div class="view-inner">
      <div class="section-head">
        <div><h2>Dados</h2><p>Tabelas do agente. Cada registro ganha id, data de criação e autor.</p></div>
        <div class="side" style="display:flex;gap:8px">
          <button class="btn" data-act="newEntity">Nova tabela</button>
          <button class="btn primary" data-act="addRecord" ${ent ? '' : 'disabled'}>Novo registro</button>
        </div>
      </div>
      ${state.entities.length > 1 ? `<div class="toolbar">${state.entities.map((e) => `<button class="btn tiny ${e.id === entityId ? 'primary' : ''}" data-act="pickEntity" data-id="${e.id}">${esc(e.name)} <span style="opacity:.7">${e.records.length}</span></button>`).join('')}</div>` : ''}
      ${table}
      <div class="card" style="margin-top:16px">
        <h3>Isolamento por dono</h3>
        <p class="sub">Com RLS ligado, cada pessoa só enxerga os próprios registros. Administradores veem tudo.</p>
      </div>
    </div>`;
};

/* ============ view: configurações ============ */
let settingsTab = 'general';
views.settings = function () {
  const tabs = ['general', 'trusted', 'credits', 'meetings', 'security', 'developer'];
  const labels = { general: 'Geral', trusted: 'Pessoas de confiança', credits: 'Uso de créditos', meetings: 'Reuniões', security: 'Segurança', developer: 'Desenvolvedor' };
  let body = '';

  if (settingsTab === 'general') {
    const opt = (v, t, cur) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${t}</option>`;
    body = `
      <div class="card">
        <h3>Modelos de IA</h3>
        <p class="sub">Escolha por contexto. Automático decide o melhor modelo por tarefa.</p>
        <div class="grid two" style="margin-top:12px">
          <div class="field"><label for="mChat">Chat</label>
            <select id="mChat">${opt('auto', 'Automático', state.agent.models.chat)}${opt('rapido', 'Rápido', state.agent.models.chat)}${opt('avancado', 'Avançado', state.agent.models.chat)}${opt('raciocinio', 'Raciocínio', state.agent.models.chat)}</select>
          </div>
          <div class="field"><label for="mAuto">Automações</label>
            <select id="mAuto">${opt('auto', 'Automático', state.agent.models.automations)}${opt('rapido', 'Rápido', state.agent.models.automations)}${opt('avancado', 'Avançado', state.agent.models.automations)}</select>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Acesso entre apps</h3>
        <p class="sub">Ações interativas rodam com as permissões de quem conversa. Rotinas em background rodam como o dono.</p>
        <div class="field" style="margin-top:12px;max-width:320px">
          <label for="crossApp">Escopo</label>
          <select id="crossApp">
            <option value="all" ${state.agent.crossApp === 'all' ? 'selected' : ''}>Todos os apps do workspace</option>
            <option value="agent" ${state.agent.crossApp === 'agent' ? 'selected' : ''}>Somente este agente</option>
            <option value="none" ${state.agent.crossApp === 'none' ? 'selected' : ''}>Nenhum</option>
          </select>
        </div>
      </div>

      <div class="card">
        <h3>Voz</h3>
        <p class="sub">Voz usada quando o agente fala.</p>
        <div class="inline" style="margin-top:12px;max-width:420px">
          <select id="voice">${opt('Kore', 'Kore', state.agent.voice)}${opt('Puck', 'Puck', state.agent.voice)}${opt('Charon', 'Charon', state.agent.voice)}${opt('Fenrir', 'Fenrir', state.agent.voice)}</select>
          <button class="btn tiny" data-act="voicePreview">Ouvir</button>
        </div>
      </div>

      <div class="card">
        <h3>Link de template público</h3>
        <p class="sub">Gera um link para qualquer pessoa criar uma cópia deste agente. Conectores não vão junto.</p>
        <div class="inline" style="margin-top:12px">
          <input type="text" readonly value="${state.agent.templateLink ? esc(state.agent.templateLink) : 'Nenhum link gerado'}" id="tplInput">
          <button class="btn tiny primary" data-act="makeTemplate">${state.agent.templateLink ? 'Gerar novo' : 'Compartilhar'}</button>
        </div>
      </div>

      <div class="card">
        <h3>Excluir agente</h3>
        <p class="sub">Vai para a lixeira por 30 dias. Integrações são desconectadas na hora e não voltam ao restaurar.</p>
        <button class="btn tiny danger" data-act="deleteAgent" style="margin-top:10px">Excluir este agente</button>
      </div>`;
  }

  if (settingsTab === 'trusted') {
    body = `<div class="card">
        <div class="section-head" style="margin-bottom:10px"><div><h3>Pessoas de confiança</h3><p class="sub">Podem falar com o agente pelos canais conectados.</p></div>
        <button class="btn tiny primary" data-act="addTrusted">Adicionar</button></div>
        <div class="list">${state.trusted.map((t) => `<div class="row"><div class="stack"><b>${esc(t.name)}</b><span>${esc(t.contact)} · ${esc(t.channel)}</span></div>
        <button class="btn tiny ghost" data-act="delTrusted" data-id="${t.id}">Remover</button></div>`).join('') || '<p class="sub">Ninguém adicionado.</p>'}</div>
      </div>`;
  }

  if (settingsTab === 'credits') {
    const used = state.agent.credits.used, total = state.agent.credits.total;
    const max = Math.max(...state.usage.map((u) => u.n), 1);
    body = `<div class="card">
        <h3>${used} de ${total} créditos usados</h3>
        <p class="sub">Renova em 3 dias. ${creditsLeft()} créditos disponíveis.</p>
        <div class="bar" style="margin:12px 0"><i style="width:${(used / total) * 100}%"></i></div>
        <div class="grid" style="grid-template-columns:repeat(5,1fr);align-items:end;height:110px;margin-top:16px">
          ${state.usage.map((u) => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end">
            <div style="width:100%;background:var(--accent);border-radius:6px 6px 0 0;height:${(u.n / max) * 80}%;opacity:.85"></div>
            <span style="font-size:11px;color:var(--muted)">${u.d}</span>
          </div>`).join('')}
        </div>
      </div>
      <div class="card"><h3>Plano</h3><p class="sub">Mensal · ${total} créditos por ciclo. Ao esgotar, o chat pausa até a renovação ou upgrade.</p>
      <button class="btn tiny primary" data-act="upgrade" style="margin-top:10px">Ver planos</button></div>`;
  }

  if (settingsTab === 'meetings') {
    body = `<div class="card">
        <div class="section-head" style="margin-bottom:10px"><div><h3>Reuniões</h3><p class="sub">O agente entra como ouvinte, faz notas e lista ações.</p></div>
        <button class="btn tiny primary" data-act="addMeeting">Agendar</button></div>
        <div class="list">${state.meetings.map((m) => `<div class="row"><div class="stack"><b>${esc(m.title)}</b><span>${esc(m.when)} · ${esc(m.duration)}</span></div>
        <button class="btn tiny ghost" data-act="delMeeting" data-id="${m.id}">Cancelar</button></div>`).join('') || '<p class="sub">Nenhuma reunião agendada.</p>'}</div>
      </div>`;
  }

  if (settingsTab === 'security') {
    const row = (key, label, desc) => `<div class="row" style="margin-bottom:10px">
        <div class="stack"><b>${label}</b><span>${desc}</span></div>
        <button class="toggle ${state.security[key] ? 'on' : ''}" data-act="toggleSecurity" data-key="${key}" aria-label="${label}"><i></i></button>
      </div>`;
    body = `<div class="card"><h3>Controles</h3><p class="sub">Valem para todas as conversas, em qualquer canal.</p>
      <div style="margin-top:12px">
        ${row('requireApproval', 'Pedir confirmação', 'Ações externas só rodam depois do seu ok.')}
        ${row('blockPayments', 'Bloquear pagamentos', 'Impede compras e cobranças.')}
        ${row('logActions', 'Registrar tudo', 'Mantém um log de cada ferramenta usada.')}
      </div></div>`;
  }

  if (settingsTab === 'developer') {
    body = `<div class="card">
        <h3>Chave de API</h3>
        <p class="sub">Use para chamar o agente de fora. Trate como senha.</p>
        <div class="inline" style="margin-top:12px">
          <input type="text" readonly value="${state.developer.apiKey ? esc(state.developer.apiKey) : 'nenhuma chave gerada'}" class="mono">
          <button class="btn tiny primary" data-act="genKey">${state.developer.apiKey ? 'Gerar nova' : 'Gerar chave'}</button>
        </div>
      </div>
      <div class="card">
        <h3>Webhook de saída</h3>
        <p class="sub">Recebe eventos de mensagem criada e concluída.</p>
        <div class="inline" style="margin-top:12px">
          <input type="text" readonly value="https://seu-servidor.exemplo/webhook/superagente" class="mono">
          <button class="btn tiny" data-act="copy" data-copy="https://seu-servidor.exemplo/webhook/superagente">Copiar</button>
        </div>
      </div>`;
  }

  $('#view').innerHTML = `<div class="view-inner">
      <div class="section-head"><div><h2>Configurações</h2><p>Modelos, permissões, plano e integrações.</p></div></div>
      <div class="tabs">${tabs.map((t) => `<button class="tab ${settingsTab === t ? 'on' : ''}" data-act="settingsTab" data-tab="${t}">${labels[t]}</button>`).join('')}</div>
      ${body}
    </div>`;

  const mChat = $('#mChat');
  if (mChat) mChat.addEventListener('change', (e) => { state.agent.models.chat = e.target.value; save(); toast('Modelo de chat salvo.'); renderChrome(); });
  const mAuto = $('#mAuto');
  if (mAuto) mAuto.addEventListener('change', (e) => { state.agent.models.automations = e.target.value; save(); toast('Modelo de automações salvo.'); });
  const crossApp = $('#crossApp');
  if (crossApp) crossApp.addEventListener('change', (e) => { state.agent.crossApp = e.target.value; save(); toast('Escopo de acesso salvo.'); renderChrome(); });
  const voice = $('#voice');
  if (voice) voice.addEventListener('change', (e) => { state.agent.voice = e.target.value; save(); toast('Voz alterada para ' + e.target.value + '.'); renderChrome(); });
};

/* ============ ações ============ */
const actions = {
  /* conversas */
  openConv(el) { state.activeConversation = el.dataset.id; save(); go('chat'); },
  suggest(el) { const t = $('#input'); if (t) { t.value = el.dataset.text; t.focus(); } },
  attach() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      state.files.push({ id: uid('f'), path: 'conversations/anexos', name: f.name, size: (f.size / 1024).toFixed(1).replace('.', ',') + ' kB' });
      save(); renderChrome();
      toast('Anexo "' + f.name + '" enviado para Arquivos.');
    };
    inp.click();
  },
  mic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Ditado indisponível neste navegador.'); return; }
    try {
      const r = new SR();
      r.lang = 'pt-BR';
      r.interimResults = false;
      r.onresult = (e) => { const t = $('#input'); if (t) { t.value += (t.value ? ' ' : '') + e.results[0][0].transcript; t.focus(); } };
      r.onerror = () => toast('Não consegui ouvir. Tente de novo.');
      r.start();
      toast('Ouvindo...');
    } catch { toast('Ditado indisponível neste navegador.'); }
  },
  voice() {
    openModal({
      title: 'Modo voz',
      body: `<p class="sub">Conversa falada em tempo real. Aqui é uma simulação visual do modo de voz.</p>
        <div style="display:flex;align-items:flex-end;gap:4px;height:90px;justify-content:center;margin:22px 0" id="waves">
          ${Array.from({ length: 28 }).map(() => '<span style="width:5px;background:var(--accent);border-radius:99px;height:12px;opacity:.8"></span>').join('')}
        </div>
        <p class="sub" style="text-align:center">Segure para falar</p>`,
      foot: `<button class="btn" data-close="1">Fechar</button><button class="btn primary" data-act="voiceSay">Falar</button>`,
      onMount(root) {
        setInterval(() => {
          $$('#waves span', root).forEach((s) => { s.style.height = 8 + Math.random() * 70 + 'px'; });
        }, 160);
      },
    });
  },
  voiceSay() { toast('"Claro, pode falar."'); },
  upgrade() {
    openModal({
      title: 'Planos',
      body: `<div class="grid two">
        <div class="card"><h3>Mensal</h3><p class="sub">25 créditos por ciclo, renova todo mês.</p><p style="font-size:22px;font-weight:700;margin-top:10px">R$ 0</p><span class="badge ok">plano atual</span></div>
        <div class="card"><h3>Premium</h3><p class="sub">100 créditos, prioridade nas filas e mais contexto.</p><p style="font-size:22px;font-weight:700;margin-top:10px">R$ 79<span style="font-size:12px;color:var(--muted)">/mês</span></p><button class="btn primary tiny" data-act="fakeUpgrade">Assinar</button></div>
      </div>`,
      foot: `<button class="btn" data-close="1">Fechar</button>`,
    });
  },
  fakeUpgrade() {
    state.agent.credits.total = 100;
    state.agent.credits.used = Math.min(state.agent.credits.used, 100);
    save(); closeModal(); render(); toast('Plano Premium simulado. 100 créditos no ciclo.');
  },
  resetDemo() {
    openModal({
      title: 'Restaurar demonstração',
      body: '<p class="sub">Isso apaga as alterações feitas nesta interface e volta ao estado inicial da demonstração. Nada aqui toca em dados reais.</p>',
      foot: '<button class="btn" data-close="1">Cancelar</button><button class="btn primary" data-act="confirmReset">Restaurar</button>',
    });
  },
  confirmReset() {
    localStorage.removeItem(STORAGE);
    state = seed();
    save(); closeModal(); go('chat'); toast('Demonstração restaurada.');
  },
  copy(el) {
    navigator.clipboard?.writeText(el.dataset.copy).then(() => toast('Copiado.'), () => toast('Não deu para copiar.'));
  },

  /* workflows */
  toggleWorkflow(el) {
    const w = state.workflows.find((x) => x.id === el.dataset.id);
    w.active = !w.active;
    save(); renderChrome(); views.tasks();
    toast(w.active ? 'Workflow ativado.' : 'Workflow pausado.');
  },
  runWorkflow(el) {
    const w = state.workflows.find((x) => x.id === el.dataset.id);
    const ms = 2000 + Math.round(Math.random() * 6000);
    w.runs.unshift({ id: uid('r'), ts: Date.now(), status: 'ok', ms });
    save(); views.tasks(); renderChrome();
    toast('Execução de "' + w.name + '" concluída.');
  },
  delWorkflow(el) {
    const id = el.dataset.id;
    openModal({
      title: 'Excluir workflow',
      body: '<p class="sub">O histórico de execuções também é removido. Essa ação não pode ser desfeita.</p>',
      foot: `<button class="btn" data-close="1">Cancelar</button><button class="btn danger" data-act="confirmDelWorkflow" data-id="${id}">Excluir</button>`,
    });
  },
  confirmDelWorkflow(el) {
    state.workflows = state.workflows.filter((w) => w.id !== el.dataset.id);
    save(); closeModal(); views.tasks(); renderChrome(); toast('Workflow excluído.');
  },
  newWorkflow() {
    openModal({
      title: 'Novo workflow',
      body: `<div class="field"><label for="wfName">Nome</label><input type="text" id="wfName" placeholder="Resumo diário"></div>
        <div class="field"><label for="wfTrig">Gatilho</label><select id="wfTrig">
          <option>Agenda</option><option>Evento de registro</option><option>Evento de conector</option><option>Webhook</option>
        </select></div>
        <div class="field"><label for="wfDetail">Quando</label><input type="text" id="wfDetail" placeholder="Todos os dias às 08:00"></div>`,
      foot: '<button class="btn" data-close="1">Cancelar</button><button class="btn primary" data-act="saveWorkflow">Criar</button>',
    });
  },
  saveWorkflow() {
    const name = $('#wfName').value.trim();
    if (!name) return toast('Dê um nome ao workflow.');
    state.workflows.unshift({ id: uid('wf'), name, trigger: $('#wfTrig').value, detail: $('#wfDetail').value.trim() || 'sem agendamento definido', active: true, runs: [] });
    save(); closeModal(); views.tasks(); renderChrome(); toast('Workflow criado e ativo.');
  },

  /* plugins */
  pluginsTab(el) { pluginsTab = el.dataset.tab; views.integrations(); },
  connect(el) {
    const c = state.connectors.find((x) => x.id === el.dataset.id);
    c.status = 'active';
    c.scope = c.id === 'gmail' ? 'somente leitura' : 'leitura e escrita';
    save(); views.integrations(); renderChrome(); toast(c.name + ' conectado.');
  },
  disconnect(el) {
    const c = state.connectors.find((x) => x.id === el.dataset.id);
    c.status = 'off'; c.scope = '';
    save(); views.integrations(); renderChrome(); toast(c.name + ' desconectado.');
  },
  toggleSkill(el) {
    const s = state.skills.find((x) => x.id === el.dataset.id);
    s.on = !s.on; save(); views.integrations(); toast(s.name + (s.on ? ' ligada.' : ' desligada.'));
  },
  addConnector() {
    openModal({
      title: 'Adicionar conector',
      body: `<div class="field"><label for="cName">Serviço</label><input type="text" id="cName" placeholder="Notion"></div>
        <div class="field"><label for="cDesc">Para que serve</label><input type="text" id="cDesc" placeholder="Páginas e bancos de dados"></div>
        <p class="help">Ao conectar de verdade, o serviço abre a tela de autorização do provedor.</p>`,
      foot: '<button class="btn" data-close="1">Cancelar</button><button class="btn primary" data-act="saveConnector">Adicionar</button>',
    });
  },
  saveConnector() {
    const name = $('#cName').value.trim();
    if (!name) return toast('Informe o serviço.');
    state.connectors.push({ id: uid('c'), name, desc: $('#cDesc').value.trim() || 'Conector personalizado', status: 'off', scope: '' });
    save(); closeModal(); views.integrations(); toast(name + ' adicionado aos disponíveis.');
  },

  /* canais */
  chanConnect(el) {
    const c = state.channels.find((x) => x.id === el.dataset.id);
    const detailBy = {
      whatsapp: '+55 27 9••••-4558', telegram: '@superagente_bot', imessage: 'verificado por código',
      slack: '#geral', phone: '+1 (555) 010-7788', browser: 'extensão instalada',
    };
    c.status = 'connected';
    c.detail = detailBy[c.id] || 'conectado';
    save(); views.channels(); renderChrome(); toast(c.name + ' conectado.');
  },
  chanManage(el) {
    const c = state.channels.find((x) => x.id === el.dataset.id);
    openModal({
      title: 'Gerenciar ' + c.name,
      body: `<dl class="kv"><dt>Status</dt><dd><span class="badge ok">conectado</span></dd>
        <dt>Identificação</dt><dd class="mono">${esc(c.detail)}</dd>
        <dt>Responde</dt><dd>Apenas pessoas de confiança, ou qualquer contato se você liberar.</dd>
        <dt>Histórico</dt><dd>Mantido junto da conversa principal.</dd></dl>`,
      foot: '<button class="btn" data-close="1">Fechar</button><button class="btn danger" data-act="chanDisconnect" data-id="' + c.id + '">Desconectar</button>',
    });
  },
  chanDisconnect(el) {
    const c = state.channels.find((x) => x.id === el.dataset.id);
    c.status = 'off'; c.detail = '';
    save(); closeModal(); views.channels(); renderChrome(); toast(c.name + ' desconectado.');
  },

  /* notas */
  newNote() {
    openModal({
      title: 'Nova nota',
      body: `<div class="field"><label for="nTitle">Título</label><input type="text" id="nTitle" placeholder="Plano da semana"></div>
        <div class="field"><label for="nBody">Conteúdo</label><textarea class="input" id="nBody" placeholder="Escreva aqui..."></textarea></div>`,
      foot: '<button class="btn" data-close="1">Cancelar</button><button class="btn primary" data-act="saveNote">Salvar</button>',
    });
  },
  openNote(el) {
    const n = state.notes.find((x) => x.id === el.dataset.id);
    openModal({
      title: 'Editar nota',
      body: `<div class="field"><label for="nTitle">Título</label><input type="text" id="nTitle" value="${esc(n.title)}"></div>
        <div class="field"><label for="nBody">Conteúdo</label><textarea class="input" id="nBody">${esc(n.body)}</textarea></div>`,
      foot: `<button class="btn danger" data-act="delNote" data-id="${n.id}">Excluir</button><button class="btn primary" data-act="saveNote" data-id="${n.id}">Salvar</button>`,
    });
  },
  saveNote(el) {
    const title = $('#nTitle').value.trim() || 'Sem título';
    const body = $('#nBody').value;
    const id = el.dataset.id;
    if (id) {
      const n = state.notes.find((x) => x.id === id);
      n.title = title; n.body = body; n.updated = Date.now();
    } else {
      state.notes.unshift({ id: uid('n'), title, body, updated: Date.now() });
    }
    save(); closeModal(); views.notes(); renderChrome(); toast('Nota salva.');
  },
  delNote(el) {
    state.notes = state.notes.filter((n) => n.id !== el.dataset.id);
    save(); closeModal(); views.notes(); renderChrome(); toast('Nota excluída.');
  },

  /* arquivos */
  addFile() {
    openModal({
      title: 'Adicionar arquivo',
      body: `<div class="field"><label for="fPath">Pasta</label><input type="text" id="fPath" value=".agents/rules" list="folders">
        <datalist id="folders">${[...new Set(state.files.map((f) => f.path))].map((p) => `<option>${esc(p)}</option>`).join('')}</datalist></div>
        <div class="field"><label for="fName">Nome do arquivo</label><input type="text" id="fName" placeholder="tom-de-voz.md"></div>
        <div class="field"><label for="fSize">Tamanho</label><input type="text" id="fSize" placeholder="1,2 kB"></div>`,
      foot: '<button class="btn" data-close="1">Cancelar</button><button class="btn primary" data-act="saveFile">Adicionar</button>',
    });
  },
  saveFile() {
    const name = $('#fName').value.trim();
    if (!name) return toast('Informe o nome do arquivo.');
    state.files.push({ id: uid('f'), path: $('#fPath').value.trim() || 'raiz', name, size: $('#fSize').value.trim() || '1,0 kB' });
    save(); closeModal(); views.library(); renderChrome(); toast('Arquivo adicionado.');
  },
  delFile(el) {
    state.files = state.files.filter((f) => f.id !== el.dataset.id);
    save(); views.library(); renderChrome(); toast('Arquivo removido.');
  },

  /* memória */
  addMemory() {
    openModal({
      title: 'Adicionar fato',
      body: `<div class="field"><label for="mCat">Categoria</label><input type="text" id="mCat" value="Preferências"></div>
        <div class="field"><label for="mText">Fato</label><textarea class="input" id="mText" placeholder="Prefere reuniões pela manhã."></textarea></div>`,
      foot: '<button class="btn" data-close="1">Cancelar</button><button class="btn primary" data-act="saveMemory">Salvar</button>',
    });
  },
  saveMemory() {
    const text = $('#mText').value.trim();
    if (!text) return toast('Escreva o fato.');
    state.memories.unshift({ id: uid('mem'), category: $('#mCat').value.trim() || 'Geral', text });
    save(); closeModal(); views.memory(); renderChrome(); toast('Fato memorizado.');
  },
  delMemory(el) {
    state.memories = state.memories.filter((m) => m.id !== el.dataset.id);
    save(); views.memory(); renderChrome(); toast('Fato esquecido.');
  },

  /* dados */
  pickEntity(el) { entityId = el.dataset.id; views.data(); },
  addRecord() {
    const ent = state.entities.find((e) => e.id === entityId);
    if (!ent) return;
    openModal({
      title: 'Novo registro em ' + ent.name,
      body: ent.fields.map((f, i) => `<div class="field"><label for="rf${i}">${esc(f)}</label><input type="text" id="rf${i}"></div>`).join(''),
      foot: '<button class="btn" data-close="1">Cancelar</button><button class="btn primary" data-act="saveRecord">Salvar</button>',
    });
  },
  saveRecord() {
    const ent = state.entities.find((e) => e.id === entityId);
    const rec = { id: uid('rec') };
    ent.fields.forEach((f, i) => { rec[f] = $('#rf' + i).value.trim(); });
    ent.records.push(rec);
    save(); closeModal(); views.data(); renderChrome(); toast('Registro criado.');
  },
  delRecord(el) {
    const ent = state.entities.find((e) => e.id === el.dataset.ent);
    ent.records = ent.records.filter((r) => r.id !== el.dataset.id);
    save(); views.data(); renderChrome(); toast('Registro excluído.');
  },
  newEntity() {
    openModal({
      title: 'Nova tabela',
      body: `<div class="field"><label for="eName">Nome</label><input type="text" id="eName" placeholder="Projetos"></div>
        <div class="field"><label for="eFields">Campos (separados por vírgula)</label><input type="text" id="eFields" placeholder="nome, status, prazo"></div>`,
      foot: '<button class="btn" data-close="1">Cancelar</button><button class="btn primary" data-act="saveEntity">Criar</button>',
    });
  },
  saveEntity() {
    const name = $('#eName').value.trim();
    const fields = $('#eFields').value.split(',').map((s) => s.trim()).filter(Boolean);
    if (!name || !fields.length) return toast('Informe nome e ao menos um campo.');
    const id = uid('e');
    state.entities.push({ id, name, fields, records: [] });
    entityId = id;
    save(); closeModal(); views.data(); renderChrome(); toast('Tabela criada.');
  },

  /* configurações */
  settingsTab(el) { settingsTab = el.dataset.tab; views.settings(); },
  voicePreview() { toast('Tocando prévia da voz ' + state.agent.voice + '...'); },
  makeTemplate() {
    state.agent.templateLink = 'https://exemplo.app/template/' + Math.random().toString(36).slice(2, 8);
    save(); views.settings(); toast('Link de template gerado.');
  },
  deleteAgent() {
    openModal({
      title: 'Excluir agente',
      body: '<p class="sub">Vai para a lixeira por 30 dias. Nesta demonstração, nada é apagado de verdade.</p>',
      foot: '<button class="btn" data-close="1">Cancelar</button><button class="btn danger" data-act="confirmDeleteAgent">Excluir</button>',
    });
  },
  confirmDeleteAgent() { closeModal(); toast('Na demonstração o agente não é apagado.'); },
  addTrusted() {
    openModal({
      title: 'Pessoa de confiança',
      body: `<div class="field"><label for="tName">Nome</label><input type="text" id="tName"></div>
        <div class="field"><label for="tContact">Contato</label><input type="text" id="tContact" placeholder="+55 27 99999-0000"></div>
        <div class="field"><label for="tChan">Canal</label><select id="tChan"><option>WhatsApp</option><option>Telegram</option><option>E-mail</option><option>Telefone</option></select></div>`,
      foot: '<button class="btn" data-close="1">Cancelar</button><button class="btn primary" data-act="saveTrusted">Adicionar</button>',
    });
  },
  saveTrusted() {
    const name = $('#tName').value.trim();
    if (!name) return toast('Informe o nome.');
    state.trusted.push({ id: uid('t'), name, contact: $('#tContact').value.trim() || 'sem contato', channel: $('#tChan').value });
    save(); closeModal(); views.settings(); toast(name + ' agora é pessoa de confiança.');
  },
  delTrusted(el) {
    state.trusted = state.trusted.filter((t) => t.id !== el.dataset.id);
    save(); views.settings(); toast('Removido.');
  },
  addMeeting() {
    openModal({
      title: 'Agendar reunião',
      body: `<div class="field"><label for="mtTitle">Título</label><input type="text" id="mtTitle" placeholder="Revisão de sprint"></div>
        <div class="field"><label for="mtWhen">Quando</label><input type="text" id="mtWhen" placeholder="Quinta, 10:00"></div>
        <div class="field"><label for="mtDur">Duração</label><input type="text" id="mtDur" placeholder="30 min"></div>`,
      foot: '<button class="btn" data-close="1">Cancelar</button><button class="btn primary" data-act="saveMeeting">Agendar</button>',
    });
  },
  saveMeeting() {
    const title = $('#mtTitle').value.trim();
    if (!title) return toast('Informe o título.');
    state.meetings.push({ id: uid('mt'), title, when: $('#mtWhen').value.trim() || 'a definir', duration: $('#mtDur').value.trim() || '30 min' });
    save(); closeModal(); views.settings(); toast('Reunião agendada.');
  },
  delMeeting(el) {
    state.meetings = state.meetings.filter((m) => m.id !== el.dataset.id);
    save(); views.settings(); toast('Reunião cancelada.');
  },
  toggleSecurity(el) {
    const k = el.dataset.key;
    state.security[k] = !state.security[k];
    save(); views.settings(); toast('Ajuste salvo.');
  },
  genKey() {
    state.developer.apiKey = 'sk_demo_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    save(); views.settings(); toast('Chave gerada para esta demonstração.');
  },
};

/* ============ eventos globais ============ */
document.addEventListener('click', (e) => {
  const closer = e.target.closest('[data-close]');
  if (closer) { closeModal(); return; }
  const actEl = e.target.closest('[data-act]');
  if (actEl) {
    e.preventDefault();
    const fn = actions[actEl.dataset.act];
    if (fn) fn(actEl, e);
    return;
  }
  const navEl = e.target.closest('[data-view]');
  if (navEl) {
    e.preventDefault();
    if (navEl.dataset.new) {
      if (streaming) { toast('Aguarde a resposta terminar.'); return; }
      const conv = { id: uid('conv'), title: 'Nova conversa', created: Date.now(), updated: Date.now(), messages: [] };
      state.conversations.unshift(conv);
      state.activeConversation = conv.id;
      save();
    }
    go(navEl.dataset.view);
    return;
  }
  if (e.target.closest('[data-dismiss="setup"]')) {
    state.dismissed.setup = true;
    save(); renderChrome();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#modalRoot').hidden) closeModal();
});

function syncMore() {
  const g = $('#moreGroup');
  const b = $('#moreToggle');
  if (!g || !b) return;
  g.classList.toggle('open', moreOpen);
  b.setAttribute('aria-expanded', String(moreOpen));
}
$('#moreToggle').addEventListener('click', () => { moreOpen = !moreOpen; syncMore(); save(); });

$('#themeToggle').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(STORAGE + '.theme', next);
  toast(next === 'dark' ? 'Tema escuro.' : 'Tema claro.');
});
$('#bellBtn').addEventListener('click', () => {
  state.user.notifications = 0;
  save(); renderChrome();
  toast('Sem notificações novas.');
});
$('#resetDemo').addEventListener('click', () => actions.resetDemo());

$$('[data-context]').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.context === 'apps') { toast('Modo Apps faz parte do workspace, fora desta demonstração.'); return; }
}));

window.addEventListener('hashchange', () => { render(); $('#view').scrollTop = 0; });

/* ============ init ============ */
document.documentElement.dataset.theme = localStorage.getItem(STORAGE + '.theme') || 'light';
state = load();
if (!state.conversations.length) state.conversations = seed().conversations;
save();
render();

})();
