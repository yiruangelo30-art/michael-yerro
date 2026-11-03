// Chef Studio: the private side. Nothing here is visible to visitors.
import { h, clear, money, pct, toast, modal, confirmBox, downloadJson, printNode } from './ui.js';
import * as store from './store.js';
import { icon, profileBlock } from './site.js';
import { UNIT_NAMES, buildCtx, pricing, unitCost, explode, shoppingList, setMenuCalc, UNITS } from './calc.js';

const COURSES = ['Starter', 'Soup', 'Salad', 'Main', 'Dessert', 'Bakery', 'Sauce', 'Drink'];
const ALLERGENS = ['Gluten', 'Dairy', 'Egg', 'Fish', 'Shellfish', 'Tree nuts', 'Peanuts', 'Sesame', 'Soy', 'Mustard', 'Celery', 'Sulphites'];
const DIETARY = ['Halal', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut-free'];
const STATUS = { idea: 'Idea', testing: 'Testing', final: 'Final' };
const PHOTO_CATS = ['Dishes', 'Events', 'Kitchen', 'Team'];
const NAV = [
  ['My kitchen', [['studio', 'Overview', 'home'], ['s-recipes', 'Recipes', 'dish'], ['s-lab', 'Recipe lab', 'heart'], ['s-ingredients', 'Ingredients', 'menu']]],
  ['Tools', [['s-menus', 'Set menus', 'menu'], ['s-costing', 'Costing', 'dish'], ['s-photos', 'Photos', 'photo']]],
  ['Account', [['s-profile', 'Profile', 'chef'], ['s-account', 'Settings', 'lock']]],
];

let authed = false;
const clone = (o) => JSON.parse(JSON.stringify(o));
const D = () => store.getDocs();
const ctx = () => buildCtx(D());
const cur = () => ctx().s.currency;
const go = (r) => { location.hash = r; };
const setHash = (r) => { try { history.replaceState(null, '', `#${r}`); lastRoute = r; } catch { /* the preview frame blocks this */ } };
const short = (r) => r.name.replace(/^Sample( idea)?:\s*/, '');

function field(label, control, hint) {
  return h('label', { class: 'field' }, h('span', {}, label), control, hint && h('small', {}, hint));
}
function input(obj, key, attrs = {}, after) {
  return h('input', { type: 'text', value: obj[key] ?? '', ...attrs, oninput: (e) => { obj[key] = e.target.value; after?.(); } });
}
function area(obj, key, rows = 3, attrs = {}, after) {
  return h('textarea', { rows, ...attrs, oninput: (e) => { obj[key] = e.target.value; after?.(); } }, obj[key] ?? '');
}
function select(obj, key, options, after) {
  return h('select', { onchange: (e) => { obj[key] = e.target.value; after?.(); } },
    options.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; return h('option', { value: v, selected: String(obj[key] ?? '') === String(v) }, t); }));
}
function toggle(obj, key, label, after) {
  return h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!obj[key], onchange: (e) => { obj[key] = e.target.checked; after?.(); } }), h('span', {}, label));
}
function chips(arr, options) {
  return h('div', { class: 'chips' }, options.map((o) => h('button', {
    type: 'button', class: arr.includes(o) ? 'on' : '', 'aria-pressed': String(arr.includes(o)),
    onclick: (e) => {
      const i = arr.indexOf(o);
      if (i >= 0) arr.splice(i, 1); else arr.push(o);
      e.currentTarget.classList.toggle('on', i < 0);
      e.currentTarget.setAttribute('aria-pressed', String(i < 0));
    },
  }, o)));
}
const pill = (text, kind) => h('span', { class: `pill ${kind || ''}` }, text);
const guard = async (fn, ok) => { try { const r = await fn(); if (ok) toast(ok); return r; } catch (e) { toast(e.message, true); return undefined; } };

/* ---------- Sign in ---------- */
function gate(title, intro, fields, label, submit) {
  const msg = h('p', { class: 'form-err', role: 'alert' });
  return h('main', { class: 'gate' }, h('a', { class: 'back-link', href: '#home' }, 'Back to the portfolio'),
    h('h1', {}, title), h('p', {}, intro),
    h('form', {
      class: 'stack',
      onsubmit: async (e) => {
        e.preventDefault();
        msg.textContent = '';
        try { await submit(); authed = true; await renderStudio(document.getElementById('app'), location.hash.slice(1) || 'studio'); }
        catch (x) { msg.textContent = x.message; }
      },
    }, fields, msg, h('button', { class: 'btn' }, label)));
}

/* ---------- Overview ---------- */
function overview() {
  const d = D(); const c = ctx();
  const real = d.recipe.filter((r) => !r.sample);
  const dishes = d.recipe.filter((r) => r.kind !== 'base');
  const costed = dishes.map((r) => ({ r, p: pricing(r, c) }));
  const over = costed.filter((x) => x.p.over);
  const samples = d.recipe.filter((r) => r.sample).length + d.ingredient.filter((i) => i.sample).length + d.setmenu.filter((m) => m.sample).length;
  const shownReal = real.filter((r) => r.published && r.kind !== 'base');
  const realPhotos = d.photo.filter((p) => !p.sample && p.published);
  const steps = [
    [shownReal.length >= 6, `Publish at least 6 of your own dishes (${shownReal.length} so far)`, '#s-recipes'],
    [shownReal.every((r) => (r.photos || []).length) && shownReal.length > 0, 'Add a photo to every published dish', '#s-recipes'],
    [realPhotos.length >= 12, `Add at least 12 photos to the gallery (${realPhotos.length} so far)`, '#s-photos'],
    [d.setmenu.some((m) => m.published && !m.sample), 'Publish one set menu you have served', '#s-menus'],
    [!samples, `Delete the sample content (${samples} items left)`, '#s-account'],
  ];
  return h('div', {}, h('h1', {}, 'Overview'),
    h('div', { class: 'stats' },
      [['Recipes', d.recipe.length], ['Ingredients', d.ingredient.length], ['Set menus', d.setmenu.length], ['Photos', d.photo.length]].map(([a, b]) => h('div', {}, h('strong', {}, b), h('span', {}, a)))),
    h('div', { class: 'grid2' },
      h('section', { class: 'panel' }, h('h2', {}, 'Before you send this to an employer'),
        h('ul', { class: 'todo' }, steps.map(([ok, t, href]) => h('li', { class: ok ? 'ok' : '' }, h('span', { 'aria-hidden': 'true' }, ok ? '✓' : '○'), ok ? t : h('a', { href }, t))))),
      h('section', { class: 'panel' }, h('h2', {}, 'Above target food cost'),
        over.length ? h('ul', { class: 'lines' }, over.map(({ r, p }) => h('li', {}, h('a', { href: `#s-recipe-${r.id}` }, short(r)), pill(pct(p.fc), 'bad'))))
          : h('p', { class: 'muted' }, 'All priced dishes are within target.'))));
}

