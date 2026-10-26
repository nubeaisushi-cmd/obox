'use strict';
const $ = id => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.matchMedia('(max-width: 959px)').matches;
const isNarrowCal = () => window.matchMedia('(max-width: 640px)').matches;

/* Crea elementos sin armar HTML a mano: el texto de la gente siempre entra como texto. */
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  let value;
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (k.slice(0, 5) === 'aria-' && v != null) { e.setAttribute(k, String(v)); continue; }
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k === 'value') value = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else if (['checked', 'disabled', 'hidden', 'draggable', 'selected'].includes(k)) e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  const add = (k) => {
    if (k == null || k === false) return;
    if (Array.isArray(k)) k.forEach(add);
    else e.append(k.nodeType ? k : document.createTextNode(String(k)));
  };
  kids.forEach(add);
  if (value !== undefined) e.value = value;
  return e;
}

/* ---------- Constantes ---------- */
const PRIO_ORDER = { Alta:0, Media:1, Baja:2 };
const PRIO_DOT = { Alta:'var(--warn)', Media:'var(--gold)', Baja:'var(--ink-faint)' };
const STATUS_OPTIONS = ['Por hacer', 'En curso', 'Espera de respuesta', 'Hecho'];
const STATUS_CLASS = { 'Por hacer':'', 'En curso':'st-curso', 'Espera de respuesta':'st-wait', 'Hecho':'st-done' };
const WELCOME = [
  'Bienvenido de vuelta.', 'Qué bueno verte por acá.', 'Arrancamos con todo.', 'Un día más, un paso más.',
  'Lo importante primero.', 'Manos a la obra.', 'Todo en orden, vamos de a una.', 'Hoy se avanza.',
  'Con calma y sin dejar nada colgado.', 'A ordenar el día.', 'Qué placer tenerte de vuelta.',
  'Hagamos que hoy cuente.', 'Un paso a la vez.', 'Acá estamos, listos.', 'Que sea un gran día.',
  'Prendé motores.', 'Cada tarea cerrada suma.', 'Buen momento para avanzar.', 'Respirá hondo y a trabajar.',
  'Hoy salen cosas lindas.'
];
const MOTIV = [
  "Hoy no hace falta hacerlo todo. Hace falta hacer lo importante.",
  "Un paso chico hoy vale más que un plan perfecto para mañana.",
  "Elegí tus 3 cosas y andá por ellas.",
  "Lo que se mide, se mueve. Anotá y avanzá.",
  "No es el día perfecto, es el día que tenés. Aprovechalo.",
  "Menos pestañas abiertas, más foco.",
  "Cerrá una cosa antes de abrir otra.",
  "El orden de hoy es el descanso de mañana."
];
const CELEBRATE_PHRASES = [
  ["🎉","Una menos, y bien hecha."], ["🚀","Así se avanza. Seguimos."], ["🙌","Eso es foco puro."],
  ["✨","Tu yo de mañana te lo agradece."], ["🔥","Vas prendido fuego hoy."], ["💪","Constancia le gana a la urgencia."],
  ["🏆","Otra al marcador."], ["☕","Bien ganado ese respiro."], ["🎯","Directo al punto. Así se hace."], ["🌟","Chiquita o grande, cuenta igual."]
];
/* Los ids de cliente son el nombre original, así las tareas que ya tenés siguen apuntando bien. */
const DEFAULT_CLIENTS = [
  { id:'West', name:'West', color:'#2569A8' }, { id:'Dimarco', name:'Dimarco', color:'#15875A' },
  { id:'Aisushi', name:'Aisushi', color:'#CC3A49' }, { id:'Poke', name:'Poke', color:'#B85A0B' },
  { id:'Adrian', name:'Adrian', color:'#7E3FCB' }, { id:'Calma', name:'Calma', color:'#C93F82' },
  { id:'Interno', name:'Interno', color:'#6B6759' }
];
const SWATCHES = ['#2569A8','#15875A','#CC3A49','#B85A0B','#7E3FCB','#C93F82','#0F7C8A','#6B6759','#8A6A00','#3F4FB8','#A33B2A','#2F6B3A'];
const LABELS = [
  { id:'reel', name:'Reel', color:'#C93F82' }, { id:'carrusel', name:'Carrusel', color:'#7E3FCB' },
  { id:'story', name:'Story', color:'#B85A0B' }, { id:'diseno', name:'Diseño', color:'#2569A8' },
  { id:'copy', name:'Copy', color:'#15875A' }, { id:'video', name:'Video', color:'#CC3A49' },
  { id:'urgente', name:'Urgente', color:'#8A6A00' }
];
const MODULES = [ ['tablero','Tablero de tareas'], ['calendario','Calendario'], ['tableros','Trello'], ['semana','Semana y retro'] ];
const DEFAULT_COLUMNS = ['Ideas', 'En producción', 'En revisión', 'Esperando al cliente', 'Listo'];
const ICON = {
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h10l4 4v14H5z"/><path d="M9 12h6M9 16h6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l4 4 10-10"/></svg>',
  clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5l-8.5 8.5a5 5 0 0 1-7-7L14 4.5a3.3 3.3 0 0 1 4.7 4.7L10.2 17.7a1.7 1.7 0 0 1-2.4-2.4L15.5 7.6"/></svg>',
  lines: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>'
};

/* Tareas traídas de tu Notion (Agenda general) el 24/09/2026. Se cargan una sola vez, la primera vez que abrís esta web. */
const SEED_TASKS = [
  { titulo:"Sticker golf", cliente:"Dimarco", estado:"Hecho", prioridad:"Alta", fecha:"2026-09-21", top3:true },
  { titulo:"Flyer Zac", cliente:"Calma", estado:"Hecho", prioridad:"Alta", fecha:"2026-09-21", top3:false },
  { titulo:"Venti Zac", cliente:"Calma", estado:"Hecho", prioridad:"Media", fecha:"2026-09-21", top3:true },
  { titulo:"Video retenedores", cliente:"Adrian", estado:"Hecho", prioridad:"Media", fecha:"2026-09-22", top3:false },
  { titulo:"Diente faltante", cliente:"Adrian", estado:"Hecho", prioridad:"Media", fecha:"2026-09-23", top3:false },
  { titulo:"Restauracion", cliente:"Adrian", estado:"En curso", prioridad:"Media", fecha:"2026-09-25", top3:false },
  { titulo:"Carrete aisu post prima", cliente:"Aisushi", estado:"Por hacer", prioridad:"Media", fecha:"2026-09-24", top3:false },
  { titulo:"Video presentacion Poke", cliente:"Poke", estado:"En curso", prioridad:"Media", fecha:"2026-09-25", top3:false },
  { titulo:"Video dia del Poke", cliente:"Poke", estado:"Por hacer", prioridad:"Media", fecha:"2026-09-28", top3:false },
  { titulo:"Gift poke", cliente:"Poke", estado:"Por hacer", prioridad:"Media", fecha:"2026-09-23", top3:false },
  { titulo:"Sticker Dimarco", cliente:"Dimarco", estado:"En curso", prioridad:"Alta", fecha:"2026-09-23", top3:true },
  { titulo:"Subir videos y copy al drive", cliente:"Adrian", estado:"Hecho", prioridad:"Baja", fecha:"2026-09-22", top3:false },
  { titulo:"Ordenar trello", cliente:"Interno", estado:"Hecho", prioridad:"Baja", fecha:"2026-09-22", top3:false }
];

/* ---------- Estado ---------- */
let mode = 'local', dbApi = null;
const me = { id:null, name:'', avatar:'', email:'', isOwner:false, isAdmin:true };
let booting = true;
let myMember = null, dataStarted = false, requestSent = false, selfRegistering = false, requestFailed = false;
let composerCol = null, asignadoTouched = false;
let gateKind = null;
const D = { tasks:[], clients:[], campaigns:[], boards:[], cards:[], members:[], requests:[], events:[] };
const PROF = {};
let loaded = false;
let dailyCache = {}, weeklyCache = {};
let dailyLoaded = false;
let filterClient = null, searchQ = '', onlyMine = false;
let currentView = 'board', sidebarOpen = true, openDayIso = null, swapping = false;
let pendingDeleteId = null, pendingDeleteTimer = null;
let dailyDirty = false, weekDirty = false, selectedEnergy = '';
let calDate = new Date();
let currentBoardId = '', openCardId = null, boardModalId = null;
let dragging = false, deferredRender = false;
let teamEditing = null;

/* ---------- Utilidades (fechas siempre en hora local) ---------- */
const ESC = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC[c]); }
const pad = n => String(n).padStart(2, '0');
function fmtISO(d){ return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseISO(s){ const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function todayStr(){ return fmtISO(new Date()); }
function addDays(str, n){ const d = parseISO(str); d.setDate(d.getDate() + n); return fmtISO(d); }
function daysLate(fecha){ return Math.round((parseISO(todayStr()) - parseISO(fecha)) / 86400000); }
function cap(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function fmtLong(iso){ return parseISO(iso).toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' }); }
function fmtShort(iso){ return parseISO(iso).toLocaleDateString('es-AR', { day:'numeric', month:'short' }); }
function norm(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function mondayOfWeek(dateStr){ const d = parseISO(dateStr); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return fmtISO(d); }
function plural(n, one, many){ return n + ' ' + (n === 1 ? one : many); }
function newId(){ return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function slug(s){ return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cliente'; }
function lsGet(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || fallback); } catch(e) { return JSON.parse(fallback); } }
function lsSet(key, val){ try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} }
function lsStr(key){ try { return localStorage.getItem(key) || ''; } catch(e) { return ''; } }
function lsPut(key, val){ try { localStorage.setItem(key, val); } catch(e) {} }

const WELCOME_NOW = (() => {
  let last = -1;
  try { last = parseInt(localStorage.getItem('agenda.lastWelcome') || '-1', 10); } catch(e) {}
  let i; do { i = Math.floor(Math.random() * WELCOME.length); } while (i === last && WELCOME.length > 1);
  try { localStorage.setItem('agenda.lastWelcome', String(i)); } catch(e) {}
  return WELCOME[i];
})();
function paintGreeting() {
  $('saludo').textContent = WELCOME_NOW;
  $('fecha-hoy').textContent = cap(fmtLong(todayStr()));
}

/* ---------- Asignaciones: quién asignó y avisos ---------- */
// Cada tarea o tarjeta puede tener varias personas asignadas ("asignados").
// "asignado" guarda a la primera, para que los datos viejos y las copias de seguridad sigan funcionando.
function assigneesOf(x){
  if (!x) return [];
  if (Array.isArray(x.asignados) && x.asignados.length) return x.asignados.filter(Boolean);
  return x.asignado ? [x.asignado] : [];
}
function assignFields(list){
  const l = [...new Set((list || []).filter(Boolean))];
  return { asignados: l, asignado: l[0] || null };
}
// Si sumás a otra persona, queda registrado quién, cuándo y a quiénes. Eso dispara el aviso al celular y el aviso dentro de la app.
function assignStamp(prevDoc, next){
  const prev = assigneesOf(prevDoc);
  const before = new Set(prev);
  const nuevos = [...new Set(next || [])].filter(id => id && !before.has(id) && id !== me.id);
  if (!nuevos.length) return {};
  // Si hace poco sumaste a otra persona y todavía puede no haber recibido el aviso, se conserva en la lista (no se pisa).
  let keep = [];
  if (prevDoc && prevDoc.asignadoPor === me.id && prevDoc.asignadoAt && Date.now() - prevDoc.asignadoAt < 2 * 60 * 1000 && Array.isArray(prevDoc.asignadoNuevos) && prevDoc.avisadoAt !== prevDoc.asignadoAt)
    keep = prevDoc.asignadoNuevos.filter(id => (next || []).includes(id));
  return { asignadoPor: me.id, asignadoAt: Date.now(), asignadoNuevos: [...new Set([...keep, ...nuevos])] };
}
function assignmentNotices(prevDocs, nextDocs, meId, now){
  const before = new Map(prevDocs.map(x => [x.id, x]));
  const out = [];
  nextDocs.forEach(x => {
    if (!meId || !x.asignadoPor || x.asignadoPor === meId) return;
    const nuevos = Array.isArray(x.asignadoNuevos) ? x.asignadoNuevos : (x.asignado ? [x.asignado] : []);
    if (!nuevos.includes(meId) || !assigneesOf(x).includes(meId)) return;
    if (!x.asignadoAt || now - x.asignadoAt > 10 * 60 * 1000) return;
    const b = before.get(x.id);
    if (b && assigneesOf(b).includes(meId)) return; // ya estaba asignado: no es novedad para mí
    out.push(x);
  });
  return out;
}
function firstName(uid){ return String(nameOf(uid) || 'Alguien').trim().split(/\s+/)[0]; }
function announceAssignments(col, prevDocs, nextDocs){
  const list = assignmentNotices(prevDocs, nextDocs, me.id, Date.now()).filter(x => !(col === 'tasks' && x.trelloCardId));
  if (!list.length) return;
  const noun = col === 'tasks' ? 'la tarea' : 'la tarjeta';
  const x = list[0];
  const msg = list.length === 1
    ? `${firstName(x.asignadoPor)} te asignó ${noun} «${x.titulo}» en ${clientName(x.cliente)}`
    : `${firstName(x.asignadoPor)} y otros te asignaron ${list.length} ${col === 'tasks' ? 'tareas' : 'tarjetas'} nuevas`;
  const open = () => {
    if (col === 'cards') { const b = x.boardId; if (b) { currentBoardId = b; lsPut('agenda_board_sel', b); } setView('boards'); setTimeout(() => openCard(x.id), 250); }
    else setView('board');
  };
  showToast(msg, { label: 'Ver', fn: open }, 9000);
}

/* Aviso al celular por la vía gratuita (Cloudflare Pages Functions, carpeta functions/).
   Después de guardar una asignación se le pide a /api/notificar que mande el aviso.
   Si eso no está configurado o falla, no pasa nada: el aviso dentro de la app sigue andando. */
function pushViaWorker(){ return window.PUSH_MODE !== 'firebase'; }
async function pingNotify(col, id){
  try {
    if (mode !== 'db' || !FB.auth || !FB.auth.currentUser || !pushViaWorker()) return;
    const token = await FB.auth.currentUser.getIdToken();
    await fetch('/api/notificar', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ col, id }), keepalive: true });
  } catch(e) { /* sin aviso al celular */ }
}
function afterAssign(col, id, saved, patch){
  if (!patch || !patch.asignadoNuevos || !id) return;
  Promise.resolve(saved).then((ok) => {
    if (ok === false) return;
    // Una tarea vinculada a Trello y su tarjeta son el mismo trabajo:
    // la notificación sale por la tarjeta para no duplicarla.
    const task = col === 'tasks' ? D.tasks.find(t => t.id === id) : null;
    if (task && task.trelloCardId) pingNotify('cards', task.trelloCardId);
    else pingNotify(col, id);
  });
}

/* Personas asignadas: un desplegable compacto, se puede marcar más de una (no crece aunque haya muchos nombres). */
let asgOpen = null; // { close } del desplegable abierto
document.addEventListener('mousedown', (e) => { if (asgOpen && !asgOpen.owns(e.target)) asgOpen.close(); }, true);
document.addEventListener('keydown', (e) => { if (asgOpen && e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); const f = asgOpen.trigger; asgOpen.close(); if (f) f.focus(); } }, true);
window.addEventListener('resize', () => { if (asgOpen) asgOpen.close(); });
window.addEventListener('scroll', (e) => { if (asgOpen && !asgOpen.owns(e.target)) asgOpen.close(); }, true);

