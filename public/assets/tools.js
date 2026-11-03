// Kitchen tools: everyday calculators for the chef, plus the allergen chart.
import { h, money, pct, toast } from './ui.js';
import {
  UNIT_NAMES, buildCtx, pricing, explode, shoppingList, sellingPrice, foodCostOf, yieldCalc, convertUnit, cToF, fToC,
  CUP_GRAMS, cupsToGrams, gramsToCups, breakEven, portionPlan,
} from './calc.js';

const TABS = [
  ['price', 'Selling price'], ['units', 'Unit converter'], ['yield', 'Yield and trim'], ['scale', 'Scale a recipe'], ['party', 'Party planner'],
  ['breakeven', 'Break-even'], ['timers', 'Timers'], ['temps', 'Temperatures'], ['allergens', 'Allergen chart'],
];
const n2 = (v) => Math.round(v * 1000) / 1000;

function num(state, key, label, after, attrs = {}) {
  return h('label', { class: 'field' }, h('span', {}, label), h('input', {
    type: 'number', step: 'any', inputmode: 'decimal', value: state[key] ?? '', ...attrs, oninput: (e) => { state[key] = e.target.value; after(); },
  }));
}
function pick(state, key, label, options, after) {
  return h('label', { class: 'field' }, h('span', {}, label), h('select', { onchange: (e) => { state[key] = e.target.value; after(); } },
    options.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; return h('option', { value: v, selected: String(state[key]) === String(v) }, t); })));
}
const result = (rows) => h('dl', { class: 'calc' }, rows.map(([a, b, strong]) => h('div', { class: strong ? 'strong' : '' }, h('dt', {}, a), h('dd', {}, b))));
const hint = (t) => h('p', { class: 'muted' }, t);

function priceTool(c) {
  const S = c.s; const $ = (x) => money(x, S.currency);
  const a = { cost: 25, target: S.targetFc, round: S.rounding }; const b = { cost: 25, price: 95 };
  const oa = h('div', {}); const ob = h('div', {});
  const paintA = () => {
    const r = sellingPrice({ cost: a.cost, targetFc: a.target, vatPct: S.vatPct, roundTo: a.round });
    oa.replaceChildren(r ? result([['Price before VAT', $(r.net)], [`Menu price with ${S.vatPct}% VAT`, $(r.gross), true], ['Gross profit per portion', $(r.gp)], ['Food cost at this price', pct(r.fc)]]) : hint('Enter a cost and a target.'));
  };
  const paintB = () => {
    const r = foodCostOf({ cost: b.cost, price: b.price, vatPct: S.vatPct, inclVat: S.pricesIncludeVat });
    ob.replaceChildren(r ? result([['Price before VAT', $(r.net)], ['Food cost', pct(r.fc), true], ['Gross profit per portion', $(r.gp)], ['Gross profit', pct(r.gpPct)]]) : hint('Enter a cost and a price.'));
  };
  paintA(); paintB();
  return h('div', { class: 'grid2' },
    h('section', { class: 'panel stack' }, h('h2', {}, 'I know my cost. What should I charge?'),
      h('div', { class: 'cols3' }, num(a, 'cost', `Cost per portion, ${S.currency}`, paintA), num(a, 'target', 'Target food cost %', paintA), num(a, 'round', 'Round up to nearest', paintA)), oa),
    h('section', { class: 'panel stack' }, h('h2', {}, 'I know my price. Is it profitable?'),
      h('div', { class: 'cols2' }, num(b, 'cost', `Cost per portion, ${S.currency}`, paintB), num(b, 'price', `Menu price, ${S.currency}`, paintB)), ob,
      hint('A common target for restaurants is food cost of 28% to 35%. Fine dining and private chefs vary.')));
}