/* ---------- Recipes ---------- */
function newRecipe(extra = {}) {
  return {
    id: store.uid(), name: '', kind: 'dish', status: 'testing', course: 'Main', cuisine: '', tags: [], servings: 4, yieldQty: '', yieldUnit: 'ml',
    lines: [], method: [], story: '', plating: '', allergens: [], dietary: [], price: 0, targetFc: 0, photos: [], favourite: false, signature: false,
    published: false, showRecipe: false, showCost: false, trials: [], created: Date.now(), ...extra,
  };
}

let recipeFilter = { q: '', course: '', fav: false, kind: '' };
function recipes() {
  const c = ctx();
  const list = h('div', { class: 'list' });
  const paint = () => {
    const f = recipeFilter; const q = f.q.toLowerCase();
    const rows = D().recipe.filter((r) => (!q || `${r.name} ${(r.tags || []).join(' ')} ${r.cuisine}`.toLowerCase().includes(q))
      && (!f.course || r.course === f.course) && (!f.fav || r.favourite) && (!f.kind || r.kind === f.kind))
      .sort((a, b) => (b.updated || 0) - (a.updated || 0));
    list.replaceChildren(...(rows.length ? rows.map((r) => {
      const p = pricing(r, c);
      return h('a', { class: 'rowcard', href: `#s-recipe-${r.id}` },
        h('span', { class: 'star', 'aria-label': r.favourite ? 'Favourite' : null }, r.favourite ? '★' : ''),
        h('span', { class: 'grow' }, h('strong', {}, short(r) || 'Untitled'), h('small', {}, [r.kind === 'base' ? 'Base recipe' : r.course, STATUS[r.status], r.published ? 'On portfolio' : 'Private', r.sample ? 'Sample' : ''].filter(Boolean).join(', '))),
        h('span', { class: 'num' }, r.kind === 'base' ? money(p.batch, c.s.currency) : money(p.cost, c.s.currency), h('small', {}, r.kind === 'base' ? 'per batch' : 'per portion')),
        r.kind !== 'base' && p.price ? pill(pct(p.fc), p.over ? 'bad' : 'good') : h('span', { class: 'pill' }, r.kind === 'base' ? 'Base' : 'No price'));
    }) : [h('p', { class: 'muted' }, 'No recipes match. Clear the search or add a new recipe.')]));
  };
  paint();
  const f = recipeFilter;
  return h('div', {},
    h('div', { class: 'head-row' }, h('h1', {}, 'Recipes'), h('button', { class: 'btn', onclick: () => go(`s-recipe-new`) }, 'New recipe')),
    h('div', { class: 'tools' },
      h('input', { type: 'search', id: 'rq', placeholder: 'Search name, tag or cuisine', 'aria-label': 'Search recipes', value: f.q, oninput: (e) => { f.q = e.target.value; paint(); } }),
      select(f, 'course', [['', 'All courses'], ...COURSES], paint),
      select(f, 'kind', [['', 'Dishes and bases'], ['dish', 'Dishes'], ['base', 'Base recipes']], paint),
      toggle(f, 'fav', 'Favourites only', paint)),
    list);
}

function ingredientModal(start = {}) {
  const isNew = !start.id;
  const i = { id: store.uid(), name: '', category: '', supplier: '', price: '', packQty: 1, packUnit: 'kg', yieldPct: 100, allergens: [], ...clone(start) };
  return modal(isNew ? 'New ingredient' : 'Edit ingredient', (done) => {
    const out = h('p', { class: 'muted' });
    const calc = () => {
      const u = unitCost(i); const f = UNITS[i.packUnit]?.f;
      out.textContent = u ? `Usable cost: ${money(u * (f === 'count' ? 1 : 1000), cur())} per ${f === 'mass' ? 'kg' : f === 'vol' ? 'l' : 'piece'}` : 'Enter a price and pack size to see the usable cost.';
    };
    calc();
    return h('form', {
      class: 'stack',
      onsubmit: async (e) => {
        e.preventDefault();
        if (!i.name.trim()) { toast('Give the ingredient a name.', true); return; }
        i.name = i.name.trim(); delete i.sample;
        const saved = await guard(() => store.put('ingredient', i), 'Ingredient saved');
        if (saved) done(saved);
      },
    },
    field('Name', input(i, 'name', { required: true })),
    h('div', { class: 'cols3' },
      field('Pack price', input(i, 'price', { type: 'number', step: 'any', min: 0, inputmode: 'decimal' }, calc)),
      field('Pack size', input(i, 'packQty', { type: 'number', step: 'any', min: 0, inputmode: 'decimal' }, calc)),
      field('Unit', select(i, 'packUnit', UNIT_NAMES, calc))),
    field('Yield %', input(i, 'yieldPct', { type: 'number', step: 'any', min: 1, max: 100, inputmode: 'decimal' }, calc), 'The usable share after trimming. A whole fish filleted to 45% has a 45% yield.'),
    out,
    h('div', { class: 'cols2' }, field('Category', input(i, 'category')), field('Supplier', input(i, 'supplier'))),
    h('div', { class: 'field' }, h('span', {}, 'Allergens'), chips(i.allergens, ALLERGENS)),
    h('div', { class: 'row end' },
      !isNew && h('button', {
        type: 'button', class: 'btn danger',
        onclick: async () => {
          const uses = D().recipe.filter((r) => (r.lines || []).some((l) => l.refId === i.id)).length;
          if (await confirmBox(uses ? `${i.name} is used in ${uses} recipe(s). Those lines will show a warning. Delete it?` : `Delete ${i.name}?`)) {
            await guard(() => store.del('ingredient', i.id), 'Ingredient deleted'); done('deleted');
          }
        },
      }, 'Delete'),
      h('button', { class: 'btn' }, 'Save ingredient')));
  });
}