function asgPicker(host, opts){
  const onChange = opts && opts.onChange;
  const st = { members: [], sel: [], disabled: false, pop: null, trigger: null };
  host.classList.add('asg');
  const labelText = () => {
    const names = st.sel.map(id => id === me.id ? 'Yo' : firstName(id));
    if (!names.length) return 'Sin asignar';
    if (names.length <= 2) return names.join(', ');
    return names.slice(0, 1).join('') + ' y ' + (names.length - 1) + ' más';
  };
  const closePop = () => {
    if (st.pop) { st.pop.remove(); st.pop = null; }
    if (asgOpen && asgOpen.host === host) asgOpen = null;
    if (st.trigger) st.trigger.setAttribute('aria-expanded', 'false');
  };
  const paintRows = () => {
    if (!st.pop) return;
    const list = st.pop.querySelector('.asg-list');
    const q = norm((st.pop.querySelector('.asg-search') || {}).value || '');
    list.replaceChildren(...st.members.filter(m => !q || norm(m.name).includes(q)).map(m => {
      const on = st.sel.includes(m.id);
      return h('button', { type: 'button', class: 'asg-chip' + (on ? ' on' : ''), 'data-id': m.id, role: 'menuitemcheckbox', 'aria-checked': on, 'aria-pressed': on, title: m.name,
        onclick: () => {
          st.sel = on ? st.sel.filter(x => x !== m.id) : [...st.sel, m.id];
          paintRows(); paintTrigger();
          if (onChange) onChange(st.sel.slice());
        } },
        avatarEl(m.id), h('span', { class: 'asg-name', text: m.id === me.id ? m.name + ' (yo)' : m.name }), h('span', { class: 'asg-tick', html: ICON.check }));
    }));
    if (!list.children.length) list.append(h('span', { class: 'asg-empty', text: 'Nadie coincide' }));
  };
  const place = () => {
    if (!st.pop || !st.trigger) return;
    const r = st.trigger.getBoundingClientRect();
    const pw = Math.max(r.width, 220), ph = st.pop.offsetHeight || 260;
    const below = window.innerHeight - r.bottom, up = r.top > below && below < ph + 12;
    st.pop.style.width = pw + 'px';
    st.pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8)) + 'px';
    st.pop.style.top = (up ? Math.max(8, r.top - ph - 6) : r.bottom + 6) + 'px';
  };
  const openPop = () => {
    if (st.disabled || st.pop || !st.members.length) return;
    if (asgOpen) asgOpen.close();
    const pop = h('div', { class: 'asg-pop', role: 'menu' },
      st.members.length > 6 ? h('input', { class: 'ctl asg-search', type: 'search', placeholder: 'Buscar persona…', 'aria-label': 'Buscar persona', oninput: paintRows }) : null,
      h('div', { class: 'asg-list' }),
      h('div', { class: 'asg-foot' }, h('button', { type: 'button', class: 'asg-clear', text: 'Quitar a todos', onclick: () => { st.sel = []; paintRows(); paintTrigger(); if (onChange) onChange([]); } })));
    document.body.append(pop);
    st.pop = pop; st.trigger.setAttribute('aria-expanded', 'true');
    paintRows(); place();
    asgOpen = { host, trigger: st.trigger, close: closePop, owns: (t) => pop.contains(t) || st.trigger.contains(t) };
    const first = pop.querySelector('.asg-search') || pop.querySelector('.asg-chip'); if (first) first.focus();
  };
  const paintTrigger = () => {
    if (!st.members.length) { host.replaceChildren(h('span', { class: 'asg-empty', text: 'No hay personas para asignar' })); st.trigger = null; return; }
    const t = h('button', { type: 'button', class: 'asg-trigger ctl', 'aria-haspopup': 'menu', 'aria-expanded': st.pop ? 'true' : 'false', disabled: st.disabled, onclick: () => (st.pop ? closePop() : openPop()) },
      st.sel.length ? avatarStack(st.sel, 3) : h('span', { class: 'asg-none', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></svg>' }),
      h('span', { class: 'asg-label' + (st.sel.length ? '' : ' empty'), text: labelText() }),
      h('span', { class: 'asg-caret', html: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>' }));
    host.replaceChildren(t); st.trigger = t;
    if (asgOpen && asgOpen.host === host) asgOpen.trigger = t;
  };
  return {
    set(members, sel, disabled){
      st.members = members.slice(); st.sel = (sel || []).slice(); st.disabled = !!disabled;
      if (st.disabled || !st.members.length) closePop();
      paintTrigger(); paintRows();
    },
    get(){ return st.sel.slice(); }
  };
}
function avatarStack(ids, max){
  const m = max || 3;
  const wrap = h('span', { class: 'av-stack', title: ids.map(nameOf).join(', ') }, ids.slice(0, m).map(id => avatarEl(id)));
  if (ids.length > m) wrap.append(h('i', { class: 'av more', text: '+' + (ids.length - m) }));
  return wrap;
}

/* ---------- Avisos ---------- */
let toastTimer = null, toastAction = null;
function showToast(msg, action, ms) {
  if (!action && pendingDeleteId) flushPendingDelete();
  $('toast-text').textContent = msg;
  const btn = $('toast-btn');
  if (action) { btn.hidden = false; btn.textContent = action.label; toastAction = action.fn; }
  else { btn.hidden = true; toastAction = null; }
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, ms || (action ? 5000 : 2800));
}
function hideToast() { $('toast').classList.remove('show'); toastAction = null; }
$('toast-btn').addEventListener('click', () => { const fn = toastAction; hideToast(); if (fn) fn(); });

/* ---------- Personas y permisos ---------- */
function teamMode(){ return mode === 'db' && !!me.id; }
function hasAccess(){ return !booting && (me.isAdmin || !!myMember); }
function clientById(id){ return D.clients.find(c => c.id === id) || null; }
function clientName(id){ const c = clientById(id); return c ? c.name : (id || 'Sin cliente'); }
function clientColor(id){ const c = clientById(id); return c ? c.color : '#6B6759'; }
function activeClients(){ return D.clients.filter(c => !c.archived).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)); }
function scopeSees(m, cid){
  if (!m) return false;
  if (m.role === 'cliente') return (m.clients || []).includes(cid);
  return m.role === 'admin' || m.all || (m.clients || []).includes(cid);
}
function clientVisible(cid){
  const c = clientById(cid);
  if (!c) return me.isAdmin;
  if (c.archived) return false;
  return me.isAdmin || scopeSees(myMember, cid);
}
function canWrite(cid){
  if (!clientVisible(cid)) return false;
  if (me.isAdmin) return true;
  return !!myMember && !['viewer', 'cliente'].includes(myMember.role);
}
function writableClients(){ return activeClients().filter(c => canWrite(c.id)); }
function canWriteAny(){ return writableClients().length > 0; }
function hasModule(m){
  if (me.isAdmin) return true;
  if (!myMember) return false;
  if (myMember.role === 'cliente') return ['tablero', 'calendario', 'tableros'].includes(m);

  const modules = myMember.modules;

  // Los miembros antiguos sin lista de módulos conservan el acceso.
  if (!Array.isArray(modules)) return true;

  // Compatibilidad con el identificador anterior de Trello.
  if (m === 'tableros') {
    return modules.includes('tableros') ||
           modules.includes('tableros (trello)');
  }

  return modules.includes(m);
}
function myRoleLabel(){ return me.isAdmin ? 'Admin' : (myMember && myMember.role === 'cliente' ? 'Cliente' : (myMember && myMember.role === 'viewer' ? 'Solo lectura' : 'Miembro')); }
function nameOf(uid){
  if (!uid) return '';
  const p = PROF[uid];
  if (p && p.nick) return p.nick;
  if (uid === me.id) return me.name || 'Vos';
  return (p && p.name) || 'Sin nombre';
}
function initials(name){ return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?'; }
function avatarEl(uid, big){
  const name = nameOf(uid);
  const p = PROF[uid] || {};
  const cls = 'av' + (big ? ' lg' : '');
  const color = /^#[0-9a-fA-F]{6}$/.test(p.color || '') ? p.color : '';
  if (p.avMode === 'emoji' && p.emoji) return h('i', { class: cls + ' ph emo', title: name, text: p.emoji, style: color ? 'background:' + color : '' });
  if (p.avMode === 'pic' && /^data:image\//.test(p.pic || '')) return h('img', { class: cls, src: p.pic, alt: '', title: name });
  const src = uid === me.id && me.avatar ? me.avatar : p.avatarUrl;
  const ph = () => h('i', { class: cls + ' ph', title: name, text: initials(name), style: color ? 'background:' + color : '' });
  if (src) {
    const img = h('img', { class: cls, src, alt: '', title: name, referrerpolicy: 'no-referrer' });
    img.addEventListener('error', () => { if (img.parentNode) img.replaceWith(ph()); });
    return img;
  }
  return ph();
}
function memberChoices(cid){
  return D.members.filter(m => scopeSees(m, cid)).map(m => ({ id: m.id, name: nameOf(m.id) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/* ---------- Capa de datos ---------- */
const LOCAL_KEYS = { tasks:'agenda_festejo_tasks_v1', clients:'agenda_clients_v1', campaigns:'agenda_campaigns_v1', boards:'agenda_boards_v1', cards:'agenda_cards_v1', events:'agenda_events_v1' };
const LOCAL_DAILY_KEY = 'agenda_festejo_daily_v1';
const LOCAL_WEEKLY_KEY = 'agenda_festejo_weekly_v1';
const LOCAL_SEED_KEY = 'agenda_festejo_seeded_v2';

function setSyncStatus(text, on) {
  $('sync-text').textContent = text;
  $('sync-dot').classList.toggle('off', !on);
}
function saveLocal(col){ if (mode === 'local' && LOCAL_KEYS[col]) lsSet(LOCAL_KEYS[col], D[col]); }

function upsertLocal(col, id, data, merge){
  const i = D[col].findIndex(x => x.id === id);
  if (i >= 0) D[col][i] = merge ? { ...D[col][i], ...data } : { id, ...data };
  else D[col].push({ id, ...data });
}

// Sincronización Trello ↔ Tareas. La ID determinística evita duplicados.
const mirrorSyncBusy = new Set();
const mirrorSyncPending = new Map();
const mirrorSyncPendingCreate = new Map();
const mirrorTaskId = cardId => 'trello_' + cardId;
function cardMirrorFields(c){
  const ids = assigneesOf(c);
  const isDone = !!(c.ok || c.hecho);
  return { trelloCardId:c.id, titulo:c.titulo || 'Tarjeta sin título', cliente:c.cliente, fecha:c.vence || null,
    estado:isDone ? 'Hecho' : 'Por hacer', prioridad:'Media', notas:c.desc || '',
    asignados:ids, asignado:ids[0] || null, hideFromTasks:!!c.hideFromTasks, hideFromCalendar:!!c.hideFromCalendar,
    orden:c.createdAt || Date.now(), creadoPor:c.creadoPor || null };
}
async function syncCardMirror(card, createIfMissing=true){
  if (!card || (myMember && myMember.role === 'cliente')) return;
  if (mirrorSyncBusy.has(card.id)) {
    mirrorSyncPending.set(card.id, card);
    mirrorSyncPendingCreate.set(card.id, !!createIfMissing || !!mirrorSyncPendingCreate.get(card.id));
    return;
  }
  mirrorSyncBusy.add(card.id);
  try {
    const id = mirrorTaskId(card.id);
    let task = D.tasks.find(t => t.id === id || t.trelloCardId === card.id);
    if (!task && mode === 'db') {
      const snap = await dbApi.doc('tasks/' + id).get();
      if (snap.exists) { task = { id, ...(snap.data() || {}) }; upsertLocal('tasks', id, task, false); }
    }
    if (!task && createIfMissing) {
      const data = cardMirrorFields(card);
      upsertLocal('tasks', id, data, false);
      if (mode === 'db') await dbApi.doc('tasks/' + id).set(data, { merge:true });
      saveLocal('tasks');
      scheduleRender();
      return;
    }
    if (!task) return;
    const fields = cardMirrorFields(card);
    const patch = Object.fromEntries(Object.entries(fields).filter(([k,v]) => k !== 'trelloCardId' && JSON.stringify(task[k] ?? null) !== JSON.stringify(v ?? null)));
    if (Object.keys(patch).length) {
      upsertLocal('tasks', task.id, patch, true);
      if (mode === 'db') await dbApi.doc('tasks/' + task.id).set(patch, { merge:true });
      saveLocal('tasks');
      scheduleRender();
    }
  } catch(e) { console.warn('No se pudo sincronizar la tarjeta con Tareas', e); }
  finally {
    mirrorSyncBusy.delete(card.id);
    const pending = mirrorSyncPending.get(card.id);
    if (pending) {
      const shouldCreate = !!mirrorSyncPendingCreate.get(card.id);
      mirrorSyncPending.delete(card.id);
      mirrorSyncPendingCreate.delete(card.id);
      syncCardMirror(pending, shouldCreate);
    }
  }
}
async function syncTaskMirror(task, patch){
  if (!task || !task.trelloCardId) return;
  const card = D.cards.find(c => c.id === task.trelloCardId);
  if (!card) return;
  const cp = {};
  if ('titulo' in patch) cp.titulo = patch.titulo;
  if ('fecha' in patch) cp.vence = patch.fecha || null;
  if ('notas' in patch) cp.desc = patch.notas || '';
  if ('estado' in patch) { cp.hecho = patch.estado === 'Hecho'; cp.ok = cp.hecho; }
  if ('asignados' in patch || 'asignado' in patch) {
    cp.asignados = assigneesOf({ ...task, ...patch });
    cp.asignado = cp.asignados[0] || null;
    cp.asignadoPor = ('asignadoPor' in patch) ? patch.asignadoPor : (task.asignadoPor || null);
    cp.asignadoAt = ('asignadoAt' in patch) ? patch.asignadoAt : (task.asignadoAt || null);
    cp.asignadoNuevos = ('asignadoNuevos' in patch) ? (patch.asignadoNuevos || []) : (task.asignadoNuevos || []);
    cp.avisadoAt = ('avisadoAt' in patch) ? (patch.avisadoAt || null) : (task.avisadoAt || null);
  }
  const changed = Object.fromEntries(Object.entries(cp).filter(([k,v]) => JSON.stringify(card[k] ?? null) !== JSON.stringify(v ?? null)));
  if (!Object.keys(changed).length) return;
  upsertLocal('cards', card.id, changed, true);
  saveLocal('cards');
  scheduleRender();
  if (mode === 'db') {
    try { await dbApi.doc('cards/' + card.id).set(changed, { merge:true }); }
    catch(e) { console.warn('No se pudo sincronizar Tareas con Trello', e); throw e; }
  }
}
async function persist(col, fn){
  saveLocal(col);
  scheduleRender();
  if (mode !== 'db') return true;
  try { await fn(); return true; }
  catch(e) { showToast('No se pudo guardar. Revisá tu conexión o tus permisos.'); resync(col); return false; }
}
function wSet(col, id, data){ upsertLocal(col, id, data, false); if (col === 'cards') syncCardMirror({ id, ...data }, true); return persist(col, () => dbApi.doc(col + '/' + id).set(data)); }
async function wUpd(col, id, patch){
  const before = D[col].find(x => x.id === id);
  let safePatch = patch;
  if (col === 'cards' && ('ok' in patch || 'hecho' in patch)) {
    const done = ('ok' in patch) ? !!patch.ok : !!patch.hecho;
    safePatch = { ...patch, ok: done, hecho: done };
  }
  upsertLocal(col, id, safePatch, true);
  if (col === 'cards') syncCardMirror(D.cards.find(x => x.id === id), true);
  if (col === 'tasks') {
    try { await syncTaskMirror({ ...(before || {}), ...safePatch, id }, safePatch); }
    catch(e) { showToast('No se pudo sincronizar la tarea vinculada con Trello.'); }
  }
  return persist(col, () => dbApi.doc(col + '/' + id).update(safePatch));
}
function wDel(col, id){ D[col] = D[col].filter(x => x.id !== id); return persist(col, () => dbApi.doc(col + '/' + id).delete()); }
function resync(col){ if (mode === 'db') { if (col === 'events') { if (typeof mergeEvents === 'function') mergeEvents(); return; } rebuild(col); scheduleRender(); } }

function startLocal(reason){
  mode = 'local'; me.isAdmin = true; me.isOwner = true; booting = false;
  setSyncStatus(reason === 'config' ? 'Modo local: falta conectar Firebase (mirá el LEEME)' : (reason === 'offline' ? 'Sin conexión con Firebase: guardado solo en este navegador' : 'Guardado solo en este navegador'), false);
  D.tasks = lsGet(LOCAL_KEYS.tasks, '[]');
  let seeded = false;
  try { seeded = !!localStorage.getItem(LOCAL_SEED_KEY); } catch(e) {}
  if (!seeded && D.tasks.length === 0) {
    D.tasks = SEED_TASKS.map((t, i) => ({ id: 'seed' + Date.now() + '_' + i, ...t }));
    saveLocal('tasks');
  }
  lsPut(LOCAL_SEED_KEY, '1');
  D.clients = lsGet(LOCAL_KEYS.clients, '[]');
  D.campaigns = lsGet(LOCAL_KEYS.campaigns, '[]');
  if (!D.clients.length) { D.clients = DEFAULT_CLIENTS.map((c, i) => ({ ...c, orden: i })); saveLocal('clients'); }
  D.boards = lsGet(LOCAL_KEYS.boards, '[]');
  D.cards = lsGet(LOCAL_KEYS.cards, '[]');
  D.events = lsGet(LOCAL_KEYS.events, '[]');
  dailyCache = lsGet(LOCAL_DAILY_KEY, '{}');
  weeklyCache = lsGet(LOCAL_WEEKLY_KEY, '{}');
  dailyLoaded = true;
  loaded = true;
  paintGreeting(); renderDaily(); scheduleRender();
}

/* ---------- Firebase: sesión, permisos y datos ---------- */
const FB = { auth:null, db:null };
const SCOPED = ['tasks', 'campaigns', 'boards', 'cards'];
const scopedData = { tasks:new Map(), campaigns:new Map(), boards:new Map(), cards:new Map() };
const scopedUnsub = { tasks:new Map(), campaigns:new Map(), boards:new Map(), cards:new Map() };
const firstSeen = new Set();
let clientsReady = false, sessionUid = null, ownerTried = false, hadMember = false, readErrorShown = false;
let unsubs = [];
function track(fn){ unsubs.push(fn); return fn; }

function firebaseConfigured(){
  const c = window.FIREBASE_CONFIG;
  return !!(c && c.apiKey && c.projectId && !/PEGA|TU_|XXXX/i.test(c.apiKey + c.projectId));
}

function readError(){
  if (readErrorShown) return;
  readErrorShown = true;
  showToast('No pude leer algunos datos. Si acabás de recibir acceso, recargá la página.', null, 6000);
}

async function initStore() {
  if (!window.firebase || !firebaseConfigured()) { startLocal(window.firebase ? 'config' : 'offline'); return; }
  setGate('loading');
  try {
    firebase.initializeApp(window.FIREBASE_CONFIG);
    FB.auth = firebase.auth(); FB.db = firebase.firestore();
    try { FB.db.settings({ ignoreUndefinedProperties: true }); } catch(e) {}
    try { await FB.db.enablePersistence({ synchronizeTabs: true }); } catch(e) {}
  } catch(e) { setGate(null); startLocal('offline'); return; }
  dbApi = FB.db; mode = 'db';
  FB.auth.onAuthStateChanged((user) => {
    if (!user) { sessionUid = null; setGate('login'); return; }
    if (sessionUid === user.uid) return;
    sessionUid = user.uid;
    me.id = user.uid; me.name = user.displayName || user.email || ''; me.avatar = user.photoURL || ''; me.email = user.email || '';
    me.isAdmin = false; me.isOwner = false; booting = false;
    paintGreeting();
    setGate('loading');
    watchMe();
  });
}

async function signIn(){
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try { await FB.auth.signInWithPopup(provider); }
  catch(e) {
    const code = (e && e.code) || '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') { try { await FB.auth.signInWithRedirect(provider); } catch(x) {} }
    else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') { /* cerró la ventana */ }
    else if (code === 'auth/unauthorized-domain') showToast('Este dominio no está autorizado en Firebase. Mirá el LEEME, paso 7.', null, 8000);
    else showToast('No pude iniciar sesión. Probá de nuevo.');
  }
}
async function signOutNow(){
  try { await FB.auth.signOut(); } catch(e) {}
  try { await FB.db.terminate(); await FB.db.clearPersistence(); } catch(e) {}
  location.reload();
}

/* Mi ficha de equipo: si existe, entro; si soy el dueño, me registro; si no, pido acceso. */
function watchMe(){
  track(dbApi.doc('members/' + me.id).onSnapshot((snap) => {
    if (!snap.exists && snap.metadata && snap.metadata.fromCache) return;
    const was = me.isAdmin;
    myMember = snap.exists ? { id: snap.id, ...(snap.data() || {}) } : null;
    me.isAdmin = !!(myMember && myMember.role === 'admin');
    me.isOwner = !!(myMember && myMember.owner === true);
    // Valor predeterminado en cada inicio de sesión: miembros ven solo sus tareas;
    // admin y dueño ven todas. No se guarda la elección anterior.
    onlyMine = !(me.isAdmin || me.isOwner || (myMember && myMember.role === 'cliente'));
    if (myMember) {
      hadMember = true;
      setGate(null);
      if (myMember.role === 'cliente') {
        $('cover').hidden = true;
        $('app').hidden = false;
        currentView = 'board';
        sidebarOpen = false;
      }
      startData();
      if (was !== me.isAdmin) { dataReset(); }
      syncScoped();
      paintGreeting();
      scheduleRender();
      return;
    }
    if (hadMember) { location.reload(); return; } // me quitaron del equipo
    if (ownerTried) { setGate('pending'); return; }
    ownerTried = true;
    registerOwnerOrRequest();
  }, () => { setGate('error'); }));
}
async function registerOwnerOrRequest(){
  try {
    await dbApi.doc('members/' + me.id).set({ role:'admin', owner:true, all:true, clients:[], modules: MODULES.map(m => m[0]), at: Date.now() });
    return; // el próximo aviso de la ficha abre la app
  } catch(e) { /* no soy el dueño: pido acceso */ }
  setGate('pending');
  try { await dbApi.doc('requests/' + me.id).set({ name: me.name, photo: me.avatar, email: me.email || '', at: Date.now() }); }
  catch(e) { requestFailed = true; setGate('pending'); }
}

function startData(){
  if (dataStarted) return;
  dataStarted = true;
  setSyncStatus('Conectado al equipo', true);
  if (myMember && myMember.role === 'cliente') {
    const ids = [...new Set(myMember.clients || [])];
    let pending = ids.length;
    clientsReady = ids.length === 0;
    if (!ids.length) { syncScoped(); scheduleRender(); }
    ids.forEach(id => track(dbApi.doc('clients/' + id).onSnapshot((snap) => {
      D.clients = D.clients.filter(c => c.id !== id);
      if (snap.exists) D.clients.push({ id: snap.id, ...(snap.data() || {}) });
      pending = Math.max(0, pending - 1);
      if (pending === 0) { clientsReady = true; syncScoped(); scheduleRender(); }
    }, () => { pending = Math.max(0, pending - 1); if (pending === 0) { clientsReady = true; syncScoped(); scheduleRender(); } })));
  } else {
    track(dbApi.collection('clients').onSnapshot((snap) => {
      D.clients = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
      clientsReady = true;
      syncScoped();
      scheduleRender();
    }, readError));
  }
  if (!(myMember && myMember.role === 'cliente')) track(dbApi.collection('members').onSnapshot((snap) => {
    D.members = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
    scheduleRender();
  }, readError));
  if (!(myMember && myMember.role === 'cliente')) track(dbApi.collection('users').onSnapshot((snap) => {
    snap.docs.forEach(d => { const u = d.data() || {}; PROF[d.id] = { id: d.id, name: u.name || '', avatarUrl: u.photo || '', nick: u.nick || '', emoji: u.emoji || '', color: u.color || '', pic: u.pic || '', avMode: u.avMode || '' }; });
    if (typeof profileSynced === 'function') profileSynced();
    scheduleRender();
  }, () => {}));
  if (me.isAdmin) subRequests();
  if (!(myMember && myMember.role === 'cliente')) {
    startPrivate();
    if (typeof startEvents === 'function') startEvents();
    publishProfile();
    pushInit();
  }
}
function subRequests(){
  if (subRequests.on) return;
  subRequests.on = true;
  track(dbApi.collection('requests').onSnapshot((snap) => {
    D.requests = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
    D.requests.forEach(r => { if (!PROF[r.id] || !PROF[r.id].name) PROF[r.id] = { id: r.id, name: r.name || '', avatarUrl: r.photo || '' }; });
    scheduleRender();
  }, () => {}));
}
function publishProfile(){
  dbApi.doc('users/' + me.id).set({ name: me.name || '', photo: me.avatar || '' }, { merge: true }).catch(() => {});
}

/* tareas, tableros y tarjetas: una escucha por cliente visible (el admin escucha todo de una). */
function visibleClientIds(){
  return D.clients.filter(c => !c.archived && scopeSees(myMember, c.id)).map(c => c.id);
}
function rebuild(col){ D[col] = [].concat(...scopedData[col].values()); }
function dataReset(){
  SCOPED.forEach(col => { scopedUnsub[col].forEach(fn => fn()); scopedUnsub[col].clear(); scopedData[col].clear(); D[col] = []; });
  firstSeen.clear(); loaded = false;
  if (me.isAdmin) subRequests();
}
function updateLoaded(keys){
  const ok = clientsReady && keys.every(k => SCOPED.every(col => firstSeen.has(col + ':' + k)));
  if (ok && !loaded) { loaded = true; scheduleRender(); }
}
function syncScoped(){
  if (!clientsReady || !myMember) return;
  const keys = me.isAdmin ? ['*'] : visibleClientIds();
  SCOPED.forEach(col => {
    const unsub = scopedUnsub[col], data = scopedData[col];
    for (const k of [...unsub.keys()]) if (!keys.includes(k)) { unsub.get(k)(); unsub.delete(k); data.delete(k); }
    for (const k of keys) {
      if (unsub.has(k)) continue;
      const q = k === '*' ? dbApi.collection(col) : dbApi.collection(col).where('cliente', '==', k);
      const fn = q.onSnapshot((snap) => {
        const nextDocs = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
        if (firstSeen.has(col + ':' + k) && (col === 'tasks' || col === 'cards')) announceAssignments(col, data.get(k) || [], nextDocs);
        data.set(k, nextDocs);
        firstSeen.add(col + ':' + k);
        rebuild(col);
        // Sincronizar usando el estado más reciente ya reconstruido, no el snapshot anterior.
        if (col === 'cards') D.cards.forEach(c => syncCardMirror(c, true));
        updateLoaded(keys);
        scheduleRender();
      }, () => { firstSeen.add(col + ':' + k); readError(); updateLoaded(keys); });
      unsub.set(k, fn); track(fn);
    }
    rebuild(col);
  });
  updateLoaded(keys);
}

/* Daily y Semana son personales: viven en el espacio privado de cada persona. */
function privOK(){ return mode === 'db' && !!me.id; }
function privRef(name){ return dbApi.collection('users/' + me.id + '/' + name); }
function startPrivate(){
  if (!privOK()) { dailyCache = lsGet(LOCAL_DAILY_KEY, '{}'); weeklyCache = lsGet(LOCAL_WEEKLY_KEY, '{}'); dailyLoaded = true; renderDaily(); return; }
  track(privRef('daily').onSnapshot((snap) => {
    dailyCache = {};
    snap.docs.forEach(d => { dailyCache[d.id] = d.data() || {}; });
    dailyLoaded = true;
    renderDaily();
  }, () => { dailyLoaded = true; renderDaily(); }));
  track(privRef('weekly').onSnapshot((snap) => {
    weeklyCache = {};
    snap.docs.forEach(d => { weeklyCache[d.id] = d.data() || {}; });
    if (currentView === 'week') renderWeek();
  }, () => {}));
}

/* ---------- Pantalla de acceso ---------- */
function setGate(kind){
  gateKind = kind;
  const g = $('gate');
  g.hidden = !kind;
  if (!kind) return;
  const who = $('gate-who'), acts = $('gate-actions');
  who.replaceChildren(); acts.replaceChildren();
  const T = { title:$('gate-title'), text:$('gate-text'), extra:$('gate-extra') };
  T.extra.textContent = '';
  if (kind === 'loading') {
    T.title.textContent = 'Un momento…'; T.text.textContent = '';
  } else if (kind === 'login') {
    T.title.textContent = 'Entrá a Obox';
    T.text.textContent = 'Usá tu cuenta de Google. Si todavía no sos parte del equipo, vas a poder pedir acceso.';
    acts.append(h('button', { type: 'button', class: 'btn block', text: 'Continuar con Google', onclick: signIn }));
  } else if (kind === 'pending') {
    T.title.textContent = 'Esperando que te den acceso';
    T.text.textContent = requestFailed
      ? 'No pude enviar tu pedido. Avisale a quien administra Obox que entraste con esta cuenta.'
      : 'Ya avisé a quien administra Obox. Esta pantalla se abre sola cuando te aprueben.';
    who.append(h('div', { class: 'gate-who' }, avatarEl(me.id), h('span', { text: me.name || 'Tu cuenta' })));
    T.extra.textContent = 'Cuando te aprueben vas a ver solo los clientes y las secciones que te asignen.';
    acts.append(h('button', { type: 'button', class: 'btn secondary sm', text: 'Entrar con otra cuenta', onclick: signOutNow }));
  } else {
    T.title.textContent = 'No pude conectar con el equipo';
    T.text.textContent = 'Recargá la página. Si sigue igual, avisale a quien administra Obox.';
    acts.append(h('button', { type: 'button', class: 'btn secondary sm', text: 'Recargar', onclick: () => location.reload() }));
  }
}

/* ---------- Render: orquestación ---------- */
let renderQueued = false;
function busy(){
  if (dragging) return true;
  if (document.querySelector('.task-editing, .team-edit')) return true;
  const a = document.activeElement;
  if (!a || !a.matches) return false;
  if (a.matches('.col-title-input, .client-row-name input')) return true;
  if (a.matches('.kcomposer textarea, .kcol-new input, .team-add input')) return !!a.value.trim();
  return false;
}
function scheduleRender(){
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    if (busy()) { deferredRender = true; return; }
    renderAll();
  });
}
document.addEventListener('focusout', () => { if (deferredRender) setTimeout(() => { if (!busy()) { deferredRender = false; scheduleRender(); } }, 80); });
function renderAll(){
  renderChrome();
  renderTasks();
  if (currentView === 'boards') renderBoards();
  if (currentView === 'team') renderTeam();
  if (openCardId) syncCardModal();
}

/* ---------- Pestañas, identidad y distribución ---------- */
const VIEWS = {
  board:    { id:'view-board',    mod:'tablero' },
  calendar: { id:'view-calendar', mod:'calendario' },
  boards:   { id:'view-boards',   mod:'tableros' },
  week:     { id:'view-week',     mod:'semana' },
  team:     { id:'view-team',     admin:true }
};
function viewLabel(k){
  return { board:'Tablero', calendar:'Calendario', boards:'Trello', week:'Semana', team: mode === 'db' ? 'Equipo' : 'Clientes' }[k];
}
function allowedViews(){
  if (!hasAccess()) return [];
  if (myMember && myMember.role === 'cliente') return ['board', 'calendar', 'boards'];
  return Object.keys(VIEWS).filter(k => {
    if (VIEWS[k].admin) return me.isAdmin;
    return hasModule(VIEWS[k].mod);
  });
}
let tabsSig = '';
function renderTabs(){
  const allowed = allowedViews();
  if (allowed.length && !allowed.includes(currentView)) forceView(allowed[0]);
  const sig = allowed.join(',') + '|' + currentView + '|' + mode;
  if (sig === tabsSig) return;
  tabsSig = sig;
  const box = $('view-switch');
  box.replaceChildren(...allowed.map(k => h('button', {
    type: 'button', class: 'tab-btn' + (k === currentView ? ' active' : ''), role: 'tab',
    'aria-selected': k === currentView, 'data-view': k, text: viewLabel(k),
    onclick: () => setView(k)
  })));
}
function forceView(k){
  Object.keys(VIEWS).forEach(v => { $(VIEWS[v].id).hidden = v !== k; });
  currentView = k; tabsSig = '';
  if (k === 'calendar') renderCalendar();
  if (k === 'week') renderWeek();
  if (k === 'boards') renderBoards();
  if (k === 'team') renderTeam();
}
function updateFilterVisibility(){
  const taskView = currentView === 'board' || currentView === 'calendar';
  $('client-chips').hidden = !taskView;
  $('search-wrap').hidden = !taskView;
  // El filtro "Solo mis tareas" es exclusivo del tablero, nunca del calendario.
  $('only-mine').hidden = !(currentView === 'board' && teamMode());
}
function applyLayout(){
  const taskView = currentView === 'board' || currentView === 'calendar';
  const can = canWriteAny();
  const show = taskView && sidebarOpen && can;
  $('sidebar').classList.toggle('collapsed', !show);
  document.querySelector('.layout').classList.toggle('no-sidebar', !show);
  const btn = $('btn-sidebar-toggle');
  btn.hidden = !(taskView && can);
  btn.setAttribute('aria-expanded', show);
  $('toggle-label').textContent = show ? 'Cerrar' : 'Nueva tarea';
}
function renderChrome(){
  const chip = $('me-chip');
  const team = teamMode();
  chip.hidden = !team;
  if (team) {
    chip.replaceChildren(avatarEl(me.id), h('span', { class: 'me-name', text: nameOf(me.id) || 'Vos' }),
      h('span', { class: 'pill ' + (me.isAdmin ? 'admin' : (myMember && myMember.role === 'viewer' ? 'viewer' : '')), text: myRoleLabel() }));
  }
  $('btn-reset').hidden = !(me.isOwner || mode === 'local');
  $('btn-signout').hidden = !teamMode();
  $('setup-hint').hidden = !(mode === 'db' && me.isAdmin && loaded && D.clients.length === 0);
  if (mode === 'db' && me.id) setSyncStatus(me.isAdmin ? 'Conectado al equipo · Admin' : 'Conectado al equipo', true);
  renderTabs();
  updateFilterVisibility();
  applyLayout();
  syncFormSelects();
  $('only-mine').classList.toggle('active', onlyMine);
  $('only-mine').textContent = onlyMine ? 'Ver todas' : 'Solo mis tareas';
  $('only-mine').setAttribute('aria-pressed', onlyMine);
}
let selSig = '';
const formAsg = asgPicker($('f-asignado'), { onChange: () => { asignadoTouched = true; } });
function syncFormSelects(){
  const wc = writableClients();
  const members = teamMode() ? memberChoices($('f-cliente').value || (wc[0] && wc[0].id)) : [];
  const sig = wc.map(c => c.id + c.name).join('|') + '#' + members.map(m => m.id + m.name).join('|') + '#' + teamMode();
  if (sig === selSig) return;
  selSig = sig;
  const prevC = $('f-cliente').value;
  $('f-cliente').replaceChildren(...wc.map(c => h('option', { value: c.id, text: c.name })));
  if (wc.some(c => c.id === prevC)) $('f-cliente').value = prevC;
  const wrap = $('f-asignado-wrap');
  wrap.hidden = !teamMode();
  if (teamMode()) {
    const meOk = members.some(m => m.id === me.id);
    const keep = asignadoTouched ? formAsg.get().filter(id => members.some(m => m.id === id)) : null;
    formAsg.set(members, keep !== null ? keep : (meOk ? [me.id] : []), false);
  }
}
$('f-cliente').addEventListener('change', () => { selSig = ''; syncFormSelects(); });

/* ---------- Tareas: acciones ---------- */
function activeTop3Count(exceptId = null){
  return D.tasks.filter(t => t.id !== exceptId && t.top3 && t.estado !== 'Hecho').length;
}
function canSetTop3(exceptId = null){
  return activeTop3Count(exceptId) < 3;
}
function taskAdd(data){
  if (data.top3 && !canSetTop3()) {
    showToast('El Top 3 ya está completo. Cerrá o desmarcá una tarea antes de sumar otra.');
    return null;
  }
  const id = newId();
  const p = wSet('tasks', id, { orden: Date.now(), creadoPor: me.id || null, ...data });
  p.id = id;
  return p;
}
function taskUpdate(id, patch){
  if (patch.top3 === true && !canSetTop3(id)) {
    showToast('El Top 3 ya está completo. Desmarcá una de las 3 tareas primero.');
    return null;
  }
  return wUpd('tasks', id, patch);
}
function taskDelete(id){ return wDel('tasks', id); }
function setEstado(t, nuevo) {
  const was = t.estado;
  if (was === nuevo) return;
  const patch = { estado: nuevo };
  if (nuevo === 'Hecho') { patch.estadoPrev = was; patch.doneAt = Date.now(); }
  taskUpdate(t.id, patch);
  if (nuevo === 'Hecho') celebrate();
}
function reopen(t) {
  const prev = t.estadoPrev && t.estadoPrev !== 'Hecho' ? t.estadoPrev : 'Por hacer';
  setEstado(t, prev);
}

/* ---------- Tareas: UI ---------- */
function taskEl(t) {
  const div = document.createElement('div');
  const done = t.estado === 'Hecho';
  const ro = !canWrite(t.cliente);
  div.className = 'task' + (done ? ' done' : '');
  div.style.setProperty('--client-color', clientColor(t.cliente));
  div.dataset.id = t.id;
  const lateN = (t.fecha && !done) ? daysLate(t.fecha) : 0;
  const opts = STATUS_OPTIONS.map(s => `<option value="${s}"${t.estado === s ? ' selected' : ''}>${s}</option>`).join('');
  const prio = t.prioridad || 'Media';
  const dis = ro ? ' disabled' : '';
  const dateTxt = t.fecha ? fmtShort(t.fecha) : 'Sin fecha';
  const stCls = STATUS_CLASS[t.estado] || '';
  div.innerHTML = `
    <input type="checkbox" class="task-check" aria-label="Marcar como hecha: ${escapeHtml(t.titulo)}"${done ? ' checked' : ''}${dis}>
    <div class="task-body">
      <p class="task-title">${t.top3 && !done ? '<span class="top3-star" title="Top 3" aria-label="Top 3">★</span>' : ''}<span class="task-text">${escapeHtml(t.titulo)}</span>${prio === 'Alta' && !done ? '<span class="prio p-alta" title="Prioridad alta"></span>' : ''}${t.notas ? `<span class="note-ico" title="Tiene notas">${ICON.note}</span>` : ''}</p>
      <div class="task-meta">
        ${t.cliente ? `<span class="tag tag-client">${escapeHtml(clientName(t.cliente))}</span>` : ''}
        <label class="meta-ctl meta-date${lateN > 0 ? ' is-late' : ''}${t.fecha ? '' : ' is-empty'}" title="${lateN > 0 ? 'Atrasada ' + plural(lateN, 'día', 'días') : 'Cambiar fecha'}"><span>${escapeHtml(dateTxt)}</span><input type="date" class="task-date-input" value="${escapeHtml(t.fecha || '')}" aria-label="Fecha"${dis}></label>
        <label class="meta-ctl meta-status ${stCls}${t.estado === 'Por hacer' ? ' is-default' : ''}" title="Cambiar estado"><span>${escapeHtml(t.estado || '')}</span><select class="task-status ${stCls}" aria-label="Estado"${dis}>${opts}</select></label>
        <span class="task-av"></span>
      </div>
    </div>
    ${ro ? '' : `<div class="task-actions">
      <button type="button" class="mini-btn task-edit" aria-label="Editar tarea" title="Editar">${ICON.edit}</button>
      <button type="button" class="mini-btn del task-del" aria-label="Eliminar tarea" title="Eliminar">${ICON.trash}</button>
    </div>`}`;
  if (teamMode()) { const ids = assigneesOf(t); if (ids.length) div.querySelector('.task-av').append(avatarStack(ids)); }
  if (ro) { div.draggable = false; return div; }
  div.draggable = true;
  div.addEventListener('dragstart', () => { dragging = true; div.classList.add('dragging'); });
  div.addEventListener('dragend', () => { dragging = false; div.classList.remove('dragging'); if (div.parentElement) persistOrder(div.parentElement); scheduleRender(); });
  div.querySelector('.task-check').addEventListener('change', (e) => { e.target.checked ? setEstado(t, 'Hecho') : reopen(t); });
  div.querySelector('.task-status').addEventListener('change', (e) => { setEstado(t, e.target.value); });
  div.querySelector('.task-date-input').addEventListener('change', (e) => { taskUpdate(t.id, { fecha: e.target.value || null }); });
  div.querySelector('.task-date-input').addEventListener('click', (e) => { try { e.target.showPicker && e.target.showPicker(); } catch(x) {} });
  div.querySelector('.task-del').addEventListener('click', () => { if (t.trelloCardId) showToast('Esta tarea está vinculada a Trello. Ocultala desde la tarjeta para conservarla.'); else deleteWithUndo(t); });
  div.querySelector('.task-edit').addEventListener('click', () => {
    const ed = taskEditEl(t);
    div.replaceWith(ed);
    ed.querySelector('.e-titulo').focus();
  });
  return div;
}

function taskEditEl(t) {
  const wc = writableClients();
  const clientes = wc.some(c => c.id === t.cliente) ? wc : [...wc, { id: t.cliente, name: clientName(t.cliente) }];
  const div = h('div', { class: 'task task-editing' });
  const sel = (cls, label, options, val) => h('select', { class: 'ctl ' + cls, 'aria-label': label, value: val }, options.map(o => h('option', { value: o[0], text: o[1] })));
  const titulo = h('input', { type: 'text', class: 'ctl e-titulo', value: t.titulo || '', maxlength: '200', 'aria-label': 'Título' });
  const cliente = sel('e-cliente', 'Cliente', clientes.map(c => [c.id, c.name]), t.cliente);
  cliente.disabled = !!t.trelloCardId;
  const prioridad = sel('e-prioridad', 'Prioridad', ['Alta', 'Media', 'Baja'].map(p => [p, p]), t.prioridad || 'Media');
  const top3 = h('input', { type: 'checkbox', class: 'e-top3', checked: !!t.top3 });
  let asignado = null, asgPick = null;
  if (teamMode()) {
    const ms = memberChoices(t.cliente);
    assigneesOf(t).forEach(id => { if (!ms.some(m => m.id === id)) ms.push({ id, name: nameOf(id) }); });
    const host = h('div', { class: 'asg-edit' });
    asgPick = asgPicker(host);
    asgPick.set(ms, assigneesOf(t), false);
    asignado = h('div', { class: 'asg-row' }, h('span', { class: 'field-label', text: 'Asignados' }), host);
  }
  const notas = h('textarea', { class: 'ctl e-notas', placeholder: 'Detalles, acuerdos, qué falta...', value: t.notas || '' });
  const close = () => { div.replaceWith(taskEl(t)); };
  const save = async () => {
    const wantTop = top3.checked;
    const patch = {
      titulo: titulo.value.trim() || t.titulo, cliente: cliente.value, prioridad: prioridad.value,
      top3: wantTop, notas: notas.value.trim()
    };
    if (asgPick) {
      const allowedIds = new Set(memberChoices(cliente.value).map(m => m.id));
      const chosen = asgPick.get().filter(id => allowedIds.has(id));
      Object.assign(patch, assignFields(chosen), assignStamp(t, chosen));
    }
    const saved = taskUpdate(t.id, patch);
    if (!saved) return;
    afterAssign('tasks', t.id, saved, patch);
    const ok = await saved;
    if (ok !== false) close();
  };
  div.append(h('div', { class: 'task-edit-body' },
    titulo,
    h('div', { class: 'frow' }, cliente, prioridad, h('label', { class: 'check' }, top3, ' Top 3')),
    asignado,
    h('label', { class: 'field-label mt', text: 'Notas (solo se ven acá adentro)' }), notas,
    h('div', { class: 'frow mt' },
      h('button', { type: 'button', class: 'btn sm', text: 'Guardar', onclick: save }),
      h('button', { type: 'button', class: 'btn secondary sm', text: 'Cancelar', onclick: close }))));
  div.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Enter' && e.target === titulo) { e.preventDefault(); save(); }
  });
  return div;
}

function fill(id, arr, emptyText) {
  const el = $(id); el.innerHTML = '';
  if (!loaded) { el.innerHTML = '<div class="empty">Cargando tus tareas…</div>'; return; }
  if (arr.length === 0) { const p = document.createElement('div'); p.className = 'empty'; p.textContent = emptyText; el.appendChild(p); return; }
  arr.forEach(t => el.appendChild(taskEl(t)));
  if (!el._dnd) { el.addEventListener('dragover', dragOverHandler); el._dnd = true; }
}
function dragOverHandler(e) {
  const container = e.currentTarget;
  const dragEl = container.querySelector('.task.dragging');
  if (!dragEl) return; // solo se reordena dentro de la misma lista
  e.preventDefault();
  const siblings = [...container.querySelectorAll('.task:not(.dragging)')];
  const after = siblings.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = e.clientY - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: -Infinity, element: null }).element;
  if (after == null) container.appendChild(dragEl);
  else container.insertBefore(dragEl, after);
}
function persistOrder(container) {
  const ids = [...container.querySelectorAll('.task[data-id]')].map(el => el.dataset.id);
  ids.forEach((id, i) => {
    const t = D.tasks.find(x => x.id === id);
    if (!t) return;
    const orden = i * 10;
    if (t.orden !== orden) wUpd('tasks', id, { orden });
  });
}

