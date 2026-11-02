// Every request under /api/* is handled here.
import { liveSeed } from '../../public/assets/seed.js';
import { toPublic } from '../../public/assets/publicview.js';

// SHA-256 of the one-time setup code. Only the hash lives in the code.
const SETUP_CODE_HASH = 'e6cce422d2ff66948dbceaa2068a574214bbce77fe4aa7cc966ff4fae9f103bb';
const KINDS = ['profile', 'settings', 'ingredient', 'recipe', 'setmenu', 'photo'];
const MIMES = ['image/webp', 'image/jpeg', 'image/png'];
const MAX_IMG = 1900000;
const SESSION_DAYS = 30;
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS docs (kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY (kind, id))',
  'CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, mime TEXT NOT NULL, bytes BLOB NOT NULL, created INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL)',
];

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
});
const err = (message, status = 400) => json({ error: message }, status);
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (t) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)));

async function hashPassword(password, saltHex) {
  const salt = saltHex || hex(crypto.getRandomValues(new Uint8Array(16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bytes = new Uint8Array(salt.match(/../g).map((h) => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: bytes, iterations: 100000 }, key, 256);
  return { salt, hash: hex(bits) };
}

const getKv = async (env, k) => (await env.DB.prepare('SELECT v FROM kv WHERE k = ?').bind(k).first())?.v ?? null;
const setKv = (env, k, v) => env.DB.prepare('INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(k, String(v)).run();
const putDocStmt = (env, kind, doc) => env.DB.prepare(
  'INSERT INTO docs (kind, id, data, updated) VALUES (?, ?, ?, ?) ON CONFLICT(kind, id) DO UPDATE SET data = excluded.data, updated = excluded.updated',
).bind(kind, doc.id, JSON.stringify(doc), Date.now());

let ready = false;
async function ensureDb(env) {
  if (ready) return;
  await env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s)));
  const seeded = await getKv(env, 'seeded');
  if (!seeded) {
    // Claim the seed first so two simultaneous first visits cannot seed twice.
    const claim = await env.DB.prepare("INSERT OR IGNORE INTO kv (k, v) VALUES ('seeded', '1')").run();
    if (claim.meta.changes) {
      const seed = liveSeed();
      const stmts = [];
      for (const kind of KINDS) for (const doc of seed[kind] || []) stmts.push(putDocStmt(env, kind, doc));
      await env.DB.batch(stmts);
    }
  }
  ready = true;
}

async function allDocs(env) {
  const { results } = await env.DB.prepare('SELECT kind, data FROM docs').all();
  const docs = Object.fromEntries(KINDS.map((k) => [k, []]));
  for (const r of results) docs[r.kind]?.push(JSON.parse(r.data));
  return docs;
}

const cookie = (req) => (req.headers.get('cookie') || '').match(/(?:^|;\s*)sid=([a-f0-9]{64})/)?.[1];
async function isAuthed(req, env) {
  const t = cookie(req);
  if (!t) return false;
  const row = await env.DB.prepare('SELECT expires FROM sessions WHERE token = ?').bind(await sha256(t)).first();
  return !!row && row.expires > Date.now();
}
async function newSession(env) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const expires = Date.now() + SESSION_DAYS * 864e5;
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires < ?').bind(Date.now()),
    env.DB.prepare('INSERT INTO sessions (token, expires) VALUES (?, ?)').bind(await sha256(token), expires),
  ]);
  return `sid=${token}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`;
}
const clearCookie = 'sid=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0';

const body = async (request) => { try { return await request.json(); } catch { return {}; } };

function validDoc(kind, doc) {
  return KINDS.includes(kind) && doc && typeof doc === 'object' && ID_RE.test(String(doc.id || '')) && JSON.stringify(doc).length < 900000;
}

