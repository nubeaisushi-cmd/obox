/*
  Avisos al celular de Obox, versión GRATIS (Cloudflare Pages Functions).

  Cuando alguien asigna una tarea o una tarjeta, la app llama acá (POST /api/notificar) con su sesión de Firebase.
  Esta función:
    1. comprueba que la sesión es de verdad (firma del token de Firebase),
    2. lee la tarea/tarjeta y confirma que ESA persona fue quien asignó y hace menos de 5 minutos,
    3. confirma que a quien se avisa tiene acceso a ese cliente,
    4. manda la notificación a los celulares de esa persona (FCM) y marca la asignación como avisada.

  Necesita UN secreto en Cloudflare: FIREBASE_SERVICE_ACCOUNT (el JSON de la cuenta de servicio). Ver LEEME, punto 22.
  No usa librerías: solo fetch y crypto, que ya trae Cloudflare.
*/

const SCOPES = 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging';
const JWK_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const MAX_AGE_MS = 5 * 60 * 1000;

/* ---------- utilidades ---------- */
const enc = new TextEncoder();
function b64urlToBytes(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64url(buf) {
  const b = new Uint8Array(buf); let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const strB64url = (str) => bytesToB64url(enc.encode(str));
const parseJSONPart = (part) => JSON.parse(new TextDecoder().decode(b64urlToBytes(part)));
function pemToDer(pem) {
  const b64 = String(pem).replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(b64); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}
function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

/* ---------- cuenta de servicio y token de acceso (se reutilizan entre llamadas) ---------- */
let saCache = { raw: '', sa: null };
function getServiceAccount(env) {
  const raw = env && env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  if (saCache.raw === raw) return saCache.sa;
  let sa = null;
  try { sa = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return null; }
  if (!sa || !sa.private_key || !sa.client_email || !sa.project_id) return null;
  saCache = { raw, sa };
  return sa;
}
let tokenCache = { value: '', exp: 0, email: '' };
async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache.value && tokenCache.email === sa.client_email && tokenCache.exp - 120 > now) return tokenCache.value;
  const uri = sa.token_uri || 'https://oauth2.googleapis.com/token';
  const header = strB64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = strB64url(JSON.stringify({ iss: sa.client_email, scope: SCOPES, aud: uri, iat: now, exp: now + 3600 }));
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(sa.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(header + '.' + claims));
  const res = await fetch(uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + encodeURIComponent(header + '.' + claims + '.' + bytesToB64url(sig))
  });
  if (!res.ok) throw new Error('token ' + res.status);
  const data = await res.json();
  tokenCache = { value: data.access_token, exp: now + (Number(data.expires_in) || 3600), email: sa.client_email };
  return tokenCache.value;
}

/* ---------- verificar la sesión de Firebase de quien llama ---------- */
let jwkCache = { keys: [], at: 0 };
async function getJwk(kid, force) {
  const fresh = Date.now() - jwkCache.at < 60 * 60 * 1000;
  if (!force && fresh) { const k = jwkCache.keys.find((x) => x.kid === kid); if (k) return k; }
  const res = await fetch(JWK_URL);
  if (!res.ok) throw new Error('jwk ' + res.status);
  const data = await res.json();
  jwkCache = { keys: data.keys || [], at: Date.now() };
  return jwkCache.keys.find((x) => x.kid === kid) || null;
}
async function verifyIdToken(idToken, projectId) {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) return null;
  let header, claims;
  try { header = parseJSONPart(parts[0]); claims = parseJSONPart(parts[1]); } catch (e) { return null; }
  if (header.alg !== 'RS256' || !header.kid) return null;
  let jwk = await getJwk(header.kid, false);
  if (!jwk) jwk = await getJwk(header.kid, true);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const okSig = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), enc.encode(parts[0] + '.' + parts[1]));
  if (!okSig) return null;
  const now = Math.floor(Date.now() / 1000);
  if (claims.aud !== projectId) return null;
  if (claims.iss !== 'https://securetoken.google.com/' + projectId) return null;
  if (!claims.sub || typeof claims.sub !== 'string' || claims.sub.length > 128) return null;
  if (typeof claims.exp !== 'number' || claims.exp <= now) return null;
  if (typeof claims.iat !== 'number' || claims.iat > now + 60) return null;
  return { uid: claims.sub, name: claims.name || '' };
}

