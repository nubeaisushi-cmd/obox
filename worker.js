/*
  Recordatorios de eventos de Obox (Cloudflare Worker con "Cron", plan gratis).

  Corre solo, una vez por minuto. Busca eventos cuyo recordatorio ya toca (campo proximoAviso)
  y manda la notificación al celular de quien corresponde (FCM). No necesita que nadie tenga Obox abierto.

  Es un archivo suelto: se pega entero en Cloudflare (LEEME, punto 23). No usa librerías.
  Necesita: secreto FIREBASE_SERVICE_ACCOUNT y variable APP_URL (la dirección de tu web, sin barra final).
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
async function fsList(ctx, path, size) {
  const res = await fetch(fsBase(ctx.pid) + '/' + path + '?pageSize=' + (size || 50), { headers: { Authorization: 'Bearer ' + ctx.at } });
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


/* ---------- recordatorios ---------- */
const GRACE_MS = 30 * 60 * 1000; // si el evento ya empezó hace más de 30 min, no se avisa
const LATE_MS = 10 * 60 * 1000;

function intVal(n) { return { integerValue: String(Math.round(n)) }; }

async function fsRunDue(ctx, now) {
  const res = await fetch(fsBase(ctx.pid) + ':runQuery', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + ctx.at,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'events' }],
        limit: 100
      }
    })
  });

  if (!res.ok) throw new Error('query ' + res.status);

  const rows = await res.json();

  return rows
    .filter((r) => r && r.document)
    .map((r) => fsDoc(r.document))
    .filter((ev) => {
      const inicio = Number(ev.inicio);
      const enviados = Array.isArray(ev.enviados)
        ? ev.enviados.map(Number)
        : [];
      const recordar = Array.isArray(ev.recordar)
        ? ev.recordar.map(Number)
        : [];

      return inicio > 0 && recordar.some((m) =>
        !enviados.includes(m) &&
        inicio - m * 60000 <= now &&
        now <= inicio + GRACE_MS
      );
    });
});
  if (!res.ok) throw new Error('query ' + res.status);
  const rows = await res.json();
  return rows.filter((r) => r && r.document).map((r) => fsDoc(r.document));
}
async function fsPatchEvent(ctx, id, enviados, proximo) {
  const fields = {
    enviados: { arrayValue: { values: enviados.map(intVal) } },
    proximoAviso: proximo == null ? { nullValue: null } : intVal(proximo)
  };
  const res = await fetch(fsBase(ctx.pid) + '/events/' + seg(id) + '?updateMask.fieldPaths=enviados&updateMask.fieldPaths=proximoAviso&currentDocument.exists=true', {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + ctx.at, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  return res.ok;
}
function nextPending(ev, enviados) {
  const ts = (Array.isArray(ev.recordar) ? ev.recordar : []).filter((m) => !enviados.includes(m)).map((m) => Number(ev.inicio) - m * 60000);
  return ts.length ? Math.min(...ts) : null;
}
function textoAviso(ev, m) {
  const hora = ev.hora || '';
  if (m >= 1440) return { title: '🗓 Mañana: ' + ev.titulo, body: 'A las ' + hora + (ev.notas ? ' · ' + String(ev.notas).slice(0, 80) : '') };
  if (m >= 60) return { title: '🗓 En ' + (m / 60 === 1 ? '1 hora' : (m / 60) + ' horas') + ': ' + ev.titulo, body: 'A las ' + hora + (ev.notas ? ' · ' + String(ev.notas).slice(0, 80) : '') };
  return { title: '🗓 En ' + m + ' minutos: ' + ev.titulo, body: 'A las ' + hora + (ev.notas ? ' · ' + String(ev.notas).slice(0, 80) : '') };
}
async function destinatarios(ctx, ev) {
  if (ev.visib === 'todos') return (await fsList(ctx, 'members', 300)).map((m) => m.__id);
  const set = new Set([ev.owner]);
  if (ev.visib === 'personas' && Array.isArray(ev.invitados)) ev.invitados.slice(0, 30).forEach((u) => set.add(u));
  return [...set].filter((u) => typeof u === 'string' && u);
}
async function procesar(env, now) {
  const sa = getServiceAccount(env);
  if (!sa) {
  return {
    ok: false,
    error: 'No se pudo leer FIREBASE_SERVICE_ACCOUNT',
    diagnostico: {
      existe: !!env.FIREBASE_SERVICE_ACCOUNT,
      tipo: typeof env.FIREBASE_SERVICE_ACCOUNT
    }
  };
}
  const origin = String(env.APP_URL || '').replace(/\/+$/, '');
  const ctx = { pid: sa.project_id, at: await getAccessToken(sa) };
  const due = await fsRunDue(ctx, now);
  let enviados = 0;
  for (const ev of due) {
    const inicio = Number(ev.inicio);
    const ya = Array.isArray(ev.enviados) ? ev.enviados.map(Number) : [];
    const recordar = (Array.isArray(ev.recordar) ? ev.recordar : []).map(Number);
    const toca = recordar.filter((m) => !ya.includes(m) && inicio - m * 60000 <= now);
    const todos = [...new Set([...ya, ...toca])];
    const proximo = nextPending(ev, todos);
    if (!inicio || !toca.length) { await fsPatchEvent(ctx, ev.__id, todos, proximo); continue; }
    // Se marca primero, así una corrida solapada no manda el aviso doble.
    const okMark = await fsPatchEvent(ctx, ev.__id, todos, proximo);
    if (!okMark) continue;
    if (now > inicio + GRACE_MS) continue;
    const m = Math.min(...toca);
    // Si ya pasó mucho del momento del aviso (Cloudflare caído, etc.), igual se manda el más cercano.
    const { title, body } = textoAviso(ev, m);
    const data = { tipo: 'evento', id: String(ev.__id) };
    for (const uid of await destinatarios(ctx, ev)) {
      const tokens = await fsList(ctx, 'users/' + seg(uid) + '/tokens');
      for (const t of tokens) {
        if (!t.token) continue;
        const r = await sendFcm(ctx, t.token, { title, body }, data, origin);
        if (r.ok) enviados++;
        else if (r.dead) await fsDelete(ctx, 'users/' + seg(uid) + '/tokens/' + seg(t.token));
      }
    }
  }
  return { ok: true, revisados: due.length, enviados };
}

export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(procesar(env, Date.now()).catch(() => {})); },
  // Abrir la dirección del Worker en el navegador sirve para probar que está andando (no manda nada si no hay nada pendiente).
  async fetch(request, env) {
    try { return json(await procesar(env, Date.now())); } catch (e) { return json({ ok: false, error: 'error interno' }, 500); }
  }
};