/* ---------- Borrar con deshacer ---------- */
function flushPendingDelete() {
  if (pendingDeleteId) { const id = pendingDeleteId; pendingDeleteId = null; taskDelete(id); }
  clearTimeout(pendingDeleteTimer);
}
function commitPendingDelete() { flushPendingDelete(); hideToast(); }
function deleteWithUndo(t) {
  commitPendingDelete();
  pendingDeleteId = t.id;
  scheduleRender();
  showToast(`Eliminaste "${t.titulo}"`, { label: 'Deshacer', fn: () => {
    pendingDeleteId = null; clearTimeout(pendingDeleteTimer); scheduleRender();
  } }, 5000);
  pendingDeleteTimer = setTimeout(flushPendingDelete, 5000);
}

/* ---------- Render del tablero de tareas ---------- */
function visibleTasks(){ return D.tasks.filter(t => t.id !== pendingDeleteId && !t.hideFromTasks && clientVisible(t.cliente)); }
function mineOK(t){
  // El calendario siempre muestra todas las tareas, independientemente del filtro del tablero.
  if (currentView === 'calendar') return true;
  return !onlyMine || assigneesOf(t).includes(me.id);
}
function matches(t) {
  if (!mineOK(t)) return false;
  if (filterClient && t.cliente !== filterClient) return false;
  if (searchQ) {
    const hay = norm((t.titulo || '') + ' ' + (t.notas || '') + ' ' + clientName(t.cliente));
    if (!hay.includes(searchQ)) return false;
  }
  return true;
}
function renderTasks() {
  const all = visibleTasks();
  const scoped = all.filter(matches);
  const open = scoped.filter(t => t.estado !== 'Hecho');
  const cerradas = scoped.filter(t => t.estado === 'Hecho').sort((a, b) => ((b.doneAt || 0) - (a.doneAt || 0)) || (b.fecha || '').localeCompare(a.fecha || ''));
  // Dentro de cada grupo, ordenar por vencimiento: fecha más cercana primero y sin fecha al final.
  const sortFn = (a, b) => {
    const af = a.fecha || '', bf = b.fecha || '';
    if (af !== bf) { if (!af) return 1; if (!bf) return -1; return af.localeCompare(bf); }
    const p = (PRIO_ORDER[a.prioridad] ?? 1) - (PRIO_ORDER[b.prioridad] ?? 1);
    if (p) return p;
    return (a.orden ?? 0) - (b.orden ?? 0);
  };
  const hoyS = todayStr(), mananaS = addDays(hoyS, 1);
  // Cada tarea aparece una sola vez en el tablero. El orden de prioridad visual es:
  // Top 3 → atrasadas → hoy → mañana → espera → resto.
  const top3 = open.filter(t => t.top3).sort(sortFn);
  const top3Ids = new Set(top3.map(t => t.id));
  const atrasadas = open.filter(t => !top3Ids.has(t.id) && t.fecha && daysLate(t.fecha) > 0 && t.estado !== 'Espera de respuesta')
    .sort(sortFn);
  const usedAfterLate = new Set([...top3Ids, ...atrasadas.map(t => t.id)]);
  const hoy = open.filter(t => !usedAfterLate.has(t.id) && t.fecha === hoyS).sort(sortFn);
  const usedAfterToday = new Set([...usedAfterLate, ...hoy.map(t => t.id)]);
  const manana = open.filter(t => !usedAfterToday.has(t.id) && t.fecha === mananaS).sort(sortFn);
  const usedAfterTomorrow = new Set([...usedAfterToday, ...manana.map(t => t.id)]);
  const espera = open.filter(t => !usedAfterTomorrow.has(t.id) && t.estado === 'Espera de respuesta').sort(sortFn);
  const used = new Set([...usedAfterTomorrow, ...espera.map(t => t.id)]);
  const resto = open.filter(t => !used.has(t.id)).sort(sortFn);
  fill('list-top3', top3, 'Elegí hasta 3 tareas y marcalas como Top 3 al crearlas.');
  fill('list-atrasadas', atrasadas, 'Nada atrasado. Buen momento.');
  fill('list-hoy', hoy, 'Nada cargado para hoy.');
  fill('list-manana', manana, 'Nada cargado para mañana.');
  fill('list-espera', espera, 'Nada esperando respuesta.');
  fill('list-resto', resto, 'No hay más tareas abiertas.');
  fill('list-cerradas', cerradas.slice(0, 60), 'Todavía no cerraste nada.');
  const c3 = $('c-top3'); c3.textContent = top3.length + '/3'; c3.classList.toggle('over', top3.length > 3);
  $('c-atrasadas').textContent = atrasadas.length;
  $('c-hoy').textContent = hoy.length;
  $('c-manana').textContent = manana.length;
  $('c-espera').textContent = espera.length;
  $('c-resto').textContent = resto.length;
  $('c-cerradas').textContent = cerradas.length;

  const cerradasTotal = all.filter(t => t.estado === 'Hecho').length;
  $('racha-txt').textContent = cerradasTotal === 0 ? 'Sin tareas cerradas todavía' : `${plural(cerradasTotal, 'tarea cerrada', 'tareas cerradas')} en total`;

  const base = all.filter(mineOK);
  const allOpen = base.filter(t => t.estado !== 'Hecho');
  const allAtrasadas = allOpen.filter(t => t.fecha && daysLate(t.fecha) > 0 && t.estado !== 'Espera de respuesta').length;
  const allHoy = allOpen.filter(t => t.fecha === hoyS).length;
  const allTop3 = allOpen.filter(t => t.top3).length;
  renderCoverStats(allAtrasadas, allHoy, allTop3);
  renderTodayStrip(base, allAtrasadas);
  renderClientChips(all.filter(t => t.estado !== 'Hecho' && mineOK(t)));
  if (currentView === 'calendar') renderCalendar();
  if (currentView === 'week') renderWeekStats();
  if (openDayIso) renderDayModalContent();
}
function renderTodayStrip(all, nLate) {
  const hoyS = todayStr();
  const deHoy = all.filter(t => t.fecha === hoyS);
  const hechas = deHoy.filter(t => t.estado === 'Hecho').length;
  const pct = deHoy.length ? Math.round(hechas / deHoy.length * 100) : 0;
  $('ts-date').textContent = cap(fmtLong(hoyS));
  const parts = [];
  parts.push(deHoy.length ? `${hechas} de ${plural(deHoy.length, 'tarea', 'tareas')} de hoy ${hechas === 1 ? 'hecha' : 'hechas'}` : 'Nada con fecha de hoy');
  if (nLate > 0) parts.push(plural(nLate, 'atrasada', 'atrasadas'));
  $('ts-line').textContent = parts.join(' · ');
  $('ts-fill').style.width = pct + '%';
  $('ts-bar').setAttribute('aria-valuenow', pct);
}
function renderClientChips(allOpen) {
  const el = $('client-chips');
  const cs = activeClients().filter(c => clientVisible(c.id));
  if (filterClient && !cs.some(c => c.id === filterClient)) filterClient = null;
  const items = [{ id:'', name:'Todos', color:'#4A463B' }, ...cs];
  const sig = items.map(c => c.id + c.name + c.color).join('|');
  if (el._sig !== sig) {
    el._sig = sig;
    el.replaceChildren(...items.map(c => h('button', {
      type: 'button', class: 'client-chip', 'data-c': c.id, style: `--chip-color:${c.color}`, 'aria-pressed': 'false',
      onclick: () => { filterClient = c.id || null; renderTasks(); }
    }, c.name, h('span', { class: 'chip-n' }))));
  }
  el.querySelectorAll('.client-chip').forEach(btn => {
    const c = btn.dataset.c;
    const active = c ? filterClient === c : !filterClient;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active);
    btn.querySelector('.chip-n').textContent = c ? allOpen.filter(t => t.cliente === c).length : allOpen.length;
  });
}
function renderCoverStats(nAtrasadas, nHoy, nTop3) {
  const el = $('cover-stats');
  const parts = [];
  if (nAtrasadas > 0) parts.push(`<span class="cover-stat late">${plural(nAtrasadas, 'atrasada', 'atrasadas')}</span>`);
  if (nHoy > 0) parts.push(`<span class="cover-stat today">${nHoy} para hoy</span>`);
  if (nTop3 > 0) parts.push(`<span class="cover-stat ok">${nTop3} en tu Top 3</span>`);
  el.innerHTML = parts.length ? parts.join('') : (loaded ? '<span class="cover-stat ok">Sin pendientes urgentes. Buen momento.</span>' : '');
}

