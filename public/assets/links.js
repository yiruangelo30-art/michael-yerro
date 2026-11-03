// Connections to Michael's stock website and OrderEase. Nothing is shared in the
// background: each transfer is one click by a person logged in to both sites.
import { h, money, modal, toast } from './ui.js';
import * as store from './store.js';
import { buildCtx, nameScore, parsePack, unitCost, linkNumber } from './calc.js';

export const STOCK_URL = 'https://the-plane-stock.pages.dev';
export const ORDEREASE_URL = 'https://orderease.pages.dev';

const enc = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const dec = (t) => JSON.parse(decodeURIComponent(escape(atob(t.replace(/-/g, '+').replace(/_/g, '/')))));

export const salesOf = (docs) => (docs.sync || []).find((d) => d.id === 'sales');
export function soldOf(r, sales) {
  if (r.salesKey && sales) {
    const x = sales.items.find((i) => `${i.store}|${i.name}` === r.salesKey);
    if (x) return { qty: x.qty, linked: true };
  }
  return { qty: Number(r.sold) || 0, linked: false };
}

/** Sends a shopping list to OrderEase, using its existing "from stock" order page. */
export function sendToOrderEase(list) {
  if (store.isPreview) { toast('This opens OrderEase on the live site'); return; }
  modal('Send to OrderEase', (done) => {
    const o = { shop: 'plane' };
    return h('form', {
      class: 'stack',
      onsubmit: (e) => {
        e.preventDefault();
        const items = list.map((x) => ({ id: linkNumber(x.id), name: x.name, unit: x.buy[1], cat: x.cat, qty: x.buy[0] }));
        window.open(`${ORDEREASE_URL}/#/from-stock?d=${enc({ v: 1, src: 'chef', store: o.shop, date: new Date().toISOString().slice(0, 10), items })}`, '_blank', 'noopener');
        toast('OrderEase opened in a new tab. Choose the products once, then create the orders.');
        done();
      },
    }, h('p', {}, `${list.length} items go to OrderEase. Nothing is ordered until you confirm there.`),
    h('label', { class: 'field' }, h('span', {}, 'Order for'), h('select', { onchange: (e) => { o.shop = e.target.value; } }, h('option', { value: 'plane' }, 'The Plane'), h('option', { value: 'kitchen' }, 'Daily Edition'))),
    h('button', { class: 'btn' }, 'Open in OrderEase'));
  });
}

export function linksPage(docs) {
  const sales = salesOf(docs);
  const card = (title, text, label, href, foot) => h('section', { class: 'panel stack' }, h('h2', {}, title), h('p', {}, text),
    h('a', { class: 'btn', href, target: '_blank', rel: 'noopener' }, label), foot && h('small', { class: 'muted' }, foot));
  return h('div', {}, h('h1', {}, 'Connected sites'),
    h('p', { class: 'muted' }, 'Log in to each site once on this device. Every transfer is one click, and you check it before anything changes.'),
    h('div', { class: 'grid2' },
      card('Prices from OrderEase', 'Bring in the latest supplier prices and pack sizes. Your ingredient costs, recipes and menus update after you confirm.', 'Get prices from OrderEase', `${ORDEREASE_URL}/#/to-chef`),
      card('Sales from the stock site', 'Bring in how many of each dish sold in the last 30 days. The Costing page uses it to show which dishes to promote, reprice or remove.', 'Get sales from stock site', `${STOCK_URL}/#/to-chef`,
        sales ? `Last updated from ${sales.from} to ${sales.to}.` : 'No sales brought in yet.'),
      h('section', { class: 'panel stack' }, h('h2', {}, 'Shopping lists to OrderEase'),
        h('p', {}, 'Open a recipe or a set menu and press Send to OrderEase under its list. It makes an order per supplier, ready for you to check.')),
      h('section', { class: 'panel stack' }, h('h2', {}, 'Open the other sites'),
        h('div', { class: 'row' }, h('a', { class: 'btn ghost', href: STOCK_URL, target: '_blank', rel: 'noopener' }, 'Stock site'), h('a', { class: 'btn ghost', href: ORDEREASE_URL, target: '_blank', rel: 'noopener' }, 'OrderEase')))));
}

