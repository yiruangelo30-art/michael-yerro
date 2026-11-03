// Every costing and pricing number on the site comes from this file.
export const UNITS = {
  g: { f: 'mass', b: 1 }, kg: { f: 'mass', b: 1000 }, oz: { f: 'mass', b: 28.3495 }, lb: { f: 'mass', b: 453.592 },
  ml: { f: 'vol', b: 1 }, l: { f: 'vol', b: 1000 }, tsp: { f: 'vol', b: 5 }, tbsp: { f: 'vol', b: 15 }, cup: { f: 'vol', b: 240 },
  pc: { f: 'count', b: 1 },
};
export const UNIT_NAMES = Object.keys(UNITS);
const FAMILY_LABEL = { mass: 'weight', vol: 'volume', count: 'pieces' };

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const toBase = (q, u) => num(q) * (UNITS[u]?.b || 0);
const fam = (u) => UNITS[u]?.f;

export const DEFAULT_SETTINGS = { currency: 'SAR', vatPct: 15, targetFc: 30, qFactor: 3, rounding: 1, pricesIncludeVat: true };

export function buildCtx(docs) {
  const ing = new Map(), rec = new Map();
  (docs.ingredient || []).forEach((d) => ing.set(d.id, d));
  (docs.recipe || []).forEach((d) => rec.set(d.id, d));
  const s = { ...DEFAULT_SETTINGS, ...((docs.settings || [])[0] || {}) };
  return { ing, rec, s };
}

/** Cost of one gram / ml / piece of usable ingredient, after trim loss. */
export function unitCost(i) {
  const pack = toBase(i.packQty, i.packUnit);
  const y = num(i.yieldPct) || 100;
  return pack > 0 ? num(i.price) / pack / (y / 100) : 0;
}

export function recipeCost(r, ctx, seen = new Set()) {
  const out = { batch: 0, lines: [], warnings: [], allergens: new Set() };
  const chain = new Set(seen).add(r.id);
  for (const l of r.lines || []) {
    const row = { cost: 0, warn: '', name: '' };
    if (!l.refId) { row.warn = l.name ? 'Not in your ingredients yet' : ''; row.name = l.name || ''; }
    else if (l.type === 'recipe') {
      const sub = ctx.rec.get(l.refId);
      if (!sub) row.warn = 'This base recipe was deleted';
      else if (chain.has(sub.id)) { row.name = sub.name; row.warn = 'A recipe cannot contain itself'; }
      else {
        row.name = sub.name;
        const c = recipeCost(sub, ctx, chain);
        const yb = toBase(sub.yieldQty, sub.yieldUnit);
        if (yb <= 0) row.warn = `Set the batch yield on ${sub.name}`;
        else if (fam(l.unit) !== fam(sub.yieldUnit)) row.warn = `${sub.name} yields ${FAMILY_LABEL[fam(sub.yieldUnit)]}, use a ${FAMILY_LABEL[fam(sub.yieldUnit)]} unit`;
        else row.cost = (c.batch * toBase(l.qty, l.unit)) / yb;
        c.allergens.forEach((a) => out.allergens.add(a));
        c.warnings.forEach((w) => { if (!out.warnings.includes(w)) out.warnings.push(w); });
      }
    } else {
      const i = ctx.ing.get(l.refId);
      if (!i) row.warn = 'This ingredient was deleted';
      else {
        row.name = i.name;
        (i.allergens || []).forEach((a) => out.allergens.add(a));
        if (fam(l.unit) !== fam(i.packUnit)) row.warn = `${i.name} is priced by ${FAMILY_LABEL[fam(i.packUnit)]}, use a ${FAMILY_LABEL[fam(i.packUnit)]} unit`;
        else if (!(num(i.price) > 0)) row.warn = `${i.name} has no price yet`;
        else row.cost = toBase(l.qty, l.unit) * unitCost(i);
      }
    }
    out.batch += row.cost;
    if (row.warn) out.warnings.push(row.warn);
    out.lines.push(row);
  }
  return out;
}

export function ceilTo(x, step) {
  const s = num(step);
  if (!(x > 0)) return 0;
  if (!(s > 0)) return Math.round(x * 100) / 100;
  return Math.ceil(x / s - 1e-6) * s;
}

export function pricing(r, ctx) {
  const { s } = ctx;
  const c = recipeCost(r, ctx);
  const batchWithAllowance = c.batch * (1 + num(s.qFactor) / 100);
  const portions = Math.max(num(r.servings), 0) || 1;
  const cost = batchWithAllowance / portions;
  const target = num(r.targetFc) || num(s.targetFc) || 30;
  const vat = 1 + num(s.vatPct) / 100;
  const suggestedNet = cost / (target / 100);
  const suggested = ceilTo(s.pricesIncludeVat ? suggestedNet * vat : suggestedNet, s.rounding);
  const price = num(r.price);
  const net = price ? (s.pricesIncludeVat ? price / vat : price) : 0;
  const fc = net ? (cost / net) * 100 : 0;
  const gp = net ? net - cost : 0;
  return {
    ...c, allergens: [...c.allergens], batchWithAllowance, portions, cost, target, suggestedNet, suggested,
    price, net, fc, gp, gpPct: net ? (gp / net) * 100 : 0, over: !!price && fc > target,
  };
}