function recipeEditor(id) {
  const existing = id === 'new' ? null : D().recipe.find((r) => r.id === id);
  if (id !== 'new' && !existing) return h('p', { class: 'muted' }, 'This recipe no longer exists.');
  const r = existing ? clone(existing) : newRecipe();
  if (!Number(r.price)) r.price = '';
  if (!Number(r.targetFc)) r.targetFc = '';
  ['lines', 'method', 'photos', 'trials', 'allergens', 'dietary', 'tags'].forEach((k) => { r[k] = r[k] || []; });
  let dirty = false;
  const touch = () => { dirty = true; bar.classList.add('dirty'); };
  const mark = () => { touch(); refresh(); };

  const summary = h('div', {});
  const lineBox = h('div', { class: 'ing-lines' });
  const mini = h('span', { class: 'mini' });
  const prep = h('div', {});
  let guests = Number(r.servings) || 4;

  const nameList = h('datalist', { id: 'ref-list' });
  const paintNames = () => {
    const d = D();
    nameList.replaceChildren(...d.ingredient.map((i) => h('option', { value: i.name })),
      ...d.recipe.filter((x) => x.kind === 'base' && x.id !== r.id).map((x) => h('option', { value: x.name }, 'Base recipe')));
  };

  const refresh = () => {
    const c = ctx();
    c.rec.set(r.id, r);
    const p = pricing(r, c);
    const money2 = (n) => money(n, c.s.currency);
    lineBox.querySelectorAll('[data-cost]').forEach((el, i) => {
      el.textContent = p.lines[i]?.cost ? money2(p.lines[i].cost) : '';
    });
    lineBox.querySelectorAll('[data-warn]').forEach((el, i) => { el.textContent = p.lines[i]?.warn || ''; });
    const isBase = r.kind === 'base';
    const rows = [
      ['Ingredients, batch', money2(p.batch)],
      [`With ${c.s.qFactor}% allowance`, money2(p.batchWithAllowance)],
      !isBase && [`Cost per portion (${p.portions})`, money2(p.cost), true],
      isBase && Number(r.yieldQty) > 0 && [`Cost per ${r.yieldUnit === 'pc' ? 'piece' : (UNITS[r.yieldUnit]?.f === 'vol' ? 'litre' : 'kg')}`, money2(p.batch / (Number(r.yieldQty) * (UNITS[r.yieldUnit]?.b || 1)) * (UNITS[r.yieldUnit]?.f === 'count' ? 1 : 1000)), true],
      !isBase && [`Suggested price at ${p.target}%`, money2(p.suggested)],
    ].filter(Boolean);
    summary.replaceChildren(...[
      h('dl', { class: 'calc' }, rows.map(([a, b, strong]) => h('div', { class: strong ? 'strong' : '' }, h('dt', {}, a), h('dd', {}, b)))),
      !isBase && p.price ? h('div', { class: `verdict ${p.over ? 'bad' : 'good'}` },
        h('div', {}, h('strong', {}, pct(p.fc)), h('span', {}, `food cost, target ${p.target}%`)),
        h('div', {}, h('strong', {}, money2(p.gp)), h('span', {}, `gross profit, ${pct(p.gpPct)}`))) : null,
      !isBase && p.price ? h('small', { class: 'muted' }, `${c.s.pricesIncludeVat ? `Price includes ${c.s.vatPct}% VAT. Net ${money2(p.net)}.` : 'Price excludes VAT.'}`) : null,
      p.warnings.length ? h('ul', { class: 'warns' }, p.warnings.map((w) => h('li', {}, w))) : null,
      p.allergens.length ? h('p', { class: 'muted' }, `Contains: ${[...new Set([...p.allergens, ...r.allergens])].join(', ')}`) : null,
    ].filter(Boolean));
    mini.textContent = isBase ? `Batch ${money2(p.batch)}` : `${money2(p.cost)} per portion${p.price ? `, ${pct(p.fc)}` : ''}`;
    const factor = guests / (Number(r.servings) || 1);
    const list = shoppingList(explode(r, factor, c));
    prep.replaceChildren(list.length ? h('div', { class: 'scroll' }, h('table', {},
      h('thead', {}, h('tr', {}, ['Ingredient', 'Needed', 'Buy', 'Cost'].map((t) => h('th', {}, t)))),
      h('tbody', {}, list.map((x) => h('tr', {}, h('td', {}, x.name), h('td', {}, x.use.join(' ')), h('td', {}, `${x.buy.join(' ')}`, h('small', {}, ` ${x.packs} × ${x.packLabel}`)), h('td', { class: 'num' }, money2(x.cost))))),
      h('tfoot', {}, h('tr', {}, h('td', { colspan: 3 }, `Food cost for ${guests}`), h('td', { class: 'num' }, money2(list.reduce((a, x) => a + x.cost, 0))))))) : h('p', { class: 'muted' }, 'Add ingredients to build a prep list.'));
  };

  const resolve = (line, name) => {
    const d = D();
    const t = name.trim().toLowerCase();
    const ing = d.ingredient.find((i) => i.name.toLowerCase() === t);
    const base = d.recipe.find((x) => x.kind === 'base' && x.id !== r.id && x.name.toLowerCase() === t);
    if (ing) { line.type = 'ing'; line.refId = ing.id; line.name = ing.name; if (UNITS[line.unit]?.f !== UNITS[ing.packUnit]?.f) line.unit = ing.packUnit === 'kg' ? 'g' : ing.packUnit === 'l' ? 'ml' : ing.packUnit; }
    else if (base) { line.type = 'recipe'; line.refId = base.id; line.name = base.name; if (UNITS[line.unit]?.f !== UNITS[base.yieldUnit]?.f) line.unit = base.yieldUnit; }
    else { line.refId = ''; line.name = name; }
  };

  const paintLines = () => {
    const c = ctx();
    lineBox.replaceChildren(...r.lines.map((l, idx) => {
      const nameNow = l.refId ? (l.type === 'recipe' ? c.rec.get(l.refId)?.name : c.ing.get(l.refId)?.name) || '' : (l.name || '');
      const addBtn = h('button', {
        type: 'button', class: 'link', hidden: !!l.refId || !nameNow,
        onclick: async () => {
          const made = await ingredientModal({ name: l.name || '' });
          if (made && made !== 'deleted') { resolve(l, made.name); paintNames(); paintLines(); mark(); }
        },
      }, 'Add to ingredients');
      return h('div', { class: 'ing-line' },
        h('input', {
          type: 'text', list: 'ref-list', value: nameNow, placeholder: 'Ingredient or base recipe', 'aria-label': 'Ingredient',
          onchange: (e) => { resolve(l, e.target.value); paintLines(); mark(); },
          oninput: (e) => { l.name = e.target.value; addBtn.hidden = true; },
        }),
        h('input', { type: 'number', step: 'any', min: 0, inputmode: 'decimal', value: l.qty ?? '', 'aria-label': 'Quantity', oninput: (e) => { l.qty = e.target.value; mark(); } }),
        select(l, 'unit', UNIT_NAMES, mark),
        h('input', { type: 'text', value: l.prep || '', placeholder: 'Prep note', 'aria-label': 'Prep note', oninput: (e) => { l.prep = e.target.value; touch(); } }),
        h('span', { class: 'num', 'data-cost': '' }),
        h('button', { type: 'button', class: 'x', 'aria-label': 'Remove line', onclick: () => { r.lines.splice(idx, 1); paintLines(); mark(); } }, '×'),
        h('small', { class: 'warn', 'data-warn': '' }), addBtn);
    }));
    refresh();
  };

  const photoBox = h('div', { class: 'thumb-row' });
  const paintPhotos = () => {
    photoBox.replaceChildren(...r.photos.map((pid, i) => h('div', { class: 'thumb' },
      h('img', { src: store.imgUrl(pid), alt: 'Dish photo' }),
      i === 0 && h('span', { class: 'sample' }, 'Cover'),
      h('button', { type: 'button', class: 'x', 'aria-label': 'Remove photo', onclick: () => { r.photos.splice(i, 1); paintPhotos(); mark(); } }, '×'))),
    h('label', { class: 'upload' }, 'Add photos', h('input', {
      type: 'file', accept: 'image/*', multiple: true, class: 'hide',
      onchange: async (e) => {
        const ids = await uploadPhotos(e.target.files, { category: 'Dishes', published: false, caption: short(r) });
        r.photos.push(...ids); paintPhotos(); mark(); e.target.value = '';
      },
    })));
  };

  const trialBox = h('div', {});
  const paintTrials = () => {
    trialBox.replaceChildren(...r.trials.map((t, i) => h('div', { class: 'trial' },
      h('div', { class: 'cols3' },
        field('Date', input(t, 'date', { type: 'date' })),
        field(`Test ${i + 1}: what changed`, input(t, 'change')),
        field('Score out of 5', input(t, 'score', { type: 'number', min: 0, max: 5, step: 1 }))),
      field('Result', input(t, 'result')),
      h('button', { type: 'button', class: 'link', onclick: () => { r.trials.splice(i, 1); paintTrials(); touch(); } }, 'Remove this test'))));
  };

  const persist = async () => {
    if (!r.name.trim()) { toast('Give the recipe a name before saving.', true); return false; }
    if (r.published && !r.sample && r.kind === 'base') r.published = false;
    r.lines = r.lines.filter((l) => l.refId || (l.name || '').trim());
    const saved = await guard(() => store.put('recipe', clone(r)), 'Recipe saved');
    if (saved) { dirty = false; bar.classList.remove('dirty'); if (id === 'new') { setHash(`s-recipe-${r.id}`); } }
    return !!saved;
  };

  const bar = h('div', { class: 'savebar' }, mini,
    h('button', { class: 'btn', onclick: persist }, 'Save recipe'));
  // Leaving with unsaved edits asks first.
  leaveCheck = async () => {
    if (!dirty) return true;
    return modal('Unsaved changes', (done) => h('div', { class: 'stack' }, h('p', {}, 'Save this recipe before leaving?'),
      h('div', { class: 'row end' },
        h('button', { class: 'btn ghost', onclick: () => done(true) }, 'Leave without saving'),
        h('button', { class: 'btn', onclick: async () => done(await persist()) }, 'Save recipe'))));
  };

  const basics = h('div', { class: 'kind-fields' });
  const paintBasics = () => {
    basics.replaceChildren(...(r.kind === 'base'
      ? [h('div', { class: 'cols2' },
        field('Batch yield', input(r, 'yieldQty', { type: 'number', step: 'any', min: 0, inputmode: 'decimal' }, mark), 'Used to cost this base inside other recipes'),
        field('Yield unit', select(r, 'yieldUnit', UNIT_NAMES, mark)))]
      : [h('div', { class: 'cols2' },
        field('Portions in this recipe', input(r, 'servings', { type: 'number', min: 1, step: 1, inputmode: 'numeric' }, mark)),
        field('Status', select(r, 'status', Object.entries(STATUS))))]));
  };
  paintBasics();
  paintNames(); paintPhotos(); paintTrials(); paintLines();

  const steps = area({ get v() { return r.method.join('\n'); }, set v(x) { r.method = x.split('\n').map((s) => s.trim()).filter(Boolean); touch(); } }, 'v', 7, { id: 'method', placeholder: 'One step per line' });

  return h('div', { class: 'editor' }, nameList,
    h('div', { class: 'head-row' }, h('a', { class: 'back-link', href: '#s-recipes' }, 'All recipes'),
      h('div', { class: 'row' },
        !store.isPreview && h('button', { class: 'btn ghost', onclick: () => printNode(recipeCard(r)) }, 'Print recipe card'),
        existing && h('button', {
          class: 'btn ghost',
          onclick: async () => {
            const copy = { ...clone(r), id: store.uid(), name: `${r.name.replace(/ v\d+$/, '')} v${(r.trials.length || 1) + 1}`, published: false, sample: false, status: 'testing', trials: [], created: Date.now() };
            if (await guard(() => store.put('recipe', copy), 'New version created')) go(`s-recipe-${copy.id}`);
          },
        }, 'Save as new version'))),
    h('div', { class: 'edit-grid' },
      h('div', { class: 'stack big' },
        h('section', { class: 'panel stack' },
          field('Recipe name', input(r, 'name', { id: 'rname', placeholder: 'For example, Seared sea bream', required: true }, touch)),
          h('div', { class: 'cols3' },
            field('Type', select(r, 'kind', [['dish', 'Dish'], ['base', 'Base recipe (sauce, stock)']], () => { paintBasics(); mark(); })),
            field('Course', select(r, 'course', COURSES)),
            field('Cuisine or style', input(r, 'cuisine'))),
          basics,
          toggle(r, 'favourite', 'Chef’s favourite')),
        h('section', { class: 'panel stack' }, h('h2', {}, 'Ingredients'),
          h('p', { class: 'muted' }, 'Enter the usable amount. Trim loss comes from the yield on each ingredient.'),
          lineBox,
          h('button', { type: 'button', class: 'btn ghost', onclick: () => { r.lines.push({ type: 'ing', refId: '', qty: '', unit: 'g', prep: '' }); paintLines(); lineBox.querySelector('.ing-line:last-child input')?.focus(); } }, 'Add ingredient')),
        h('section', { class: 'panel stack' }, h('h2', {}, 'Method'), steps),
        h('section', { class: 'panel stack' }, h('div', { class: 'head-row' }, h('h2', {}, 'Scale for an event'),
          h('div', { class: 'stepper' }, h('span', {}, 'Guests'), h('input', { type: 'number', min: 1, value: guests, 'aria-label': 'Guests', inputmode: 'numeric', oninput: (e) => { guests = Math.max(1, Number(e.target.value) || 1); refresh(); } }))), prep),
        h('section', { class: 'panel stack' }, h('h2', {}, 'Development log'),
          h('p', { class: 'muted' }, 'Record each test so you can show how the dish developed.'), trialBox,
          h('button', { type: 'button', class: 'btn ghost', onclick: () => { r.trials.push({ id: store.uid(), date: new Date().toISOString().slice(0, 10), change: '', result: '', score: '' }); paintTrials(); touch(); } }, 'Add a test')),
        h('section', { class: 'panel stack' }, h('h2', {}, 'Story and plating'),
          field('The story of this dish', area(r, 'story', 4, {}, touch)),
          field('Plating notes', area(r, 'plating', 3, {}, touch)),
          h('div', { class: 'field' }, h('span', {}, 'Suitable for'), chips(r.dietary, DIETARY)),
          h('div', { class: 'field' }, h('span', {}, 'Extra allergens'), chips(r.allergens, ALLERGENS), h('small', {}, 'Allergens set on ingredients are added automatically.')),
          field('Tags', h('input', { type: 'text', value: r.tags.join(', '), placeholder: 'Separate with commas', oninput: (e) => { r.tags = e.target.value.split(',').map((s) => s.trim()).filter(Boolean); touch(); } }))),
        h('section', { class: 'panel stack' }, h('h2', {}, 'Photos'), photoBox),
        existing && h('button', {
          class: 'btn danger',
          onclick: async () => {
            if (await confirmBox(`Delete ${short(r)}? This cannot be undone.`)) { dirty = false; await guard(() => store.del('recipe', r.id), 'Recipe deleted'); go('s-recipes'); }
          },
        }, 'Delete recipe')),
      h('aside', { class: 'side' },
        h('section', { class: 'panel stack' }, h('h2', {}, 'Cost and price'),
          r.kind !== 'base' && h('div', { class: 'cols2' },
            field(`Menu price, ${cur()}`, input(r, 'price', { type: 'number', step: 'any', min: 0, inputmode: 'decimal' }, mark)),
            field('Target food cost %', input(r, 'targetFc', { type: 'number', step: 'any', min: 1, max: 100, inputmode: 'decimal', placeholder: String(ctx().s.targetFc) }, mark))),
          summary),
        h('section', { class: 'panel stack' }, h('h2', {}, 'Portfolio'),
          r.kind === 'base' ? h('p', { class: 'muted' }, 'Base recipes stay private.') : [
            toggle(r, 'published', 'Show this dish on the portfolio', touch),
            toggle(r, 'showRecipe', 'Also show ingredients and method', touch),
            toggle(r, 'showCost', 'Also show price and food cost %', touch),
            toggle(r, 'sample', 'Show the Sample label', touch),
            h('small', { class: 'muted' }, 'Quantities and costs stay private until you tick these. Untick Sample once this is a real dish.'),
          ]))),
    bar);
}