function pricesImport(docs, data, finish) {
  const c = buildCtx(docs); const cur = c.s.currency;
  const products = (data.products || []).filter((p) => p.name && Number(p.price) > 0);
  const label = (p) => `${p.name}${p.pack ? ` (${p.pack})` : ''} - ${p.supplier || ''}`;
  const byLabel = new Map(products.map((p) => [label(p), p]));
  const rows = docs.ingredient.map((i) => {
    let p = i.productCode ? products.find((x) => x.code && x.code === i.productCode) : null;
    if (!p && i.productName) p = products.find((x) => x.name === i.productName);
    if (!p) { const best = products.map((x) => [nameScore(i.name, x.name), x]).sort((a, b) => b[0] - a[0])[0]; if (best && best[0] >= 0.6) [, p] = best; }
    return { i, p: p || null, on: false };
  });
  const body = h('tbody', {});
  const describe = (r) => {
    if (!r.p) return { text: 'No match', ok: false };
    const pack = parsePack(r.p.pack) || (r.p.unit ? parsePack(`1 ${r.p.unit}`) : null);
    if (!pack) return { text: `Check pack size: "${r.p.pack || 'none'}"`, ok: false };
    const nu = { ...r.i, price: r.p.price, ...pack };
    const before = unitCost(r.i); const after = unitCost(nu);
    const scale = pack.packUnit === 'pc' ? 1 : 1000;
    const change = before ? ((after - before) / before) * 100 : 0;
    return { text: `${money(before * scale, cur)} → ${money(after * scale, cur)} per ${pack.packUnit}${before ? ` (${change > 0 ? '+' : ''}${change.toFixed(1)}%)` : ''}`, ok: true, pack, same: Math.abs(change) < 0.05 };
  };
  const paint = () => {
    body.replaceChildren(...rows.map((r) => {
      const d = describe(r);
      if (d.ok && !d.same && r.on === false && !r.touched) r.on = true;
      return h('tr', {},
        h('td', {}, h('input', { type: 'checkbox', 'aria-label': `Update ${r.i.name}`, checked: r.on && d.ok, disabled: !d.ok, onchange: (e) => { r.on = e.target.checked; r.touched = true; } })),
        h('td', {}, r.i.name),
        h('td', {}, h('input', {
          type: 'text', list: 'prod-list', 'aria-label': `Product for ${r.i.name}`, value: r.p ? label(r.p) : '', placeholder: 'Choose a product',
          onchange: (e) => { r.p = byLabel.get(e.target.value) || null; r.touched = false; r.on = false; paint(); },
        })),
        h('td', {}, d.text));
    }));
  };
  paint();
  return h('div', { class: 'stack' }, h('h1', {}, 'Update prices from OrderEase'),
    h('p', { class: 'muted' }, `${products.length} priced products came in. Ticked ingredients will change. Check each match first.`),
    h('datalist', { id: 'prod-list' }, products.map((p) => h('option', { value: label(p) }))),
    h('div', { class: 'scroll panel flush' }, h('table', {}, h('thead', {}, h('tr', {}, ['', 'Ingredient', 'OrderEase product', 'Change'].map((t) => h('th', {}, t)))), body)),
    h('div', { class: 'row' }, h('button', {
      class: 'btn',
      onclick: async () => {
        const todo = rows.filter((r) => r.on && r.p && describe(r).ok);
        for (const r of todo) {
          const d = describe(r);
          const doc = { ...r.i, price: r.p.price, ...d.pack, supplier: r.p.supplier || r.i.supplier, productCode: r.p.code || '', productName: r.p.name };
          delete doc.sample;
          await store.put('ingredient', doc);
        }
        toast(`${todo.length} ingredients updated`);
        finish();
      },
    }, 'Update ticked ingredients'), h('a', { class: 'btn ghost', href: '#s-links' }, 'Cancel')));
}

function salesImport(docs, data, finish) {
  const items = (data.items || []).filter((x) => x.name);
  const label = (x) => `${x.name} - ${x.shop || x.store}`;
  const byLabel = new Map(items.map((x) => [label(x), x]));
  const dishes = docs.recipe.filter((r) => r.kind !== 'base');
  const rows = dishes.map((r) => {
    let m = r.salesKey ? items.find((x) => `${x.store}|${x.name}` === r.salesKey) : null;
    if (!m) { const best = items.map((x) => [nameScore(r.name, x.name), x]).sort((a, b) => b[0] - a[0])[0]; if (best && best[0] >= 0.7) [, m] = best; }
    return { r, m: m || null };
  });
  return h('div', { class: 'stack' }, h('h1', {}, 'Link dishes to stock site sales'),
    h('p', { class: 'muted' }, `Sales from ${data.from} to ${data.to}. Match each dish to its name on the stock site. Dishes left empty keep the number you typed.`),
    h('datalist', { id: 'sale-list' }, items.map((x) => h('option', { value: label(x) }))),
    h('div', { class: 'scroll panel flush' }, h('table', {}, h('thead', {}, h('tr', {}, ['Dish', 'Stock site menu item', 'Sold'].map((t) => h('th', {}, t)))),
      h('tbody', {}, rows.map((row) => {
        const qty = h('td', { class: 'num' }, row.m ? row.m.qty : '');
        return h('tr', {}, h('td', {}, row.r.name),
          h('td', {}, h('input', { type: 'text', list: 'sale-list', 'aria-label': `Stock item for ${row.r.name}`, value: row.m ? label(row.m) : '', placeholder: 'Choose a menu item', onchange: (e) => { row.m = byLabel.get(e.target.value) || null; qty.textContent = row.m ? row.m.qty : ''; } })), qty);
      })))),
    h('div', { class: 'row' }, h('button', {
      class: 'btn',
      onclick: async () => {
        await store.put('sync', { id: 'sales', from: data.from, to: data.to, days: data.days, items: items.map((x) => ({ store: x.store, name: x.name, qty: x.qty })) });
        for (const row of rows) {
          const key = row.m ? `${row.m.store}|${row.m.name}` : '';
          if ((row.r.salesKey || '') !== key) await store.put('recipe', { ...row.r, salesKey: key });
        }
        toast('Sales saved');
        finish();
      },
    }, 'Save sales'), h('a', { class: 'btn ghost', href: '#s-links' }, 'Cancel')));
}

export function importPage(docs, query, finish) {
  let data = null;
  try { data = dec(new URLSearchParams(query || '').get('d') || ''); } catch { data = null; }
  if (data?.src === 'orderease') return pricesImport(docs, data, finish);
  if (data?.src === 'stock') return salesImport(docs, data, finish);
  return h('div', { class: 'stack' }, h('h1', {}, 'This link is empty'), h('p', {}, 'Open Connected sites and start again from there.'), h('a', { class: 'btn ghost', href: '#s-links' }, 'Connected sites'));
}