export function pretty(base, family) {
  if (family === 'mass') return base >= 1000 ? [round(base / 1000), 'kg'] : [round(base), 'g'];
  if (family === 'vol') return base >= 1000 ? [round(base / 1000), 'l'] : [round(base), 'ml'];
  return [round(base), 'pc'];
}
const round = (n) => Math.round(n * 100) / 100;

/** Flattens a recipe, including its base recipes, into a shopping list. */
export function explode(r, factor, ctx, out = new Map(), seen = new Set()) {
  const chain = new Set(seen).add(r.id);
  for (const l of r.lines || []) {
    if (l.type === 'recipe') {
      const sub = ctx.rec.get(l.refId);
      const yb = sub ? toBase(sub.yieldQty, sub.yieldUnit) : 0;
      if (sub && !chain.has(sub.id) && yb > 0 && fam(l.unit) === fam(sub.yieldUnit)) {
        explode(sub, (factor * toBase(l.qty, l.unit)) / yb, ctx, out, chain);
      }
    } else {
      const i = ctx.ing.get(l.refId);
      if (i && fam(l.unit) === fam(i.packUnit)) {
        const cur = out.get(i.id) || { ing: i, base: 0 };
        cur.base += toBase(l.qty, l.unit) * factor;
        out.set(i.id, cur);
      }
    }
  }
  return out;
}

