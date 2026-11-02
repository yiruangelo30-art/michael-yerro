// First contents of the site. The profile comes from Michael's CV.
// Everything marked sample is there to show how costing works. Delete it before going public.
const P = (id, name, category, price, packQty, packUnit, yieldPct, supplier, allergens = []) =>
  ({ id, name, category, price, packQty, packUnit, yieldPct, supplier, allergens, sample: true });
const L = (refId, qty, unit, prep = '', type = 'ing') => ({ type, refId, qty, unit, prep });

export const PROFILE = {
  id: 'main',
  name: 'Michael Angelo Yerro',
  title: 'Exclusive Chef & Restaurant Manager',
  cvTitle: 'Executive Chef',
  tagline: 'A dedicated and creative leader expert in menu development, kitchen operations, and delivering exceptional dining experiences in high-pressure environments.',
  phone: '+966 56 021 0329',
  whatsapp: '966560210329',
  email: 'Yiruangelo@gmail.com',
  location: 'Philippines and Saudi Arabia',
  age: '32 years old',
  nationality: 'Filipino',
  portrait: '',
  experience: [
    { role: 'Executive Chef', place: 'Daily Edition Cafe', period: '2025 – Present', detail: 'Overseeing all kitchen operations, menu development, team leadership, and ensuring the highest standards of food quality and guest satisfaction.' },
    { role: 'Chef de Partie', place: 'Daily Edition Cafe', period: '2022 – 2025', detail: 'Managed assigned kitchen station, ensured food quality and consistency, and supported kitchen operations.' },
    { role: 'Commi Chef / Demi Chef', place: 'Baco Restaurant', period: '2019 – 2022', detail: 'Supported daily kitchen operations in high-end restaurants, maintaining quality standards and assisting in station management and menu execution.' },
    { role: 'TESDA Instructor', place: 'Cookery and Bread and Pastry', period: '', detail: 'Delivered technical training in cookery, bread, and pastry programs, focusing on practical skills and industry standards.' },
    { role: 'College Instructor in Culinary', place: 'Pilgrim Christian College', period: '', detail: 'Taught culinary arts subjects and mentored students in both practical and theoretical aspects of food preparation and kitchen management.' },
  ],
  education: ['Degree in Culinary Arts (2015–2017)', 'Bachelor of Elementary Education (2011–2015)'],
  competencies: ['Menu Innovation & Development', 'Kitchen Operations Management', 'Food Cost Control & Budgeting', 'Team Leadership & Staff Development', 'High-Pressure Problem Solving', 'Quality Control & Food Safety', 'Culinary Training & Mentoring', 'Exceptional Customer Experience'],
  skills: ['Menu Development & Costing', 'Kitchen Operations Management', 'Food Cost Control & Inventory', 'Staff Training & Development', 'Culinary Techniques & Presentation', 'Quality Assurance & Food Safety', 'Event & Banquet Operations', 'Leadership & Team Management'],
  attributes: ['Creative and detail-oriented', 'Calm under pressure', 'Strong leadership and communication', 'Passionate about culinary excellence', 'Committed to continuous improvement'],
  expertise: [
    { title: 'Menu & operational innovation', text: 'Expertise in Menu Innovation and Operational Excellence to drive restaurant success.' },
    { title: 'Management & leadership', text: 'Specialized in Food Cost Control, Kitchen Management, and Strategic Crisis Management.' },
    { title: 'Leadership', text: 'Proven track record in Staff Mentoring & Development.' },
  ],
};

const INGREDIENTS = [
  P('i-bream', 'Sea bream, whole', 'Seafood', 58, 1, 'kg', 45, 'Sample fish market', ['Fish']),
  P('i-lamb', 'Lamb shoulder, bone-in', 'Meat', 62, 1, 'kg', 60, 'Sample butcher'),
  P('i-butter', 'Unsalted butter', 'Dairy', 32, 1, 'kg', 100, 'Sample dairy', ['Dairy']),
  P('i-cream', 'Cream, 35%', 'Dairy', 24, 1, 'l', 100, 'Sample dairy', ['Dairy']),
  P('i-yolk', 'Eggs', 'Dairy', 22, 30, 'pc', 100, 'Sample dairy', ['Egg']),
  P('i-sugar', 'Caster sugar', 'Dry store', 5, 1, 'kg', 100, 'Sample grocer'),
  P('i-saffron', 'Saffron', 'Spices', 18, 1, 'g', 100, 'Sample spice trader'),
  P('i-cardamom', 'Green cardamom, ground', 'Spices', 90, 1, 'kg', 100, 'Sample spice trader'),
  P('i-shallot', 'Shallots', 'Produce', 12, 1, 'kg', 85, 'Sample grocer'),
  P('i-lemon', 'Lemons', 'Produce', 9, 1, 'kg', 40, 'Sample grocer'),
  P('i-dates', 'Medjool dates', 'Dry store', 45, 1, 'kg', 85, 'Sample grocer'),
  P('i-stock', 'Lamb stock', 'Stocks', 14, 1, 'l', 100, 'Made in-house'),
  P('i-potato', 'Baby potatoes', 'Produce', 8, 1, 'kg', 90, 'Sample grocer'),
  P('i-oil', 'Olive oil', 'Dry store', 38, 1, 'l', 100, 'Sample grocer'),
  P('i-fennel', 'Fennel bulbs', 'Produce', 16, 1, 'kg', 70, 'Sample grocer'),
];

const now = Date.UTC(2026, 10, 2);
const R = (o) => ({
  kind: 'dish', status: 'final', course: '', cuisine: '', tags: [], servings: 4, lines: [], method: [], story: '', plating: '',
  allergens: [], dietary: [], price: 0, targetFc: 0, photos: [], favourite: false, signature: false, published: false,
  showRecipe: false, showCost: false, sample: true, trials: [], created: now, updated: now, ...o,
});

