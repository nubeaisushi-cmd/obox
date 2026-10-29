'use strict';
/*
  Obox v8: personalización de perfil, eventos de calendario (privados o compartidos) con recordatorios,
  e informes mensuales con IA. Se carga después de app.js y usa sus funciones (h, D, me, wSet, wUpd, wDel…).
*/

/* =====================================================================
   1. Mi perfil: nombre, foto o carita y color
   ===================================================================== */
const EMOJIS = ['😀', '😎', '🤓', '🥳', '🦄', '🐱', '🐶', '🦊', '🐼', '🐸', '🦋', '🌸', '🔥', '⚡', '🚀', '🎨', '🎧', '☕', '🍕', '🌈'];
const AV_COLORS = ['#7C3AED', '#C026D3', '#DB2777', '#E11D48', '#EA580C', '#CA8A04', '#16A34A', '#0D9488', '#0284C7', '#4F46E5'];
let profDraft = null;

function profileSynced() { /* los datos de PROF ya cambian solos; esto solo repinta el chip de arriba */ }

function mkModal(id, wide) {
  let bd = $(id);
  if (bd) return bd;
  bd = h('div', { class: 'day-modal-backdrop', id },
    h('div', { class: 'day-modal' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true' }));
  bd.addEventListener('click', (e) => { if (e.target === bd) bd.classList.remove('show'); });
  document.body.append(bd);
  return bd;
}
function closeModal(id) { const bd = $(id); if (bd) bd.classList.remove('show'); }
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  ['profile-modal', 'ev-modal'].forEach(id => { const bd = $(id); if (bd && bd.classList.contains('show')) { e.stopPropagation(); bd.classList.remove('show'); } });
}, true);
const X_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

// Achica la foto a 160×160 (recortada al centro) para que pese unos pocos KB y entre en la base de datos.
function shrinkAvatar(file, size) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        if (!side) throw new Error('vacía');
        const c = document.createElement('canvas'); c.width = c.height = size;
        c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
        let q = 0.85, out = c.toDataURL('image/jpeg', q);
        while (out.length > 30000 && q > 0.35) { q -= 0.1; out = c.toDataURL('image/jpeg', q); }
        URL.revokeObjectURL(url);
        resolve(out);
      } catch (e) { URL.revokeObjectURL(url); reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagen')); };
    img.src = url;
  });
}

