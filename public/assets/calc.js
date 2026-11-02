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
      name: ing.name, supplier: ing.supplier || '', use: pretty(base, f), buy: pretty(buyBase, f),
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
