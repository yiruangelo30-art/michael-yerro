// One data layer with two back ends: the live API, and a browser-only preview.
import { SEED, previewSeed } from './seed.js';
import { toPublic } from './publicview.js';

const DEMO = !!window.__PREVIEW;
const KEY = 'chef-preview-v1';
const KINDS = ['profile', 'settings', 'ingredient', 'recipe', 'setmenu', 'photo'];
export const isPreview = DEMO;

let docs = null;
const demoImages = new Map();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(docs)); } catch { /* preview works without storage */ } };
function demoLoad() {
  if (docs) return;
  try { const raw = localStorage.getItem(KEY); if (raw) docs = JSON.parse(raw); } catch { /* ignore */ }
  if (!docs) docs = previewSeed();
  docs.photo = (docs.photo || []).filter((p) => p.art);
}

async function api(path, opts = {}) {
  const res = await fetch(`/api/${path}`, { credentials: 'same-origin', ...opts });
  let data = {};
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) { const e = new Error(data.error || 'The server did not respond. Check your connection and try again.'); e.status = res.status; throw e; }
  return data;
}
const post = (path, body) => api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`).replace(/[^a-zA-Z0-9-]/g, '');

export const imgUrl = (id) => (demoImages.get(id) || `/api/img/${id}`);

export async function loadPublic() {
  if (DEMO) { demoLoad(); return toPublic(docs); }
  try { return await api('public'); }
  catch (e) {
    // The database is not connected yet: still show the chef's profile.
    return toPublic({ ...SEED, recipe: [], setmenu: [], photo: [] });
  }
}
export async function status() {
  if (DEMO) return { db: true, claimed: true, authed: true };
  try { return await api('status'); }
  catch (e) { if (e.status === 503) return { db: false }; throw e; }
}
export const setup = (code, password) => post('setup', { code, password });
export const login = (password) => post('login', { password });
export const logout = () => (DEMO ? Promise.resolve() : post('logout'));
export const changePassword = (current, next) => post('password', { current, next });

export async function loadStudio() {
  if (DEMO) { demoLoad(); return docs; }
  docs = await api('studio');
  KINDS.forEach((k) => { docs[k] = docs[k] || []; });
  return docs;
}
export const getDocs = () => docs;

export async function put(kind, doc) {
  doc.updated = Date.now();
  if (!DEMO) await api(`doc/${kind}/${encodeURIComponent(doc.id)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(doc) });
  const list = docs[kind];
  const i = list.findIndex((d) => d.id === doc.id);
  if (i >= 0) list[i] = doc; else list.push(doc);
  if (DEMO) save();
  return doc;
}
export async function del(kind, id) {
  if (!DEMO) await api(`doc/${kind}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  docs[kind] = docs[kind].filter((d) => d.id !== id);
  if (DEMO) save();
}

function canvasBlob(canvas, type, q) { return new Promise((res) => canvas.toBlob(res, type, q)); }

/** Shrinks a photo in the browser so it uploads fast and stays small in storage. */
export async function shrink(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);
  if (!bmp) throw new Error(`${file.name} is not a photo this browser can read. Use a JPEG or PNG.`);
  let max = 1600;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const r = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * r); c.height = Math.round(bmp.height * r);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    let blob = await canvasBlob(c, 'image/webp', 0.82);
    if (!blob || blob.type !== 'image/webp') blob = await canvasBlob(c, 'image/jpeg', 0.82);
    if (blob && blob.size < 1000000) return blob;
    max = Math.round(max * 0.75);
  }
  throw new Error(`${file.name} could not be made small enough to upload.`);
}

export async function uploadImage(blob, id = uid()) {
  if (DEMO) {
    const url = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
    demoImages.set(id, url);
  } else {
    await api(`img/${id}`, { method: 'PUT', headers: { 'content-type': blob.type }, body: blob });
  }
  return id;
}
export async function deleteImage(id) {
  if (DEMO) demoImages.delete(id);
  else await api(`img/${id}`, { method: 'DELETE' });
}

export async function makeBackup(onStep) {
  const images = [];
  const ids = docs.photo.filter((p) => !p.art).map((p) => p.id);
  const portrait = docs.profile[0]?.portrait;
  if (portrait && !ids.includes(portrait)) ids.push(portrait);
  for (let i = 0; i < ids.length; i += 1) {
    onStep?.(i + 1, ids.length);
    const res = await fetch(imgUrl(ids[i]));
    if (!res.ok) continue;
    const blob = await res.blob();
    const data = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });
    images.push({ id: ids[i], mime: blob.type, data });
  }
  return { app: 'chef-portfolio', version: 1, saved: new Date().toISOString(), docs, images };
}

export async function restoreBackup(b, onStep) {
  if (b?.app !== 'chef-portfolio' || !b.docs) throw new Error('This is not a backup from this site.');
  if (!DEMO) await post('restore', { docs: b.docs });
  docs = b.docs;
  KINDS.forEach((k) => { docs[k] = docs[k] || []; });
  if (DEMO) save();
  const images = b.images || [];
  for (let i = 0; i < images.length; i += 1) {
    onStep?.(i + 1, images.length);
    const blob = await (await fetch(images[i].data)).blob();
    await uploadImage(blob, images[i].id);
  }
}

export const resetPreview = () => { docs = previewSeed(); save(); };