/* ---------- Alta de tareas ---------- */
$('add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const titulo = $('f-tarea').value.trim();
  if (!titulo) { $('f-tarea').focus(); return; }
  const cliente = $('f-cliente').value;
  if (!cliente || !canWrite(cliente)) { showToast('Elegí un cliente en el que puedas cargar tareas.'); return; }
  const top3 = $('f-top3').checked;
  const data = {
    titulo, cliente, estado: $('f-estado').value,
    prioridad: $('f-prioridad').value, fecha: $('f-fecha').value || null, top3
  };
  if (teamMode()) { const who = formAsg.get(); Object.assign(data, assignFields(who), assignStamp(null, who)); }
  const saved = taskAdd(data);
  if (!saved) return;
  afterAssign('tasks', saved.id, saved, data);
  showToast('Tarea agregada');
  $('f-tarea').value = ''; $('f-top3').checked = false; asignadoTouched = false; selSig = ''; syncFormSelects();
  if (isMobile()) { sidebarOpen = false; applyLayout(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  else $('f-tarea').focus();
});
document.querySelectorAll('.quick-dates button').forEach(b => {
  b.addEventListener('click', () => { $('f-fecha').value = addDays(todayStr(), Number(b.dataset.d)); });
});
let resetArmed = false, resetTimer = null;
function disarmReset() {
  resetArmed = false; clearTimeout(resetTimer);
  const b = $('btn-reset'); b.textContent = 'Borrar todos los datos'; b.classList.remove('danger');
}
async function clearAll() {
  const jobs = [];
  ['tasks', 'boards', 'cards'].forEach(col => D[col].slice().forEach(x => jobs.push(wDel(col, x.id))));
  await Promise.all(jobs);
  const dKeys = Object.keys(dailyCache), wKeys = Object.keys(weeklyCache);
  dailyCache = {}; weeklyCache = {};
  if (privOK()) {
    try {
      for (const k of dKeys) await privRef('daily').doc(k).delete();
      for (const k of wKeys) await privRef('weekly').doc(k).delete();
    } catch(e) {}
  } else { lsSet(LOCAL_DAILY_KEY, {}); lsSet(LOCAL_WEEKLY_KEY, {}); }
  dailyDirty = false; weekDirty = false;
  renderDaily(); renderWeek(); scheduleRender();
}
$('btn-reset').addEventListener('click', () => {
  if (!resetArmed) {
    resetArmed = true;
    const b = $('btn-reset');
    b.textContent = mode === 'db' ? 'Tocá de nuevo: se borran las tareas, tableros y tarjetas de TODO el equipo' : 'Tocá de nuevo para borrar todo (no toca tu Notion)';
    b.classList.add('danger');
    resetTimer = setTimeout(disarmReset, 6000);
    return;
  }
  disarmReset();
  clearAll().then(() => showToast('Se borraron los datos'));
});

/* ---------- Búsqueda y "solo mías" ---------- */
$('search').addEventListener('input', (e) => { searchQ = norm(e.target.value.trim()); renderTasks(); });
$('only-mine').addEventListener('click', () => { onlyMine = !onlyMine; renderChrome(); renderTasks(); });

/* ---------- Daily (personal) ---------- */
function setIfIdle(id, val) { const el = $(id); if (document.activeElement !== el) el.value = val || ''; }
document.querySelectorAll('.energy-opt').forEach(el => {
  el.addEventListener('click', () => {
    selectedEnergy = selectedEnergy === el.dataset.v ? '' : el.dataset.v;
    dailyDirty = true;
    paintEnergy();
  });
});
function paintEnergy() {
  document.querySelectorAll('.energy-opt').forEach(x => {
    const on = x.dataset.v === selectedEnergy;
    x.classList.toggle('sel', on); x.setAttribute('aria-pressed', on);
  });
}
['d-ayer', 'd-hoy', 'd-bloqueos'].forEach(id => $(id).addEventListener('input', () => { dailyDirty = true; }));
function renderDaily() {
  const today = dailyCache[todayStr()];
  if (!dailyDirty) {
    setIfIdle('d-ayer', today && today.ayer);
    setIfIdle('d-hoy', today && today.hoy);
    setIfIdle('d-bloqueos', today && today.bloqueos);
    selectedEnergy = (today && today.energia) || '';
    paintEnergy();
  }
  $('btn-daily-save').textContent = today ? 'Actualizar Daily de hoy' : 'Guardar Daily de hoy';
  const hist = Object.keys(dailyCache).filter(k => k !== todayStr()).sort().reverse().slice(0, 10);
  const el = $('daily-history');
  el.innerHTML = hist.length === 0 ? '<p class="empty" style="padding:8px 0 0;">Todavía no hay días anteriores.</p>' :
    hist.map(k => {
      const d = dailyCache[k];
      return `<div class="daily-entry"><div class="d-date">${escapeHtml(fmtLong(k))} ${escapeHtml(d.energia || '')}</div>
      ${d.ayer ? `<div class="d-line"><strong>Ayer:</strong> ${escapeHtml(d.ayer)}</div>` : ''}
      ${d.hoy ? `<div class="d-line"><strong>Plan:</strong> ${escapeHtml(d.hoy)}</div>` : ''}
      ${d.bloqueos ? `<div class="d-line"><strong>Frenos:</strong> ${escapeHtml(d.bloqueos)}</div>` : ''}</div>`;
    }).join('');
  renderStreak();
  updateEnterGate();
}
/* El Daily de hoy es obligatorio: sin "ayer" y "hoy" no se entra a las tareas. */
function dailyDone() {
  const d = dailyCache[todayStr()];
  return !!(d && String(d.ayer || '').trim() && String(d.hoy || '').trim());
}
function updateEnterGate() {
  const btn = $('btn-enter-app'), hint = $('daily-gate-hint'), label = $('enter-label');
  if (!btn) return;
  const ok = dailyLoaded && dailyDone();
  btn.disabled = !ok;
  label.textContent = !dailyLoaded ? 'Cargando tu Daily…' : (ok ? 'Ir a mis tareas' : 'Completá tu Daily para entrar');
  if (ok) { hint.textContent = ''; hint.classList.remove('bad'); }
  else if (dailyLoaded && !hint.classList.contains('bad')) hint.textContent = 'Falta contar qué hiciste ayer y qué vas a hacer hoy.';
}
function renderStreak() {
  const el = $('streak-badge');
  const filled = k => { const d = dailyCache[k]; return !!(d && (d.hoy || d.ayer || d.bloqueos)); };
  let cursor = todayStr();
  if (!filled(cursor)) cursor = addDays(cursor, -1); // si todavía no hiciste el de hoy, la racha de ayer sigue viva
  let streak = 0;
  while (filled(cursor)) { streak++; cursor = addDays(cursor, -1); }
  el.hidden = streak === 0;
  el.textContent = streak > 0 ? `🔥 ${streak} día${streak === 1 ? '' : 's'} seguido${streak === 1 ? '' : 's'} con tu Daily` : '';
}
async function dailySave(dateId, data) {
  dailyCache[dateId] = data;
  if (privOK()) { try { await privRef('daily').doc(dateId).set(data); } catch(e) { showToast('No se pudo guardar tu Daily.'); } }
  else lsSet(LOCAL_DAILY_KEY, dailyCache);
  renderDaily();
}
$('btn-daily-save').addEventListener('click', () => {
  const ayer = $('d-ayer').value.trim(), hoy = $('d-hoy').value.trim();
  const hint = $('daily-gate-hint');
  ['d-ayer', 'd-hoy'].forEach(id => $(id).classList.toggle('invalid', !$(id).value.trim()));
  if (!ayer || !hoy) {
    hint.textContent = !ayer && !hoy ? 'Completá qué hiciste ayer y qué vas a hacer hoy.' : (!ayer ? 'Contanos qué hiciste ayer.' : 'Contanos qué vas a hacer hoy.');
    hint.classList.add('bad');
    ($(!ayer ? 'd-ayer' : 'd-hoy')).focus();
    return;
  }
  hint.classList.remove('bad');
  const firstTime = !dailyDone();
  dailyDirty = false;
  dailySave(todayStr(), {
    fecha: todayStr(),
    ayer, hoy,
    bloqueos: $('d-bloqueos').value.trim(),
    energia: selectedEnergy,
    at: Date.now()
  });
  const btn = $('btn-daily-save');
  btn.textContent = 'Guardado ✓';
  setTimeout(() => { btn.textContent = 'Actualizar Daily de hoy'; }, 1600);
  if (firstTime && !$('cover').hidden) setTimeout(() => { if (!$('cover').hidden && dailyDone()) swap($('cover'), $('app'), null, () => window.scrollTo(0, 0)); }, 700);
});
['d-ayer', 'd-hoy'].forEach(id => $(id).addEventListener('input', () => { $(id).classList.remove('invalid'); const h = $('daily-gate-hint'); if (h.classList.contains('bad')) { h.classList.remove('bad'); updateEnterGate(); } }));

/* ---------- Festejo: confeti + frase ---------- */
const canvas = $('confetti-canvas'); const ctx = canvas.getContext('2d');
let cw = 0, ch = 0;
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  cw = window.innerWidth; ch = window.innerHeight;
  canvas.width = cw * dpr; canvas.height = ch * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas); resizeCanvas();
let particles = []; let animId = null;
const COLORS = ['#FF5D5D','#3E7CB1','#2E9E6B','#E0862B','#7C5CBF','#C6558B','#F2C230'];
function launchConfetti() {
  if (reduceMotion) return;
  for (let i = 0; i < 90; i++) particles.push({
    x: cw / 2 + (Math.random() - 0.5) * 120, y: ch * 0.22,
    vx: (Math.random() - 0.5) * 9, vy: Math.random() * -9 - 4, g: .28 + Math.random() * .08,
    size: 5 + Math.random() * 5, color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.random() * Math.PI, vrot: (Math.random() - 0.5) * .3, life: 0
  });
  if (!animId) tick();
}
function tick() {
  ctx.clearRect(0, 0, cw, ch);
  particles.forEach(p => {
    p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vrot; p.life++;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, 1 - p.life / 140); ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); ctx.restore();
  });
  particles = particles.filter(p => p.life < 140 && p.y < ch + 40);
  if (particles.length > 0) animId = requestAnimationFrame(tick);
  else { ctx.clearRect(0, 0, cw, ch); animId = null; }
}
const celebrateEl = $('celebrate'); let celebrateTimer = null;
function celebrate() {
  launchConfetti();
  const [emoji, phrase] = CELEBRATE_PHRASES[Math.floor(Math.random() * CELEBRATE_PHRASES.length)];
  celebrateEl.innerHTML = `<div class="emoji" aria-hidden="true">${emoji}</div><p class="phrase">${phrase}</p><p class="hint">Tocá para cerrar</p>`;
  celebrateEl.classList.add('show'); clearTimeout(celebrateTimer);
  celebrateTimer = setTimeout(() => celebrateEl.classList.remove('show'), 2600);
}
celebrateEl.addEventListener('click', () => { celebrateEl.classList.remove('show'); clearTimeout(celebrateTimer); });

/* ---------- Navegación ---------- */
function swap(hideEl, showEl, before, after) {
  if (swapping) return;
  swapping = true;
  const reveal = () => {
    hideEl.hidden = true; hideEl.classList.remove('fade-out');
    if (before) before();
    showEl.hidden = false;
    if (reduceMotion) { swapping = false; if (after) after(); return; }
    showEl.classList.add('fade-out');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      showEl.classList.remove('fade-out');
      swapping = false;
      if (after) after();
    }));
  };
  if (reduceMotion) { reveal(); return; }
  hideEl.classList.add('fade-out');
  setTimeout(reveal, 180);
}
$('btn-enter-app').addEventListener('click', () => { if (!dailyDone()) return; swap($('cover'), $('app'), null, () => window.scrollTo(0, 0)); });
$('btn-signout').addEventListener('click', () => { if (confirm('¿Cerrar sesión en este dispositivo?')) signOutNow(); });
$('btn-goto-team').addEventListener('click', () => setView('team'));
$('btn-cover-back').addEventListener('click', () => { swap($('app'), $('cover'), null, () => window.scrollTo(0, 0)); });
$('btn-sidebar-toggle').addEventListener('click', () => {
  sidebarOpen = !sidebarOpen;
  applyLayout();
  if (sidebarOpen) $('f-tarea').focus();
});
function setView(target) {
  if (target === currentView || swapping) return;
  if (!allowedViews().includes(target)) return;
  const hideEl = $(VIEWS[currentView].id), showEl = $(VIEWS[target].id);
  currentView = target; tabsSig = '';
  renderTabs(); updateFilterVisibility(); applyLayout();
  swap(hideEl, showEl, () => {
    if (target === 'calendar') renderCalendar();
    if (target === 'week') renderWeek();
    if (target === 'boards') renderBoards();
    if (target === 'team') renderTeam();
  });
}

