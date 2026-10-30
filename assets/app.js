/* Superagente · interface funcional (SPA sem build, estado local no navegador) */
(() => {
'use strict';

/* ============ utilitários ============ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const initials = (name) => {
  const w = String(name || '').split(/[\s\-]+/).filter(Boolean);
  return ((w[0] || '?')[0] + (w[1] ? w[1][0] : '')).toUpperCase();
};
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
  const cs = $('#countSkills');
  if (cs) cs.textContent = state.skillsOff ? CATALOG.length - Object.keys(state.skillsOff).length : CATALOG.length;
  const cc = $('#countConvs');
  if (cc) cc.textContent = state.conversations.length;

  const pill = $('#creditPill');
  pill.textContent = left === 0 ? 'sem créditos' : left + (left === 1 ? ' crédito' : ' créditos');
  pill.className = 'pill' + (left === 0 ? ' out' : left <= 5 ? ' low' : '');

  $('#planLine').textContent = state.agent.credits.used + ' de ' + state.agent.credits.total + ' créditos usados';

  const st = computeSetup();
  $('#setupProgressText').textContent = st.done + ' de ' + st.total + ' concluídos';
  $('#setupBar').style.width = (st.done / st.total) * 100 + '%';
  $('#setupCard').style.display = state.dismissed.setup ? 'none' : '';

  const list = state.conversations
    .slice()
    .sort((a, b) => b.updated - a.updated)
    .map((c) => `<button class="conv ${c.id === state.activeConversation ? 'on' : ''}" data-act="openConv" data-id="${c.id}" role="listitem" title="${esc(c.title)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v10H8l-4 4z"/></svg>
        <b>${esc(c.title)}</b>
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
  skills: ['Habilidades', 'Skills, ferramentas, conectores e canais'],
  stream: ['Streaming', 'Como a resposta chega em pedaços'],
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
  const first = (state.user.name || '').split(' ')[0] || 'por aqui';
  return `<div class="chat-empty">
    <div class="big-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M12 3v3m0 12v3M4.2 7.5l2.6 1.5m10.4 6 2.6 1.5M19.8 7.5l-2.6 1.5m-10.4 6-2.6 1.5"/><circle cx="12" cy="12" r="3.4"/></svg>
    </div>
    <h2>Olá, ${esc(first)}.</h2>
    <p>O que posso fazer por você hoje?</p>
    <div class="suggestions">
      <button class="suggestion" data-act="suggest" data-text="Resume as pendências de hoje.">
        <svg viewBox="0 0 24 24"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/></svg>
        <span><b>Resume as pendências de hoje</b><small>Notas, memória e execuções recentes</small></span>
      </button>
      <button class="suggestion" data-act="suggest" data-text="Quais conectores estão ativos e com qual escopo?">
        <svg viewBox="0 0 24 24"><path d="M10 3.5a2 2 0 0 1 4 0V5h2.5A1.5 1.5 0 0 1 18 6.5V9h1.5a2 2 0 0 1 0 4H18v2.5a1.5 1.5 0 0 1-1.5 1.5H14v1.5a2 2 0 0 1-4 0V17H7.5A1.5 1.5 0 0 1 6 15.5V13H4.5a2 2 0 0 1 0-4H6V6.5A1.5 1.5 0 0 1 7.5 5H10z"/></svg>
        <span><b>Quais conectores estão ativos?</b><small>Plugins, escopo e status</small></span>
      </button>
      <button class="suggestion" data-act="goalHint">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>
        <span><b>Use /goal para tarefas longas</b><small>Plano com etapas que sobrevive entre dias</small></span>
      </button>
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
        <div id="slashPalette"></div>
        <form class="composer" id="composer">
          <textarea id="input" rows="1" placeholder="Pergunte qualquer coisa, ou digite / para mais opções" aria-label="Mensagem para o agente"></textarea>
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
            <button type="submit" class="send" id="sendBtn" aria-label="Enviar mensagem">
              <span id="sendLabel">Enviar</span>
              <svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </button>
          </div>
        </form>
        <p class="hint">Enter envia · Shift + Enter quebra a linha · demonstração local, sem dados reais</p>
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
    updateSlash(input.value);
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
  const input = $('#input');
  const send = $('#sendBtn');
  if (left > 0) {
    box.innerHTML = '';
    if (input) { input.disabled = false; input.placeholder = 'Pergunte qualquer coisa, ou digite / para mais opções'; }
    if (send) send.disabled = streaming;
    return;
  }
  box.innerHTML = `<div class="credits-banner" role="status">
      <div class="row-top"><span>0 créditos restantes</span><span>renova em 3 dias</span></div>
      <div class="body">
        <div>
          <strong>Seus créditos do mês acabaram</strong>
          <p>Assine o plano Premium e libere créditos na hora, além de mais contexto por conversa.</p>
        </div>
        <button class="btn orange" data-act="upgrade">Ver planos</button>
      </div>
    </div>`;
  if (input) { input.disabled = true; input.placeholder = 'Sem créditos para continuar'; }
  if (send) send.disabled = true;
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
  return `<div class="thinking" aria-live="polite" aria-label="Pensando"><span>
    <svg viewBox="0 0 24 24"><path d="M12 3v3m0 12v3M4.2 7.5l2.6 1.5m10.4 6 2.6 1.5M19.8 7.5l-2.6 1.5m-10.4 6-2.6 1.5"/><circle cx="12" cy="12" r="3.4"/></svg>
  </span></div>`;
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
  btn.disabled = creditsLeft() <= 0 && !streaming;
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

/* ============ paleta de comandos (/) ============ */
const COMMANDS = [
  { cmd: '/goal', desc: 'Criar um objetivo de longo prazo com etapas', text: '/goal ' },
  { cmd: '/nota', desc: 'Salvar uma nota com o que vier depois', text: 'Cria uma nota com ' },
  { cmd: '/workflow', desc: 'Agendar uma rotina recorrente', text: 'Cria um workflow que ' },
  { cmd: '/canal', desc: 'Falar com alguém por um canal conectado', text: 'Envia uma mensagem para ' },
];
function updateSlash(value) {
  const box = $('#slashPalette');
  if (!box) return;
  if (!value.startsWith('/')) { box.innerHTML = ''; return; }
  const q = value.slice(1).toLowerCase();
  const items = COMMANDS.filter((c) => c.cmd.slice(1).startsWith(q));
  if (!items.length) { box.innerHTML = ''; return; }
  box.innerHTML = `<div class="slash-list">${items.map((c) => `
      <button class="slash-item" data-act="pickCommand" data-text="${esc(c.text)}">
        <span class="mono">${esc(c.cmd)}</span><span>${esc(c.desc)}</span>
      </button>`).join('')}</div>`;
}

/* ============ view: workflows ============ */
let wfTab = 'scheduled';
let wfFilter = 'active';
let wfQuery = '';

views.tasks = function () {
  const all = state.workflows;
  const counts = {
    active: all.filter((w) => w.active).length,
    paused: all.filter((w) => !w.active).length,
    done: 0,
  };
  const q = wfQuery.toLowerCase();
  const rows = all
    .filter((w) => (wfFilter === 'active' ? w.active : wfFilter === 'paused' ? !w.active : false))
    .filter((w) => !q || (w.name + ' ' + w.trigger + ' ' + w.detail).toLowerCase().includes(q));

  const lastRun = (w) => (w.runs[0] ? brlFull.format(w.runs[0].ts) + ' ' + hora.format(w.runs[0].ts) : 'nunca');

  const table = rows.length ? `
    <div class="table-wrap">
      <table>
        <thead><tr><th style="width:42%">Workflow</th><th>Gatilho</th><th>Última execução</th><th style="width:150px"></th></tr></thead>
        <tbody>
          ${rows.map((w) => `<tr>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <button class="toggle ${w.active ? 'on' : ''}" data-act="toggleWorkflow" data-id="${w.id}" aria-label="Ativar ou pausar ${esc(w.name)}"><i></i></button>
                <b style="font-weight:600">${esc(w.name)}</b>
              </div>
            </td>
            <td><span class="badge">${esc(w.trigger)}</span><div class="help" style="margin-top:3px">${esc(w.detail)}</div></td>
            <td class="mono" style="color:var(--muted)">${esc(lastRun(w))}</td>
            <td>
              <div style="display:flex;gap:6px;justify-content:flex-end">
                <button class="btn tiny" data-act="runWorkflow" data-id="${w.id}">Executar agora</button>
                <button class="btn tiny ghost" data-act="wfMenu" data-id="${w.id}" aria-label="Mais opções">···</button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : `<div class="empty"><strong>Nada por aqui</strong><p>${wfQuery ? 'Nenhum workflow corresponde à busca.' : 'Crie o primeiro workflow para o agente trabalhar sozinho.'}</p></div>`;

  const activity = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Workflow</th><th>Quando</th><th>Status</th><th>Duração</th></tr></thead>
        <tbody>
        ${all.flatMap((w) => w.runs.map((r) => `<tr>
          <td>${esc(w.name)}</td>
          <td class="mono" style="color:var(--muted)">${brlFull.format(r.ts)} ${hora.format(r.ts)}</td>
          <td><span class="badge ok">${esc(r.status)}</span></td>
          <td>${(r.ms / 1000).toFixed(1)}s</td>
        </tr>`)).join('') || '<tr><td colspan="4" style="color:var(--muted)">Nenhuma execução registrada.</td></tr>'}
        </tbody>
      </table>
    </div>`;

  $('#view').innerHTML = `<div class="view-inner">
      <div class="section-head">
        <div>
          <h2>Workflows</h2>
          <p>Ações automatizadas por agenda ou quando um gatilho acontece.</p>
        </div>
        <button class="btn dark" data-act="newWorkflow">Novo workflow</button>
      </div>

      <div class="tabs">
        <button class="tab ${wfTab === 'scheduled' ? 'on' : ''}" data-act="wfTab" data-tab="scheduled">Workflows agendados</button>
        <button class="tab ${wfTab === 'triggered' ? 'on' : ''}" data-act="wfTab" data-tab="triggered">Com gatilho</button>
        <button class="tab ${wfTab === 'activity' ? 'on' : ''}" data-act="wfTab" data-tab="activity">Atividade</button>
      </div>

      ${wfTab === 'activity' ? activity : `
        <div class="toolbar">
          ${[['active', 'Ativos'], ['paused', 'Pausados'], ['done', 'Concluídos']].map(([k, label]) => `
            <button class="btn tiny ${wfFilter === k ? 'dark' : ''}" data-act="wfFilter" data-filter="${k}">${label} (${counts[k]})</button>
          `).join('')}
          <input type="search" id="wfSearch" placeholder="Buscar workflows" value="${esc(wfQuery)}" style="max-width:240px;margin-left:auto">
        </div>
        ${table}`}
    </div>`;

  const search = $('#wfSearch');
  if (search) search.addEventListener('input', (e) => {
    wfQuery = e.target.value;
    views.tasks();
    setTimeout(() => { const i = $('#wfSearch'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0);
  });
};

/* ============ view: plugins ============ *//* ============ view: plugins ============ */
let pluginsTab = 'connectors';
views.integrations = function () {
  const active = state.connectors.filter((c) => c.status === 'active');
  const available = state.connectors.filter((c) => c.status !== 'active');
  const popular = available.slice(0, 4);

  const card = (c) => `
    <div class="connector">
      <div class="connector-top">
        <span class="mark">${esc(initials(c.name))}</span>
        <b>${esc(c.name)}</b>
        ${c.status === 'active' ? '<span class="badge ok">ativo</span>' : ''}
      </div>
      <p>${esc(c.desc)}${c.status === 'active' && c.scope ? ' · ' + esc(c.scope) : ''}</p>
      <div class="foot">
        <span class="help">${c.status === 'active' ? 'conectado' : 'disponível'}</span>
        ${c.status === 'active'
          ? `<button class="btn tiny" data-act="disconnect" data-id="${c.id}">Desconectar</button>`
          : `<button class="btn tiny" data-act="connect" data-id="${c.id}">Conectar</button>`}
      </div>
    </div>`;

  const skills = state.skills.map((s) => `
    <div class="row">
      <div class="mark">${esc(initials(s.name))}</div>
      <div class="stack"><b>${esc(s.name)}</b><span>${esc(s.desc)}</span></div>
      <div class="side"><button class="toggle ${s.on ? 'on' : ''}" data-act="toggleSkill" data-id="${s.id}" aria-label="Ativar ${esc(s.name)}"><i></i></button></div>
    </div>`).join('');

  const connectorsBody = `
    <div class="promo">
      <div class="promo-copy">
        <strong>Conecte o agente ao e-mail, ao calendário e ao que mais usar</strong>
        <p>Ele resume threads não lidas, cruza a agenda e responde na hora em que você pedir.</p>
      </div>
      <div class="promo-art" aria-hidden="true">
        <span class="hub"><svg viewBox="0 0 24 24"><path d="M12 3v3m0 12v3M4.2 7.5l2.6 1.5m10.4 6 2.6 1.5M19.8 7.5l-2.6 1.5m-10.4 6-2.6 1.5"/><circle cx="12" cy="12" r="3.4"/></svg></span>
        <span class="nodes">
          <span class="node">Gmail</span>
          <span class="node">Slack</span>
          <span class="node">Agenda</span>
        </span>
      </div>
    </div>
    ${popular.length ? `<div class="section-title"><h3>Mais populares</h3><button class="link" data-act="showAllConnectors">Ver todos</button></div>
    <div class="grid connectors">${popular.map(card).join('')}</div>` : ''}
    ${available.length > 4 ? `<div class="section-title" style="margin-top:22px"><h3>Todos os conectores</h3></div>
    <div class="grid connectors">${available.slice(4).map(card).join('')}</div>` : ''}
    <div class="section-title" style="margin-top:26px">
      <h3>Apps conectados</h3><span class="badge count">${active.length}</span>
    </div>
    ${active.length ? `<div class="grid connectors">${active.map(card).join('')}</div>`
      : `<div class="empty"><strong>Nenhum app conectado</strong><p>Conecte um serviço para eu poder agir nele.</p></div>`}
  `;

  $('#view').innerHTML = `<div class="view-inner">
      <div class="section-head">
        <div>
          <h2>Plugins</h2>
          <p>Melhore a experiência do agente integrando os seus apps favoritos e conectores personalizados.</p>
        </div>
        <button class="btn dark" data-act="addConnector">+ Adicionar conector</button>
      </div>
      <div class="tabs">
        <button class="tab ${pluginsTab === 'connectors' ? 'on' : ''}" data-act="pluginsTab" data-tab="connectors">Conectores</button>
        <button class="tab ${pluginsTab === 'skills' ? 'on' : ''}" data-act="pluginsTab" data-tab="skills">Skills</button>
      </div>
      ${pluginsTab === 'connectors' ? connectorsBody : `<div class="list">${skills}</div>`}
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
      <div class="card"><h3>Plano</h3><p class="sub">Mensal · ${total} créditos por ciclo. Ao esgotar, o chat pausa até a renovação ou o upgrade.</p>
      <div class="inline" style="margin-top:10px">
        <button class="btn tiny primary" data-act="upgrade">Ver planos</button>
        <button class="btn tiny" data-act="toggleCredits">${creditsLeft() > 0 ? 'Simular créditos esgotados' : 'Recarregar 5 créditos'}</button>
      </div></div>`;
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
        <p class="sub">Eventos <span class="mono">message.created</span> e <span class="mono">message.completed</span>. Até 5 por agente, URL HTTPS pública, sem retentativa.</p>
        <div class="inline" style="margin-top:12px">
          <input type="text" readonly value="https://seu-servidor.exemplo/webhook/superagente" class="mono">
          <button class="btn tiny" data-act="copy" data-copy="https://seu-servidor.exemplo/webhook/superagente">Copiar</button>
        </div>
      </div>
      <div class="card">
        <h3>Endpoints que a interface consome</h3>
        <p class="sub">Contratos públicos do Superagente, documentados em <span class="mono">docs/api-e-backend.md</span>.</p>
        <div class="table-wrap" style="margin-top:12px">
          <table><thead><tr><th>Método</th><th>Caminho</th></tr></thead><tbody>
            <tr><td class="mono">POST</td><td class="mono">/api/agents/{agent_id}/conversations</td></tr>
            <tr><td class="mono">POST</td><td class="mono">/api/agents/{agent_id}/conversations/{conversation_id}/messages</td></tr>
            <tr><td class="mono">GET</td><td class="mono">/api/agents/{agent_id}/memory</td></tr>
            <tr><td class="mono">POST</td><td class="mono">/api/agents/{agent_id}/webhooks</td></tr>
            <tr><td class="mono">GET</td><td class="mono">/api/apps/{app_id}/entities/{entity_name}</td></tr>
            <tr><td class="mono">POST</td><td class="mono">/api/apps/{app_id}/entities/{entity_name}</td></tr>
          </tbody></table>
        </div>
        <p class="help" style="margin-top:8px">A demonstração local não faz essas chamadas: simula os contratos no navegador.</p>
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
  pickCommand(el) {
    const input = $('#input');
    if (input) { input.value = el.dataset.text; input.focus(); }
    const box = $('#slashPalette');
    if (box) box.innerHTML = '';
  },
  goalHint() {
    openModal({
      title: 'Objetivos com /goal',
      body: `<p class="sub">Use <span class="mono">/goal</span> quando a tarefa levar mais de uma conversa.</p>
        <ol style="font-size:13px;color:var(--muted);padding-left:18px;margin-top:12px;line-height:1.7">
          <li>O objetivo vira um plano com etapas e dependências.</li>
          <li>Cada etapa roda em segundo plano, mesmo entre dias.</li>
          <li>Você recebe o resultado ou uma pergunta quando algo trava.</li>
        </ol>`,
      foot: '<button class="btn primary" data-close="1">Entendi</button>',
    });
  },
  showAllConnectors() {
    const avail = state.connectors.filter((c) => c.status !== 'active');
    openModal({
      title: 'Todos os conectores',
      body: `<div class="list">${avail.map((c) => `<div class="row">
          <div class="mark">${esc(initials(c.name))}</div>
          <div class="stack"><b>${esc(c.name)}</b><span>${esc(c.desc)}</span></div>
          <button class="btn tiny" data-act="connect" data-id="${c.id}">Conectar</button>
        </div>`).join('') || '<p class="sub">Todos os conectores já estão ativos.</p>'}</div>`,
      foot: '<button class="btn" data-close="1">Fechar</button>',
    });
  },
  toggleCredits() {
    if (creditsLeft() > 0) {
      state.agent.credits.used = state.agent.credits.total;
      toast('Créditos zerados para demonstrar o bloqueio.');
    } else {
      state.agent.credits.used = Math.max(0, state.agent.credits.total - 5);
      toast('5 créditos liberados.');
    }
    save(); render();
  },
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
    save(); closeModal(); render(); toast('Plano Premium simulado: 100 créditos no ciclo.');
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
  wfTab(el) { wfTab = el.dataset.tab; views.tasks(); },
  wfFilter(el) { wfFilter = el.dataset.filter; views.tasks(); },
  wfMenu(el) {
    const w = state.workflows.find((x) => x.id === el.dataset.id);
    openModal({
      title: w.name,
      body: `<dl class="kv">
          <dt>Gatilho</dt><dd>${esc(w.trigger)}</dd>
          <dt>Quando</dt><dd>${esc(w.detail)}</dd>
          <dt>Status</dt><dd>${w.active ? 'ativo' : 'pausado'}</dd>
          <dt>Execuções</dt><dd>${w.runs.length}</dd>
        </dl>`,
      foot: `<button class="btn danger" data-act="delWorkflow" data-id="${w.id}">Excluir</button>
        <button class="btn" data-act="toggleWorkflow" data-id="${w.id}">${w.active ? 'Pausar' : 'Ativar'}</button>
        <button class="btn primary" data-close="1">Fechar</button>`,
    });
  },
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

  /* habilidades */
  skillCat(el) { skillCat = el.dataset.cat; views.skills(); },
  toggleSkill(el) {
    const off = skillsOnMap();
    const id = el.dataset.id;
    if (off[id]) delete off[id]; else off[id] = true;
    save(); views.skills(); renderChrome();
  },
  enableAll() {
    state.skillsOff = {};
    save(); views.skills(); renderChrome(); toast('Todas as habilidades ligadas.');
  },

  /* streaming */
  playStream() {
    if (labPlaying) { stopLab(); views.stream(); return; }
    labFrames = []; labPlaying = true; views.stream();
    let i = 0;
    const step = () => {
      if (!labPlaying) return;
      if (i >= STREAM_FRAMES.length) { labPlaying = false; views.stream(); return; }
      labFrames.push(STREAM_FRAMES[i]);
      i += 1;
      paintLab();
      labTimer = setTimeout(step, STREAM_FRAMES[i - 1].ms);
    };
    labTimer = setTimeout(step, 120);
  },
  resetStream() { stopLab(); labFrames = []; views.stream(); },

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

/* ============ catálogo de habilidades, ferramentas e canais ============ */
const CATALOG = [
  /* instrucionais */
  { id: 'capabilities', n: 'capabilities', c: 'instrucional', r: 'leitura', d: 'Índice de capacidades: diz o que existe e qual sub-skill carregar antes de prometer algo.', t: ['roteamento', 'descoberta'] },
  { id: 'sub-agents', n: 'sub-agents', r: 'leitura', c: 'instrucional', d: 'Delegação para workers em background com tarefas paralelas e resultado consolidado.', t: ['paralelismo', 'workers'] },
  { id: 'chat-experience', n: 'chat-experience', c: 'instrucional', r: 'leitura', d: 'Compositor, anexos, importação do Drive, sugestões e navegador ao vivo dentro do chat.', t: ['compositor', 'anexos'] },
  { id: 'editor-settings', n: 'editor-settings', c: 'instrucional', r: 'escrita', d: 'Modelo, memória, segurança, docs de dev, clonar, mover e excluir o agente.', t: ['modelo', 'segurança'] },
  { id: 'sharing', n: 'sharing', c: 'instrucional', r: 'externo', d: 'Link do chat, colaboração, clone do agente e publicação de template público.', t: ['link', 'template'] },
  { id: 'contacting-people', n: 'contacting-people', c: 'instrucional', r: 'externo', d: 'Achar contatos, ver rotas disponíveis, enviar mensagens e convites e tratar respostas.', t: ['pessoas', 'convite'] },
  { id: 'agent-api', n: 'agent-api', c: 'instrucional', r: 'externo', d: 'API externa de conversas, mensagens, memória e mensagem direta ao agente.', t: ['api', 'integração'] },
  { id: 'owner-management-api', n: 'owner-management-api', c: 'instrucional', r: 'escrita', d: 'Ajustes do dono: modelo principal, memória, configurações e co-proprietários.', t: ['dono', 'modelo'] },
  { id: 'agent-webhooks', n: 'agent-webhooks', c: 'instrucional', r: 'externo', d: 'Webhooks de saída para message.created e message.completed.', t: ['webhook'] },
  { id: 'automations', n: 'automations', c: 'instrucional', r: 'escrita', d: 'Automações agendadas, por entidade e por evento de connector.', t: ['agenda', 'gatilho'] },
  { id: 'workflows', n: 'workflows', c: 'instrucional', r: 'escrita', d: 'Autoria, ativação e depuração de workflows com passos e ramificações.', t: ['orquestração'] },
  { id: 'goals', n: 'goals', c: 'instrucional', r: 'escrita', d: 'Objetivos duráveis que atravessam turnos, dias e reinícios até concluir.', t: ['longo prazo'] },
  { id: 'channel-connections', n: 'channel-connections', c: 'instrucional', r: 'externo', d: 'WhatsApp, Telegram, iMessage, Slack, LINE e Telefone: conectar e operar.', t: ['canais'] },
  { id: 'whatsapp-groups', n: 'whatsapp-groups', c: 'instrucional', r: 'externo', d: 'Criar grupo, link de convite, modo de resposta e limite de oito números.', t: ['whatsapp'] },
  { id: 'connectors', n: 'connectors', c: 'instrucional', r: 'externo', d: 'OAuth de terceiros, escopos mínimos e troca de conta.', t: ['oauth'] },
  { id: 'workspace', n: 'workspace', c: 'instrucional', r: 'escrita', d: 'Arquivos do sandbox, bash, regras do agente, secrets e extensões MCP.', t: ['sandbox'] },
  { id: 'secrets', n: 'secrets', c: 'instrucional', r: 'escrita', d: 'Captura segura de credenciais, variáveis de ambiente e detecção automática.', t: ['credenciais'] },
  { id: 'knowledge-library', n: 'knowledge-library', c: 'instrucional', r: 'escrita', d: 'Biblioteca de conhecimento, uploads, previews e artefatos.', t: ['arquivos'] },
  { id: 'memory-identity', n: 'memory-identity', c: 'instrucional', r: 'escrita', d: 'Identidade, memória de longo prazo, checkpoints e logs de sessão.', t: ['memória'] },
  { id: 'tool-permissions', n: 'tool-permissions', c: 'instrucional', r: 'escrita', d: 'Auto-aprovação de ferramentas sensíveis e guardas de connector.', t: ['permissões'] },
  { id: 'data-entities', n: 'data-entities', c: 'instrucional', r: 'escrita', d: 'Schemas de entidades e CRUD de registros, com RLS por usuário.', t: ['dados'] },
  { id: 'backend-functions', n: 'backend-functions', c: 'instrucional', r: 'externo', d: 'Funções HTTP server-side, deploy, teste e leitura de logs.', t: ['backend'] },
  { id: 'base44-apps', n: 'base44-apps', c: 'instrucional', r: 'externo', d: 'Listar, editar, checar e chamar apps do usuário.', t: ['apps'] },
  { id: 'media-files', n: 'media-files', c: 'instrucional', r: 'escrita', d: 'Gerar imagem, subir arquivo, URL assinada e transcrição de áudio.', t: ['mídia'] },
  { id: 'voice', n: 'voice', c: 'instrucional', r: 'externo', d: 'Ligações em tempo real, escolha de voz, prévia e transcrição.', t: ['voz'] },
  { id: 'payments', n: 'payments', c: 'instrucional', r: 'externo', d: 'Instalação de meios de pagamento no app, com provedor escolhido pelo contexto.', t: ['cobrança'] },
  { id: 'stripe-payments', n: 'stripe-payments', c: 'instrucional', r: 'externo', d: 'Produtos, preços e sessões de checkout no Stripe.', t: ['stripe'] },
  { id: 'purchases', n: 'purchases', c: 'instrucional', r: 'externo', d: 'Comprar com Link, cartões temporários, aprovação e status do pedido.', t: ['compras'] },
  { id: 'browser', n: 'browser', c: 'instrucional', r: 'externo', d: 'Automação de navegador: sessão, navegação, ações, extração e screenshot.', t: ['navegador'] },
  { id: 'skills', n: 'skills', c: 'instrucional', r: 'escrita', d: 'Criar e rodar skills reutilizáveis do sandbox.', t: ['skills'] },
  { id: 'skill-store', n: 'skill-store', c: 'instrucional', r: 'leitura', d: 'Descobrir e instalar skills do catálogo público.', t: ['marketplace'] },

  /* famílias de ferramentas */
  { id: 'f-entities', n: 'Entidades', c: 'ferramenta', r: 'escrita', d: 'manage_entity_schemas, create_entity_records, update_entities, delete_entities, read_entities.', t: ['5 ferramentas', 'dados'] },
  { id: 'f-backend', n: 'Funções de backend', c: 'ferramenta', r: 'externo', d: 'deploy_backend_function, test_backend_function, delete_backend_function, get_backend_function_logs.', t: ['4 ferramentas'] },
  { id: 'f-workflow', n: 'Workflows', c: 'ferramenta', r: 'escrita', d: 'get_workflow_guide, create_or_update_workflow, manage_workflow, get_workflow_run.', t: ['4 ferramentas'] },
  { id: 'f-webhook', n: 'Webhooks de entrada', c: 'ferramenta', r: 'externo', d: 'select_or_create_workflow_webhook, request_webhook_sample e configure_email_workflows.', t: ['3 ferramentas'] },
  { id: 'f-people', n: 'Pessoas', c: 'ferramenta', r: 'externo', d: 'manage_shared_update e manage_superagent_contacts: pedidos, respostas e trabalho dividido.', t: ['2 ferramentas'] },
  { id: 'f-messaging', n: 'Mensageria', c: 'ferramenta', r: 'externo', d: 'show_channel_connection_options, send_image, send_whatsapp_voice_message.', t: ['3 ferramentas'] },
  { id: 'f-phone', n: 'Telefone', c: 'ferramenta', r: 'externo', d: 'make_phone_call e manage_phone: ligar, credenciar contatos, histórico e cota.', t: ['2 ferramentas'] },
  { id: 'f-apps', n: 'Apps Base44', c: 'ferramenta', r: 'escrita', d: 'list_base44_apps, send_message_to_builder, get_base44_app_status, call_base44_backend_function.', t: ['4 ferramentas'] },
  { id: 'f-agentcfg', n: 'Configuração do agente', c: 'ferramenta', r: 'escrita', d: 'read_agent_api, call_agent_api e set_agent_model.', t: ['3 ferramentas'] },
  { id: 'f-connectors', n: 'Conectores', c: 'ferramenta', r: 'externo', d: 'get_connectors_info, get_connector_token, enable_connector, request_oauth_authorization.', t: ['4 ferramentas'] },
  { id: 'f-media', n: 'Mídia e arquivos', c: 'ferramenta', r: 'escrita', d: 'generate_image, upload_file, upload_private_file, create_file_signed_url, transcribe_audio.', t: ['5 ferramentas'] },
  { id: 'f-browser', n: 'Navegador', c: 'ferramenta', r: 'externo', d: 'browserbase_navigate, batch, fast_nav, act, observe, extract, click, type, content, screenshot.', t: ['14 ferramentas'] },
  { id: 'f-memory', n: 'Memória e histórico', c: 'ferramenta', r: 'escrita', d: 'save_memory, forget_memory, read_session_log, list_sessions, search_sessions, search_previous_messages.', t: ['6 ferramentas'] },
  { id: 'f-fs', n: 'Arquivos e shell', c: 'ferramenta', r: 'escrita', d: 'read_file, write_file, grep, bash e run_skill no workspace do agente.', t: ['5 ferramentas', 'sandbox'] },
  { id: 'f-web', n: 'Busca na web', c: 'ferramenta', r: 'leitura', d: 'web_search com busca, notícias, vagas, mapas e leitura de página.', t: ['1 ferramenta'] },
  { id: 'f-ui', n: 'Interface', c: 'ferramenta', r: 'leitura', d: 'artifacts e ask_clarifying_questions: render no chat e escolha do usuário.', t: ['2 ferramentas'] },
  { id: 'f-subagents', n: 'Sub-agentes', c: 'ferramenta', r: 'escrita', d: 'sub_agent, sub_agent_status, sub_agent_result e sub_agent_stop.', t: ['4 ferramentas'] },
  { id: 'f-goals', n: 'Metas', c: 'ferramenta', r: 'escrita', d: 'manage_goal: criar, ler, avançar tarefas e concluir com critérios.', t: ['1 ferramenta'] },
  { id: 'f-payments', n: 'Pagamentos', c: 'ferramenta', r: 'externo', d: 'suggest_payments_installation e sequence_connect_oauth.', t: ['2 ferramentas'] },
  { id: 'f-groups', n: 'Grupos de WhatsApp', c: 'ferramenta', r: 'externo', d: 'create_whatsapp_group e list_whatsapp_groups.', t: ['2 ferramentas'] },
  { id: 'f-safety', n: 'Utilidades', c: 'ferramenta', r: 'leitura', d: 'vent_send_feedback, invite_friend e leitura de uso de créditos.', t: ['3 ferramentas'] },

  /* conectores */
  { id: 'c-github', n: 'GitHub', c: 'conector', r: 'externo', d: 'Repos, issues, pull requests, commits e releases. Webhooks de push e PR.', t: ['repo', 'oauth'] },
  { id: 'c-google', n: 'Google', c: 'conector', r: 'externo', d: 'Gmail, Calendar e Drive: ler, escrever e disparar workflows por evento.', t: ['gmail', 'calendar', 'drive'] },
  { id: 'c-slack', n: 'Slack', c: 'conector', r: 'externo', d: 'Mensagens, canais e eventos em tempo real.', t: ['slack'] },
  { id: 'c-outlook', n: 'Outlook', c: 'conector', r: 'externo', d: 'Caixa de e-mail com rotulagem e rascunho assistidos.', t: ['email'] },
  { id: 'c-stripe', n: 'Stripe', c: 'conector', r: 'externo', d: 'Produtos, preços, checkout e eventos de cobrança.', t: ['pagamentos'] },

  /* canais */
  { id: 'ch-web', n: 'Chat web', c: 'canal', r: 'leitura', d: 'Interface principal, com artefatos, anexos e streaming.', t: ['padrão'] },
  { id: 'ch-whatsapp', n: 'WhatsApp', c: 'canal', r: 'externo', d: 'Inbox pessoal via WhatsApp Web, voz, imagem e grupos.', t: ['meta'] },
  { id: 'ch-telegram', n: 'Telegram', c: 'canal', r: 'externo', d: 'Bot dedicado com mensagens e arquivos.', t: ['bot'] },
  { id: 'ch-imessage', n: 'iMessage', c: 'canal', r: 'externo', d: 'Mensagens no ecossistema Apple.', t: ['apple'] },
  { id: 'ch-slack', n: 'Slack', c: 'canal', r: 'externo', d: 'Conector de usuário ou instalação em canal.', t: ['time'] },
  { id: 'ch-line', n: 'LINE', c: 'canal', r: 'externo', d: 'Mensageria no mercado asiático.', t: ['bot'] },
  { id: 'ch-phone', n: 'Telefone', c: 'canal', r: 'externo', d: 'Número dedicado dos EUA, chamadas de entrada e saída.', t: ['voz', 'plano'] },

  /* mercado */
  { id: 'm-store', n: 'Skill store', c: 'mercado', r: 'leitura', d: 'Catálogo público de skills prontas para instalar no agente.', t: ['catálogo'] },
  { id: 'm-custom', n: 'Skill própria', c: 'mercado', r: 'escrita', d: 'Pacote local com SKILL.md e scripts/run.{sh,py,js}.', t: ['autoral'] },
  { id: 'm-github', n: 'Skill via GitHub', c: 'mercado', r: 'externo', d: 'Distribuição por repositório: install script, licença e versionamento.', t: ['distribuição'] },
  { id: 'm-community', n: 'Templates da comunidade', c: 'mercado', r: 'externo', d: 'Templates publicados por outros usuários para começar mais rápido.', t: ['template'] },
];

const CATLBL = { instrucional: 'Instrucional', ferramenta: 'Ferramenta', conector: 'Conector', canal: 'Canal', mercado: 'Mercado' };
let skillQuery = '';
let skillCat = 'todas';

function skillsOnMap() {
  if (!state.skillsOff) state.skillsOff = {};
  return state.skillsOff;
}

views.skills = function () {
  const off = skillsOnMap();
  const q = skillQuery.toLowerCase();
  const list = CATALOG.filter((s) => {
    if (skillCat !== 'todas' && s.c !== skillCat) return false;
    if (!q) return true;
    return (s.n + ' ' + s.d + ' ' + s.t.join(' ')).toLowerCase().includes(q);
  });
  const counts = Object.keys(CATLBL).map((k) => {
    const total = CATALOG.filter((s) => s.c === k).length;
    return { k, total };
  });
  const onCount = CATALOG.filter((s) => !off[s.id]).length;

  $('#view').innerHTML = `<div class="view-inner">
    <div class="section-head">
      <div><h2>Habilidades</h2><p>${CATALOG.length} capacidades mapeadas · ${onCount} ligadas neste agente.</p></div>
      <button class="btn" data-act="enableAll">Ligar todas</button>
    </div>
    <div class="toolbar">
      <input type="text" id="skillSearch" placeholder="Buscar habilidade, ferramenta ou canal" value="${esc(skillQuery)}" style="max-width:320px">
      <div class="chips">
        <button class="chip ${skillCat === 'todas' ? 'on' : ''}" data-act="skillCat" data-cat="todas">Todas <em>${CATALOG.length}</em></button>
        ${counts.map((c) => `<button class="chip ${skillCat === c.k ? 'on' : ''}" data-act="skillCat" data-cat="${c.k}">${CATLBL[c.k]} <em>${c.total}</em></button>`).join('')}
      </div>
    </div>
    ${list.length ? `<div class="cat-grid">${list.map((s) => `
      <article class="cat-card">
        <div class="cat-top">
          <h3>${esc(s.n)}</h3>
          <span class="chip tag ${s.c}">${CATLBL[s.c]}</span>
        </div>
        <p>${esc(s.d)}</p>
        <div class="cat-tags">${s.t.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        <div class="cat-foot">
          <span class="risk ${s.r}">${s.r === 'leitura' ? 'Só leitura' : s.r === 'escrita' ? 'Escreve dados' : 'Efeito externo'}</span>
          <button class="btn tiny ${off[s.id] ? '' : 'on'}" data-act="toggleSkill" data-id="${s.id}">${off[s.id] ? 'Desligada' : 'Ligada'}</button>
        </div>
      </article>`).join('')}</div>`
      : `<div class="empty"><strong>Nada encontrado</strong><p>Tente outro termo ou troque o filtro.</p></div>`}
  </div>`;

  const inp = $('#skillSearch');
  if (inp) inp.addEventListener('input', (e) => {
    skillQuery = e.target.value;
    const pos = e.target.selectionStart;
    views.skills();
    setTimeout(() => { const i = $('#skillSearch'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } }, 0);
  });
};

/* ============ view: streaming ============ */
const STREAM_FRAMES = [
  { ms: 260, t: 'message.start', raw: { type: 'message.start', conversation_id: 'conv_demo', message_id: 'msg_demo' }, note: 'Abre a mensagem que vai receber os deltas.' },
  { ms: 520, t: 'thinking', raw: { type: 'thinking', text: 'Analisando o pedido e escolhendo o caminho.' }, note: 'Bloco de raciocínio: a interface mostra um indicador, não o texto.' },
  { ms: 620, t: 'step.start', raw: { type: 'step.start', step_id: 's1', tool: 'read_entities', args: { entity_name: 'Projetos' } }, note: 'Chamada de ferramenta: vira um cartão com nome e argumentos.' },
  { ms: 780, t: 'step.end', raw: { type: 'step.end', step_id: 's1', status: 'ok', ms: 412, summary: '3 registros lidos' }, note: 'Resultado da ferramenta: cartão colapsa em uma linha com status.' },
  { ms: 300, t: 'delta', raw: { type: 'delta', text: 'Encontrei três projetos abertos. ' }, note: 'Texto em streaming: cada delta é anexado ao mesmo balão.' },
  { ms: 320, t: 'delta', raw: { type: 'delta', text: 'O prazo mais próximo é o do site novo, na sexta.' } },
  { ms: 700, t: 'message.end', raw: { type: 'message.end', status: 'complete', usage: { credits: 1, tokens_in: 812, tokens_out: 96 } }, note: 'Fecha a mensagem e debita créditos.' },
];
let labTimer = null;
let labFrames = [];
let labPlaying = false;

function stopLab() {
  if (labTimer) { clearTimeout(labTimer); labTimer = null; }
  labPlaying = false;
  const btn = $('#playStream');
  if (btn) btn.textContent = 'Reproduzir';
}

function paintLab() {
  const chat = $('#streamChat');
  const raw = $('#streamRaw');
  const log = $('#streamLog');
  if (!chat) return;
  const bubbles = [];
  let text = '';
  let steps = [];
  labFrames.forEach((f) => {
    if (f.t === 'delta') text += f.raw.text;
  });
  chat.innerHTML = `<div class="bubble user">Quais projetos estão abertos?</div>
    <div class="bubble agent">
      ${labFrames.some((f) => f.t === 'thinking') ? '<div class="lab-think"><i></i><i></i><i></i><span>Pensando</span></div>' : ''}
      <div class="lab-steps">${labFrames.filter((f) => f.t === 'step.start').map((f) => {
        const end = labFrames.find((x) => x.t === 'step.end');
        return `<div class="lab-step ${end ? 'ok' : 'run'}">
          <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h10M4 17h7"/></svg>
          <b>${esc(f.raw.tool)}</b>
          <span>${end ? (end.raw.summary + ' · ' + end.raw.ms + ' ms') : 'executando'}</span>
        </div>`;
      }).join('')}</div>
      ${text ? `<p class="lab-text">${esc(text)}${labPlaying ? '<i class="caret"></i>' : ''}</p>` : ''}
      ${labFrames.some((f) => f.t === 'message.end') ? `<div class="lab-usage">1 crédito · 812 tokens de entrada · 96 de saída</div>` : ''}
    </div>`;
  raw.innerHTML = labFrames.map((f) => `<div class="raw-line"><span>${esc(f.t)}</span><code>${esc(JSON.stringify(f.raw))}</code></div>`).join('') || '<div class="raw-empty">Nada transmitido ainda.</div>';
  if (log) log.innerHTML = labFrames.filter((f) => f.note).map((f) => `<li><b>${esc(f.t)}</b>${esc(f.note)}</li>`).join('') || '<li class="muted">Cada quadro aparece aqui com o que a interface faz com ele.</li>';
}

views.stream = function () {
  $('#view').innerHTML = `<div class="view-inner">
    <div class="section-head">
      <div><h2>Streaming</h2><p>Sequência de quadros entre o envio e a resposta completa.</p></div>
      <div style="display:flex;gap:6px">
        <button class="btn tiny" data-act="resetStream">Limpar</button>
        <button class="btn primary tiny" data-act="playStream" id="playStream">Reproduzir</button>
      </div>
    </div>
    <div class="lab-grid">
      <div class="panel-card">
        <h3>No chat</h3>
        <div class="lab-chat" id="streamChat"></div>
      </div>
      <div class="panel-card">
        <h3>Quadros na rede</h3>
        <div class="lab-raw" id="streamRaw"></div>
      </div>
    </div>
    <div class="panel-card">
      <h3>O que a interface faz com cada quadro</h3>
      <ul class="lab-log" id="streamLog"></ul>
    </div>
  </div>`;
  paintLab();
  if (labPlaying) $('#playStream').textContent = 'Parar';
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