function openProfile() {
  if (!teamMode() || !me.id) return;
  const p = PROF[me.id] || {};
  profDraft = { nick: p.nick || '', avMode: p.avMode || 'google', emoji: p.emoji || EMOJIS[0], color: /^#[0-9a-fA-F]{6}$/.test(p.color || '') ? p.color : AV_COLORS[0], pic: p.pic || '' };
  paintProfile();
  mkModal('profile-modal').classList.add('show');
}
function paintProfile() {
  const bd = mkModal('profile-modal');
  const box = bd.firstChild;
  const d = profDraft;
  const googleName = me.name || '';
  PROF['__preview'] = { id: '__preview', name: googleName, nick: d.nick.trim(), avatarUrl: me.avatar || '', emoji: d.emoji, color: d.color, pic: d.pic, avMode: d.avMode };
  const prev = h('div', { class: 'pf-preview' }, avatarEl('__preview', true), h('div', null, h('strong', { text: d.nick.trim() || googleName || 'Vos' }), h('span', { class: 'pf-sub', text: 'Así te ve el equipo' })));
  prev.querySelector('.av').classList.add('xl');

  const nameIn = h('input', { class: 'ctl', maxlength: '40', placeholder: googleName || 'Tu nombre', value: d.nick, 'aria-label': 'Nombre',
    oninput: (e) => { d.nick = e.target.value; const s = prev.querySelector('strong'); if (s) s.textContent = d.nick.trim() || googleName || 'Vos'; } });

  const modes = [['google', 'Mi foto de Google'], ['pic', 'Subir foto'], ['emoji', 'Una carita']];
  const modeBtns = h('div', { class: 'pf-modes', role: 'tablist' }, modes.map(([k, t]) => h('button', {
    type: 'button', class: 'team-tab' + (d.avMode === k ? ' active' : ''), role: 'tab', 'aria-selected': d.avMode === k,
    onclick: () => { d.avMode = k; paintProfile(); } }, t)));

  const panel = h('div', { class: 'pf-panel' });
  if (d.avMode === 'google') {
    panel.append(h('p', { class: 't-sub', text: me.avatar ? 'Se usa la foto de tu cuenta de Google.' : 'Tu cuenta de Google no tiene foto: se muestran tus iniciales. Podés elegir un color o subir otra foto.' }));
  } else if (d.avMode === 'pic') {
    const file = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async (e) => {
      const f = e.target.files && e.target.files[0]; e.target.value = '';
      if (!f) return;
      try { d.pic = await shrinkAvatar(f, 160); paintProfile(); }
      catch (err) { showToast('No pude leer esa imagen. Probá con otra (JPG o PNG).'); }
    } });
    panel.append(file, h('div', { class: 'pf-row' }, btn(d.pic ? 'Cambiar foto' : 'Elegir una foto', 'btn secondary sm', () => file.click()),
      d.pic ? btn('Quitar', 'btn danger sm', () => { d.pic = ''; paintProfile(); }) : null),
      h('p', { class: 't-sub', text: 'Se recorta en cuadrado y se achica sola. Solo la ve tu equipo.' }));
  } else {
    panel.append(
      h('div', { class: 'pf-emojis', role: 'group', 'aria-label': 'Carita' }, EMOJIS.map(em => h('button', { type: 'button', class: 'pf-emoji' + (d.emoji === em ? ' on' : ''), 'aria-pressed': d.emoji === em, onclick: () => { d.emoji = em; paintProfile(); } }, em))));
  }
  if (d.avMode !== 'pic') {
    panel.append(h('span', { class: 'field-label', style: 'margin-top:14px', text: 'Color' }),
      h('div', { class: 'pf-colors', role: 'group', 'aria-label': 'Color' }, AV_COLORS.map(c => h('button', { type: 'button', class: 'pf-color' + (d.color === c ? ' on' : ''), style: 'background:' + c, 'aria-label': 'Color ' + c, 'aria-pressed': d.color === c, onclick: () => { d.color = c; paintProfile(); } }))));
  }

  const save = btn('Guardar', 'btn', async () => {
    save.disabled = true;
    const nick = d.nick.trim().slice(0, 40);
    const data = { nick, avMode: d.avMode, emoji: d.emoji, color: d.color, pic: d.avMode === 'pic' ? d.pic : (d.pic || '') };
    if (d.avMode === 'pic' && !d.pic) data.avMode = 'google';
    try {
      await dbApi.doc('users/' + me.id).set(data, { merge: true });
      PROF[me.id] = { ...(PROF[me.id] || { id: me.id, name: me.name, avatarUrl: me.avatar }), ...data };
      delete PROF['__preview'];
      closeModal('profile-modal'); scheduleRender(); showToast('Listo, tu perfil quedó actualizado.');
    } catch (e) { save.disabled = false; showToast('No pude guardar tu perfil. Revisá la conexión y que hayas publicado las reglas nuevas (LEEME).', null, 6000); }
  });
  box.replaceChildren(
    h('div', { class: 'day-modal-head' }, h('h2', { text: 'Mi perfil' }), h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Cerrar', html: X_ICON, onclick: () => { delete PROF['__preview']; closeModal('profile-modal'); } })),
    prev,
    h('label', { class: 'field-label', text: 'Cómo querés que te llamen' }), nameIn,
    h('span', { class: 'field-label', style: 'margin-top:18px', text: 'Tu cara en Obox' }), modeBtns, panel,
    h('div', { class: 'day-modal-foot', style: 'display:flex;gap:10px;justify-content:flex-end' },
      btn('Cancelar', 'btn secondary sm', () => { delete PROF['__preview']; closeModal('profile-modal'); }), save));
}
(() => {
  const chip = $('me-chip');
  if (!chip) return;
  chip.setAttribute('role', 'button'); chip.setAttribute('tabindex', '0'); chip.setAttribute('title', 'Mi perfil'); chip.classList.add('clickable');
  chip.addEventListener('click', openProfile);
  chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProfile(); } });
})();

/* =====================================================================
   2. Eventos de calendario (no son tareas)
   ===================================================================== */