/* ---------- Semana (personal) ---------- */
function renderWeekStats() {
  const monday = mondayOfWeek(todayStr()), sunday = addDays(monday, 6);
  const semana = visibleTasks().filter(t => mineOK(t) && t.fecha && t.fecha >= monday && t.fecha <= sunday);
  const hechas = semana.filter(t => t.estado === 'Hecho').length;
  const abiertas = semana.length - hechas;
  $('week-stats').textContent = semana.length ? `Con fecha esta semana: ${plural(hechas, 'hecha', 'hechas')} · ${plural(abiertas, 'abierta', 'abiertas')}` : 'Todavía no hay tareas con fecha en esta semana.';
}
function renderWeek() {
  const monday = mondayOfWeek(todayStr());
  const sunday = addDays(monday, 6);
  $('week-title').textContent = `Semana del ${fmtShort(monday)} al ${fmtShort(sunday)}`;
  const w = weeklyCache[monday] || {};
  if (!weekDirty) {
    setIfIdle('week-meta', w.meta); setIfIdle('week-bien', w.bien);
    setIfIdle('week-trabo', w.trabo); setIfIdle('week-cambio', w.cambio);
  }
  renderWeekStats();
  const hist = Object.keys(weeklyCache).filter(k => k !== monday).sort().reverse().slice(0, 12);
  $('week-history').innerHTML = hist.length === 0 ? '<p class="empty" style="padding:8px 0 0;">Todavía no hay semanas anteriores.</p>' :
    hist.map(k => {
      const wk = weeklyCache[k];
      return `<div class="daily-entry"><div class="d-date">${escapeHtml(fmtShort(k))} al ${escapeHtml(fmtShort(addDays(k, 6)))}</div>
        ${wk.meta ? `<div class="d-line"><strong>Meta:</strong> ${escapeHtml(wk.meta)}</div>` : ''}
        ${wk.bien ? `<div class="d-line"><strong>Bien:</strong> ${escapeHtml(wk.bien)}</div>` : ''}
        ${wk.trabo ? `<div class="d-line"><strong>Se trabó:</strong> ${escapeHtml(wk.trabo)}</div>` : ''}
        ${wk.cambio ? `<div class="d-line"><strong>Cambio:</strong> ${escapeHtml(wk.cambio)}</div>` : ''}</div>`;
    }).join('');
}
['week-meta', 'week-bien', 'week-trabo', 'week-cambio'].forEach(id => $(id).addEventListener('input', () => { weekDirty = true; }));
function flashButton(btn, text) { const orig = btn.textContent; btn.textContent = text; setTimeout(() => { btn.textContent = orig; }, 1600); }
async function weeklySave(monday, patch) {
  const data = { ...(weeklyCache[monday] || {}), ...patch };
  weeklyCache[monday] = data;
  if (privOK()) { try { await privRef('weekly').doc(monday).set(data); } catch(e) { showToast('No se pudo guardar la semana.'); } }
  else lsSet(LOCAL_WEEKLY_KEY, weeklyCache);
}
$('btn-week-meta-save').addEventListener('click', () => {
  weekDirty = false;
  weeklySave(mondayOfWeek(todayStr()), { meta: $('week-meta').value.trim() });
  flashButton($('btn-week-meta-save'), 'Guardado ✓');
});
$('btn-week-retro-save').addEventListener('click', () => {
  weekDirty = false;
  weeklySave(mondayOfWeek(todayStr()), {
    bien: $('week-bien').value.trim(), trabo: $('week-trabo').value.trim(), cambio: $('week-cambio').value.trim()
  });
  flashButton($('btn-week-retro-save'), 'Guardado ✓');
});

/* ---------- Calendario ---------- */
const DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
function renderCalendar() {
  const grid = $('cal-grid');
  grid.innerHTML = '';
  DOW.forEach(d => { const el = document.createElement('div'); el.className = 'cal-dow'; el.textContent = d; grid.appendChild(el); });
  const y = calDate.getFullYear(), m = calDate.getMonth();
  const startWeekday = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevMonthDays = new Date(y, m, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const todayS = todayStr();
  const pool = D.tasks.filter(t => t.id !== pendingDeleteId && clientVisible(t.cliente) && !t.hideFromCalendar).filter(matches);
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startWeekday + 1;
    let cellDate, muted = false;
    if (dayNum < 1) { cellDate = new Date(y, m - 1, prevMonthDays + dayNum); muted = true; }
    else if (dayNum > daysInMonth) { cellDate = new Date(y, m + 1, dayNum - daysInMonth); muted = true; }
    else { cellDate = new Date(y, m, dayNum); }
    const iso = fmtISO(cellDate);
    const dayTasks = pool.filter(t => t.fecha === iso);
    const dayEv = !(myMember && myMember.role === 'cliente') && typeof eventsOn === 'function' ? eventsOn(iso) : [];
    const cell = document.createElement('div');
    cell.className = 'cal-day' + (muted ? ' muted' : '') + (iso === todayS ? ' today' : '');
    cell.dataset.iso = iso;
    cell.tabIndex = 0;
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label', `${fmtLong(iso)}: ${dayTasks.length || dayEv.length ? [dayTasks.length ? plural(dayTasks.length, 'tarea', 'tareas') : '', dayEv.length ? plural(dayEv.length, 'evento', 'eventos') : ''].filter(Boolean).join(' y ') : 'sin tareas'}`);
    const evPills = dayEv.map(e => `<div class="cal-ev" data-ev="${escapeHtml(e.id)}" title="${escapeHtml((e.hora ? e.hora + ' · ' : '') + e.titulo)}">${escapeHtml((e.hora ? e.hora + ' ' : '') + e.titulo)}</div>`);
    const tkPills = dayTasks.map(t =>
      `<div class="cal-pill${t.estado === 'Hecho' ? ' is-done' : ''}" style="background:${escapeHtml(clientColor(t.cliente))}" data-id="${escapeHtml(t.id)}" title="${escapeHtml(t.titulo)}">${escapeHtml(t.titulo)}</div>`
    );
    const allPills = evPills.concat(tkPills);
    const pills = allPills.slice(0, 3).join('');
    const more = allPills.length > 3 ? `<div class="cal-more">+${allPills.length - 3}</div>` : '';
    cell.innerHTML = `<span class="cal-daynum">${cellDate.getDate()}</span><div class="cal-pills">${pills}</div>${more}`;
    cell.addEventListener('click', () => openDayModal(iso));
    cell.addEventListener('keydown', (e) => {
      if (e.target === cell && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDayModal(iso); }
    });
    cell.querySelectorAll('.cal-pill').forEach(p => {
      p.addEventListener('click', (e) => {
        if (isNarrowCal()) return; // en el celular el toque abre el día
        e.stopPropagation();
        const t = D.tasks.find(x => x.id === p.dataset.id);
        if (!t || !canWrite(t.cliente)) { openDayModal(iso); return; }
        t.estado === 'Hecho' ? reopen(t) : setEstado(t, 'Hecho');
      });
    });
    if (typeof bindEventPills === 'function') bindEventPills(cell, iso);
    grid.appendChild(cell);
  }
  $('cal-title').textContent = calDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}
$('cal-prev').addEventListener('click', () => { calDate = new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1); renderCalendar(); });
$('cal-next').addEventListener('click', () => { calDate = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1); renderCalendar(); });
$('cal-today').addEventListener('click', () => { calDate = new Date(); renderCalendar(); });

/* ---------- Panel del día ---------- */
function openDayModal(iso) {
  openDayIso = iso;
  renderDayModalContent();
  $('day-modal-add').hidden = !canWriteAny();
  if ($('day-modal-add-ev')) $('day-modal-add-ev').hidden = !hasAccess() || !!(myMember && myMember.role === 'cliente');
  $('day-modal-backdrop').classList.add('show');
  $('day-modal-close').focus();
}
function closeDayModal() {
  openDayIso = null;
  $('day-modal-backdrop').classList.remove('show');
}
function renderDayModalContent() {
  if (!openDayIso) return;
  const dayTasks = D.tasks.filter(t => t.id !== pendingDeleteId && clientVisible(t.cliente) && !t.hideFromCalendar && t.fecha === openDayIso && matches(t)).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  $('day-modal-title').textContent = fmtLong(openDayIso);
  const listEl = $('day-modal-list');
  listEl.innerHTML = '';
  const evs = !(myMember && myMember.role === 'cliente') && typeof eventsOn === 'function' ? eventsOn(openDayIso) : [];
  if (evs.length) evs.forEach(e => listEl.appendChild(eventRowEl(e)));
  if (dayTasks.length === 0 && evs.length === 0) { const p = document.createElement('div'); p.className = 'empty'; p.textContent = 'Nada cargado para este día.'; listEl.appendChild(p); }
  else dayTasks.forEach(t => listEl.appendChild(taskEl(t)));
}
$('day-modal-close').addEventListener('click', closeDayModal);
$('day-modal-backdrop').addEventListener('click', (e) => { if (e.target.id === 'day-modal-backdrop') closeDayModal(); });
$('day-modal-add').addEventListener('click', () => {
  const iso = openDayIso;
  closeDayModal();
  if (iso) $('f-fecha').value = iso;
  sidebarOpen = true; applyLayout();
  $('f-tarea').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* =====================================================================
   Tableros (Trello)
   ===================================================================== */
function visibleBoards(){
  return D.boards.filter(b => clientVisible(b.cliente)).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}
function boardCards(b, colId){
  const cols = b.columns || [], first = cols[0];
  return D.cards.filter(c => c.boardId === b.id && (c.columnId === colId || (first && colId === first.id && !cols.some(x => x.id === c.columnId))))
    .sort((a, b2) => (a.orden ?? 0) - (b2.orden ?? 0));
}
function nextOrden(boardId, colId){
  const os = D.cards.filter(c => c.boardId === boardId && c.columnId === colId).map(c => c.orden ?? 0);
  return (os.length ? Math.max(...os) : 0) + 1000;
}
function newBoardDoc(title, cliente){
  return { title, cliente, orden: Date.now(), createdAt: Date.now(), columns: DEFAULT_COLUMNS.map(t => ({ id: newId(), title: t })) };
}
function btn(text, cls, fn, extra){ return h('button', { type: 'button', class: cls, onclick: fn, ...(extra || {}) }, text); }

function renderBoards(){
  const root = $('boards-root');
  if (!root) return;
  if (!loaded) { root.replaceChildren(h('div', { class: 'empty', text: 'Cargando tableros…' })); return; }
  const bs = visibleBoards();
  if (!bs.some(b => b.id === currentBoardId)) currentBoardId = lsStr('agenda_board_sel');
  if (!bs.some(b => b.id === currentBoardId)) currentBoardId = bs[0] ? bs[0].id : '';
  const board = bs.find(b => b.id === currentBoardId);
  const wClients = writableClients();
  if (composerCol && !(board && (board.columns || []).some(c => c.id === composerCol))) composerCol = null;

  if (!board) {
    root.replaceChildren(h('div', { class: 'card boards-empty' },
      h('h2', { text: 'Todavía no hay tableros' }),
      h('p', { text: wClients.length ? 'Armá un tablero por cliente o por campaña: columnas para cada etapa y una tarjeta por pieza.' : 'Tu admin todavía no te asignó ningún cliente con tableros.' }),
      wClients.length ? btn('Crear el primer tablero', 'btn', () => openBoardModal(null)) : null));
    return;
  }
  const ro = !canWrite(board.cliente);
  const select = h('select', { class: 'ctl', 'aria-label': 'Tablero', value: board.id, onchange: (e) => { currentBoardId = e.target.value; lsPut('agenda_board_sel', currentBoardId); renderBoards(); } },
    bs.map(b => h('option', { value: b.id, text: `${clientName(b.cliente)} · ${b.title}` })));
  const bar = h('div', { class: 'boards-bar' },
    h('div', { class: 'board-pick' }, h('span', { class: 'cdot', style: `--dot:${clientColor(board.cliente)}` }), select),
    h('span', { class: 'spacer' }),
    ro ? h('span', { class: 'pill viewer', text: 'Solo lectura' }) : null,
    !ro ? btn('Editar tablero', 'btn secondary sm', () => openBoardModal(board.id)) : null,
    wClients.length ? h('button', { type: 'button', class: 'btn sm', onclick: () => openBoardModal(null) }, h('span', { html: ICON.plus, style: 'display:inline-flex' }), 'Nuevo tablero') : null);

  const previousKanban = root.querySelector('.kanban');
  const savedLeft = previousKanban ? previousKanban.scrollLeft : 0;
  const savedTops = new Map(previousKanban ? [...previousKanban.querySelectorAll('.kcol-cards')].map(el => [el.dataset.col, el.scrollTop]) : []);
  const cols = board.columns || [];
  const kan = h('div', { class: 'kanban' }, cols.map((col, i) => colEl(board, col, i, cols.length, ro)));
  if (!ro) kan.append(newColEl(board));
  root.replaceChildren(bar, kan);
  kan.scrollLeft = savedLeft;
  kan.querySelectorAll('.kcol-cards').forEach(el => { el.scrollTop = savedTops.get(el.dataset.col) || 0; });
}

function colEl(board, col, i, n, ro){
  const cards = boardCards(board, col.id);
  const isLast = i === n - 1 && n > 1;
  const list = h('div', { class: 'kcol-cards', 'data-col': col.id }, cards.map(c => kcardEl(c, board, isLast, ro)));
  const colEl_ = h('div', { class: 'kcol' + (isLast ? ' is-last' : ''), 'data-col': col.id },
    h('div', { class: 'kcol-head' },
      h('input', { class: 'col-title-input', value: col.title, disabled: ro, maxlength: '60', 'aria-label': 'Nombre de la columna',
        onchange: (e) => { const t = e.target.value.trim() || col.title; saveColumns(board, board.columns.map(c => c.id === col.id ? { ...c, title: t } : c)); },
        onkeydown: (e) => { if (e.key === 'Enter') e.target.blur(); } }),
      h('span', { class: 'count', text: cards.length }),
      ro ? null : h('div', { class: 'kcol-tools' },
        i > 0 ? btn('‹', 'mini-btn', () => moveColumn(board, i, -1), { 'aria-label': 'Mover columna a la izquierda', title: 'Mover a la izquierda' }) : null,
        i < n - 1 ? btn('›', 'mini-btn', () => moveColumn(board, i, 1), { 'aria-label': 'Mover columna a la derecha', title: 'Mover a la derecha' }) : null,
        btn('✕', 'mini-btn del', () => deleteColumn(board, col), { 'aria-label': 'Eliminar columna', title: 'Eliminar columna' }))),
    list,
    ro ? null : composerEl(board, col));
  colEl_.addEventListener('dragover', (e) => {
    const dragEl = document.querySelector('.kcard.dragging');
    if (!dragEl) return;
    e.preventDefault();
    list.classList.add('over');
    const siblings = [...list.querySelectorAll('.kcard:not(.dragging)')];
    const after = siblings.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = e.clientY - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: -Infinity, element: null }).element;
    if (after == null) list.appendChild(dragEl); else list.insertBefore(dragEl, after);
  });
  colEl_.addEventListener('dragleave', (e) => { if (!colEl_.contains(e.relatedTarget)) list.classList.remove('over'); });
  colEl_.addEventListener('drop', () => list.classList.remove('over'));
  return colEl_;
}

/* Vista previa de imágenes adjuntas en Trello */
const cardImageCache = new Map();
let imagePreviewBackdrop = null;

async function getCardImageUrl(a) {
  if (cardImageCache.has(a.id)) return cardImageCache.get(a.id);

  const pending = (async () => {
    if (a.store === 'storage') {
      return await firebase.storage().ref(a.path).getDownloadURL();
    }

    let data = null;

    if (a.store === 'local') {
      data = localStorage.getItem(LOCAL_BLOB + a.id);
    } else {
      const snap = await dbApi.doc('blobs/' + a.id).get();
      data = snap.exists ? snap.data().data : null;
    }

    if (!data) throw new Error('Imagen no disponible');
    return data;
  })();

  cardImageCache.set(a.id, pending);

  try {
    return await pending;
  } catch (e) {
    cardImageCache.delete(a.id);
    throw e;
  }
}

function closeImagePreview() {
  if (imagePreviewBackdrop) {
    imagePreviewBackdrop.remove();
    imagePreviewBackdrop = null;
  }
}


async function openImagePreview(images, startIndex = 0, cardId = '') {
  closeImagePreview();

  const state = {
    images,
    index: startIndex,
    cardId,
    request: 0
  };

  const backdrop = h('div', {
    class: 'obox-image-preview',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Galería de imágenes'
  });

  const panel = h('div', { class: 'obox-image-preview-panel' });
  const img = h('img', {
    class: 'obox-image-preview-img',
    alt: ''
  });
  const caption = h('div', { class: 'obox-image-preview-caption' });

  const close = h('button', {
    type: 'button',
    class: 'obox-image-preview-close',
    text: '×',
    'aria-label': 'Cerrar imágenes',
    onclick: closeImagePreview
  });

  const prev = h('button', {
    type: 'button',
    class: 'obox-image-preview-arrow obox-image-preview-prev',
    text: '‹',
    'aria-label': 'Foto anterior',
    onclick: () => {
      state.index = (state.index - 1 + state.images.length) % state.images.length;
      paint();
    }
  });

  const next = h('button', {
    type: 'button',
    class: 'obox-image-preview-arrow obox-image-preview-next',
    text: '›',
    'aria-label': 'Foto siguiente',
    onclick: () => {
      state.index = (state.index + 1) % state.images.length;
      paint();
    }
  });

  const setCover = h('button', {
    type: 'button',
    class: 'obox-image-preview-action',
    text: 'Usar como portada',
    onclick: async () => {
      const a = state.images[state.index];
      if (!state.cardId || !a) return;

      await wUpd('cards', state.cardId, { portadaId: a.id });
      setCover.textContent = 'Portada guardada';
      paint();
    }
  });

  const removeCover = h('button', {
    type: 'button',
    class: 'obox-image-preview-action secondary',
    text: 'Quitar portada',
    onclick: async () => {
      if (!state.cardId) return;

      await wUpd('cards', state.cardId, { portadaId: '' });
      removeCover.textContent = 'Portada quitada';
      paint();
    }
  });

  const counter = h('div', {
    class: 'obox-image-preview-counter'
  });

  panel.append(close, prev, img, next, caption, counter,
    h('div', { class: 'obox-image-preview-actions' }, setCover, removeCover));

  backdrop.append(panel);

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closeImagePreview();
  });

  // Permite cambiar de foto deslizando en celulares.
  let touchX = null;
  img.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX;
  }, { passive: true });

  img.addEventListener('touchend', e => {
    if (touchX === null || state.images.length < 2) return;

    const delta = e.changedTouches[0].clientX - touchX;
    touchX = null;

    if (Math.abs(delta) < 45) return;

    state.index = delta < 0
      ? (state.index + 1) % state.images.length
      : (state.index - 1 + state.images.length) % state.images.length;

    paint();
  }, { passive: true });

  document.body.append(backdrop);
  imagePreviewBackdrop = backdrop;

  async function paint() {
    const a = state.images[state.index];
    if (!a) return;

    const request = ++state.request;
    img.alt = a.name || 'Imagen adjunta';
    img.removeAttribute('src');
    caption.textContent = a.name || 'Imagen adjunta';
    counter.textContent = `${state.index + 1} de ${state.images.length}`;

    prev.hidden = state.images.length < 2;
    next.hidden = state.images.length < 2;

    const card = D.cards.find(c => c.id === state.cardId);
    const currentCover = card
      ? (card.portadaId === undefined
          ? state.images[0]?.id
          : card.portadaId)
      : '';

    const isCover = currentCover === a.id;
    setCover.hidden = isCover;
    removeCover.hidden = !currentCover;

    try {
      const url = await getCardImageUrl(a);
      if (request !== state.request || !backdrop.isConnected) return;
      img.src = url;
    } catch (e) {
      if (request === state.request) {
        caption.textContent = 'No pude cargar esta imagen.';
      }
    }
  }

  paint();
}

