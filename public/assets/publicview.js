// Builds what visitors may see. Anything left out here never leaves the database,
// so costs and quantities stay private unless a dish opts in.
import { buildCtx, pricing, setMenuCalc } from './calc.js';

export function toPublic(docs) {
  const ctx = buildCtx(docs);
  const profile = (docs.profile || [])[0] || {};
  const dishes = (docs.recipe || []).filter((r) => r.kind !== 'base' && r.published).map((r) => {
    const p = pricing(r, ctx);
    const d = {
      id: r.id, name: r.name, course: r.course || '', cuisine: r.cuisine || '', story: r.story || '', plating: r.plating || '',
      photos: r.photos || [], favourite: !!r.favourite, dietary: r.dietary || [], tags: r.tags || [],
      allergens: [...new Set([...(r.allergens || []), ...p.allergens])], sample: !!r.sample, order: r.updated || 0,
    };
    if (r.showRecipe) {
      d.servings = r.servings;
      d.method = r.method || [];
      d.lines = (r.lines || []).map((l, i) => ({ name: p.lines[i]?.name || l.name || '', qty: l.qty, unit: l.unit, prep: l.prep || '' })).filter((l) => l.name);
    }
    if (r.showCost && r.price) { d.price = r.price; d.fc = p.fc; }
    return d;
  });
  const shown = new Set(dishes.map((d) => d.id));
  const setMenus = (docs.setmenu || []).filter((m) => m.published).map((m) => {
    const c = setMenuCalc(m, ctx);
    const o = {
      id: m.id, name: m.name, occasion: m.occasion || '', description: m.description || '', sample: !!m.sample,
      courses: c.courses.map((x) => ({ course: x.course || '', name: x.name, note: x.note || '', dishId: shown.has(x.recipeId) ? x.recipeId : null })),
    };
    if (m.showPrice) o.price = m.price || c.suggested;
    return o;
  });
  const photos = (docs.photo || []).filter((p) => p.published).map((p) => ({
    id: p.id, caption: p.caption || '', category: p.category || '', art: !!p.art, sample: !!p.sample,
  }));
  return { profile, currency: ctx.s.currency, dishes, setMenus, photos };
}
