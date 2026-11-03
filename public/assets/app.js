import * as store from './store.js';
import { renderSite, hatSvg } from './site.js';
import { startSpices } from './motion.js';
import { renderStudio } from './studio.js';

const root = document.getElementById('app');

function splash() {
  let seen = false;
  try { seen = !!sessionStorage.getItem('splash'); sessionStorage.setItem('splash', '1'); } catch { /* show it */ }
  if (seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.createElement('div');
  el.className = 'splash';
  el.setAttribute('aria-hidden', 'true');
  const name = document.createElement('div');
  name.className = 'sname';
  name.textContent = 'CHEF MICHAEL';
  const line = document.createElement('div');
  line.className = 'sline';
  const canvas = document.createElement('canvas');
  canvas.className = 'spices';
  el.append(canvas, hatSvg(), name, line);
  document.body.append(el);
  startSpices(canvas, { count: 46, mode: 'fall', opacity: 0.8 });
  setTimeout(() => el.remove(), 2500);
}
splash();
let pub = null;
let wasStudio = false;

async function route() {
  const r = location.hash.slice(1) || 'home';
  const inStudio = r === 'studio' || r.startsWith('s-');
  document.body.classList.toggle('in-studio', inStudio);
  if (inStudio) { wasStudio = true; await renderStudio(root, r); return; }
  if (!pub || wasStudio) { pub = await store.loadPublic(); wasStudio = false; }
  renderSite(root, pub, r);
}
window.addEventListener('hashchange', route);
route();