document.addEventListener('keydown', e => {
  if (!imagePreviewBackdrop) return;

  if (e.key === 'Escape') {
    e.stopImmediatePropagation();
    e.preventDefault();
    closeImagePreview();
    return;
  }

  // Navegación por teclado entre las fotos de una tarjeta.
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    const arrows = imagePreviewBackdrop.querySelectorAll('.obox-image-preview-arrow');
    const button = imagePreviewBackdrop.querySelector(
      e.key === 'ArrowLeft' ? '.obox-image-preview-prev' : '.obox-image-preview-next'
    );
    if (button && !button.hidden) {
      e.stopImmediatePropagation();
      e.preventDefault();
      button.click();
    }
  }
}, true);
function kcardEl(c, board, isLast, ro){
  const total = (c.checklist || []).length, done = (c.checklist || []).filter(x => x.d).length;
  const labels = (c.labels || []).map(id => LABELS.find(l => l.id === id)).filter(Boolean);
  const kAsg = teamMode() ? assigneesOf(c) : [];
  

const cardImages = (c.adjuntos || []).filter(a =>
  a.kind !== 'link' && /^image\//i.test(a.type || '')
);

const coverAttachment = c.portadaId === undefined
  ? cardImages[0]
  : cardImages.find(a => a.id === c.portadaId);

const coverImg = coverAttachment
  ? h('img', {
      class: 'kcard-cover-img',
      alt: coverAttachment.name || 'Imagen adjunta',
      loading: 'lazy'
    })
  : null;

const cover = coverImg
  ? h('div', { class: 'kcard-cover' }, coverImg)
  : null;
  const chips = [];
  if (c.vence) {
    const late = daysLate(c.vence) > 0 && !isLast;
    const today = c.vence === todayStr();
    chips.push(h('span', { class: 'k-chip' + (isLast ? ' ok' : (late ? ' late' : (today ? ' today' : ''))), title: late ? 'Vencida' : 'Vence' },
      h('span', { html: ICON.clock, style: 'display:inline-flex' }), fmtShort(c.vence)));
  }
  if (total) chips.push(h('span', { class: 'k-chip' + (done === total ? ' ok' : ''), title: 'Checklist' }, h('span', { html: ICON.check, style: 'display:inline-flex' }), `${done}/${total}`));
  if ((c.adjuntos || []).length) chips.push(h('span', { class: 'k-chip', title: 'Adjuntos' }, h('span', { html: ICON.clip, style: 'display:inline-flex' }), String(c.adjuntos.length)));
  const okControl = !ro
    ? h('button', {
        type: 'button',
        class: 'kcard-ok' + (c.ok ? ' is-ok' : ''),
        title: c.ok ? 'Marcar como pendiente' : 'Marcar como OK',
        'aria-label': c.ok ? 'Marcar tarjeta como pendiente' : 'Marcar tarjeta como OK',
        'aria-pressed': c.ok ? 'true' : 'false',
        onclick: (e) => {
          e.stopPropagation();
          wUpd('cards', c.id, { ok: !c.ok });
        }
      }, h('span', { html: ICON.check, style: 'display:inline-flex' }))
    : (c.ok ? h('span', { class: 'kcard-ok is-ok is-readonly', title: 'Tarjeta OK', 'aria-label': 'Tarjeta OK' }, h('span', { html: ICON.check, style: 'display:inline-flex' })) : null);
  const el = h('div', { class: 'kcard' + (c.ok ? ' is-card-ok' : ''), 'data-id': c.id, draggable: !ro, tabindex: '0', role: 'button', 'aria-label': `Abrir tarjeta: ${c.titulo}` },   
labels.length ? h('div', { class: 'k-labels' }, labels.map(l => h('span', { class: 'k-label', style: `background:${l.color}`, title: l.name }))) : null,
cover,
h('p', { class: 'k-title', text: c.titulo }),
    (chips.length || kAsg.length || okControl) ? h('div', { class: 'k-meta' }, chips, kAsg.length ? avatarStack(kAsg) : null, okControl) : null);


if (coverImg) {
  coverImg.addEventListener('click', e => {
    e.stopPropagation();
    openImagePreview(cardImages, cardImages.findIndex(a => a.id === coverAttachment.id), c.id);
  });

  getCardImageUrl(coverAttachment).then(url => {
    if (!coverImg.isConnected) return;
    coverImg.src = url;
    coverImg.classList.add('loaded');
  }).catch(() => {
    if (cover) cover.remove();
  });
}
  el.addEventListener('click', () => openCard(c.id));
  el.addEventListener('keydown', (e) => { if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openCard(c.id); } });
  if (!ro) {
    el.addEventListener('dragstart', (e) => { dragging = true; el.classList.add('dragging'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.id); } catch(x) {} });
    el.addEventListener('dragend', () => {
      dragging = false; el.classList.remove('dragging');
      document.querySelectorAll('.kcol-cards.over').forEach(x => x.classList.remove('over'));
      finishCardDrag(el);
      scheduleRender();
    });
  }
  return el;
}
function finishCardDrag(el){
  const list = el.parentElement;
  if (!list || !list.dataset.col) return;
  const card = D.cards.find(x => x.id === el.dataset.id);
  if (!card) return;
  const ord = (node) => { const x = node && D.cards.find(k => k.id === node.dataset.id); return x ? (x.orden ?? 0) : null; };
  const prev = ord(el.previousElementSibling), next = ord(el.nextElementSibling);
  let orden;
  if (prev == null && next == null) orden = 1000;
  else if (prev == null) orden = next - 1000;
  else if (next == null) orden = prev + 1000;
  else orden = (prev + next) / 2;
  if (card.columnId === list.dataset.col && card.orden === orden) return;
  wUpd('cards', card.id, { columnId: list.dataset.col, orden });
}

function composerEl(board, col){
  const wrap = h('div', { class: 'kcomposer' });
  const open = () => {
    const ta = h('textarea', { class: 'ctl', placeholder: 'Título de la tarjeta', maxlength: '200', 'aria-label': 'Título de la nueva tarjeta' });
    const add = async () => {
      const t = ta.value.trim();
      if (!t) { ta.focus(); return; }
      const saved = await wSet('cards', newId(), { boardId: board.id, cliente: board.cliente, columnId: col.id, titulo: t, orden: nextOrden(board.id, col.id), createdAt: Date.now(), creadoPor: me.id || null, labels: [], checklist: [], tipo: '', aprobacion: '', campaignId: '' });
      if (saved === false) { ta.focus(); return; }
      composerCol = null;
      scheduleRender();
    };
    const close = () => { composerCol = null; wrap.replaceChildren(trigger()); };
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(); }
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    composerCol = col.id;
    wrap.replaceChildren(ta, h('div', { class: 'frow' },
      btn('Agregar', 'btn sm', add), btn('Cerrar', 'btn secondary sm', close)));
    setTimeout(() => ta.focus(), 0);
  };
  const trigger = () => h('button', { type: 'button', class: 'add-card-btn', onclick: open }, h('span', { html: ICON.plus, style: 'display:inline-flex' }), 'Agregar tarjeta');
  if (composerCol === col.id) open(); else wrap.append(trigger());
  return wrap;
}
function newColEl(board){
  const input = h('input', { class: 'ctl', type: 'text', placeholder: 'Nueva columna', maxlength: '60', 'aria-label': 'Nombre de la nueva columna' });
  const add = () => {
    const t = input.value.trim();
    if (!t) return;
    saveColumns(board, [...board.columns, { id: newId(), title: t }]);
    input.value = '';
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
  return h('div', { class: 'kcol kcol-new' }, h('div', { class: 'frow' }, input, btn('Agregar', 'btn secondary sm', add)));
}
function saveColumns(board, columns){ wUpd('boards', board.id, { columns }); }
function moveColumn(board, i, dir){
  const cols = board.columns.slice();
  const j = i + dir;
  if (j < 0 || j >= cols.length) return;
  [cols[i], cols[j]] = [cols[j], cols[i]];
  saveColumns(board, cols);
}
function deleteColumn(board, col){
  if (board.columns.length <= 1) { showToast('Un tablero necesita al menos una columna.'); return; }
  if (D.cards.some(c => c.boardId === board.id && c.columnId === col.id)) { showToast('Mové o eliminá las tarjetas de esta columna antes de borrarla.'); return; }
  saveColumns(board, board.columns.filter(c => c.id !== col.id));
}

/* ---------- Modal de tablero ---------- */
function openBoardModal(id){
  boardModalId = id;
  const b = id ? D.boards.find(x => x.id === id) : null;
  $('bm-head').textContent = b ? 'Editar tablero' : 'Nuevo tablero';
  $('bm-title').value = b ? b.title : '';
  const wc = writableClients();
  const sel = $('bm-cliente');
  sel.replaceChildren(...wc.map(c => h('option', { value: c.id, text: c.name })));
  const first = wc[0] && wc[0].id;
  const current = b ? b.cliente : (filterClient && wc.some(c => c.id === filterClient) ? filterClient : (boardClientHint() || first));
  if (current) sel.value = current;
  sel.disabled = !!b; // el cliente de un tablero existente no se cambia
  $('bm-del').hidden = !(b && me.isAdmin);
  disarmBoardDel();
  $('board-modal-backdrop').classList.add('show');
  $('bm-title').focus();
}
function boardClientHint(){
  const b = D.boards.find(x => x.id === currentBoardId);
  return b && canWrite(b.cliente) ? b.cliente : null;
}
function closeBoardModal(){ boardModalId = null; $('board-modal-backdrop').classList.remove('show'); }
$('bm-close').addEventListener('click', closeBoardModal);
$('bm-cancel').addEventListener('click', closeBoardModal);
$('board-modal-backdrop').addEventListener('click', (e) => { if (e.target.id === 'board-modal-backdrop') closeBoardModal(); });
$('bm-save').addEventListener('click', () => {
  const title = $('bm-title').value.trim();
  if (!title) { $('bm-title').focus(); return; }
  if (boardModalId) { wUpd('boards', boardModalId, { title }); }
  else {
    const cliente = $('bm-cliente').value;
    if (!cliente || !canWrite(cliente)) { showToast('Elegí un cliente.'); return; }
    const id = newId();
    wSet('boards', id, newBoardDoc(title, cliente));
    currentBoardId = id; lsPut('agenda_board_sel', id);
  }
  closeBoardModal();
  renderBoards();
});
$('bm-title').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('bm-save').click(); });
let bmArmed = false, bmTimer = null;
function disarmBoardDel(){ bmArmed = false; clearTimeout(bmTimer); $('bm-del').textContent = 'Eliminar tablero'; }
$('bm-del').addEventListener('click', async () => {
  if (!bmArmed) { bmArmed = true; $('bm-del').textContent = 'Tocá de nuevo: se borran también sus tarjetas'; bmTimer = setTimeout(disarmBoardDel, 5000); return; }
  const id = boardModalId;
  disarmBoardDel(); closeBoardModal();
  if (!id) return;
  const cards = D.cards.filter(c => c.boardId === id);
  for (const c of cards) { purgeFiles(c); await wDel('cards', c.id); }
  await wDel('boards', id);
  showToast('Tablero eliminado');
});

/* ---------- Modal de tarjeta ---------- */
function curCard(){ return openCardId ? D.cards.find(c => c.id === openCardId) : null; }
function curBoard(c){ return c ? D.boards.find(b => b.id === c.boardId) : null; }
function openCard(id){
  const c = D.cards.find(x => x.id === id);
  if (!c) return;
  openCardId = id;
  fillCardModal(c);
  disarmCardDel();
  $('card-modal-backdrop').classList.add('show');
}
function closeCard(){ openCardId = null; $('card-modal-backdrop').classList.remove('show'); disarmCardDel(); }
function modalFocused(){ const a = document.activeElement; return !!(a && a.closest && a.closest('#card-modal-backdrop')); }
function syncCardModal(){
  const c = curCard();
  // Durante snapshots momentáneos puede faltar la tarjeta del array; no cerrar el modal por eso.
  if (!c) return;
  if (!modalFocused()) fillCardModal(c);
}
function ensureCardSyncControls(c, ro){
  let wrap = $('cm-sync-controls');
  if (!wrap) { wrap = h('div', { id:'cm-sync-controls', class:'cm-sync-controls' }); $('cm-sub').after(wrap); }
  wrap.hidden = !!ro;
  if (ro) return;
  wrap.replaceChildren(
    btn((c.ok || c.hecho) ? 'Reabrir tarea' : 'Marcar hecha', 'btn secondary sm', () => { const cur=curCard(); if (cur) patchCard({ ok:!(cur.ok || cur.hecho), hecho:!(cur.ok || cur.hecho) }); }),
    btn(c.hideFromTasks ? 'Mostrar en Tareas' : 'Ocultar de Tareas', 'btn secondary sm', () => { const cur=curCard(); if (cur) patchCard({ hideFromTasks:!cur.hideFromTasks }); }),
    btn(c.hideFromCalendar ? 'Mostrar en Calendario' : 'Ocultar de Calendario', 'btn secondary sm', () => { const cur=curCard(); if (cur) patchCard({ hideFromCalendar:!cur.hideFromCalendar }); })
  );
}
function fillCardModal(c){
  const b = curBoard(c);
  if (!b) { closeCard(); return; }
  const ro = !canWrite(b.cliente);
  const colId = b.columns.some(x => x.id === c.columnId) ? c.columnId : b.columns[0].id;
  $('cm-title').value = c.titulo || ''; $('cm-title').disabled = ro;
  $('cm-sub').textContent = `${clientName(b.cliente)} · ${b.title}` + (c.createdAt ? ` · creada el ${fmtShort(fmtISO(new Date(c.createdAt)))}` : '') + (ro ? ' · solo lectura' : '');
  ensureCardSyncControls(c, ro);
  $('cm-col').replaceChildren(...b.columns.map(x => h('option', { value: x.id, text: x.title })));
  $('cm-col').value = colId; $('cm-col').disabled = ro;
  $('cm-asg-wrap').hidden = !teamMode();
  if (teamMode()) {
    const ms = memberChoices(b.cliente);
    const cur = assigneesOf(c);
    cur.forEach(id => { if (!ms.some(m => m.id === id)) ms.push({ id, name: nameOf(id) }); });
    cmAsg.set(ms, cur, ro);
  }
  $('cm-vence').value = c.vence || ''; $('cm-vence').disabled = ro;
  $('cm-tipo').value = c.tipo || ''; $('cm-tipo').disabled = ro;
  const campSel = $('cm-campana');
  if (campSel) {
    const camps = D.campaigns.filter(x => x.cliente === b.cliente && !x.archived).sort((a, z) => (a.nombre || '').localeCompare(z.nombre || '', 'es'));
    campSel.replaceChildren(h('option', { value:'', text:'Sin campaña / proyecto' }), ...camps.map(x => h('option', { value:x.id, text:x.nombre })));
    campSel.value = c.campaignId || ''; campSel.disabled = ro;
  }
  $('cm-aprobacion').value = c.aprobacion || ''; $('cm-aprobacion').disabled = ro;
$('cm-desc').value = c.desc || '';
$('cm-desc').disabled = ro;
ajustarAlturaDescripcion();
  $('cm-labels').replaceChildren(...LABELS.map(l => {
    const on = (c.labels || []).includes(l.id);
    return h('button', { type: 'button', class: 'lbl-btn' + (on ? ' on' : ''), style: `--lbl:${l.color}`, 'aria-pressed': on, disabled: ro, text: l.name,
      onclick: () => { const cur = curCard(); if (!cur) return; const set = new Set(cur.labels || []); set.has(l.id) ? set.delete(l.id) : set.add(l.id); patchCard({ labels: [...set] }); fillCardModal(curCard()); } });
  }));
  renderChecklist(c, ro);
  renderAttach(c, ro);
  $('cm-del').hidden = ro;
  $('cm-cl-addrow').hidden = ro;
  $('cm-at-addrow').hidden = ro;
}
function renderChecklist(c, ro){
  const list = c.checklist || [];
  const done = list.filter(x => x.d).length;
  $('cm-cl-count').textContent = list.length ? `${done}/${list.length}` : '';
  $('cm-cl-bar').hidden = !list.length;
  $('cm-cl-bar').firstElementChild.style.width = list.length ? Math.round(done / list.length * 100) + '%' : '0';
  const box = $('cm-checklist');
  box.replaceChildren(...list.map(it => h('div', { class: 'cl-row' + (it.d ? ' done' : '') },
    h('input', { type: 'checkbox', checked: !!it.d, disabled: ro, 'aria-label': 'Hecho',
      onchange: (e) => { setItem(it.id, { d: e.target.checked }); fillCardModal(curCard()); } }),
    h('input', { class: 'cl-text', value: it.t, disabled: ro, maxlength: '160', 'aria-label': 'Ítem',
      onchange: (e) => { const t = e.target.value.trim(); if (t) setItem(it.id, { t }); else { removeItem(it.id); fillCardModal(curCard()); } } }),
    ro ? null : btn('✕', 'mini-btn del', () => { removeItem(it.id); fillCardModal(curCard()); }, { 'aria-label': 'Quitar ítem' }))));
}
function setItem(itemId, patch){ const c = curCard(); if (!c) return; patchCard({ checklist: (c.checklist || []).map(x => x.id === itemId ? { ...x, ...patch } : x) }); }
function removeItem(itemId){ const c = curCard(); if (!c) return; patchCard({ checklist: (c.checklist || []).filter(x => x.id !== itemId) }); }
let savedTimer = null;
function patchCard(patch){
  const c = curCard();
  if (!c) return;
  const saved = wUpd('cards', c.id, patch);
  const s = $('cm-saved');
  s.textContent = 'Guardando…';
  s.classList.add('show');
  clearTimeout(savedTimer);
  Promise.resolve(saved).then(ok => {
    s.textContent = ok === false ? 'No se guardó' : 'Guardado ✓';
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => s.classList.remove('show'), ok === false ? 2600 : 1200);
  });
  const latest = curCard(); if (latest) ensureCardSyncControls(latest, !canWrite((curBoard(latest) || {}).cliente));
  return saved;
}
$('cm-title').addEventListener('change', (e) => { const c = curCard(); if (c) patchCard({ titulo: e.target.value.trim() || c.titulo }); });
$('cm-desc').addEventListener('change', (e) => patchCard({ desc: e.target.value.trim() }));
function ajustarAlturaDescripcion() {
  const desc = $('cm-desc');
  if (!desc) return;
  desc.style.height = 'auto';
  desc.style.height = Math.max(150, desc.scrollHeight) + 'px';
}

$('cm-desc').addEventListener('input', ajustarAlturaDescripcion);
$('cm-vence').addEventListener('change', (e) => patchCard({ vence: e.target.value || null }));
$('cm-tipo').addEventListener('change', (e) => patchCard({ tipo: e.target.value || '' }));
$('cm-campana')?.addEventListener('change', (e) => patchCard({ campaignId: e.target.value || '' }));
$('cm-aprobacion').addEventListener('change', (e) => patchCard({ aprobacion: e.target.value || '' }));
const cmAsg = asgPicker($('cm-asignado'), { onChange: (list) => {
  const c = curCard(); if (!c) return;
  const patch = { ...assignFields(list), ...assignStamp(c, list) };
  afterAssign('cards', c.id, patchCard(patch), patch);
} });
$('cm-col').addEventListener('change', (e) => { const c = curCard(); if (c) patchCard({ columnId: e.target.value, orden: nextOrden(c.boardId, e.target.value) }); });
$('cm-cl-new').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const t = e.target.value.trim(), c = curCard();
  if (!t || !c) return;
  patchCard({ checklist: [...(c.checklist || []), { id: newId(), t, d: false }] });
  e.target.value = '';
  fillCardModal(curCard());
  $('cm-cl-new').focus();
});