const EV_STORE = { own: [], todos: [], inv: [] };
function myUid() { return me.id || 'local'; }
function startEvents() {
  if (mode !== 'db' || !me.id || startEvents.on) return;
  startEvents.on = true;
  const col = dbApi.collection('events');
  const watch = (key, q) => track(q.onSnapshot((snap) => {
    EV_STORE[key] = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
    mergeEvents();
  }, () => { /* sin permiso o sin reglas nuevas: el calendario sigue con las tareas */ }));
  watch('own', col.where('owner', '==', me.id));
  watch('todos', col.where('visib', '==', 'todos'));
  watch('inv', col.where('invitados', 'array-contains', me.id));
}
function mergeEvents() {
  const m = new Map();
  [...EV_STORE.own, ...EV_STORE.todos, ...EV_STORE.inv].forEach(e => m.set(e.id, e));
  D.events = [...m.values()];
  scheduleRender();
}
function evVisible(e) {
  const u = myUid();
  return e.owner === u || e.visib === 'todos' || (Array.isArray(e.invitados) && e.invitados.includes(u));
}
function eventsOn(iso) {
  return (D.events || []).filter(e => e.fecha === iso && evVisible(e)).sort((a, b) => (a.hora || '').localeCompare(b.hora || '') || (a.titulo || '').localeCompare(b.titulo || '', 'es'));
}
function eventRepeatDates(startIso, endIso, repeat) {
  if (!startIso || repeat === 'none' || !endIso || endIso < startIso) return [startIso];
  const start = new Date(startIso + 'T12:00:00');
  const end = new Date(endIso + 'T12:00:00');
  const dates = [];
  for (let d = new Date(start); d <= end && dates.length < 100; ) {
    dates.push(fmtISO(d));
    if (repeat === 'daily') d.setDate(d.getDate() + 1);
    else if (repeat === 'weekly') d.setDate(d.getDate() + 7);
    else if (repeat === 'monthly') {
      const day = start.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(day, lastDay));
    } else break;
  }
  return dates.length ? dates : [startIso];
}
function evInicio(fecha, hora) {
  if (!fecha || !/^\d{2}:\d{2}$/.test(hora || '')) return 0;
  const [y, m, d] = fecha.split('-').map(Number), [hh, mm] = hora.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).getTime();
}
const REMIND_OPTS = [[1440, '1 día antes'], [60, '1 hora antes'], [30, '30 min antes']];
function visibLabel(e) {
  if (e.visib === 'todos') return 'Todo el equipo';
  if (e.visib === 'personas') return 'Personas elegidas';
  return 'Solo yo';
}
function bindEventPills(cell, iso) {
  cell.querySelectorAll('.cal-ev').forEach(p => p.addEventListener('click', (e) => {
    e.stopPropagation();
    const ev = (D.events || []).find(x => x.id === p.dataset.ev);
    if (ev) openEventModal(iso, ev);
  }));
}
function eventRowEl(e) {
  const mine = e.owner === myUid();
  const row = h('button', { type: 'button', class: 'ev-row', onclick: () => openEventModal(e.fecha, e) },
    h('span', { class: 'ev-time', text: e.hora ? e.hora + (e.horaFin ? '–' + e.horaFin : '') : 'Todo el día' }),
    h('span', { class: 'ev-main' }, h('span', { class: 'ev-title', text: e.titulo }),
      h('span', { class: 'ev-meta', text: (e.visib === 'yo' ? '🔒 Solo yo' : (e.visib === 'todos' ? '👥 Todo el equipo' : '👥 Personas elegidas')) + (!mine && teamMode() ? ' · de ' + nameOf(e.owner) : '') + (mine && (e.recordar || []).length && e.hora ? ' · 🔔' : '') })));
  return row;
}
$('day-modal-add-ev').addEventListener('click', () => { const iso = openDayIso; closeDayModal(); openEventModal(iso || todayStr(), null); });