export function shoppingList(map) {
  return [...map.values()].map(({ ing, base }) => {
    const f = fam(ing.packUnit);
    const y = (num(ing.yieldPct) || 100) / 100;
    const buyBase = base / y;
    const pack = toBase(ing.packQty, ing.packUnit);
    return {
      id: ing.id, cat: ing.category || '', name: ing.name, supplier: ing.supplier || '', use: pretty(base, f), buy: pretty(buyBase, f),
      packs: pack > 0 ? Math.ceil(buyBase / pack - 1e-9) : 0, packLabel: `${ing.packQty} ${ing.packUnit}`,
      cost: base * unitCost(ing),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export function setMenuCalc(m, ctx) {
  const { s } = ctx;
  const guests = Math.max(1, Math.round(num(m.guests)) || 1);
  const courses = (m.courses || []).map((c) => {
    const r = ctx.rec.get(c.recipeId);
    return { ...c, name: r?.name || c.name || '', cost: r ? pricing(r, ctx).cost : 0, missing: !r };
  });
  const perGuest = courses.reduce((a, c) => a + c.cost, 0);
  const food = perGuest * guests;
  const extras = (m.extras || []).reduce((a, e) => a + num(e.amount), 0);
  const target = num(m.targetFc) || num(s.targetFc) || 30;
  const vat = 1 + num(s.vatPct) / 100;
  const suggestedNetTotal = food / (target / 100) + extras;
  const suggested = ceilTo((suggestedNetTotal / guests) * (s.pricesIncludeVat ? vat : 1), s.rounding);
  const price = num(m.price);
  const unit = price || suggested;
  const total = unit * guests;
  const net = s.pricesIncludeVat ? total / vat : total;
  return {
    courses, guests, perGuest, food, extras, target, suggested, price, total, net,
    profit: net - food - extras, fc: net ? (food / net) * 100 : 0, usingSuggested: !price,
  };
}

/* ---------- Kitchen tools ---------- */
const money2 = (n) => Math.round(n * 100) / 100;

export function sellingPrice({ cost, targetFc, vatPct, roundTo }) {
  const c = num(cost); const t = num(targetFc);
  if (!(c > 0) || !(t > 0)) return null;
  const net = c / (t / 100);
  const gross = ceilTo(net * (1 + num(vatPct) / 100), roundTo);
  const realNet = gross / (1 + num(vatPct) / 100);
  return { net: money2(net), gross: money2(gross), vat: money2(gross - realNet), gp: money2(realNet - c), fc: (c / realNet) * 100 };
}

export function foodCostOf({ cost, price, vatPct, inclVat }) {
  const c = num(cost); const p = num(price);
  if (!(c > 0) || !(p > 0)) return null;
  const net = inclVat ? p / (1 + num(vatPct) / 100) : p;
  return { net: money2(net), fc: (c / net) * 100, gp: money2(net - c), gpPct: ((net - c) / net) * 100 };
}

export function yieldCalc({ bought, usable, price }) {
  const b = num(bought); const u = num(usable);
  if (!(b > 0) || !(u > 0)) return null;
  const y = (u / b) * 100;
  const pr = num(price);
  return { yieldPct: y, loss: money2(b - u), costUsable: pr ? money2((pr * b) / u) : 0 };
}

export function convertUnit(value, from, to) {
  const v = num(value);
  if (!UNITS[from] || !UNITS[to] || fam(from) !== fam(to)) return null;
  return (v * UNITS[from].b) / UNITS[to].b;
}
export const cToF = (c) => (num(c) * 9) / 5 + 32;
export const fToC = (f) => ((num(f) - 32) * 5) / 9;

/** Grams in one 240 ml cup. Typical kitchen values; weigh when accuracy matters. */
export const CUP_GRAMS = {
  'Plain flour': 120, 'Caster sugar': 200, 'Brown sugar': 220, 'Icing sugar': 120, Butter: 227, 'Cocoa powder': 100,
  'Basmati rice, raw': 185, Salt: 288, Honey: 340, 'Olive oil': 216, Milk: 245, Water: 240, Cream: 240, Yogurt: 245,
};
export function cupsToGrams(cups, ingredient) { return num(cups) * (CUP_GRAMS[ingredient] || 0); }
export function gramsToCups(grams, ingredient) { const g = CUP_GRAMS[ingredient]; return g ? num(grams) / g : 0; }

export function breakEven({ fixed, avgCheck, foodPct, vatPct, days }) {
  const f = num(fixed); const a = num(avgCheck);
  if (!(f > 0) || !(a > 0)) return null;
  const net = a / (1 + num(vatPct) / 100);
  const margin = net * (1 - num(foodPct) / 100);
  if (!(margin > 0)) return null;
  const covers = Math.ceil(f / margin - 1e-9);
  return { net: money2(net), margin: money2(margin), covers, perDay: Math.ceil(covers / (num(days) || 30) - 1e-9), sales: money2(covers * a) };
}

/** Rule-of-thumb amounts per guest for a plated meal, cooked weight. */
export const PORTIONS = [
  ['Meat or poultry, boneless', 180, 'g'], ['Meat on the bone', 300, 'g'], ['Fish fillet', 170, 'g'], ['Rice, cooked', 150, 'g'], ['Potatoes or pasta', 150, 'g'],
  ['Vegetables', 120, 'g'], ['Salad', 80, 'g'], ['Soup', 250, 'ml'], ['Sauce', 60, 'ml'], ['Bread', 60, 'g'], ['Dessert', 120, 'g'],
];
export function portionPlan(guests, styleFactor) {
  const n = Math.max(0, Math.round(num(guests)));
  const k = num(styleFactor) || 1;
  return PORTIONS.map(([name, amt, unit]) => {
    const each = Math.round(amt * k);
    const total = pretty(each * n, unit === 'ml' ? 'vol' : 'mass');
    return { name, each: `${each} ${unit}`, total: `${total[0]} ${total[1]}` };
  });
}

/** Classic menu engineering: popularity against 70% of a fair share, profit against the average. */
export function menuEngineering(rows) {
  const list = rows.filter((r) => num(r.sold) > 0 && r.gp);
  const total = list.reduce((a, r) => a + num(r.sold), 0);
  if (!list.length) return { rows: [], total: 0, avgGp: 0, popular: 0 };
  const avgGp = list.reduce((a, r) => a + num(r.sold) * r.gp, 0) / total;
  const popular = (total / list.length) * 0.7;
  return {
    total, avgGp, popular,
    rows: list.map((r) => {
      const hiPop = num(r.sold) >= popular; const hiGp = r.gp >= avgGp;
      return { ...r, group: hiPop && hiGp ? 'star' : hiPop ? 'workhorse' : hiGp ? 'puzzle' : 'dog' };
    }),
  };
}

/** "4 x 2.27 kg" becomes { packQty: 9.08, packUnit: 'kg' }. */
export function parsePack(txt) {
  const t = String(txt || '').toLowerCase().replace(',', '.');
  const m = t.match(/(?:(\d+(?:\.\d+)?)\s*[x×*]\s*)?(\d+(?:\.\d+)?)\s*(kg|g|gm|gr|l|lt|ltr|litre|liter|ml|pcs|pc|pieces|piece)\b/);
  if (!m) {
    const n = t.match(/(\d+)\s*(?:pcs|pc|pieces)/);
    return n ? { packQty: +n[1], packUnit: 'pc' } : null;
  }
  const k = m[1] ? +m[1] : 1; const v = +m[2]; const u = m[3];
  const q = (x) => Math.round(x * 1000) / 1000;
  if (u === 'kg') return { packQty: q(k * v), packUnit: 'kg' };
  if (/^g/.test(u)) return { packQty: q((k * v) / 1000), packUnit: 'kg' };
  if (/^(l|lt|ltr|litre|liter)$/.test(u)) return { packQty: q(k * v), packUnit: 'l' };
  if (u === 'ml') return { packQty: q((k * v) / 1000), packUnit: 'l' };
  return { packQty: q(k * v), packUnit: 'pc' };
}

export function nameScore(a, b) {
  const w = (x) => String(x).toLowerCase().replace(/[^a-z0-9؀-ۿ ]/g, ' ').split(/\s+/).filter((t) => t.length > 2);
  const A = w(a); const B = new Set(w(b));
  if (!A.length) return 0;
  return A.filter((t) => B.has(t) || [...B].some((x) => x.startsWith(t) || t.startsWith(x))).length / A.length;
}

/** A stable number for an ingredient, kept clear of real stock item ids in OrderEase. */
export function linkNumber(id) {
  let n = 7;
  for (const ch of String(id)) n = (n * 131 + ch.charCodeAt(0)) % 1000000007;
  return 1000000000 + n;
}