function recipeCard(r) {
  const c = ctx(); const p = pricing(r, c);
  return h('div', { class: 'cv' }, h('h1', {}, short(r)), h('p', {}, [r.course, r.kind === 'base' ? `Yield ${r.yieldQty} ${r.yieldUnit}` : `${r.servings} portions`].filter(Boolean).join('   |   ')),
    h('h2', {}, 'Ingredients'), h('ul', {}, r.lines.map((l, i) => h('li', {}, `${l.qty} ${l.unit} ${p.lines[i]?.name || l.name || ''}${l.prep ? `, ${l.prep}` : ''}`))),
    h('h2', {}, 'Method'), h('ol', {}, r.method.map((s) => h('li', {}, s))),
    h('h2', {}, 'Cost'), h('p', {}, `${money(p.cost, c.s.currency)} per portion${p.price ? `. Menu price ${money(p.price, c.s.currency)}. Food cost ${pct(p.fc)}.` : '.'}`));
}

/* ---------- Lab ---------- */
function lab() {
  const col = (key) => {
    const rows = D().recipe.filter((r) => (r.status || 'final') === key && r.kind !== 'base');
    return h('section', { class: 'lane' }, h('h2', {}, STATUS[key], h('small', {}, ` ${rows.length}`)),
      rows.map((r) => {
        const t = (r.trials || [])[r.trials.length - 1];
        return h('a', { class: 'lab-card', href: `#s-recipe-${r.id}` }, h('strong', {}, short(r)),
          h('small', {}, t ? `Last test ${t.date}${t.result ? `: ${t.result}` : ''}` : 'No tests logged'),
          h('small', {}, `${(r.trials || []).length} test(s)`));
      }));
  };
  return h('div', {},
    h('div', { class: 'head-row' }, h('h1', {}, 'Recipe lab'), h('button', {
      class: 'btn',
      onclick: async () => {
        const name = await modal('New idea', (done) => {
          const o = { n: '' };
          return h('form', { class: 'stack', onsubmit: (e) => { e.preventDefault(); done(o.n.trim()); } }, field('Dish idea', input(o, 'n', { required: true })), h('button', { class: 'btn' }, 'Add idea'));
        });
        if (!name) return;
        const r = newRecipe({ name, status: 'idea' });
        if (await guard(() => store.put('recipe', r), 'Idea added')) go(`s-recipe-${r.id}`);
      },
    }, 'New idea')),
    h('p', { class: 'muted' }, 'Move a dish along by changing its status. Open a card to log tests.'),
    h('div', { class: 'lanes' }, ['idea', 'testing', 'final'].map(col)));
}