/* ---------- Adjuntos de tarjeta ---------- */
/* Tres formas de guardar: links (siempre), archivos en Firebase Storage (si se activa) o archivos chicos dentro de Firestore (gratis). */
const INLINE_MAX = 650 * 1024;      // archivo original máximo en modo gratis
const STORAGE_MAX = 25 * 1024 * 1024;
const LOCAL_BLOB = 'agenda_blob_';
function fmtSize(n){ if (!n) return ''; return n < 1024 ? n + ' B' : n < 1048576 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(1).replace('.', ',') + ' MB'; }
function storageOn(){ return mode === 'db' && !!(window.APP_OPTIONS && window.APP_OPTIONS.useStorage) && !!(window.firebase && firebase.storage); }
function fileExt(name){ const m = /\.([a-z0-9]{1,5})$/i.exec(name || ''); return m ? m[1] : 'link'; }
function readDataURL(blob){ return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(r.error); r.readAsDataURL(blob); }); }
async function shrinkImage(file){
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    let w = img.naturalWidth, hgt = img.naturalHeight, q = 0.82;
    const max = 1600, k = Math.min(1, max / Math.max(w, hgt));
    w = Math.round(w * k); hgt = Math.round(hgt * k);
    for (let i = 0; i < 6; i++) {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = hgt;
      const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, hgt); ctx.drawImage(img, 0, 0, w, hgt);
      const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', q));
      if (blob && blob.size <= INLINE_MAX) return blob;
      q = Math.max(0.4, q - 0.12); w = Math.round(w * 0.85); hgt = Math.round(hgt * 0.85);
    }
  } catch(e) {} finally { URL.revokeObjectURL(url); }
  return null;
}
let attachBusy = 0;
const attachProg = { done: 0, total: 0 };
function renderAttach(c, ro){
  const list = c.adjuntos || [];
  $('cm-at-count').textContent = list.length ? String(list.length) : '';
  const box = $('cm-attach');
  const rows = list.map(a => {
    const isImage = a.kind !== 'link' && /^image\//i.test(a.type || '');
    const images = list.filter(x => x.kind !== 'link' && /^image\//i.test(x.type || ''));
    const actions = [
      btn('↓ Descargar', 'mini-btn at-download', () => downloadAttachment(a), { 'aria-label': 'Descargar archivo', title: 'Descargar archivo' })
    ];
    if (!ro) actions.push(btn('✕', 'mini-btn del', () => removeAttachment(a.id), { 'aria-label': 'Quitar adjunto', title: 'Quitar adjunto' }));
    return h('div', { class: 'at-row' },
      h('span', { class: 'at-ico', text: a.kind === 'link' ? '🔗' : fileExt(a.name).slice(0, 4) }),
      h('button', { type: 'button', class: 'at-name', title: a.name, text: a.name, onclick: () => {
        if (isImage) openImagePreview(images, images.findIndex(x => x.id === a.id), c.id);
        else openAttachment(a);
      } }),
      h('span', { class: 'at-size', text: fmtSize(a.size) }),
      ...actions
    );
  });
  if (attachBusy) rows.push(h('div', { class: 'at-busy', text: attachProg.total > 1 ? `Subiendo ${Math.min(attachProg.done + 1, attachProg.total)} de ${attachProg.total}…` : 'Subiendo…' }));
  box.replaceChildren(...rows);
  $('cm-at-hint').textContent = ro ? '' : (storageOn() ? 'Podés elegir o arrastrar varios archivos a la vez (hasta 25 MB cada uno). Para algo más grande, pegá un link de Drive o Figma.' : 'Podés elegir o arrastrar varios archivos a la vez (hasta ~650 KB cada uno; las fotos se achican solas). Para algo más grande, pegá un link de Drive o Figma.');
}
function pushAttachment(card, att){
  const cur = D.cards.find(x => x.id === card.id) || card;
  return wUpd('cards', card.id, { adjuntos: [...(cur.adjuntos || []), att] });
}
async function addFiles(files){
  const c = curCard(); if (!c) return;
  const b = curBoard(c); if (!b || !canWrite(b.cliente)) return;
  const list = [...files];
  const tooBig = [], failed = [];
  attachProg.done = 0; attachProg.total = list.length;
  for (const f of list) {
    attachBusy++; renderAttach(curCard() || c, false);
    try {
      const id = newId();
      let name = f.name || 'archivo', type = f.type || 'application/octet-stream', size = f.size;
      let att;
      if (storageOn()) {
        if (f.size > STORAGE_MAX) { tooBig.push(name); continue; }
        const path = `adjuntos/${c.id}/${id}-${name.replace(/[\/\\]/g, '_')}`;
        await firebase.storage().ref(path).put(f, { contentType: type });
        att = { id, kind: 'file', store: 'storage', name, type, size, path, by: me.id || null, at: Date.now() };
      } else {
        let blob = f;
        if (blob.size > INLINE_MAX && /^image\/(png|jpe?g|webp|gif|bmp)$/.test(type)) {
          const small = await shrinkImage(f);
          if (small) { blob = small; type = 'image/jpeg'; size = small.size; name = name.replace(/\.[a-z0-9]+$/i, '') + '.jpg'; }
        }
        if (blob.size > INLINE_MAX) { tooBig.push(name); continue; }
        const data = await readDataURL(blob);
        if (mode === 'db') {
          await dbApi.doc('blobs/' + id).set({ cliente: b.cliente, cardId: c.id, name, type, data, at: Date.now() });
          att = { id, kind: 'file', store: 'inline', name, type, size, by: me.id || null, at: Date.now() };
        } else {
          try { localStorage.setItem(LOCAL_BLOB + id, data); } catch(e) { failed.push(name); continue; }
          att = { id, kind: 'file', store: 'local', name, type, size, at: Date.now() };
        }
      }
      await pushAttachment(c, att);
    } catch(e) { failed.push(f.name || 'archivo'); }
    finally { attachBusy--; attachProg.done++; const cur = curCard(); if (cur) renderAttach(cur, false); }
  }
  const lim = storageOn() ? '25 MB' : '650 KB';
  const ok = list.length - tooBig.length - failed.length;
  const parts = [];
  if (ok > 0 && list.length > 1) parts.push(`Se subieron ${ok} de ${list.length} archivos.`);
  if (tooBig.length) parts.push(tooBig.length === 1 ? `"${tooBig[0]}" pesa más de ${lim}: pegá un link.` : `${tooBig.length} archivos pesan más de ${lim}: pegá un link (${tooBig.slice(0, 2).join(', ')}${tooBig.length > 2 ? '…' : ''}).`);
  if (failed.length) parts.push(failed.length === 1 ? `No pude subir "${failed[0]}". Revisá tu conexión o permisos.` : `No pude subir ${failed.length} archivos. Revisá tu conexión o permisos.`);
  if (parts.length) showToast(parts.join(' '), null, 7000);
}
function addLink(raw){
  const c = curCard(); if (!c) return false;
  let u = (raw || '').trim();
  if (!u) return false;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  let host;
  try { const x = new URL(u); if (!/^https?:$/.test(x.protocol) || !x.hostname.includes('.')) throw 0; host = x.hostname.replace(/^www\./, ''); }
  catch(e) { showToast('Ese link no parece válido.'); return false; }
  pushAttachment(c, { id: newId(), kind: 'link', name: host, url: u, by: me.id || null, at: Date.now() });
  const cur = curCard(); if (cur) renderAttach(cur, false);
  return true;
}
function triggerDownload(blob, name, openInTab){
  const url = URL.createObjectURL(blob);
  if (openInTab) { window.open(url, '_blank', 'noopener'); }
  else { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function downloadAttachment(a){
  if (!a || a.kind === 'link') {
    if (a && a.url) window.open(a.url, '_blank', 'noopener');
    return;
  }
  try {
    let blob = null;
    if (a.store === 'storage') {
      const url = await firebase.storage().ref(a.path).getDownloadURL();
      const response = await fetch(url);
      if (!response.ok) throw new Error('No se pudo descargar');
      blob = await response.blob();
    } else {
      let data = null;
      if (a.store === 'local') data = localStorage.getItem(LOCAL_BLOB + a.id);
      else {
        const snap = await dbApi.doc('blobs/' + a.id).get();
        data = snap.exists ? snap.data().data : null;
      }
      if (!data) throw new Error('Archivo no disponible');
      blob = await (await fetch(data)).blob();
    }
    triggerDownload(blob, a.name || 'archivo', false);
  } catch (e) {
    showToast('No pude descargar el archivo. Probá abrirlo y guardarlo desde allí.');
  }
}

async function openAttachment(a){
  let opened = null;
  try {
    if (a.kind === 'link') {
      window.open(a.url, '_blank');
      return;
    }

    const viewable = /^(image\/|application\/pdf)/.test(a.type || '');

    // Abrir la pestaña mientras el toque del usuario sigue activo.
    if (viewable) opened = window.open('about:blank', '_blank');

    if (a.store === 'storage') {
      const url = await firebase.storage().ref(a.path).getDownloadURL();
      if (opened) opened.location.href = url;
      else window.location.href = url;
      return;
    }

    let data = null;
    if (a.store === 'local') {
      data = localStorage.getItem(LOCAL_BLOB + a.id);
    } else {
      const snap = await dbApi.doc('blobs/' + a.id).get();
      data = snap.exists ? snap.data().data : null;
    }

    if (!data) {
      if (opened) opened.close();
      showToast('El archivo no está disponible (puede que no se haya incluido en una copia de seguridad).', null, 6000);
      return;
    }

    const blob = await (await fetch(data)).blob();

    if (viewable) {
      const url = URL.createObjectURL(blob);
      if (opened) opened.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else {
      triggerDownload(blob, a.name, false);
    }
  } catch(e) {
    if (opened) opened.close();
    showToast('No pude abrir el adjunto.');
  }
}
function dropFile(a){
  if (!a || a.kind === 'link') return;
  try {
    if (a.store === 'storage') firebase.storage().ref(a.path).delete().catch(() => {});
    else if (a.store === 'local') localStorage.removeItem(LOCAL_BLOB + a.id);
    else if (mode === 'db') dbApi.doc('blobs/' + a.id).delete().catch(() => {});
  } catch(e) {}
}
function purgeFiles(c){ (c.adjuntos || []).forEach(dropFile); }
function removeAttachment(id){
  const c = curCard(); if (!c) return;
  const a = (c.adjuntos || []).find(x => x.id === id);
  patchCard({ adjuntos: (c.adjuntos || []).filter(x => x.id !== id) });
  dropFile(a);
  fillCardModal(curCard());
}
$('cm-at-pick').addEventListener('click', () => $('cm-at-file').click());
$('cm-at-file').addEventListener('change', (e) => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) addFiles(fs); });
$('cm-at-link').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  if (addLink(e.target.value)) e.target.value = '';
});
(() => {
  const m = document.querySelector('#card-modal-backdrop .day-modal');
  const has = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
  m.addEventListener('dragover', (e) => { if (has(e) && !$('cm-at-addrow').hidden) { e.preventDefault(); m.classList.add('drop-over'); } });
  m.addEventListener('dragleave', (e) => { if (e.target === m) m.classList.remove('drop-over'); });
  m.addEventListener('drop', (e) => { m.classList.remove('drop-over'); if (has(e) && !$('cm-at-addrow').hidden) { e.preventDefault(); addFiles([...e.dataTransfer.files]); } });
})();

$('cm-close').addEventListener('click', closeCard);
$('card-modal-backdrop').addEventListener('click', (e) => { if (e.target.id === 'card-modal-backdrop') closeCard(); });
let cmArmed = false, cmTimer = null;
function disarmCardDel(){ cmArmed = false; clearTimeout(cmTimer); $('cm-del').textContent = 'Eliminar tarjeta'; }
$('cm-del').addEventListener('click', () => {
  if (!cmArmed) { cmArmed = true; $('cm-del').textContent = 'Tocá de nuevo para eliminar'; cmTimer = setTimeout(disarmCardDel, 4000); return; }
  const c = curCard();
  disarmCardDel(); closeCard();
  if (c) { purgeFiles(c); wDel('cards', c.id); showToast('Tarjeta eliminada'); }
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (openCardId) closeCard();
  else if ($('board-modal-backdrop').classList.contains('show')) closeBoardModal();
  else if (openDayIso) closeDayModal();
});

/* =====================================================================
   Equipo (solo admin)
   ===================================================================== */
function memberSummary(m){
  const cl = m.role === 'admin' || m.all ? 'Todos los clientes' : ((m.clients || []).map(clientName).join(', ') || 'Sin clientes');
  const mods = m.role === 'admin' || !m.modules || m.modules.length === MODULES.length ? 'todas las secciones' : (m.modules.map(k => (MODULES.find(x => x[0] === k) || [k, k])[1]).join(', ') || 'ninguna sección');
  return `${cl} · ${mods}`;
}
function memberForm(init, saveLabel, onSave, onCancel){
  const savedModules = Array.isArray(init.modules) ? init.modules.map(k => k === 'tableros (trello)' ? 'tableros' : k) : MODULES.map(m => m[0]);
  const st = { role: ['admin', 'viewer', 'cliente'].includes(init.role) ? init.role : 'member', all: !!init.all, clients: new Set(init.clients || []), modules: new Set(savedModules) };
  const role = h('select', { class: 'ctl', 'aria-label': 'Rol', value: st.role, onchange: (e) => { st.role = e.target.value; syncRoleFields(); } },
    h('option', { value: 'member', text: 'Miembro: crea y edita en sus clientes' }), h('option', { value: 'viewer', text: 'Solo lectura: mira pero no edita' }),
    h('option', { value: 'cliente', text: 'Cliente: ve sus marcas, solo lectura' }),
    me.isOwner ? h('option', { value: 'admin', text: 'Admin: ve y administra todo, incluido el equipo' }) : null);
  const allBox = h('input', { type: 'checkbox', checked: st.all });
  const clientBoxes = activeClients().map(c => {
    const cb = h('input', { type: 'checkbox', checked: st.clients.has(c.id), disabled: st.all, onchange: (e) => { e.target.checked ? st.clients.add(c.id) : st.clients.delete(c.id); } });
    return h('label', { class: 'check' }, cb, h('span', { class: 'cdot', style: `--dot:${c.color}` }), c.name);
  });
  allBox.addEventListener('change', () => { st.all = allBox.checked; clientBoxes.forEach(l => { l.querySelector('input').disabled = st.all; }); });
  function syncRoleFields(){
    const isClient = st.role === 'cliente';
    allBox.disabled = isClient;
    if (isClient) { st.all = false; allBox.checked = false; }
    clientBoxes.forEach(l => { l.querySelector('input').disabled = st.all; });
  }
  syncRoleFields();
  const modBoxes = MODULES.map(m => h('label', { class: 'check' },
    h('input', { type: 'checkbox', checked: st.modules.has(m[0]), onchange: (e) => { e.target.checked ? st.modules.add(m[0]) : st.modules.delete(m[0]); } }), m[1]));
  return h('div', { class: 'team-edit' },
    h('fieldset', null, h('legend', { text: 'Rol' }), role),
    h('fieldset', null, h('legend', { text: 'Clientes que ve' }),
      h('label', { class: 'check', style: 'margin-bottom:8px' }, allBox, h('strong', { text: 'Todos los clientes' })),
      h('div', { class: 'check-grid' }, clientBoxes)),
    h('fieldset', null, h('legend', { text: 'Secciones' }), h('div', { class: 'check-grid' }, modBoxes)),
    h('div', { class: 'frow' },
      btn(saveLabel, 'btn sm', () => {
        const isAdm = st.role === 'admin';
        if (st.role === 'cliente' && st.clients.size === 0) { showToast('Elegí al menos una marca para el cliente.'); return; }
        onSave({ role: st.role, all: isAdm || (st.role !== 'cliente' && st.all), clients: (isAdm || (st.role !== 'cliente' && st.all)) ? [] : [...st.clients], modules: isAdm ? MODULES.map(m => m[0]) : [...st.modules] });
      }),
      btn('Cancelar', 'btn secondary sm', onCancel)));
}
let armedRemove = null, armedTimer = null;
function armRemove(id){ armedRemove = id; clearTimeout(armedTimer); armedTimer = setTimeout(() => { armedRemove = null; renderTeam(); }, 4000); renderTeam(); }

let teamTab = 'gestion';
function renderTeam(){
  const root = $('team-root');
  if (!root || !me.isAdmin) return;
  const dbOn = mode === 'db' && !!me.id;
  if (!dbOn) teamTab = 'gestion';
  const kids = [];
  if (dbOn) kids.push(teamTabsEl());
  if (dbOn && teamTab === 'daily') {
    kids.push(teamDailyCard());
  } else if (dbOn && teamTab === 'informes' && typeof reportsCard === 'function') {
    teamDailyStop();
    kids.push(reportsCard());
  } else {
    teamDailyStop();
    if (dbOn) kids.push(teamNote(), requestsCard(), membersCard());
    kids.push(campaignsCard());
    kids.push(clientsCard(), backupCard());
  }
  root.replaceChildren(...kids);
}
function teamTabsEl(){
  const tab = (k, text) => h('button', { type: 'button', class: 'team-tab' + (teamTab === k ? ' active' : ''), role: 'tab', 'aria-selected': teamTab === k, onclick: () => { teamTab = k; renderTeam(); } }, text);
  return h('div', { class: 'team-tabs', role: 'tablist', 'aria-label': 'Secciones de Equipo' }, tab('gestion', 'Equipo y accesos'), tab('daily', 'Daily del equipo'), tab('informes', 'Informes'));
}

