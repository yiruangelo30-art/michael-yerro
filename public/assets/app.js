import * as store from './store.js';
import { renderSite } from './site.js';
import { renderStudio } from './studio.js';

const root = document.getElementById('app');
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