/* ---------- Ingredients ---------- */
let ingQ = '';
function ingredients() {
  const body = h('tbody', {});
  const paint = () => {
    const d = D(); const q = ingQ.toLowerCase(); const c = cur();
    const used = (id) => d.recipe.filter((r) => (r.lines || []).some((l) => l.refId === id)).length;
    body.replaceChildren(...d.ingredient.filter((i) => !q || `${i.name} ${i.category} ${i.supplier}`.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((i) => {
        const f = UNITS[i.packUnit]?.f; const per = f === 'count' ? 1 : 1000;
        return h('tr', { class: 'click', tabindex: 0, onclick: () => open(i), onkeydown: (e) => { if (e.key === 'Enter') open(i); } },
          h('td', {}, h('strong', {}, i.name), h('small', {}, i.supplier || '')),
          h('td', { class: 'num' }, money(i.price, c)), h('td', {}, `${i.packQty} ${i.packUnit}`), h('td', { class: 'num' }, `${i.yieldPct || 100}%`),
          h('td', { class: 'num' }, `${money(unitCost(i) * per, c)} / ${f === 'mass' ? 'kg' : f === 'vol' ? 'l' : 'pc'}`), h('td', { class: 'num' }, used(i.id)));
      }));
  };
  const open = async (i) => { if (await ingredientModal(i)) paint(); };
  paint();
  return h('div', {},
    h('div', { class: 'head-row' }, h('h1', {}, 'Ingredients'), h('button', { class: 'btn', onclick: async () => { if (await ingredientModal()) paint(); } }, 'New ingredient')),
    h('p', { class: 'muted' }, 'Change a price here and every recipe, set menu and cost report updates.'),
    h('div', { class: 'tools' }, h('input', { type: 'search', placeholder: 'Search ingredients', 'aria-label': 'Search ingredients', value: ingQ, oninput: (e) => { ingQ = e.target.value; paint(); } })),
    h('div', { class: 'scroll panel flush' }, h('table', {}, h('thead', {}, h('tr', {}, ['Ingredient', 'Price', 'Pack', 'Yield', 'Usable cost', 'Used in'].map((t) => h('th', {}, t)))), body)));
}

/* ---------- Set menus ---------- */
function menusList() {
  const c = ctx();
  return h('div', {},
    h('div', { class: 'head-row' }, h('h1', {}, 'Set menus'), h('button', {
      class: 'btn',
      onclick: async () => {
        const m = { id: store.uid(), name: 'New set menu', occasion: '', description: '', guests: 8, price: 0, targetFc: 0, published: false, showPrice: false, courses: [], extras: [] };
        if (await guard(() => store.put('setmenu', m))) go(`s-menu-${m.id}`);
      },
    }, 'New set menu')),
    h('div', { class: 'list' }, D().setmenu.length ? D().setmenu.map((m) => {
      const x = setMenuCalc(m, c);
      return h('a', { class: 'rowcard', href: `#s-menu-${m.id}` },
        h('span', { class: 'grow' }, h('strong', {}, m.name.replace(/^Sample:\s*/, '')), h('small', {}, `${x.courses.length} courses, ${x.guests} guests${m.published ? ', on portfolio' : ', private'}${m.sample ? ', sample' : ''}`)),
        h('span', { class: 'num' }, money(x.perGuest, c.s.currency), h('small', {}, 'food per guest')), pill(pct(x.fc), x.fc > x.target ? 'bad' : 'good'));
    }) : h('p', { class: 'muted' }, 'No set menus yet. Add one to quote a private dinner.')));
}

function menuEditor(id) {
  const orig = D().setmenu.find((m) => m.id === id);
  if (!orig) return h('p', { class: 'muted' }, 'This set menu no longer exists.');
  const m = clone(orig);
  if (!Number(m.price)) m.price = '';
  if (!Number(m.targetFc)) m.targetFc = '';
  m.courses = m.courses || []; m.extras = m.extras || [];
  const dishes = D().recipe.filter((r) => r.kind !== 'base');
  const out = h('div', {}); const cBox = h('div', { class: 'stack' }); const xBox = h('div', { class: 'stack' }); const prep = h('div', {});
  const refresh = () => {
    const c = ctx(); const x = setMenuCalc(m, c); const $ = (n) => money(n, c.s.currency);
    out.replaceChildren(
      h('dl', { class: 'calc' }, [['Food per guest', $(x.perGuest)], [`Food for ${x.guests} guests`, $(x.food)], ['Staff and other costs', $(x.extras)], [`Suggested price per guest at ${x.target}%`, $(x.suggested)]].map(([a, b]) => h('div', {}, h('dt', {}, a), h('dd', {}, b)))),
      h('div', { class: `verdict ${x.fc > x.target ? 'bad' : 'good'}` },
        h('div', {}, h('strong', {}, $(x.total)), h('span', {}, x.usingSuggested ? 'quote at the suggested price' : 'quote at your price')),
        h('div', {}, h('strong', {}, $(x.profit)), h('span', {}, `profit, food cost ${pct(x.fc)}`))),
    );
    const map = new Map();
    m.courses.forEach((co) => { const r = c.rec.get(co.recipeId); if (r) explode(r, x.guests / (Number(r.servings) || 1), c, map); });
    const list = shoppingList(map);
    prep.replaceChildren(list.length ? h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, ['Ingredient', 'Buy', 'Packs', 'Supplier'].map((t) => h('th', {}, t)))),
      h('tbody', {}, list.map((l) => h('tr', {}, h('td', {}, l.name), h('td', {}, l.buy.join(' ')), h('td', {}, `${l.packs} × ${l.packLabel}`), h('td', {}, l.supplier)))))) : h('p', { class: 'muted' }, 'Add courses to build the shopping list.'));
  };
  const paint = () => {
    cBox.replaceChildren(...m.courses.map((co, i) => h('div', { class: 'cols3 course' },
      field('Course', select(co, 'course', COURSES)),
      field('Dish', select(co, 'recipeId', [['', 'Choose a dish'], ...dishes.map((r) => [r.id, short(r)])], refresh)),
      h('button', { type: 'button', class: 'x', 'aria-label': 'Remove course', onclick: () => { m.courses.splice(i, 1); paint(); } }, '×'))));
    xBox.replaceChildren(...m.extras.map((e, i) => h('div', { class: 'cols3 course' },
      field('Cost', input(e, 'label')), field(`Amount, ${cur()}`, input(e, 'amount', { type: 'number', step: 'any', min: 0, inputmode: 'decimal' }, refresh)),
      h('button', { type: 'button', class: 'x', 'aria-label': 'Remove cost', onclick: () => { m.extras.splice(i, 1); paint(); } }, '×'))));
    refresh();
  };
  paint();
  return h('div', { class: 'editor' }, h('a', { class: 'back-link', href: '#s-menus' }, 'All set menus'),
    h('div', { class: 'edit-grid' },
      h('div', { class: 'stack big' },
        h('section', { class: 'panel stack' }, field('Menu name', input(m, 'name')), field('Occasion', input(m, 'occasion')), field('Description', area(m, 'description', 2))),
        h('section', { class: 'panel stack' }, h('h2', {}, 'Courses'), cBox, h('button', { class: 'btn ghost', onclick: () => { m.courses.push({ course: 'Main', recipeId: '' }); paint(); } }, 'Add course')),
        h('section', { class: 'panel stack' }, h('h2', {}, 'Staff, transport and other costs'), xBox, h('button', { class: 'btn ghost', onclick: () => { m.extras.push({ label: '', amount: '' }); paint(); } }, 'Add cost')),
        h('section', { class: 'panel stack' }, h('h2', {}, 'Shopping list'), prep)),
      h('aside', { class: 'side' },
        h('section', { class: 'panel stack' }, h('h2', {}, 'Quote'),
          h('div', { class: 'cols2' },
            field('Guests', input(m, 'guests', { type: 'number', min: 1, step: 1, inputmode: 'numeric' }, refresh)),
            field(`Price per guest, ${cur()}`, input(m, 'price', { type: 'number', step: 'any', min: 0, inputmode: 'decimal', placeholder: 'Suggested' }, refresh))),
          field('Target food cost %', input(m, 'targetFc', { type: 'number', step: 'any', min: 1, inputmode: 'decimal', placeholder: String(ctx().s.targetFc) }, refresh)), out),
        h('section', { class: 'panel stack' }, h('h2', {}, 'Portfolio'), toggle(m, 'published', 'Show this menu on the portfolio'), toggle(m, 'showPrice', 'Also show the price per guest'), toggle(m, 'sample', 'Show the Sample label'),
          h('button', { class: 'btn', onclick: () => guard(() => store.put('setmenu', clone(m)), 'Set menu saved') }, 'Save set menu'),
          h('button', { class: 'btn danger', onclick: async () => { if (await confirmBox(`Delete ${m.name}?`)) { await guard(() => store.del('setmenu', m.id), 'Set menu deleted'); go('s-menus'); } } }, 'Delete set menu')))));
}