export async function onRequest({ request, env, params }) {
  if (!env.DB) return err('The database is not connected yet.', 503);
  try { await ensureDb(env); } catch (e) { return err(`Database setup failed: ${e.message}`, 500); }

  const path = [].concat(params.route || []);
  const [a, b, c] = path;
  const m = request.method;

  try {
    if (m === 'GET' && a === 'public') return json(toPublic(await allDocs(env)));

    if (a === 'img' && b && m === 'GET') {
      const row = await env.DB.prepare('SELECT mime, bytes FROM images WHERE id = ?').bind(b).first();
      if (!row) return new Response('Not found', { status: 404 });
      return new Response(new Uint8Array(row.bytes), {
        headers: { 'content-type': row.mime, 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' },
      });
    }

    if (m === 'GET' && a === 'status') {
      const claimed = !!(await getKv(env, 'pw_hash'));
      return json({ db: true, claimed, authed: claimed && await isAuthed(request, env) });
    }

    if (m === 'POST' && a === 'setup') {
      if (await getKv(env, 'pw_hash')) return err('This site already has a password. Log in instead.', 409);
      const { code, password } = await body(request);
      if (await sha256(String(code || '').trim().toUpperCase()) !== SETUP_CODE_HASH) return err('That setup code is not correct.', 403);
      if (String(password || '').length < 8) return err('Use at least 8 characters for the password.');
      const { salt, hash } = await hashPassword(password);
      await setKv(env, 'pw_salt', salt);
      await setKv(env, 'pw_hash', hash);
      return json({ ok: true }, 200, { 'set-cookie': await newSession(env) });
    }

    if (m === 'POST' && a === 'login') {
      const until = Number(await getKv(env, 'lock_until')) || 0;
      if (until > Date.now()) return err('Too many wrong passwords. Try again in 15 minutes.', 429);
      const { password } = await body(request);
      const salt = await getKv(env, 'pw_salt');
      const stored = await getKv(env, 'pw_hash');
      if (!stored) return err('Set a password first.', 409);
      const { hash } = await hashPassword(String(password || ''), salt);
      if (hash !== stored) {
        const fails = (Number(await getKv(env, 'fails')) || 0) + 1;
        await setKv(env, 'fails', fails >= 8 ? 0 : fails);
        if (fails >= 8) await setKv(env, 'lock_until', Date.now() + 15 * 60000);
        return err('That password is not correct.', 401);
      }
      await setKv(env, 'fails', 0);
      return json({ ok: true }, 200, { 'set-cookie': await newSession(env) });
    }

    if (m === 'POST' && a === 'logout') {
      const t = cookie(request);
      if (t) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(await sha256(t)).run();
      return json({ ok: true }, 200, { 'set-cookie': clearCookie });
    }

    // Everything below needs a login.
    if (!await isAuthed(request, env)) return err('Log in to continue.', 401);

    if (m === 'GET' && a === 'studio') return json(await allDocs(env));

    if (a === 'doc' && b && c) {
      if (!KINDS.includes(b) || !ID_RE.test(c)) return err('Unknown item.');
      if (m === 'PUT') {
        const doc = await body(request);
        doc.id = c;
        if (!validDoc(b, doc)) return err('This item is too large to save.');
        await putDocStmt(env, b, doc).run();
        return json({ ok: true });
      }
      if (m === 'DELETE') {
        await env.DB.prepare('DELETE FROM docs WHERE kind = ? AND id = ?').bind(b, c).run();
        return json({ ok: true });
      }
    }

    if (a === 'img' && b && ID_RE.test(b)) {
      if (m === 'PUT') {
        const mime = (request.headers.get('content-type') || '').split(';')[0];
        if (!MIMES.includes(mime)) return err('Use a JPEG, PNG or WebP photo.');
        const bytes = await request.arrayBuffer();
        if (!bytes.byteLength || bytes.byteLength > MAX_IMG) return err('This photo is too large. Keep it under 1.9 MB.', 413);
        await env.DB.prepare('INSERT INTO images (id, mime, bytes, created) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET mime = excluded.mime, bytes = excluded.bytes')
          .bind(b, mime, bytes, Date.now()).run();
        return json({ ok: true, url: `/api/img/${b}` });
      }
      if (m === 'DELETE') {
        await env.DB.prepare('DELETE FROM images WHERE id = ?').bind(b).run();
        return json({ ok: true });
      }
    }

    if (m === 'POST' && a === 'restore') {
      const { docs } = await body(request);
      if (!docs || typeof docs !== 'object') return err('This backup file cannot be read.');
      const stmts = [env.DB.prepare('DELETE FROM docs')];
      for (const kind of KINDS) for (const doc of docs[kind] || []) {
        if (!validDoc(kind, doc)) return err('This backup file contains an item that cannot be restored.');
        stmts.push(putDocStmt(env, kind, doc));
      }
      await env.DB.batch(stmts);
      return json({ ok: true });
    }

    if (m === 'POST' && a === 'password') {
      const { current, next } = await body(request);
      const salt = await getKv(env, 'pw_salt');
      const { hash } = await hashPassword(String(current || ''), salt);
      if (hash !== await getKv(env, 'pw_hash')) return err('The current password is not correct.', 401);
      if (String(next || '').length < 8) return err('Use at least 8 characters for the new password.');
      const fresh = await hashPassword(next);
      await setKv(env, 'pw_salt', fresh.salt);
      await setKv(env, 'pw_hash', fresh.hash);
      await env.DB.prepare('DELETE FROM sessions').run();
      return json({ ok: true }, 200, { 'set-cookie': await newSession(env) });
    }

    return err('Not found.', 404);
  } catch (e) {
    return err(`Something failed on the server: ${e.message}`, 500);
  }
}
