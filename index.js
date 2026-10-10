/*
  Avisos al celular de Obox.

  OPCIONAL (necesita plan Blaze de Firebase). La opción gratis es functions/api/notificar.js (Cloudflare).

  Cuando alguien asigna una TAREA o una TARJETA a otra persona (o la reasigna),
  esta función le manda una notificación a los celulares donde esa persona activó los avisos.

  La app anota en el documento quién asignó (asignadoPor) y cuándo (asignadoAt).
  Solo se avisa cuando ese sello cambia, así que editar el título o mover una tarjeta de columna no genera avisos.
*/
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();

const REGION = 'us-central1';

async function nameOf(uid) {
  if (!uid) return 'Alguien';
  try {
    const u = await db.doc('users/' + uid).get();
    const n = u.exists && (u.data().nick || u.data().name);
    if (n) return String(n).split(' ')[0];
  } catch (e) { /* sigo */ }
  return 'Alguien';
}

async function clientName(id) {
  if (!id) return 'Sin cliente';
  try {
    const c = await db.doc('clients/' + id).get();
    if (c.exists && c.data().name) return c.data().name;
  } catch (e) { /* sigo */ }
  return id;
}

function assigneesOf(x) {
  if (Array.isArray(x.asignados) && x.asignados.length) return x.asignados.filter(Boolean);
  return x.asignado ? [x.asignado] : [];
}

// ¿A quiénes hay que avisar? (las personas recién sumadas, que no sean quien asignó)
function newTargets(before, after) {
  if (!after || !after.asignadoPor) return [];
  // Evita avisos viejos si se reimporta o se reescribe un documento antiguo.
  if (!after.asignadoAt || Date.now() - after.asignadoAt > 10 * 60 * 1000) return [];
  if (before && before.asignadoAt === after.asignadoAt) return [];
  const current = new Set(assigneesOf(after));
  const nuevos = Array.isArray(after.asignadoNuevos) ? after.asignadoNuevos : (after.asignado ? [after.asignado] : []);
  return [...new Set(nuevos)].filter((u) => u !== after.asignadoPor && current.has(u));
}

async function sendToUser(uid, notification, data) {
  const snap = await db.collection('users/' + uid + '/tokens').get();
  if (snap.empty) return { sent: 0 };
  let sent = 0;
  await Promise.all(snap.docs.map(async (d) => {
    const t = d.data();
    const origin = t.origin || '';
    try {
      const message = { token: t.token, notification, data };
      if (origin) {
        message.webpush = {
          notification: { icon: origin + '/icon-192.png', badge: origin + '/icon-192.png' },
          fcmOptions: { link: origin + '/' }
        };
      }
      await getMessaging().send(message);
      sent++;
    } catch (e) {
      // Token vencido o app desinstalada: lo limpiamos.
      if (e && (e.code === 'messaging/registration-token-not-registered' || e.code === 'messaging/invalid-registration-token')) {
        await d.ref.delete().catch(() => {});
      } else {
        console.error('No pude avisar a', uid, e && e.code);
      }
    }
  }));
  return { sent };
}

exports.avisoTarea = onDocumentWritten({ document: 'tasks/{id}', region: REGION }, async (event) => {
  const before = event.data.before.exists ? event.data.before.data() : null;
  const after = event.data.after.exists ? event.data.after.data() : null;
  const targets = newTargets(before, after);
  if (!targets.length) return;
  const [quien, cliente] = await Promise.all([nameOf(after.asignadoPor), clientName(after.cliente)]);
  await Promise.all(targets.map((uid) => sendToUser(uid, {
    title: quien + ' te asignó la tarea «' + (after.titulo || 'sin título') + '»',
    body: 'Cliente: ' + cliente + (after.fecha ? ' · para el ' + after.fecha.split('-').reverse().join('/') : '')
  }, { tipo: 'tarea', id: event.params.id })));
});

exports.avisoTarjeta = onDocumentWritten({ document: 'cards/{id}', region: REGION }, async (event) => {
  const before = event.data.before.exists ? event.data.before.data() : null;
  const after = event.data.after.exists ? event.data.after.data() : null;
  const targets = newTargets(before, after);
  if (!targets.length) return;
  const [quien, cliente] = await Promise.all([nameOf(after.asignadoPor), clientName(after.cliente)]);
  let detalle = cliente;
  try {
    const b = await db.doc('boards/' + after.boardId).get();
    if (b.exists) {
      const board = b.data();
      const col = (board.columns || []).find((c) => c.id === after.columnId);
      detalle = cliente + ' · ' + (board.title || 'Tablero') + (col ? ' · ' + col.title : '');
    }
  } catch (e) { /* uso solo el cliente */ }
  await Promise.all(targets.map((uid) => sendToUser(uid, {
    title: quien + ' te asignó la tarjeta «' + (after.titulo || 'sin título') + '»',
    body: detalle
  }, { tipo: 'tarjeta', id: event.params.id, boardId: after.boardId || '' })));
});