/* ---------- Daily del equipo (solo administradores) ---------- */
const teamDaily = { date: '', sig: '', unsubs: [], data: {}, hist: {}, histOpen: {} };
let teamDailyDate = todayStr();
function teamDailyStop(){
  teamDaily.unsubs.forEach(fn => { try { fn(); } catch(e) {} });
  teamDaily.unsubs = []; teamDaily.data = {}; teamDaily.sig = ''; teamDaily.date = '';
}
function teamDailyStart(){
  const ids = D.members.map(m => m.id).sort();
  const sig = teamDailyDate + '|' + ids.join(',');
  if (teamDaily.sig === sig) return;
  teamDailyStop();
  teamDaily.sig = sig; teamDaily.date = teamDailyDate;
  const date = teamDailyDate;
  ids.forEach(uid => {
    const fn = dbApi.doc('users/' + uid + '/daily/' + date).onSnapshot((snap) => {
      if (teamDaily.date !== date) return;
      teamDaily.data[uid] = snap.exists ? (snap.data() || {}) : null;
      if (currentView === 'team' && teamTab === 'daily') scheduleRender();
    }, () => {
      if (teamDaily.date !== date) return;
      teamDaily.data[uid] = 'error';
      if (currentView === 'team' && teamTab === 'daily') scheduleRender();
    });
    teamDaily.unsubs.push(fn);
  });
}
async function teamDailyLoadHistory(uid){
  teamDaily.histOpen[uid] = !teamDaily.histOpen[uid];
  if (teamDaily.histOpen[uid] && !teamDaily.hist[uid]) {
    teamDaily.hist[uid] = 'loading'; renderTeam();
    try {
      const snap = await dbApi.collection('users/' + uid + '/daily').orderBy(firebase.firestore.FieldPath.documentId(), 'desc').limit(10).get();
      teamDaily.hist[uid] = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
    } catch(e) { teamDaily.hist[uid] = 'error'; }
  }
  renderTeam();
}
function dailyBlocks(d){
  const line = (label, text, cls) => text ? h('div', { class: 'td-line' + (cls ? ' ' + cls : '') }, h('span', { class: 'td-k', text: label }), h('span', { class: 'td-v', text })) : null;
  return [line('Ayer', d.ayer), line('Hoy', d.hoy), line('Frenos', d.bloqueos, 'warn')];
}
function teamDailyCard(){
  teamDailyStart();
  const date = teamDailyDate, isToday = date === todayStr();
  const ms = D.members.slice();
  const stateOf = (m) => { const d = teamDaily.data[m.id]; return d === undefined ? 'loading' : (d === 'error' ? 'error' : (d && (d.ayer || d.hoy || d.bloqueos) ? 'done' : 'pending')); };
  const doneN = ms.filter(m => stateOf(m) === 'done').length;
  const rank = (m) => { const st = stateOf(m), d = teamDaily.data[m.id]; return st === 'done' ? (d && d.bloqueos ? 0 : 1) : (st === 'pending' ? 2 : 3); };
  ms.sort((a, b) => rank(a) - rank(b) || nameOf(a.id).localeCompare(nameOf(b.id), 'es'));

  const nav = h('div', { class: 'td-nav' },
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Día anterior', onclick: () => { teamDailyDate = addDays(date, -1); renderTeam(); }, html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>' }),
    h('div', { class: 'td-date' }, h('strong', { text: fmtLong(date) }), h('span', { text: isToday ? 'Hoy' : '' })),
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Día siguiente', disabled: isToday, onclick: () => { teamDailyDate = addDays(date, 1); renderTeam(); }, html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>' }),
    isToday ? null : btn('Ir a hoy', 'btn secondary sm', () => { teamDailyDate = todayStr(); renderTeam(); }));
  const card = h('div', { class: 'card td-card' },
    h('div', { class: 'team-sec-head' }, h('h2', null, 'Daily del equipo', h('span', { class: 'count', text: doneN + '/' + ms.length }))),
    h('p', { class: 't-sub', style: 'margin:0 0 18px', text: 'Solo los administradores ven esto. Cada persona sabe que su Daily es visible para el equipo de administración.' }),
    nav);
  if (!ms.length) { card.append(h('p', { class: 'empty', text: 'Todavía no hay personas en el equipo.' })); return card; }
  ms.forEach(m => {
    const st = stateOf(m), d = teamDaily.data[m.id];
    const pill = st === 'done' ? h('span', { class: 'td-pill ok', text: 'Hecho' }) : (st === 'pending' ? h('span', { class: 'td-pill late', text: isToday ? 'Falta' : 'Sin Daily' }) : (st === 'error' ? h('span', { class: 'td-pill', text: 'Sin acceso' }) : h('span', { class: 'td-pill', text: 'Cargando…' })));
    const row = h('div', { class: 'td-row ' + st },
      h('div', { class: 'td-head' }, avatarEl(m.id, true),
        h('div', { class: 't-name', text: nameOf(m.id) + (m.id === me.id ? ' (vos)' : '') }),
        d && d.energia ? h('span', { class: 'td-energy', text: d.energia }) : null,
        pill));
    if (st === 'done') row.append(h('div', { class: 'td-body' }, ...dailyBlocks(d)));
    else if (st === 'pending') row.append(h('p', { class: 'td-empty', text: isToday ? 'Todavía no completó el Daily de hoy.' : 'No completó el Daily ese día.' }));
    else if (st === 'error') row.append(h('p', { class: 'td-empty', text: 'No pude leer este Daily. Revisá que publicaste las reglas nuevas de Firestore (LEEME).' }));
    const open = !!teamDaily.histOpen[m.id], hist = teamDaily.hist[m.id];
    row.append(h('button', { type: 'button', class: 'td-more', onclick: () => teamDailyLoadHistory(m.id) }, open ? 'Ocultar días anteriores' : 'Ver días anteriores'));
    if (open) {
      const box = h('div', { class: 'td-hist' });
      if (hist === 'loading' || !hist) box.append(h('p', { class: 'td-empty', text: 'Cargando…' }));
      else if (hist === 'error') box.append(h('p', { class: 'td-empty', text: 'No pude cargar el historial.' }));
      else if (!hist.length) box.append(h('p', { class: 'td-empty', text: 'Todavía no hay días anteriores.' }));
      else hist.forEach(x => box.append(h('div', { class: 'td-hrow' }, h('div', { class: 'td-hdate', text: fmtLong(x.id) + (x.energia ? ' · ' + x.energia : '') }), ...dailyBlocks(x))));
      row.append(box);
    }
    card.append(row);
  });
  return card;
}
function teamNote(){
  return h('div', { class: 'card team-note' },
    h('strong', { text: 'Cómo sumar a alguien al equipo' }),
    h('ol', null,
      h('li', { text: 'Pasale el enlace de esta página a la persona, por el medio que quieras.' }),
      h('li', { text: 'Ella entra con su cuenta de Google y le aparece una pantalla de espera.' }),
      h('li', { text: 'Acá abajo aparece su solicitud. Elegís su rol, sus clientes y sus secciones, y la aprobás.' })),
    h('p', { style: 'margin:10px 0 0', html: '<strong>Qué protege.</strong> Las tareas, tableros y tarjetas de cada cliente están protegidos en el servidor: quien no tiene ese cliente asignado no puede leerlos ni cambiarlos, ni siquiera abriendo las herramientas del navegador. Las secciones (Calendario, Tableros, Semana) solo ordenan la pantalla. La Semana de cada persona es privada; el Daily lo pueden ver los administradores.' }));
}
function requestsCard(){
  const pending = D.requests.filter(r => !D.members.some(m => m.id === r.id)).sort((a, b) => (a.at || 0) - (b.at || 0));
  const card = h('div', { class: 'card' },
    h('div', { class: 'team-sec-head' }, h('h2', null, 'Solicitudes', h('span', { class: 'count' + (pending.length ? ' over' : ''), text: pending.length }))));
  if (!pending.length) { card.append(h('p', { class: 'empty', style: 'padding:6px 0 0', text: 'No hay solicitudes pendientes.' })); return card; }
  pending.forEach(r => {
    const editing = teamEditing && teamEditing.kind === 'request' && teamEditing.id === r.id;
    const row = h('div', { class: 'trow' },
      h('div', { class: 't-who' }, avatarEl(r.id, true), h('div', null, h('div', { class: 't-name', text: nameOf(r.id) }), h('p', { class: 't-sub', text: [r.email, 'Pidió acceso' + (r.at ? ' el ' + fmtShort(fmtISO(new Date(r.at))) : '')].filter(Boolean).join(' · ') }))),
      editing ? null : h('div', { class: 't-actions' },
        btn('Aprobar', 'btn sm', () => { teamEditing = { kind: 'request', id: r.id }; renderTeam(); }),
        btn('Rechazar', 'btn secondary sm', () => wDel('requests', r.id))));
    if (editing) row.append(memberForm({ role: 'member', all: false, clients: [], modules: MODULES.map(m => m[0]) }, 'Aprobar y guardar',
      async (v) => { teamEditing = null; await wSet('members', r.id, { ...v, at: Date.now() }); await wDel('requests', r.id); showToast('Acceso aprobado'); renderTeam(); },
      () => { teamEditing = null; renderTeam(); }));
    card.append(row);
  });
  return card;
}
function membersCard(){
  const ms = D.members.slice().sort((a, b) => (a.role === 'admin' ? 0 : 1) - (b.role === 'admin' ? 0 : 1) || nameOf(a.id).localeCompare(nameOf(b.id), 'es'));
  const card = h('div', { class: 'card' },
    h('div', { class: 'team-sec-head' }, h('h2', null, 'Equipo', h('span', { class: 'count', text: ms.length }))));
  ms.forEach(m => {
    const isAdminRow = m.role === 'admin';
    const editing = teamEditing && teamEditing.kind === 'member' && teamEditing.id === m.id;
    const armed = armedRemove === m.id;
    const row = h('div', { class: 'trow' },
      h('div', { class: 't-who' }, avatarEl(m.id, true),
        h('div', { style: 'min-width:0' },
          h('div', { class: 't-name' }, nameOf(m.id) + (m.id === me.id ? ' (vos)' : ''), ' ', h('span', { class: 'pill ' + (isAdminRow ? 'admin' : (m.role === 'viewer' ? 'viewer' : '')), text: m.owner ? 'Dueño' : (isAdminRow ? 'Admin' : (m.role === 'viewer' ? 'Solo lectura' : 'Miembro')) })),
          h('p', { class: 't-sub', text: memberSummary(m) }))),
      (editing || m.owner || m.id === me.id || (isAdminRow && !me.isOwner)) ? null : h('div', { class: 't-actions' },
        btn('Editar', 'btn secondary sm', () => { teamEditing = { kind: 'member', id: m.id }; renderTeam(); }),
        btn(armed ? 'Tocá de nuevo para quitar' : 'Quitar', 'btn secondary sm', () => {
          if (!armed) { armRemove(m.id); return; }
          armedRemove = null; wDel('members', m.id).then(() => showToast('Quitaste a la persona del equipo'));
        })));
    if (editing) row.append(memberForm(m, 'Guardar cambios',
      async (v) => { teamEditing = null; await wUpd('members', m.id, v); showToast('Cambios guardados'); renderTeam(); },
      () => { teamEditing = null; renderTeam(); }));
    card.append(row);
  });
  if (ms.length <= 1) card.append(h('p', { class: 'empty', style: 'padding:6px 0 0', text: 'Todavía estás solo. Compartí la página y aprobá a tu equipo desde acá.' }));
  return card;
}
function campaignsCard(){
  const cs = D.campaigns.slice().sort((a,b) => (a.estado === 'activa' ? 0 : 1) - (b.estado === 'activa' ? 0 : 1) || (a.nombre || '').localeCompare(b.nombre || '', 'es'));
  const card = h('div', { class:'card' },
    h('div', { class:'team-sec-head' }, h('h2', null, 'Campañas y proyectos', h('span', { class:'count', text: cs.filter(x => !x.archived).length }))));
  if (!cs.length) card.append(h('p',{class:'empty',text:'Todavía no hay campañas. Creá una para agrupar entregables de un cliente.'}));
  cs.forEach(c => {
    const n = D.cards.filter(k => k.campaignId === c.id).length;
    const open = D.cards.filter(k => k.campaignId === c.id && k.aprobacion !== 'Aprobado').length;
    const row = h('div',{class:'trow'},
      h('div',{class:'client-row-name'},
        h('div',{class:'t-name'}, c.nombre),
        h('p',{class:'t-sub',text:`${clientName(c.cliente)} · ${plural(n,'entregable','entregables')} · ${plural(open,'pendiente','pendientes')}${c.fecha ? ' · vence '+fmtShort(c.fecha) : ''}`})),
      h('div',{class:'t-actions'},
        btn(c.archived ? 'Reactivar' : 'Cerrar', 'btn secondary sm', () => wUpd('campaigns', c.id, { archived: !c.archived, estado: c.archived ? 'activa' : 'cerrada' })),
        btn('Abrir tablero', 'btn sm', () => { const b = D.boards.find(x => x.cliente === c.cliente); if (b) { currentBoardId=b.id; lsPut('agenda_board_sel',b.id); setView('boards'); } else { showToast('Creá un tablero para este cliente primero.'); } })
      ));
    card.append(row);
  });
  const nameIn=h('input',{class:'ctl',placeholder:'Ej. Campaña Día de la Madre',maxlength:'80','aria-label':'Nombre de la campaña'});
  const clientSel=h('select',{class:'ctl','aria-label':'Cliente de la campaña'},...writableClients().map(c=>h('option',{value:c.id,text:c.name})));
  const dateIn=h('input',{class:'ctl',type:'date','aria-label':'Fecha de cierre opcional'});
  const add=()=>{ const nombre=nameIn.value.trim(), cliente=clientSel.value; if(!nombre||!cliente){showToast('Completá nombre y cliente.');return;} const id=newId(); wSet('campaigns',id,{nombre,cliente,estado:'activa',fecha:dateIn.value||null,archived:false,createdAt:Date.now(),creadoPor:me.id||null}); nameIn.value=''; dateIn.value=''; showToast('Campaña creada'); };
  nameIn.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();add();}});
  card.append(h('div',{class:'trow team-add'},h('div',{class:'client-row-name'},nameIn),clientSel,dateIn,h('div',{class:'t-actions'},btn('Crear campaña','btn sm',add))));
  return card;
}

function clientsCard(){
  const cs = D.clients.slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  const card = h('div', { class: 'card' },
    h('div', { class: 'team-sec-head' }, h('h2', null, 'Clientes', h('span', { class: 'count', text: cs.filter(c => !c.archived).length }))));
  cs.forEach(c => {
    const nTasks = D.tasks.filter(t => t.cliente === c.id && t.estado !== 'Hecho').length;
    const nBoards = D.boards.filter(b => b.cliente === c.id).length;
    card.append(h('div', { class: 'trow' },
      h('div', { class: 'client-row-name' }, h('input', { class: 'ctl', value: c.name, maxlength: '40', 'aria-label': 'Nombre del cliente',
        style: c.archived ? 'opacity:.55' : '',
        onchange: (e) => { const n = e.target.value.trim(); if (n) wUpd('clients', c.id, { name: n }); else e.target.value = c.name; } }),
        h('p', { class: 't-sub', text: `${plural(nTasks, 'tarea abierta', 'tareas abiertas')} · ${plural(nBoards, 'tablero', 'tableros')}${c.archived ? ' · oculto' : ''}` })),
      h('div', { class: 'swatches', role: 'group', 'aria-label': 'Color' }, SWATCHES.map(sw => h('button', {
        type: 'button', class: 'swatch' + (c.color === sw ? ' sel' : ''), style: `--sw:${sw}`, 'aria-label': 'Color ' + sw, 'aria-pressed': c.color === sw,
        onclick: () => wUpd('clients', c.id, { color: sw }) }))),
      h('div', { class: 't-actions' }, btn(c.archived ? 'Mostrar' : 'Ocultar', 'btn secondary sm', () => wUpd('clients', c.id, { archived: !c.archived })))));
  });
  const nameIn = h('input', { class: 'ctl', placeholder: 'Nuevo cliente', maxlength: '40', 'aria-label': 'Nombre del nuevo cliente' });
  let newColor = SWATCHES[cs.length % SWATCHES.length];
  const swWrap = h('div', { class: 'swatches', role: 'group', 'aria-label': 'Color del nuevo cliente' });
  const paint = () => swWrap.replaceChildren(...SWATCHES.map(sw => h('button', { type: 'button', class: 'swatch' + (newColor === sw ? ' sel' : ''), style: `--sw:${sw}`, 'aria-label': 'Color ' + sw, 'aria-pressed': newColor === sw, onclick: () => { newColor = sw; paint(); } })));
  paint();
  const add = () => {
    const name = nameIn.value.trim();
    if (!name) { nameIn.focus(); return; }
    let id = slug(name), n = 2;
    while (D.clients.some(c => c.id === id)) id = slug(name) + '-' + (n++);
    wSet('clients', id, { name, color: newColor, orden: (cs.length ? Math.max(...cs.map(c => c.orden ?? 0)) : 0) + 1 });
    nameIn.value = '';
    showToast('Cliente agregado');
  };
  nameIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
  card.append(h('div', { class: 'trow team-add' }, h('div', { class: 'client-row-name' }, nameIn), swWrap, h('div', { class: 't-actions' }, btn('Agregar cliente', 'btn sm', add))));
  return card;
}


/* ---------- Copia de seguridad: exportar e importar ---------- */
function bundleOf(){
  const toMap = (arr) => Object.fromEntries(arr.map(({ id, ...rest }) => [id, rest]));
  return { version: 2, exportedAt: new Date().toISOString(), clients: toMap(D.clients), campaigns: toMap(D.campaigns), tasks: toMap(D.tasks),
    boards: toMap(D.boards), cards: toMap(D.cards), daily: dailyCache, weekly: weeklyCache };
}
function downloadBackup(){
  const blob = new Blob([JSON.stringify(bundleOf(), null, 1)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `obox-copia-${todayStr()}.json` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  showToast('Copia descargada');
}
async function writeMany(items){
  // items: [{ path, data }]  (path = 'coleccion/id' o 'users/uid/daily/fecha')
  if (mode !== 'db') {
    items.forEach(({ path, data }) => {
      const p = path.split('/');
      if (p.length === 2) upsertLocal(p[0], p[1], data, true);
      else if (p[2] === 'daily') dailyCache[p[3]] = data;
      else if (p[2] === 'weekly') weeklyCache[p[3]] = data;
    });
    ['tasks', 'clients', 'campaigns', 'boards', 'cards'].forEach(saveLocal);
    lsSet(LOCAL_DAILY_KEY, dailyCache); lsSet(LOCAL_WEEKLY_KEY, weeklyCache);
    renderDaily(); scheduleRender();
    return;
  }
  for (let i = 0; i < items.length; i += 400) {
    const batch = dbApi.batch();
    items.slice(i, i + 400).forEach(({ path, data }) => batch.set(dbApi.doc(path), data, { merge: true }));
    await batch.commit();
  }
}
async function importBundle(b){
  if (!b || typeof b !== 'object' || ![1,2].includes(b.version)) throw new Error('formato');
  const items = [];
  const boardClient = {};
  Object.entries(b.boards || {}).forEach(([id, d]) => { boardClient[id] = d.cliente; });
  D.boards.forEach(x => { boardClient[x.id] = boardClient[x.id] || x.cliente; });
  Object.entries(b.clients || {}).forEach(([id, d]) => items.push({ path: 'clients/' + id, data: d }));
  Object.entries(b.campaigns || {}).forEach(([id, d]) => items.push({ path: 'campaigns/' + id, data: d }));
  Object.entries(b.tasks || {}).forEach(([id, d]) => { const { asignado, asignados, asignadoNuevos, asignadoPor, asignadoAt, avisadoAt, creadoPor, ...rest } = d; items.push({ path: 'tasks/' + id, data: rest }); });
  Object.entries(b.boards || {}).forEach(([id, d]) => items.push({ path: 'boards/' + id, data: d }));
  Object.entries(b.cards || {}).forEach(([id, d]) => {
    const { asignado, asignados, asignadoNuevos, asignadoPor, asignadoAt, avisadoAt, creadoPor, ...rest } = d;
    const cliente = rest.cliente || boardClient[rest.boardId];
    if (cliente) items.push({ path: 'cards/' + id, data: { ...rest, cliente } });
  });
  const mine = privOK() ? 'users/' + me.id : null;
  Object.entries(b.daily || {}).forEach(([id, d]) => items.push({ path: (mine || 'users/local') + '/daily/' + id, data: d }));
  Object.entries(b.weekly || {}).forEach(([id, d]) => items.push({ path: (mine || 'users/local') + '/weekly/' + id, data: d }));
  await writeMany(items);
  return { tasks: Object.keys(b.tasks || {}).length, clients: Object.keys(b.clients || {}).length, campaigns: Object.keys(b.campaigns || {}).length, boards: Object.keys(b.boards || {}).length, cards: Object.keys(b.cards || {}).length, daily: Object.keys(b.daily || {}).length };
}
function backupCard(){
  const file = h('input', { type: 'file', accept: 'application/json,.json', class: 'sr-only', 'aria-label': 'Archivo de copia para importar' });
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    file.value = '';
    if (!f) return;
    try {
      const b = JSON.parse(await f.text());
      const n = Object.keys(b.tasks || {}).length, c = Object.keys(b.clients || {}).length, p = Object.keys(b.campaigns || {}).length;
      if (!confirm(`Vas a importar ${n} tareas, ${c} clientes y ${p} campañas. Lo que ya existe con el mismo identificador se actualiza. ¿Seguimos?`)) return;
      const r = await importBundle(b);
      showToast(`Importado: ${plural(r.tasks, 'tarea', 'tareas')}, ${plural(r.clients, 'cliente', 'clientes')}, ${plural(r.campaigns, 'campaña', 'campañas')}`, null, 4500);
    } catch(e) { showToast('No pude leer ese archivo. ¿Es una copia de Obox?', null, 5000); }
  });
  return h('div', { class: 'card' },
    h('div', { class: 'team-sec-head' }, h('h2', null, 'Copia de seguridad')),
    h('p', { class: 't-sub', style: 'margin:0 0 12px', text: 'Descargá todo en un archivo para guardarlo, o importá una copia (por ejemplo, la de tu versión anterior). Tu Daily y tu Semana viajan con tu copia.' }),
    h('div', { class: 'frow' },
      btn('Descargar copia', 'btn secondary sm', downloadBackup),
      btn('Importar copia…', 'btn sm', () => file.click()), file));
}

/* ---------- Cambio de día con la página abierta ---------- */
let lastDay = todayStr();
function checkRollover() {
  const t = todayStr();
  if (myMember && myMember.role === 'cliente') { lastDay = t; return; }
  if (t === lastDay) return;
  lastDay = t;
  dailyDirty = false; weekDirty = false;
  paintGreeting();
  renderDaily();
  scheduleRender();
  if (currentView === 'week') renderWeek();
  // Día nuevo: si todavía no hiciste el Daily, volvés a la portada para completarlo.
  if (!dailyDone() && !$('app').hidden) { swap($('app'), $('cover'), null, () => window.scrollTo(0, 0)); showToast('Es un día nuevo: completá tu Daily para seguir.', null, 5000); }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkRollover(); });
setInterval(checkRollover, 60000);

/* ---------- Atajos de teclado ---------- */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if ($('day-modal-backdrop').classList.contains('show')) closeDayModal();
    if ($('card-modal-backdrop').classList.contains('show')) closeCard();
    if ($('board-modal-backdrop').classList.contains('show')) closeBoardModal();
    return;
  }
  const target = e.target;
  const typing = target && /INPUT|TEXTAREA|SELECT/.test(target.tagName);
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === '/' && currentView !== 'boards' && currentView !== 'team' && currentView !== 'week') {
    e.preventDefault();
    $('search').focus();
  }
  if (e.key.toLowerCase() === 'n' && canWriteAny() && currentView !== 'boards' && currentView !== 'team' && currentView !== 'week') {
    e.preventDefault();
    sidebarOpen = true;
    applyLayout();
    $('f-tarea').focus();
  }
});

/* ---------- Arranque ---------- */
paintGreeting();
$('motiv-msg').textContent = MOTIV[Math.floor(Math.random() * MOTIV.length)];
$('f-fecha').value = todayStr();
// El filtro se define al autenticar según el rol; no se recupera de localStorage.
onlyMine = false;
sidebarOpen = !isMobile();
renderDaily();
renderAll();
initStore();



/* ---------- Tema claro / oscuro (Obox) ---------- */
(function(){
  const root = document.documentElement;
  function current(){ const t = root.getAttribute('data-theme'); return t || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  function paint(){
    const dark = current() === 'dark';
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#050507' : '#F7F7F9');
  }
  function toggle(){
    const next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('obox.theme', next); } catch(e) {}
    paint();
  }
  ['btn-theme', 'btn-theme-gate'].forEach(id => { const b = document.getElementById(id); if (b) b.addEventListener('click', toggle); });
  paint();
})();


/* ---------- Avisos al celular (push) ---------- */
// La app guarda el "token" de este dispositivo en users/{uid}/tokens. Una Cloud Function (carpeta functions/)
// lo usa para avisarte cuando te asignan una tarea o una tarjeta, aunque la app esté cerrada.
function pushSupported(){
  try {
    return mode === 'db' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
      && window.firebase && firebase.messaging && firebase.messaging.isSupported();
  } catch(e) { return false; }
}
function pushKeyOK(){ const k = window.FCM_VAPID_KEY; return !!k && !/PEGA|TU_|XXXX/i.test(k); }
function paintPushBtn(){
  const b = $('btn-push');
  if (!b) return;
  if (!pushSupported()) { b.hidden = true; return; }
  const granted = Notification.permission === 'granted' && b.dataset.on === '1';
  b.hidden = false;
  b.classList.toggle('on', granted);
  b.title = granted ? 'Avisos activados en este celular' : 'Activar avisos en este celular';
  b.setAttribute('aria-label', b.title);
}
async function pushRegister(){
  const reg = await navigator.serviceWorker.register('firebase-messaging-sw.js');
  await navigator.serviceWorker.ready;
  const token = await firebase.messaging().getToken({ vapidKey: window.FCM_VAPID_KEY, serviceWorkerRegistration: reg });
  if (!token) throw new Error('sin token');
  await dbApi.doc('users/' + me.id + '/tokens/' + token).set({ token, origin: location.origin, ua: String(navigator.userAgent || '').slice(0, 200), at: Date.now() });
  $('btn-push').dataset.on = '1';
  paintPushBtn();
}
async function pushEnable(){
  if (!pushSupported()) { showToast('Este navegador no permite avisos. En iPhone, primero agregá Obox a la pantalla de inicio.', null, 6000); return; }
  if (!pushKeyOK()) { showToast('Falta configurar los avisos en firebase-config.js (mirá el LEEME).', null, 6000); return; }
  try {
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm !== 'granted') { showToast('Los avisos quedaron bloqueados. Activalos desde los permisos del navegador.', null, 6000); return; }
    await pushRegister();
    showToast('Listo: te vamos a avisar en este celular cuando te asignen algo.', null, 5000);
  } catch(e) { showToast('No pude activar los avisos. Probá de nuevo.', null, 5000); }
}
function pushInit(){
  const b = $('btn-push');
  if (!b || b.dataset.ready) { paintPushBtn(); return; }
  b.dataset.ready = '1';
  b.addEventListener('click', pushEnable);
  // Si ya había dado permiso, renovamos el token en silencio al abrir la app.
  if (pushSupported() && pushKeyOK() && Notification.permission === 'granted') pushRegister().catch(() => {});
  paintPushBtn();
}