function unitsTool() {
  const u = { value: 1, from: 'kg', to: 'lb' }; const t = { c: 180 }; const f = { f: 350 }; const k = { cups: 1, grams: 100, ing: 'Plain flour' };
  const ou = h('div', { class: 'big-result' }); const ot = h('div', { class: 'big-result' }); const of = h('div', { class: 'big-result' }); const oc = h('div', {});
  const paint = () => {
    const v = convertUnit(u.value, u.from, u.to);
    ou.textContent = v === null ? 'Weight, volume and pieces cannot convert to each other. Use the cup table for that.' : `${u.value} ${u.from} = ${n2(v)} ${u.to}`;
    ot.textContent = `${t.c} °C = ${Math.round(cToF(t.c))} °F`;
    of.textContent = `${f.f} °F = ${Math.round(fToC(f.f))} °C`;
    oc.replaceChildren(result([[`${k.cups} cup`, `${Math.round(cupsToGrams(k.cups, k.ing))} g`, true], [`${k.grams} g`, `${n2(gramsToCups(k.grams, k.ing))} cup`, true]]));
  };
  paint();
  return h('div', { class: 'grid2' },
    h('section', { class: 'panel stack' }, h('h2', {}, 'Weight and volume'),
      h('div', { class: 'cols3' }, num(u, 'value', 'Amount', paint), pick(u, 'from', 'From', UNIT_NAMES, paint), pick(u, 'to', 'To', UNIT_NAMES, paint)), ou),
    h('section', { class: 'panel stack' }, h('h2', {}, 'Oven temperature'),
      h('div', { class: 'cols2' }, num(t, 'c', '°C', paint), num(f, 'f', '°F', paint)), ot, of),
    h('section', { class: 'panel stack' }, h('h2', {}, 'Cups to grams'),
      h('div', { class: 'cols3' }, pick(k, 'ing', 'Ingredient', Object.keys(CUP_GRAMS), paint), num(k, 'cups', 'Cups', paint), num(k, 'grams', 'Grams', paint)), oc,
      hint('Based on a 240 ml cup. Values are typical, so weigh ingredients when accuracy matters.')));
}

function yieldTool(c) {
  const S = c.s; const y = { bought: 2, usable: 0.9, price: 58 }; const o = h('div', {});
  const paint = () => {
    const r = yieldCalc(y);
    o.replaceChildren(r ? result([['Yield %', pct(r.yieldPct), true], ['Lost in trimming', `${r.loss} kg`], ['Real cost per usable kg', money(r.costUsable, S.currency), true]]) : hint('Enter both weights.'));
  };
  paint();
  return h('section', { class: 'panel stack narrow' }, h('h2', {}, 'How much do I really pay after trimming?'),
    h('div', { class: 'cols3' }, num(y, 'bought', 'Bought, kg', paint), num(y, 'usable', 'Usable after trim, kg', paint), num(y, 'price', `Price per kg, ${S.currency}`, paint)), o,
    hint('Put the yield % on the ingredient, and recipes will use the real cost automatically.'));
}

function scaleTool(docs, c) {
  const dishes = docs.recipe.filter((r) => (r.lines || []).length);
  const s = { id: dishes[0]?.id || '', guests: 20 }; const o = h('div', {});
  const paint = () => {
    const r = c.rec.get(s.id);
    if (!r) { o.replaceChildren(hint('Add a recipe with ingredients first.')); return; }
    const list = shoppingList(explode(r, (Number(s.guests) || 0) / (Number(r.servings) || 1), c));
    const total = list.reduce((a, x) => a + x.cost, 0);
    o.replaceChildren(h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, ['Ingredient', 'Needed', 'Buy', 'Cost'].map((t) => h('th', {}, t)))),
      h('tbody', {}, list.map((x) => h('tr', {}, h('td', {}, x.name), h('td', {}, x.use.join(' ')), h('td', {}, x.buy.join(' ')), h('td', { class: 'num' }, money(x.cost, c.s.currency))))),
      h('tfoot', {}, h('tr', {}, h('td', { colspan: 3 }, `Total for ${s.guests} guests, per guest ${money(total / (Number(s.guests) || 1), c.s.currency)}`), h('td', { class: 'num' }, money(total, c.s.currency)))))));
  };
  paint();
  return h('section', { class: 'panel stack' }, h('h2', {}, 'Scale any recipe'),
    h('div', { class: 'cols2' }, pick(s, 'id', 'Recipe', dishes.map((r) => [r.id, r.name]), paint), num(s, 'guests', 'Guests or portions', paint, { min: 1, step: 1 })), o);
}