/* ---------- Costing ---------- */
let sortBy = { key: 'fc', dir: -1 };
function costing() {
  const c = ctx(); const $ = (n) => money(n, c.s.currency);
  const rows = D().recipe.filter((r) => r.kind !== 'base').map((r) => ({ r, p: pricing(r, c) }));
  const box = h('div', {});
  const cols = [['name', 'Dish'], ['cost', 'Cost'], ['price', 'Price'], ['fc', 'Food cost'], ['gp', 'Gross profit'], ['suggested', 'Suggested']];
  const val = (x, k) => (k === 'name' ? short(x.r).toLowerCase() : x.p[k]);
  const paint = () => {
    const s = [...rows].sort((a, b) => { const x = val(a, sortBy.key); const y = val(b, sortBy.key); return (x > y ? 1 : x < y ? -1 : 0) * sortBy.dir; });
    box.replaceChildren(h('table', {},
      h('thead', {}, h('tr', {}, cols.map(([k, t]) => h('th', { 'aria-sort': sortBy.key === k ? (sortBy.dir > 0 ? 'ascending' : 'descending') : null }, h('button', { class: 'th', onclick: () => { sortBy = { key: k, dir: sortBy.key === k ? -sortBy.dir : 1 }; paint(); } }, t, sortBy.key === k ? (sortBy.dir > 0 ? ' ↑' : ' ↓') : ''))))),
      h('tbody', {}, s.map(({ r, p }) => h('tr', {},
        h('td', {}, h('a', { href: `#s-recipe-${r.id}` }, short(r))), h('td', { class: 'num' }, $(p.cost)),
        h('td', { class: 'num' }, p.price ? $(p.price) : 'Not set'),
        h('td', { class: 'num' }, p.price ? pill(pct(p.fc), p.over ? 'bad' : 'good') : ''),
        h('td', { class: 'num' }, p.price ? $(p.gp) : ''), h('td', { class: 'num' }, p.cost ? $(p.suggested) : ''))))));
  };
  paint();
  const priced = rows.filter((x) => x.p.price);
  const avg = priced.length ? priced.reduce((a, x) => a + x.p.fc, 0) / priced.length : 0;
  return h('div', {}, h('h1', {}, 'Costing'),
    h('div', { class: 'stats' }, [['Average food cost', pct(avg)], ['Target', `${c.s.targetFc}%`], ['Above target', priced.filter((x) => x.p.over).length], ['No price yet', rows.length - priced.length]].map(([a, b]) => h('div', {}, h('strong', {}, b), h('span', {}, a)))),
    h('div', { class: 'scroll panel flush' }, box),
    h('p', { class: 'muted' }, `Costs include the ${c.s.qFactor}% allowance for oil, seasoning and garnish. Menu prices ${c.s.pricesIncludeVat ? `include ${c.s.vatPct}% VAT, which is removed before food cost is worked out` : 'exclude VAT'}. Change these in Account.`));
}