function openEventModal(iso, existing) {
  const mine = !existing || existing.owner === myUid();
  const st = existing
    ? { titulo: existing.titulo || '', notas: existing.notas || '', fecha: existing.fecha, hora: existing.hora || '', horaFin: existing.horaFin || '', visib: existing.visib || 'yo', invitados: (existing.invitados || []).slice(), recordar: (existing.recordar || []).slice(), repetir: existing.repetir || 'none', hasta: existing.hasta || existing.fecha }
    : { titulo: '', notas: '', fecha: iso, hora: '', horaFin: '', visib: 'yo', invitados: [], recordar: [], repetir: 'none', hasta: iso };
  const bd = mkModal('ev-modal', true), box = bd.firstChild;
  const canShare = teamMode();
  const people = h('div', { id: 'ev-people' });
  const asg = asgPicker(people, { onChange: (l) => { st.invitados = l; } });
  const others = D.members.filter(m => m.id !== me.id).map(m => ({ id: m.id, name: nameOf(m.id) })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  asg.set(others, st.invitados, !mine);

  const title = h('input', { class: 'ctl', maxlength: '120', placeholder: 'Ej.: Reunión con Dimarco', value: st.titulo, disabled: !mine, 'aria-label': 'Título', oninput: (e) => { st.titulo = e.target.value; title.classList.remove('invalid'); } });
  const fecha = h('input', { class: 'ctl', type: 'date', value: st.fecha, disabled: !mine, 'aria-label': 'Fecha', onchange: (e) => { st.fecha = e.target.value; fecha.min = e.target.value; if (!st.hasta || st.hasta < st.fecha) { st.hasta = st.fecha; repeatUntil.value = st.hasta; } repeatUntil.min = st.fecha; } });
  const hora = h('input', { class: 'ctl', type: 'time', value: st.hora, disabled: !mine, 'aria-label': 'Hora de inicio', onchange: (e) => { st.hora = e.target.value; paintRem(); } });
  const horaFin = h('input', { class: 'ctl', type: 'time', value: st.horaFin, disabled: !mine, 'aria-label': 'Hora de fin (opcional)', onchange: (e) => { st.horaFin = e.target.value; } });
  const repetir = h('select', { class: 'ctl', value: st.repetir, disabled: !mine || !!existing, 'aria-label': 'Repetición', onchange: (e) => { st.repetir = e.target.value; repeatUntilWrap.hidden = st.repetir === 'none'; } },
    h('option', { value: 'none', text: 'No se repite' }),
    h('option', { value: 'daily', text: 'Todos los días' }),
    h('option', { value: 'weekly', text: 'Todas las semanas' }),
    h('option', { value: 'monthly', text: 'Todos los meses' }));
  const repeatUntil = h('input', { class: 'ctl', type: 'date', value: st.hasta, min: st.fecha, disabled: !mine || !!existing, 'aria-label': 'Repetir hasta', onchange: (e) => { st.hasta = e.target.value; } });
  const repeatUntilWrap = h('div', { class: 'field', hidden: st.repetir === 'none' || !!existing }, h('label', { class: 'field-label', text: 'Repetir hasta' }), repeatUntil);
  const repeatWrap = h('div', { class: 'field', style: 'margin-top:12px' }, h('label', { class: 'field-label', text: 'Se repite' }), repetir);
  const repeatNote = h('p', { class: 't-sub', style: 'margin:6px 0 0', text: existing && existing.serieId ? 'Este evento pertenece a una repetición. Los cambios o la eliminación se aplican solo a esta fecha.' : 'Elegí una fecha final para no crear eventos sin límite.' });
  repeatNote.hidden = existing && !existing.serieId;
  const notas = h('textarea', { class: 'ctl', rows: '3', maxlength: '1000', placeholder: 'Notas, link de la videollamada, lugar…', disabled: !mine, 'aria-label': 'Notas', oninput: (e) => { st.notas = e.target.value; } });
  notas.value = st.notas;

  const visSeg = h('div', { class: 'ev-seg', role: 'radiogroup', 'aria-label': 'Quién lo ve' });
  const paintVis = () => {
    visSeg.replaceChildren(...[['yo', '🔒 Solo yo'], ['todos', '👥 Todo el equipo'], ['personas', '👥 Elegir personas']].filter(([k]) => canShare || k === 'yo').map(([k, t]) =>
      h('button', { type: 'button', class: 'ev-seg-btn' + (st.visib === k ? ' on' : ''), role: 'radio', 'aria-checked': st.visib === k, disabled: !mine, onclick: () => { st.visib = k; paintVis(); } }, t)));
    people.hidden = st.visib !== 'personas';
    visHint.textContent = st.visib === 'yo' ? 'Solo vos lo ves. Nadie más, ni los administradores.' : (st.visib === 'todos' ? 'Todo el equipo lo ve en su calendario.' : (others.length ? 'Lo ven solo las personas que marques.' : 'Todavía no hay otras personas en el equipo.'));
  };
  const visHint = h('p', { class: 't-sub', style: 'margin:8px 0 0' });

  const remBox = h('div', { class: 'ev-rem' });
  const paintRem = () => {
    const ok = !!st.hora;
    remBox.replaceChildren(...[
      ...REMIND_OPTS.map(([m, t]) => h('label', { class: 'check' + (ok ? '' : ' off') },
        h('input', { type: 'checkbox', checked: st.recordar.includes(m), disabled: !ok || !mine, onchange: (e) => { st.recordar = e.target.checked ? [...new Set([...st.recordar, m])] : st.recordar.filter(x => x !== m); } }), t)),
      ok ? null : h('span', { class: 't-sub', style: 'flex-basis:100%', text: 'Poné una hora para poder activar recordatorios.' })].filter(Boolean));
  };
  const pushNote = h('p', { class: 't-sub', style: 'margin:8px 0 0' });
  pushNote.textContent = mode === 'db'
    ? 'Te llega una notificación al celular (tenés que tener activada la campana).'
    : 'Sin conexión al equipo, el recordatorio aparece solo mientras Obox está abierto.';

  const msg = h('p', { class: 'field-err', hidden: true });
  const save = btn(existing ? 'Guardar cambios' : 'Crear evento', 'btn', () => {
    const t = st.titulo.trim();
    if (!t) { title.classList.add('invalid'); title.focus(); return; }
    if (!st.fecha) { showToast('Elegí una fecha.'); return; }
    if (st.repetir !== 'none' && (!st.hasta || st.hasta < st.fecha)) { showToast('Elegí una fecha final igual o posterior a la primera fecha.'); return; }
    if (st.repetir !== 'none' && eventRepeatDates(st.fecha, st.hasta, st.repetir).length >= 100) { showToast('La repetición puede crear como máximo 100 eventos. Acercá la fecha final.'); return; }
    if (st.horaFin && st.hora && st.horaFin <= st.hora) { showToast('La hora de fin tiene que ser después de la de inicio.'); return; }
    const visib = canShare ? st.visib : 'yo';
    const invitados = visib === 'personas' ? st.invitados.filter(Boolean).slice(0, 30) : [];
    const recordar = st.hora ? REMIND_OPTS.map(o => o[0]).filter(m => st.recordar.includes(m)) : [];
    const inicio = evInicio(st.fecha, st.hora);
    const unchanged = existing && existing.inicio === inicio && JSON.stringify(existing.recordar || []) === JSON.stringify(recordar);
    const now = Date.now();
    const enviados = unchanged ? (existing.enviados || []) : recordar.filter(m => inicio - m * 60000 <= now);
    const pend = recordar.filter(m => !enviados.includes(m)).map(m => inicio - m * 60000);
    const baseData = { titulo: t.slice(0, 120), notas: st.notas.trim().slice(0, 1000), hora: st.hora || '', horaFin: st.hora ? (st.horaFin || '') : '',
      owner: myUid(), visib, invitados, recordar };
    if (existing) {
      const data = { ...baseData, fecha: st.fecha, inicio, enviados, proximoAviso: pend.length ? Math.min(...pend) : null };
      wUpd('events', existing.id, data);
    } else {
      const dates = eventRepeatDates(st.fecha, st.hasta, st.repetir);
      const serieId = st.repetir === 'none' ? null : newId();
      dates.forEach((fechaEvento) => {
        const inicioEvento = evInicio(fechaEvento, st.hora);
        const enviadosEvento = recordar.filter(m => inicioEvento - m * 60000 <= now);
        const pendientesEvento = recordar.filter(m => !enviadosEvento.includes(m)).map(m => inicioEvento - m * 60000);
        const data = { ...baseData, fecha: fechaEvento, inicio: inicioEvento, enviados: enviadosEvento,
          proximoAviso: pendientesEvento.length ? Math.min(...pendientesEvento) : null, creadoAt: now,
          ...(serieId ? { serieId, repetir: st.repetir, hasta: st.hasta } : {}) };
        wSet('events', newId(), data);
      });
    }
    closeModal('ev-modal');
    showToast(existing ? 'Evento actualizado.' : (st.repetir === 'none' ? 'Evento creado. No aparece en tus tareas.' : 'Se crearon los eventos repetidos con sus recordatorios.'));
  });
  const del = existing && (mine || (me.isAdmin && existing.visib === 'todos')) ? btn('Eliminar', 'btn danger sm', () => {
    wDel('events', existing.id); closeModal('ev-modal'); showToast('Evento eliminado.');
  }) : null;

  box.replaceChildren(
    h('div', { class: 'day-modal-head' }, h('h2', { text: existing ? (mine ? 'Evento' : 'Evento de ' + nameOf(existing.owner)) : 'Nuevo evento' }),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Cerrar', html: X_ICON, onclick: () => closeModal('ev-modal') })),
    h('p', { class: 't-sub', style: 'margin:-6px 0 14px', text: 'Los eventos viven solo en el calendario: no aparecen en Tareas ni en el tablero.' }),
    h('label', { class: 'field-label', text: 'Título' }), title,
    h('div', { class: 'frow', style: 'margin-top:12px' },
      h('div', { class: 'field' }, h('label', { class: 'field-label', text: 'Fecha' }), fecha),
      h('div', { class: 'field' }, h('label', { class: 'field-label', text: 'Desde' }), hora),
      h('div', { class: 'field' }, h('label', { class: 'field-label', text: 'Hasta (opcional)' }), horaFin)),
    repeatWrap, repeatUntilWrap, repeatNote,
    h('label', { class: 'field-label', style: 'margin-top:12px', text: 'Notas' }), notas,
    h('span', { class: 'field-label', style: 'margin-top:14px', text: '¿Quién lo ve?' }), visSeg, visHint, people,
    h('span', { class: 'field-label', style: 'margin-top:14px', text: 'Avisarme' }), remBox, pushNote, msg,
    h('div', { class: 'day-modal-foot ev-foot' }, del, h('span', { style: 'flex:1' }),
      btn(mine ? 'Cancelar' : 'Cerrar', 'btn secondary sm', () => closeModal('ev-modal')), mine ? save : null));
  paintVis(); paintRem();
  bd.classList.add('show');
  if (mine && !existing) setTimeout(() => title.focus(), 50);
}

/* Recordatorios dentro de la app: solo cuando el celular no está recibiendo avisos (sin conexión al equipo o campana apagada). */
function pushIsOn() { const b = $('btn-push'); return mode === 'db' && !!b && b.dataset.on === '1'; }
function inAppReminders() {
  if (pushIsOn()) return;
  let fired = {};
  try { fired = JSON.parse(localStorage.getItem('obox.evFired') || '{}'); } catch (e) {}
  const now = Date.now(); let changed = false;
  (D.events || []).filter(evVisible).forEach(e => {
    if (!e.inicio || !(e.recordar || []).length || now > e.inicio + 5 * 60000) return;
    const due = e.recordar.filter(m => e.inicio - m * 60000 <= now && !fired[e.id + ':' + m + ':' + e.inicio]);
    if (!due.length) return;
    due.forEach(m => { fired[e.id + ':' + m + ':' + e.inicio] = now; });
    changed = true;
    const m = Math.min(...due);
    showToast('🔔 ' + e.titulo + ' · ' + (m >= 1440 ? 'mañana' : (m === 60 ? 'en 1 hora' : 'en ' + m + ' min')) + ' (' + e.hora + ')', null, 12000);
  });
  if (changed) {
    Object.keys(fired).forEach(k => { if (now - fired[k] > 3 * 86400000) delete fired[k]; });
    try { localStorage.setItem('obox.evFired', JSON.stringify(fired)); } catch (e) {}
  }
}
setInterval(inAppReminders, 30000);

/* =====================================================================
   3. Informes mensuales (solo administradores) con IA opcional
   ===================================================================== */
const REP = { month: todayStr().slice(0, 7), stats: {}, daily: {}, ai: {}, busy: {}, general: null };
function repMonthLabel(m) { const [y, mm] = m.split('-').map(Number); return cap(new Date(y, mm - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })); }
function repShift(m, n) { const [y, mm] = m.split('-').map(Number); const d = new Date(y, mm - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
function boardLastCol(boardId) { const b = D.boards.find(x => x.id === boardId); const cols = (b && b.columns) || []; return cols.length ? cols[cols.length - 1].id : null; }
function workdaysUntil(month) {
  const [y, m] = month.split('-').map(Number), last = new Date(y, m, 0).getDate(), today = todayStr();
  let n = 0;
  for (let d = 1; d <= last; d++) { const dt = new Date(y, m - 1, d); if (fmtISO(dt) > today) break; const w = dt.getDay(); if (w !== 0 && w !== 6) n++; }
  return n;
}
function computeStats(uid, month) {
  const inM = (f) => typeof f === 'string' && f.slice(0, 7) === month;
  const today = todayStr();
  const tasks = D.tasks.filter(t => assigneesOf(t).includes(uid) && inM(t.fecha));
  const hechas = tasks.filter(t => t.estado === 'Hecho');
  const aTiempo = hechas.filter(t => t.doneAt && fmtISO(new Date(t.doneAt)) <= t.fecha);
  const atrasadas = tasks.filter(t => t.estado !== 'Hecho' && t.fecha < today);
  const porCliente = {};
  tasks.forEach(t => { const n = clientName(t.cliente); (porCliente[n] = porCliente[n] || { total: 0, hechas: 0 }).total++; if (t.estado === 'Hecho') porCliente[n].hechas++; });
  const cards = D.cards.filter(c => assigneesOf(c).includes(uid) && inM(c.vence));
  const cardsListas = cards.filter(c => c.columnId === boardLastCol(c.boardId));
  const dl = REP.daily[month + ':' + uid];
  const dailyDias = Array.isArray(dl) ? dl.filter(d => d.ayer || d.hoy).length : (dl === null ? null : undefined);
  return {
    mes: month, tareas: tasks.length, tareasHechas: hechas.length, tareasATiempo: aTiempo.length, tareasAtrasadas: atrasadas.length,
    tarjetas: cards.length, tarjetasListas: cardsListas.length, porCliente,
    dailyDias, diasHabiles: workdaysUntil(month),
    frenos: Array.isArray(dl) ? dl.filter(d => d.bloqueos).map(d => ({ fecha: d.id, texto: String(d.bloqueos).slice(0, 300) })).slice(-6) : [],
    dailyTextos: Array.isArray(dl) ? dl.filter(d => d.ayer || d.hoy).slice(-10).map(d => ({ fecha: d.id, ayer: String(d.ayer || '').slice(0, 250), hoy: String(d.hoy || '').slice(0, 250) })) : []
  };
}
const pct = (a, b) => b ? Math.round(a * 100 / b) + '%' : '—';
function localSummary(name, s) {
  const out = [];
  if (s.tareas) out.push(`${name} tuvo ${plural(s.tareas, 'tarea asignada', 'tareas asignadas')} con fecha en ${repMonthLabel(s.mes).toLowerCase()}: completó ${s.tareasHechas} (${pct(s.tareasHechas, s.tareas)})${s.tareasHechas ? `, ${s.tareasATiempo} a tiempo` : ''}.`);
  if (s.tareasAtrasadas) out.push(`Tiene ${plural(s.tareasAtrasadas, 'tarea atrasada', 'tareas atrasadas')} sin cerrar.`);
  if (s.tarjetas) out.push(`En los tableros: ${s.tarjetasListas} de ${s.tarjetas} tarjetas con vencimiento del mes están en la última columna.`);
  if (typeof s.dailyDias === 'number' && s.diasHabiles) out.push(`Completó el Daily ${s.dailyDias} de ${s.diasHabiles} días hábiles.`);
  if (s.frenos.length) out.push(`Mencionó frenos en ${plural(s.frenos.length, 'día', 'días')}.`);
  if (!s.tareas && !s.tarjetas) out.push('No hay tareas ni tarjetas asignadas con fecha este mes.');
  return out.join(' ');
}
async function repLoadDaily(uid) {
  const key = REP.month + ':' + uid;
  if (REP.daily[key] !== undefined) return;
  REP.daily[key] = 'loading';
  try {
    const fp = firebase.firestore.FieldPath.documentId();
    const snap = await dbApi.collection('users/' + uid + '/daily').orderBy(fp).startAt(REP.month + '-01').endAt(REP.month + '-31').get();
    REP.daily[key] = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
  } catch (e) { REP.daily[key] = null; }
  if (currentView === 'team' && teamTab === 'informes') renderTeam();
}
async function repAsk(payload) {
  const token = await FB.auth.currentUser.getIdToken();
  const res = await fetch('/api/informe', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(payload) });
  let data = null; try { data = await res.json(); } catch (e) {}
  if (res.status === 404 || !data) throw new Error('nofn');
  if (!res.ok || !data.ok) throw new Error((data && data.error) || 'error');
  return data;
}
function aiErrorText(e) {
  const m = e && e.message;
  if (m === 'nofn') return 'La IA todavía no está conectada (mirá el LEEME, punto 23). Mientras tanto queda el resumen automático.';
  if (m === 'sin-ia' || m === 'falta-config') return 'Falta elegir el proveedor de IA en Cloudflare (LEEME, punto 23).';
  if (m === 'solo administradores') return 'Solo los administradores pueden generar informes.';
  return 'No pude generar el informe ahora. Probá de nuevo en un rato.';
}
async function repGenerate(uid) {
  const key = REP.month + ':' + uid;
  REP.busy[key] = true; renderTeam();
  try {
    const s = REP.stats[key] || computeStats(uid, REP.month);
    const data = await repAsk({ tipo: 'persona', mes: repMonthLabel(REP.month), persona: nameOf(uid), stats: s });
    REP.ai[key] = { texto: data.texto, via: data.proveedor || '' };
  } catch (e) {
    REP.ai[key] = { error: aiErrorText(e) };
  }
  REP.busy[key] = false; renderTeam();
}
async function repGenerateAll() {
  REP.busy.general = true; renderTeam();
  try {
    const personas = D.members.map(m => ({ persona: nameOf(m.id), stats: (({ dailyTextos, frenos, ...r }) => ({ ...r, frenos: frenos.length }))(computeStats(m.id, REP.month)) }));
    const data = await repAsk({ tipo: 'equipo', mes: repMonthLabel(REP.month), personas });
    REP.general = { texto: data.texto, via: data.proveedor || '' };
  } catch (e) { REP.general = { error: aiErrorText(e) }; }
  REP.busy.general = false; renderTeam();
}
function repText(name, s, ai) {
  const lines = [`Informe de ${repMonthLabel(s.mes)} · ${name}`, '', localSummary(name, s)];
  if (ai && ai.texto) lines.push('', 'Análisis:', ai.texto);
  return lines.join('\n');
}
function copyText(t) {
  const done = () => showToast('Copiado.');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => showToast('No pude copiar.'));
  else { const ta = h('textarea', { style: 'position:fixed;opacity:0' }); ta.value = t; document.body.append(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { showToast('No pude copiar.'); } ta.remove(); }
}
function statTile(n, label, cls) { return h('div', { class: 'rp-stat' + (cls ? ' ' + cls : '') }, h('strong', { text: String(n) }), h('span', { text: label })); }
function aiBox(ai, busyNow) {
  if (busyNow) return h('p', { class: 'rp-ai pending', text: 'Escribiendo el informe…' });
  if (!ai) return null;
  if (ai.error) return h('p', { class: 'rp-ai err', text: ai.error });
  return h('div', { class: 'rp-ai' }, h('div', { class: 'rp-ai-tag', text: 'Análisis con IA' + (ai.via ? ' · ' + ai.via : '') }), h('p', { text: ai.texto }));
}
function reportsCard() {
  const month = REP.month, isNow = month === todayStr().slice(0, 7);
  const ms = D.members.slice().sort((a, b) => nameOf(a.id).localeCompare(nameOf(b.id), 'es'));
  ms.forEach(m => repLoadDaily(m.id));
  const nav = h('div', { class: 'td-nav' },
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Mes anterior', onclick: () => { REP.month = repShift(month, -1); renderTeam(); }, html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>' }),
    h('div', { class: 'td-date' }, h('strong', { text: repMonthLabel(month) }), h('span', { text: isNow ? 'Mes en curso' : '' })),
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Mes siguiente', disabled: isNow, onclick: () => { REP.month = repShift(month, 1); renderTeam(); }, html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>' }));
  const card = h('div', { class: 'card td-card' },
    h('div', { class: 'team-sec-head' }, h('h2', null, 'Informes mensuales')),
    h('p', { class: 't-sub', style: 'margin:0 0 18px', text: 'Los números salen de tareas, tarjetas y Daily del mes y se calculan acá, sin costo. La IA es opcional: redacta el análisis con esos datos (y con lo que cada persona escribió en su Daily).' }),
    nav,
    h('div', { class: 'rp-general' }, btn('Resumen general del equipo con IA', 'btn secondary sm', repGenerateAll, { disabled: !!REP.busy.general }), aiBox(REP.general, REP.busy.general)));
  if (!ms.length) { card.append(h('p', { class: 'empty', text: 'Todavía no hay personas en el equipo.' })); return card; }
  ms.forEach(m => {
    const key = month + ':' + m.id;
    const s = computeStats(m.id, month); REP.stats[key] = s;
    const name = nameOf(m.id);
    const row = h('div', { class: 'td-row rp-row' },
      h('div', { class: 'td-head' }, avatarEl(m.id, true), h('div', { class: 't-name', text: name + (m.id === me.id ? ' (vos)' : '') })),
      h('div', { class: 'rp-stats' },
        statTile(s.tareasHechas + '/' + s.tareas, 'tareas hechas'),
        statTile(pct(s.tareasATiempo, s.tareasHechas), 'a tiempo'),
        statTile(s.tareasAtrasadas, 'atrasadas', s.tareasAtrasadas ? 'warn' : ''),
        statTile(s.tarjetasListas + '/' + s.tarjetas, 'tarjetas listas'),
        statTile(s.dailyDias === undefined ? '…' : (s.dailyDias === null ? '—' : s.dailyDias + '/' + s.diasHabiles), 'Daily')),
      h('p', { class: 'rp-sum', text: localSummary(name, s) }));
    const clients = Object.entries(s.porCliente).sort((a, b) => b[1].total - a[1].total).slice(0, 6);
    if (clients.length) row.append(h('div', { class: 'rp-clients' }, clients.map(([n, v]) => h('span', { class: 'k-chip' }, n + ' · ' + v.hechas + '/' + v.total))));
    const ai = REP.ai[key];
    const aib = aiBox(ai, REP.busy[key]); if (aib) row.append(aib);
    row.append(
      h('div', { class: 'rp-actions' },
        btn(ai && ai.texto ? 'Volver a generar' : 'Generar análisis con IA', 'btn secondary sm', () => repGenerate(m.id), { disabled: !!REP.busy[key] }),
        btn('Copiar informe', 'btn danger sm', () => copyText(repText(name, s, ai)))));
    card.append(row);
  });
  card.append(h('p', { class: 't-sub', style: 'margin:18px 0 0', text: 'Cómo se cuenta: tareas y tarjetas asignadas a cada persona con fecha de entrega o vencimiento dentro del mes. "A tiempo" = se cerró hasta la fecha. Una tarjeta está lista si está en la última columna de su tablero.' }));
  return card;
}