function partyTool() {
  const p = { guests: 20, style: 1 }; const o = h('div', {});
  const paint = () => {
    o.replaceChildren(h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, ['Item', 'Per guest', 'Total to prepare'].map((t) => h('th', {}, t)))),
      h('tbody', {}, portionPlan(p.guests, p.style).map((x) => h('tr', {}, h('td', {}, x.name), h('td', {}, x.each), h('td', {}, x.total)))))));
  };
  paint();
  return h('section', { class: 'panel stack' }, h('h2', {}, 'How much food for my guests?'),
    h('div', { class: 'cols2' }, num(p, 'guests', 'Guests', paint, { min: 1, step: 1 }), pick(p, 'style', 'Appetite', [[0.85, 'Light, many courses'], [1, 'Normal plated meal'], [1.2, 'Generous or buffet']], paint)), o,
    hint('Rule-of-thumb cooked amounts when each item is served to every guest. Use only the lines on your menu.'));
}

function breakEvenTool(c) {
  const S = c.s; const b = { fixed: 30000, avgCheck: 95, foodPct: S.targetFc, days: 30 }; const o = h('div', {});
  const paint = () => {
    const r = breakEven({ ...b, vatPct: S.vatPct });
    o.replaceChildren(r ? result([['Average check before VAT', money(r.net, S.currency)], ['Left from each guest after food', money(r.margin, S.currency)], ['Guests needed per month', r.covers, true], ['Guests needed per day', r.perDay, true], ['Sales needed with VAT', money(r.sales, S.currency)]]) : hint('Enter fixed costs and an average check. Food cost must be under 100%.'));
  };
  paint();
  return h('section', { class: 'panel stack narrow' }, h('h2', {}, 'How many guests to break even?'),
    h('div', { class: 'cols2' }, num(b, 'fixed', `Fixed costs per month, ${S.currency}`, paint), num(b, 'avgCheck', `Average check with VAT, ${S.currency}`, paint), num(b, 'foodPct', 'Food cost %', paint), num(b, 'days', 'Days open per month', paint)), o,
    hint('Fixed costs are rent, salaries, utilities and anything you pay regardless of sales.'));
}

const timers = [];
let timerTick = 0;
function timersTool() {
  const add = { label: 'Oven', min: 10 }; const box = h('div', { class: 'timers' });
  const paint = () => {
    box.replaceChildren(...(timers.length ? timers.map((t) => {
      const left = Math.max(0, Math.ceil((t.end - Date.now()) / 1000));
      const mm = String(Math.floor(left / 60)).padStart(2, '0'); const ss = String(left % 60).padStart(2, '0');
      return h('div', { class: `timer${left ? '' : ' done'}` }, h('span', {}, t.label), h('strong', {}, `${mm}:${ss}`),
        h('button', { class: 'x', 'aria-label': `Remove ${t.label} timer`, onclick: () => { timers.splice(timers.indexOf(t), 1); paint(); } }, '×'));
    }) : [hint('No timers running.')]));
  };
  clearInterval(timerTick);
  timerTick = setInterval(() => {
    if (!box.isConnected) { clearInterval(timerTick); return; }
    timers.forEach((t) => { if (!t.rang && t.end <= Date.now()) { t.rang = true; toast(`${t.label} is ready`); } });
    paint();
  }, 1000);
  paint();
  return h('section', { class: 'panel stack narrow' }, h('h2', {}, 'Kitchen timers'),
    h('form', { class: 'cols3 end', onsubmit: (e) => { e.preventDefault(); timers.push({ label: add.label || 'Timer', end: Date.now() + (Number(add.min) || 1) * 60000 }); paint(); } },
      h('label', { class: 'field' }, h('span', {}, 'Name'), h('input', { type: 'text', value: add.label, oninput: (e) => { add.label = e.target.value; } })),
      num(add, 'min', 'Minutes', () => {}, { min: 0.5 }), h('button', { class: 'btn' }, 'Start timer')), box);
}