/* ---------- Photos ---------- */
async function uploadPhotos(files, defaults) {
  const ids = [];
  const list = [...files];
  for (let i = 0; i < list.length; i += 1) {
    toast(`Uploading photo ${i + 1} of ${list.length}`);
    const id = await guard(async () => {
      const blob = await store.shrink(list[i]);
      const pid = await store.uploadImage(blob);
      await store.put('photo', { id: pid, caption: '', category: 'Dishes', published: true, date: Date.now(), ...defaults });
      return pid;
    });
    if (id) ids.push(id);
  }
  return ids;
}

function photos() {
  const grid = h('div', { class: 'photo-admin' });
  const paint = () => {
    const list = [...D().photo].reverse();
    grid.replaceChildren(...(list.length ? list.map((p) => h('button', { class: 'pa', onclick: () => edit(p) },
      h('img', { src: store.imgUrl(p.url || p.id), alt: p.caption || 'Photo', loading: 'lazy' }),
      h('small', {}, p.caption || 'No caption', p.published ? '' : ' (hidden)'))) : [h('p', { class: 'muted' }, 'No photos yet. Add your best plated dishes first.')]));
  };
  const edit = async (p) => {
    const o = clone(p);
    await modal('Photo details', (done) => h('form', {
      class: 'stack',
      onsubmit: async (e) => { e.preventDefault(); if (await guard(() => store.put('photo', o), 'Photo saved')) { done(); paint(); } },
    },
    field('Caption', input(o, 'caption')),
    field('Category', select(o, 'category', PHOTO_CATS)),
    toggle(o, 'published', 'Show in the gallery'), toggle(o, 'sample', 'Show the Sample label'),
    h('div', { class: 'row end' },
      h('button', {
        type: 'button', class: 'btn danger',
        onclick: async () => {
          if (await confirmBox('Delete this photo? It will also be removed from any dish that uses it.')) {
            await guard(async () => {
              if (!p.url) await store.deleteImage(p.id);
              await store.del('photo', p.id);
              const ref = p.url || p.id;
              for (const r of D().recipe.filter((x) => (x.photos || []).includes(ref))) { r.photos = r.photos.filter((i) => i !== ref); await store.put('recipe', r); }
            }, 'Photo deleted');
            done(); paint();
          }
        },
      }, 'Delete'),
      h('button', { class: 'btn' }, 'Save photo'))));
  };
  paint();
  return h('div', {},
    h('div', { class: 'head-row' }, h('h1', {}, 'Photos'),
      h('label', { class: 'btn' }, 'Add photos', h('input', { type: 'file', accept: 'image/*', multiple: true, class: 'hide', onchange: async (e) => { await uploadPhotos(e.target.files, {}); paint(); e.target.value = ''; } }))),
    h('p', { class: 'muted' }, 'Photos are resized automatically, so phone pictures are fine to upload.'),
    grid);
}

/* ---------- Profile ---------- */
function profileEditor() {
  const p = clone(D().profile[0] || { id: 'main' });
  ['experience', 'expertise', 'education', 'competencies', 'skills', 'attributes'].forEach((k) => { p[k] = p[k] || []; });
  const expBox = h('div', { class: 'stack' });
  const paint = () => {
    expBox.replaceChildren(...p.experience.map((e, i) => h('div', { class: 'trial' },
      h('div', { class: 'cols3' }, field('Role', input(e, 'role')), field('Where', input(e, 'place')), field('Years', input(e, 'period'))),
      field('What you did', area(e, 'detail', 2)),
      h('button', { type: 'button', class: 'link', onclick: () => { p.experience.splice(i, 1); paint(); } }, 'Remove this role'))));
  };
  paint();
  const lines = (key, label) => field(label, h('textarea', { rows: 6, oninput: (e) => { p[key] = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean); } }, p[key].join('\n')), 'One item per line');
  const preview = h('img', { src: p.portrait ? store.imgUrl(p.portrait) : (window.__PORTRAIT || '/assets/michael.jpg'), alt: 'Portrait', class: 'por' });
  return h('div', { class: 'stack big' }, h('div', { class: 'head-row' }, h('h1', {}, 'Profile'), h('button', { class: 'btn', onclick: () => guard(() => store.put('profile', clone(p)), 'Profile saved') }, 'Save profile')),
    h('section', { class: 'panel stack' }, h('div', { class: 'row' }, preview, h('label', { class: 'btn ghost' }, 'Change portrait', h('input', {
      type: 'file', accept: 'image/*', class: 'hide',
      onchange: async (e) => {
        const f = e.target.files[0]; if (!f) return;
        const id = await guard(async () => store.uploadImage(await store.shrink(f)));
        if (id) { p.portrait = id; preview.src = store.imgUrl(id); toast('Portrait ready. Save the profile to keep it.'); }
      },
    }))),
    h('div', { class: 'cols2' }, field('Name', input(p, 'name')), field('Title shown on the site', input(p, 'title'))),
    field('Short statement', area(p, 'tagline', 3)),
    h('div', { class: 'cols2' }, field('Phone', input(p, 'phone')), field('WhatsApp number', input(p, 'whatsapp'), 'Digits with country code')),
    h('div', { class: 'cols2' }, field('Email', input(p, 'email', { type: 'email' })), field('Based in', input(p, 'location'))),
    h('div', { class: 'cols2' }, field('Age, shown on the printed CV only', input(p, 'age')), field('Nationality, shown on the printed CV only', input(p, 'nationality')))),
    h('section', { class: 'panel stack' }, h('h2', {}, 'Experience'), expBox, h('button', { class: 'btn ghost', onclick: () => { p.experience.unshift({ role: '', place: '', period: '', detail: '' }); paint(); } }, 'Add a role')),
    h('section', { class: 'panel cols2' }, lines('competencies', 'Core competencies'), lines('skills', 'Key skills'), lines('attributes', 'Personal attributes'), lines('education', 'Education')));
}