const RECIPES = [
  R({ id: 'b-saffron', kind: 'base', name: 'Sample: Saffron citrus butter sauce', yieldQty: 500, yieldUnit: 'ml', course: 'Sauce',
    lines: [L('i-shallot', 80, 'g', 'finely diced'), L('i-lemon', 200, 'g', 'juiced'), L('i-cream', 100, 'ml'), L('i-butter', 300, 'g', 'cold, cubed'), L('i-saffron', 0.3, 'g', 'bloomed')],
    method: ['Sweat the shallots, add lemon juice and reduce by two-thirds.', 'Add cream and saffron, simmer for two minutes.', 'Whisk in cold butter off the heat. Hold warm.'] }),
  R({ id: 'b-datejus', kind: 'base', name: 'Sample: Date and cardamom jus', yieldQty: 600, yieldUnit: 'ml', course: 'Sauce',
    lines: [L('i-stock', 1.5, 'l'), L('i-dates', 120, 'g', 'pitted'), L('i-cardamom', 2, 'g')],
    method: ['Reduce the stock with dates and cardamom to 600 ml.', 'Strain and season.'] }),
  R({ id: 'r-bream', name: 'Sample: Seared sea bream with saffron citrus butter', course: 'Main', cuisine: 'Modern Mediterranean', servings: 4, price: 98, favourite: true, signature: true,
    published: true, showRecipe: true, tags: ['Fish', 'Private dining'], dietary: ['Halal'],
    story: 'Sample text. Tell the story of the dish here: where the idea came from, what you changed, and why guests remember it.',
    plating: 'Sample text. Sauce first, fennel on the left, fish skin-side up.',
    lines: [L('i-bream', 720, 'g', 'fillet, skin on'), L('b-saffron', 200, 'ml', '', 'recipe'), L('i-fennel', 300, 'g', 'shaved'), L('i-potato', 400, 'g', 'crushed'), L('i-oil', 40, 'ml')],
    method: ['Crush and season the potatoes.', 'Shave the fennel and dress with oil.', 'Sear the bream skin-side down until crisp.', 'Plate with the warm sauce.'],
    trials: [
      { id: 't1', date: '2026-10-12', change: 'First test with a classic reduction', result: 'Sauce too sharp', score: 3 },
      { id: 't2', date: '2026-10-19', change: 'Reduced lemon, added cream to stabilise', result: 'Balanced, holds through service', score: 5 },
    ] }),
  R({ id: 'r-lamb', name: 'Sample: Slow-braised lamb with date and cardamom jus', course: 'Main', cuisine: 'Arabic contemporary', servings: 6, price: 95, favourite: true, signature: true,
    published: true, showCost: true, tags: ['Lamb', 'Banquet'], dietary: ['Halal', 'Gluten-free'],
    story: 'Sample text. Replace this with your own dish, photo and story.',
    lines: [L('i-lamb', 1.2, 'kg', 'trimmed'), L('b-datejus', 300, 'ml', '', 'recipe'), L('i-potato', 600, 'g'), L('i-oil', 30, 'ml')],
    method: ['Brown the lamb and braise at 150 °C for four hours.', 'Rest, portion and glaze with the jus.'] }),
  R({ id: 'r-brulee', name: 'Sample: Cardamom crème brûlée', course: 'Dessert', cuisine: 'French technique', servings: 6, price: 28, favourite: true,
    published: true, tags: ['Dessert'], dietary: ['Halal', 'Vegetarian', 'Gluten-free'],
    story: 'Sample text. Replace this with your own dish, photo and story.',
    lines: [L('i-cream', 600, 'ml'), L('i-yolk', 6, 'pc', 'yolks only'), L('i-sugar', 120, 'g'), L('i-cardamom', 2, 'g')],
    method: ['Infuse the cream with cardamom.', 'Whisk yolks with sugar, temper with the cream.', 'Bake in a water bath at 110 °C until just set.', 'Chill and caramelise to order.'] }),
  R({ id: 'r-idea', name: 'Sample idea: Smoked date tart', course: 'Dessert', status: 'idea', servings: 8, published: false,
    story: 'Sample text. Keep unfinished ideas here until they are ready.' }),
];

const SETMENUS = [{
  id: 'm-dinner', name: 'Sample: Private dinner', occasion: 'Three courses at home', description: 'Sample set menu. Replace it with one you have served.',
  guests: 8, price: 0, targetFc: 0, published: true, showPrice: false, sample: true,
  courses: [{ course: 'Main', recipeId: 'r-bream', note: '' }, { course: 'Main', recipeId: 'r-lamb', note: '' }, { course: 'Dessert', recipeId: 'r-brulee', note: '' }],
  extras: [{ label: 'Service staff', amount: 600 }, { label: 'Transport', amount: 150 }],
}];

export const SEED = { profile: [PROFILE], settings: [{ id: 'main' }], ingredient: INGREDIENTS, recipe: RECIPES, setmenu: SETMENUS, photo: [] };

/** On the live site samples start hidden, so only real work reaches employers. */
export function liveSeed() {
  const s = structuredClone(SEED);
  s.recipe.forEach((r) => { r.published = false; });
  s.setmenu.forEach((m) => { m.published = false; });
  return s;
}

/** The preview adds drawn placeholders so the gallery has something to show. */
export function previewSeed() {
  const s = structuredClone(SEED);
  s.photo = ['Dishes', 'Dishes', 'Events', 'Dishes', 'Kitchen', 'Events'].map((category, n) => ({
    id: `art-${n}`, caption: `Sample photo ${n + 1}`, category, published: true, art: true, sample: true,
  }));
  return s;
}