function tempsTool() {
  const table = (head, rows) => h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, head.map((t) => h('th', {}, t)))), h('tbody', {}, rows.map((r) => h('tr', {}, r.map((x) => h('td', {}, x)))))));
  return h('div', { class: 'grid2' },
    h('section', { class: 'panel stack' }, h('h2', {}, 'Safe cooking temperatures'), table(['Food', 'Centre temperature'], [
      ['Poultry', '74 °C'], ['Minced meat', '71 °C'], ['Whole cuts of beef and lamb', '63 °C, rest 3 minutes'], ['Fish', '63 °C'], ['Reheated food', '74 °C'],
    ])),
    h('section', { class: 'panel stack' }, h('h2', {}, 'Steak doneness'), table(['Doneness', 'Centre temperature'], [
      ['Rare', '52 °C'], ['Medium rare', '57 °C'], ['Medium', '63 °C'], ['Medium well', '66 °C'], ['Well done', '71 °C'],
    ])),
    h('section', { class: 'panel stack' }, h('h2', {}, 'Storing and holding'), table(['What', 'Keep at'], [
      ['Fridge', '5 °C or below'], ['Freezer', '−18 °C or below'], ['Hot holding', '60 °C or above'], ['Danger zone', 'Between 5 °C and 60 °C'], ['Cooling cooked food', '60 °C to 21 °C in 2 hours, then to 5 °C within 4 more'],
    ]), hint('General US food safety guidance. Follow your local authority where its rules differ.')));
}

function allergensTool(docs, c) {
  const dishes = docs.recipe.filter((r) => r.kind !== 'base');
  const rows = dishes.map((r) => ({ r, set: new Set([...(r.allergens || []), ...pricing(r, c).allergens]) }));
  const all = [...new Set(rows.flatMap((x) => [...x.set]))].sort();
  return h('section', { class: 'panel stack' }, h('h2', {}, 'Allergen chart'),
    hint('Built from the allergens set on each ingredient. Check every dish before serving a guest with an allergy.'),
    all.length ? h('div', { class: 'scroll' }, h('table', { class: 'matrix' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Dish'), all.map((a) => h('th', {}, a)))),
      h('tbody', {}, rows.map(({ r, set }) => h('tr', {}, h('td', {}, r.name), all.map((a) => h('td', { class: 'dot' }, set.has(a) ? h('span', { 'aria-label': 'Contains' }, '●') : ''))))))) : hint('No allergens set yet. Add them on your ingredients.'));
}

let tab = 'price';
export function toolsPage(docs) {
  const c = buildCtx(docs);
  const box = h('div', {});
  const bar = h('div', { class: 'chips', role: 'group', 'aria-label': 'Kitchen tools' });
  const pages = {
    price: () => priceTool(c), units: unitsTool, yield: () => yieldTool(c), scale: () => scaleTool(docs, c), party: partyTool,
    breakeven: () => breakEvenTool(c), timers: timersTool, temps: tempsTool, allergens: () => allergensTool(docs, c),
  };
  const paint = () => {
    box.replaceChildren(pages[tab]());
    bar.replaceChildren(...TABS.map(([k, t]) => h('button', { class: k === tab ? 'on' : '', 'aria-pressed': String(k === tab), onclick: () => { tab = k; paint(); } }, t)));
  };
  paint();
  return h('div', {}, h('h1', {}, 'Kitchen tools'), bar, box);
}