/* ---------- Firestore (REST) ---------- */
function fsBase(pid) { return 'https://firestore.googleapis.com/v1/projects/' + pid + '/databases/(default)/documents'; }
const seg = (s) => encodeURIComponent(String(s));
function fsDecode(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return !!v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsDecode);
  if ('mapValue' in v) { const o = {}; const f = v.mapValue.fields || {}; for (const k in f) o[k] = fsDecode(f[k]); return o; }
  return null;
}
function fsDoc(d) {
  const o = {}; const f = (d && d.fields) || {};
  for (const k in f) o[k] = fsDecode(f[k]);
  o.__id = d && d.name ? String(d.name).split('/').pop() : '';
  return o;
}
async function fsGet(ctx, path) {
  const res = await fetch(fsBase(ctx.pid) + '/' + path, { headers: { Authorization: 'Bearer ' + ctx.at } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('fs ' + res.status);
  return fsDoc(await res.json());
}
async function fsList(ctx, path) {
  const res = await fetch(fsBase(ctx.pid) + '/' + path + '?pageSize=50', { headers: { Authorization: 'Bearer ' + ctx.at } });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error('fs ' + res.status);
  const data = await res.json();
  return (data.documents || []).map(fsDoc);
}
async function fsDelete(ctx, path) {
  await fetch(fsBase(ctx.pid) + '/' + path, { method: 'DELETE', headers: { Authorization: 'Bearer ' + ctx.at } }).catch(() => {});
}
async function fsMarkNotified(ctx, path, at) {
  await fetch(fsBase(ctx.pid) + '/' + path + '?updateMask.fieldPaths=avisadoAt&currentDocument.exists=true', {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + ctx.at, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { avisadoAt: { integerValue: String(at) } } })
  }).catch(() => {});
}

/* ---------- FCM ---------- */
async function sendFcm(ctx, token, notification, data, origin) {
  const res = await fetch('https://fcm.googleapis.com/v1/projects/' + ctx.pid + '/messages:send', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + ctx.at, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: {
      token, notification, data,
      webpush: { notification: { icon: origin + '/icon-192.png', badge: origin + '/icon-192.png' }, fcm_options: { link: origin + '/' } }
    } })
  });
  if (res.ok) return { ok: true };
  let body = null; try { body = await res.json(); } catch (e) {}
  const status = body && body.error && body.error.status;
  const code = body && body.error && (body.error.details || []).map((d) => d.errorCode).find(Boolean);
  return { ok: false, dead: res.status === 404 || status === 'NOT_FOUND' || code === 'UNREGISTERED' };
}

/* ---------- el aviso ---------- */
const firstWord = (s) => String(s || '').trim().split(/\s+/)[0] || '';
function fechaCorta(iso) { return /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.split('-').reverse().join('/') : ''; }
function canSee(member, cliente) {
  if (!member) return false;
  if (member.role === 'admin') return true;
  return member.all === true || (Array.isArray(member.clients) && member.clients.includes(cliente));
}

