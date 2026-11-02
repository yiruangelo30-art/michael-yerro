// Small DOM helpers shared by the public site and the studio.
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'multiple' || k === 'hidden') el[k] = !!v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  add(el, kids);
  return el;
}
function add(el, kids) {
  for (const c of kids.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
}
export const clear = (el) => { el.replaceChildren(); return el; };

export const money = (n, cur = 'SAR', dp = 2) => `${cur} ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
export const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

export const COURSE_MARK = { Starter: '◇', Soup: '◇', Salad: '◇', Main: '◆', Dessert: '✦', Bakery: '✦', Sauce: '◇', Drink: '◇' };
export const mark = (course) => COURSE_MARK[course] || '◆';

/** A drawn plate stands in until a real photo is added. Same name, same drawing. */
export function plateArt(seed, label) {
  let n = 7;
  for (const ch of String(seed)) n = (n * 31 + ch.charCodeAt(0)) % 99991;
  const r = (a, b) => { n = (n * 7919 + 13) % 99991; return a + (n / 99991) * (b - a); };
  const rot = r(0, 360);
  const dots = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 0.9 + r(0.2, 0.4);
    const d = r(92, 118);
    return `<circle cx="${(200 + Math.cos(a) * d).toFixed(1)}" cy="${(150 + Math.sin(a) * d * 0.72).toFixed(1)}" r="${(1.6 + (i % 4) * 1.3).toFixed(1)}" fill="var(--gold)"/>`;
  }).join('');
  const sw = r(0.7, 1.3);
  const svg = `<svg viewBox="0 0 400 300" role="img" aria-label="${(label || 'Drawing of a plate, photo to come').replace(/["<&]/g, '')}" preserveAspectRatio="xMidYMid slice">
    <rect width="400" height="300" fill="var(--ink-3)"/>
    <ellipse cx="200" cy="150" rx="168" ry="122" fill="none" stroke="var(--gold)" stroke-opacity=".35"/>
    <ellipse cx="200" cy="150" rx="150" ry="108" fill="none" stroke="var(--gold)" stroke-opacity=".7"/>
    <ellipse cx="200" cy="150" rx="104" ry="74" fill="none" stroke="var(--gold)" stroke-opacity=".2"/>
    <g transform="rotate(${rot.toFixed(0)} 200 150)">
      <path d="M${130 * sw + 20} 150 q 60 -${(46 * sw).toFixed(0)} 150 -10" fill="none" stroke="var(--gold)" stroke-width="7" stroke-linecap="round" opacity=".85"/>
      <path d="M${150 * sw} 172 q 44 -18 96 -12" fill="none" stroke="var(--cream)" stroke-width="2" stroke-linecap="round" opacity=".5"/>
    </g>${dots}</svg>`;
  const wrap = document.createElement('span');
  wrap.className = 'art';
  wrap.innerHTML = svg;
  return wrap;
}

export function toast(msg, bad) {
  const t = h('div', { class: `toast${bad ? ' bad' : ''}`, role: 'status' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), bad ? 5200 : 2600);
}

export function modal(title, build, opts = {}) {
  return new Promise((resolve) => {
    const prior = document.activeElement;
    const done = (v) => { back.remove(); document.removeEventListener('keydown', esc); prior?.focus?.(); resolve(v); };
    const esc = (e) => { if (e.key === 'Escape') done(undefined); };
    const box = h('div', { class: `modal${opts.wide ? ' wide' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'modal-head' }, h('h2', {}, title), h('button', { class: 'x', 'aria-label': 'Close', onclick: () => done(undefined) }, '×')));
    const back = h('div', { class: 'back', onmousedown: (e) => { if (e.target === back) done(undefined); } }, box);
    box.append(build(done));
    document.body.append(back);
    document.addEventListener('keydown', esc);
    box.querySelector('input,select,textarea')?.focus();
  });
}
export const confirmBox = (msg, action = 'Delete') => modal('Please confirm', (done) => h('div', { class: 'stack' },
  h('p', {}, msg),
  h('div', { class: 'row end' }, h('button', { class: 'btn ghost', onclick: () => done(false) }, 'Cancel'), h('button', { class: 'btn danger', onclick: () => done(true) }, action))));

export function downloadJson(name, obj) {
  const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(obj)], { type: 'application/json' })), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function printNode(node) {
  const p = document.getElementById('print');
  clear(p).append(node);
  document.body.classList.add('printing');
  const end = () => { document.body.classList.remove('printing'); window.removeEventListener('afterprint', end); };
  window.addEventListener('afterprint', end);
  window.print();
}