/* ---------- Account ---------- */
function account() {
  const c = ctx();
  const s = { id: 'main', ...c.s };
  const pw = { current: '', next: '' };
  const samples = () => [...D().recipe.filter((r) => r.sample).map((x) => ['recipe', x.id]), ...D().ingredient.filter((r) => r.sample).map((x) => ['ingredient', x.id]), ...D().setmenu.filter((r) => r.sample).map((x) => ['setmenu', x.id]), ...D().photo.filter((r) => r.sample).map((x) => ['photo', x.id])];
  const nSamples = samples().length;
  return h('div', { class: 'stack big' }, h('h1', {}, 'Account'),
    h('section', { class: 'panel stack' }, h('h2', {}, 'Costing rules'),
      h('div', { class: 'cols3' },
        field('Currency', input(s, 'currency')),
        field('Target food cost %', input(s, 'targetFc', { type: 'number', step: 'any', min: 1 })),
        field('VAT %', input(s, 'vatPct', { type: 'number', step: 'any', min: 0 }))),
      h('div', { class: 'cols2' },
        field('Allowance % (oil, seasoning, garnish)', input(s, 'qFactor', { type: 'number', step: 'any', min: 0 })),
        field('Round suggested prices up to the nearest', input(s, 'rounding', { type: 'number', step: 'any', min: 0 }))),
      toggle(s, 'pricesIncludeVat', 'Menu prices include VAT'),
      h('button', { class: 'btn', onclick: () => guard(() => store.put('settings', s), 'Costing rules saved') }, 'Save costing rules')),
    nSamples ? h('section', { class: 'panel stack' }, h('h2', {}, 'Sample content'), h('p', {}, `${nSamples} sample items are here to show how the site works.`),
      h('button', {
        class: 'btn danger',
        onclick: async () => {
          if (await confirmBox(`Delete all ${nSamples} sample items? Your own work stays.`)) {
            await guard(async () => { for (const [k, id] of samples()) await store.del(k, id); }, 'Sample content deleted');
            renderStudio(document.getElementById('app'), 's-account');
          }
        },
      }, 'Delete sample content')) : null,
    store.isPreview ? h('section', { class: 'panel stack' }, h('h2', {}, 'Preview'), h('p', {}, 'Password and backup tools are available on the live site.'),
      h('button', { class: 'btn ghost', onclick: () => { store.resetPreview(); toast('Preview reset'); renderStudio(document.getElementById('app'), 's-account'); } }, 'Reset preview data'))
      : [h('section', { class: 'panel stack' }, h('h2', {}, 'Backup'), h('p', {}, 'Download everything, photos included, about once a month. Keep the file somewhere safe.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', onclick: async () => { const b = await guard(() => store.makeBackup((i, n) => { if (i % 10 === 1) toast(`Packing photo ${i} of ${n}`); })); if (b) { downloadJson(`chef-backup-${new Date().toISOString().slice(0, 10)}.json`, b); toast('Backup downloaded'); } } }, 'Download backup'),
          h('label', { class: 'btn ghost' }, 'Restore backup', h('input', {
            type: 'file', accept: '.json', class: 'hide',
            onchange: async (e) => {
              const f = e.target.files[0]; if (!f) return;
              if (await confirmBox('Restoring replaces everything on the site with this backup. Continue?', 'Restore')) {
                await guard(async () => store.restoreBackup(JSON.parse(await f.text()), (i, n) => { if (i % 10 === 1) toast(`Restoring photo ${i} of ${n}`); }), 'Backup restored');
                renderStudio(document.getElementById('app'), 'studio');
              }
              e.target.value = '';
            },
          })))),
      h('section', { class: 'panel stack' }, h('h2', {}, 'Password'),
        h('form', { class: 'stack', onsubmit: async (e) => { e.preventDefault(); if (await guard(() => store.changePassword(pw.current, pw.next), 'Password changed')) e.target.reset(); } },
          field('Current password', input(pw, 'current', { type: 'password', autocomplete: 'current-password', required: true })),
          field('New password', input(pw, 'next', { type: 'password', autocomplete: 'new-password', minlength: 8, required: true }, null)),
          h('button', { class: 'btn' }, 'Change password'))),
      h('button', { class: 'btn ghost', onclick: async () => { await store.logout(); authed = false; go('home'); } }, 'Log out')]);
}

/* ---------- Shell ---------- */
let leaveCheck = null;
let lastRoute = 'studio';


export async function renderStudio(root, route) {
  if (leaveCheck && route !== lastRoute) {
    const ok = await leaveCheck();
    if (ok === undefined || ok === false) { setHash(lastRoute); return; }
  }
  leaveCheck = null;
  lastRoute = route;
  document.title = 'Chef Studio';
  if (!authed) {
    let st;
    try { st = await store.status(); } catch (e) { clear(root).append(h('main', { class: 'gate' }, h('h1', {}, 'Chef Studio'), h('p', {}, e.message))); return; }
    if (!st.db) {
      clear(root).append(h('main', { class: 'gate' }, h('a', { class: 'back-link', href: '#home' }, 'Back to the portfolio'), h('h1', {}, 'One step left'),
        h('p', {}, 'The site is online, but its database is not connected. In Cloudflare, open this Pages project, add a D1 database binding named DB, then deploy again.')));
      return;
    }
    if (!st.authed) {
      const o = { username: '', password: '' };
      clear(root).append(gate('Chef Studio', 'Log in to manage recipes, costs and the portfolio.', [
        field('Username', input(o, 'username', { required: true, autocomplete: 'username', autocapitalize: 'none' })),
        field('Password', input(o, 'password', { type: 'password', required: true, autocomplete: 'current-password' })),
      ], 'Log in', () => store.login(o.username, o.password)));
      return;
    }
    authed = true;
  }
  try { await store.loadStudio(); }
  catch (e) { if (e.status === 401) { authed = false; return renderStudio(root, route); } clear(root).append(h('main', { class: 'gate' }, h('p', {}, e.message))); return; }

  const [, section, ...rest] = route.split('-');
  const id = rest.join('-');
  let page;
  if (route === 'studio') page = overview();
  else if (section === 'recipes') page = recipes();
  else if (section === 'recipe') page = recipeEditor(id);
  else if (section === 'lab') page = lab();
  else if (section === 'ingredients') page = ingredients();
  else if (section === 'menus') page = menusList();
  else if (section === 'menu') page = menuEditor(id);
  else if (section === 'costing') page = costing();
  else if (section === 'photos') page = photos();
  else if (section === 'profile') page = profileEditor();
  else if (section === 'account') page = account();
  else page = overview();

  const active = route === 'studio' ? 'studio' : section === 'recipe' ? 's-recipes' : section === 'menu' ? 's-menus' : `s-${section}`;
  clear(root).append(h('div', { class: 'layout' },
    h('aside', { class: 'app-side' }, profileBlock(D().profile[0] || {}, 'Chef Studio'),
      h('nav', { class: 'navlist', 'aria-label': 'Studio' }, NAV.map(([g, items]) => [h('div', { class: 'navlabel' }, g),
        items.map(([r, t, ic]) => h('a', { href: `#${r}`, class: r === active ? 'active' : '', 'aria-current': r === active ? 'page' : null }, icon(ic), t))])),
      h('a', { class: 'side-login', href: '#home' }, icon('home'), 'View portfolio')),
    h('div', { class: 'app-main' }, h('main', { class: 'smain' }, store.isPreview && h('p', { class: 'preview-note' }, 'Preview with sample content. Your changes stay in this browser.'), page))));
  window.scrollTo(0, 0);
}