export async function onRequestPost({ request, env }) {
  try {
    const sa = getServiceAccount(env);
    if (!sa) return json({ ok: false, error: 'Falta el secreto FIREBASE_SERVICE_ACCOUNT en Cloudflare.' }, 500);
    const pid = sa.project_id;

    let body; try { body = await request.json(); } catch (e) { return json({ ok: false, error: 'pedido inválido' }, 400); }
    const col = body && body.col, id = body && body.id;
    if ((col !== 'tasks' && col !== 'cards') || !/^[A-Za-z0-9_-]{1,64}$/.test(String(id || ''))) return json({ ok: false, error: 'pedido inválido' }, 400);

    const auth = request.headers.get('Authorization') || '';
    const caller = await verifyIdToken(auth.startsWith('Bearer ') ? auth.slice(7) : '', pid);
    if (!caller) return json({ ok: false, error: 'sesión inválida' }, 401);

    const ctx = { pid, at: await getAccessToken(sa) };
    const path = col + '/' + seg(id);
    const doc = await fsGet(ctx, path);
    if (!doc) return json({ ok: false, error: 'no existe' }, 404);

    // Solo avisa quien realmente hizo la asignación, y hace poco.
    if (doc.asignadoPor !== caller.uid) return json({ ok: false, error: 'no corresponde' }, 403);
    const at = Number(doc.asignadoAt);
    if (!at || Date.now() - at > MAX_AGE_MS || at > Date.now() + 60000) return json({ ok: true, skipped: 'viejo' });
    if (Number(doc.avisadoAt) === at) return json({ ok: true, skipped: 'ya avisado' });

    const current = new Set(Array.isArray(doc.asignados) && doc.asignados.length ? doc.asignados : (doc.asignado ? [doc.asignado] : []));
    const nuevos = [...new Set(Array.isArray(doc.asignadoNuevos) ? doc.asignadoNuevos : (doc.asignado ? [doc.asignado] : []))]
      .filter((u) => typeof u === 'string' && u !== caller.uid && current.has(u)).slice(0, 10);

    // Se marca primero, así dos llamadas seguidas no mandan el aviso doble.
    await fsMarkNotified(ctx, path, at);
    if (!nuevos.length) return json({ ok: true, sent: 0 });

    const [u, cl] = await Promise.all([fsGet(ctx, 'users/' + seg(caller.uid)), doc.cliente ? fsGet(ctx, 'clients/' + seg(doc.cliente)) : null]);
    const quien = firstWord((u && (u.nick || u.name)) || caller.name) || 'Alguien';
    const cliente = (cl && cl.name) || doc.cliente || 'Sin cliente';
    let title, bodyText, tipo;
    if (col === 'tasks') {
      tipo = 'tarea';
      title = quien + ' te asignó la tarea «' + (doc.titulo || 'sin título') + '»';
      bodyText = 'Cliente: ' + cliente + (fechaCorta(doc.fecha) ? ' · para el ' + fechaCorta(doc.fecha) : '');
    } else {
      tipo = 'tarjeta';
      let detalle = cliente;
      try {
        const b = doc.boardId ? await fsGet(ctx, 'boards/' + seg(doc.boardId)) : null;
        if (b) {
          const colm = (Array.isArray(b.columns) ? b.columns : []).find((c) => c && c.id === doc.columnId);
          detalle = cliente + ' · ' + (b.title || 'Tablero') + (colm && colm.title ? ' · ' + colm.title : '');
        }
      } catch (e) { /* uso solo el cliente */ }
      title = quien + ' te asignó la tarjeta «' + (doc.titulo || 'sin título') + '»';
      bodyText = detalle;
    }
    const origin = new URL(request.url).origin;
    const data = { tipo, id: String(id), boardId: String(doc.boardId || '') };

    let sent = 0;
    for (const target of nuevos) {
      const member = await fsGet(ctx, 'members/' + seg(target));
      if (!canSee(member, doc.cliente)) continue;
      const tokens = await fsList(ctx, 'users/' + seg(target) + '/tokens');
      for (const t of tokens) {
        if (!t.token) continue;
        const r = await sendFcm(ctx, t.token, { title, body: bodyText }, data, origin);
        if (r.ok) sent++;
        else if (r.dead) await fsDelete(ctx, 'users/' + seg(target) + '/tokens/' + seg(t.token));
      }
    }
    return json({ ok: true, sent });
  } catch (e) {
    return json({ ok: false, error: 'error interno' }, 500);
  }
}
