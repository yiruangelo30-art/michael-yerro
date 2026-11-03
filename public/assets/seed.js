// First contents of the site. The profile comes from Michael's CV.
// Everything marked sample is placeholder content. Replace it with Michael's real dishes and photos.
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
  P('i-salmon', 'Salmon fillet, skin on', 'Seafood', 95, 1, 'kg', 88, 'Sample fish market', ['Fish']),
  P('i-whitefish', 'White fish fillet', 'Seafood', 70, 1, 'kg', 90, 'Sample fish market', ['Fish']),
  P('i-prawn', 'Prawns, whole', 'Seafood', 85, 1, 'kg', 55, 'Sample fish market', ['Shellfish']),
  P('i-beef', 'Beef tenderloin', 'Meat', 140, 1, 'kg', 80, 'Sample butcher'),
  P('i-ribeye', 'Beef ribeye', 'Meat', 120, 1, 'kg', 85, 'Sample butcher'),
  P('i-butter', 'Unsalted butter', 'Dairy', 32, 1, 'kg', 100, 'Sample dairy', ['Dairy']),
  P('i-cream', 'Cream, 35%', 'Dairy', 24, 1, 'l', 100, 'Sample dairy', ['Dairy']),
  P('i-milk', 'Whole milk', 'Dairy', 7, 1, 'l', 100, 'Sample dairy', ['Dairy']),
  P('i-feta', 'Feta cheese', 'Dairy', 42, 1, 'kg', 100, 'Sample dairy', ['Dairy']),
  P('i-parmesan', 'Parmesan', 'Dairy', 95, 1, 'kg', 95, 'Sample dairy', ['Dairy']),
  P('i-egg', 'Eggs', 'Dairy', 22, 30, 'pc', 100, 'Sample dairy', ['Egg']),
  P('i-coconut', 'Coconut milk', 'Dry store', 16, 1, 'l', 100, 'Sample grocer'),
  P('i-sugar', 'Caster sugar', 'Dry store', 5, 1, 'kg', 100, 'Sample grocer'),
  P('i-flour', 'Plain flour', 'Dry store', 4, 1, 'kg', 100, 'Sample grocer', ['Gluten']),
  P('i-rice', 'Basmati rice', 'Dry store', 12, 1, 'kg', 100, 'Sample grocer'),
  P('i-oil', 'Olive oil', 'Dry store', 38, 1, 'l', 100, 'Sample grocer'),
  P('i-gelatin', 'Halal gelatin', 'Dry store', 180, 1, 'kg', 100, 'Sample grocer'),
  P('i-vanilla', 'Vanilla bean paste', 'Dry store', 900, 1, 'kg', 100, 'Sample grocer'),
  P('i-bread', 'Sourdough bread', 'Bakery', 18, 1, 'kg', 85, 'Sample bakery', ['Gluten']),
  P('i-saffron', 'Saffron', 'Spices', 18, 1, 'g', 100, 'Sample spice trader'),
  P('i-spice', 'Spice blend', 'Spices', 80, 1, 'kg', 100, 'Sample spice trader'),
  P('i-pumpkin', 'Pumpkin', 'Produce', 7, 1, 'kg', 70, 'Sample grocer'),
  P('i-potato', 'Potatoes', 'Produce', 5, 1, 'kg', 85, 'Sample grocer'),
  P('i-greens', 'Mixed salad greens', 'Produce', 28, 1, 'kg', 85, 'Sample grocer'),
  P('i-romaine', 'Romaine lettuce', 'Produce', 16, 1, 'kg', 75, 'Sample grocer'),
  P('i-berries', 'Strawberries', 'Produce', 38, 1, 'kg', 85, 'Sample grocer'),
  P('i-raspberry', 'Raspberries', 'Produce', 95, 1, 'kg', 95, 'Sample grocer'),
  P('i-lemon', 'Lemons', 'Produce', 9, 1, 'kg', 40, 'Sample grocer'),
  P('i-shallot', 'Shallots', 'Produce', 12, 1, 'kg', 85, 'Sample grocer'),
  P('i-herbs', 'Fresh herbs', 'Produce', 60, 1, 'kg', 80, 'Sample grocer'),
  P('i-stock', 'Beef stock', 'Stocks', 14, 1, 'l', 100, 'Made in-house'),
  P('i-fishstock', 'Fish stock', 'Stocks', 12, 1, 'l', 100, 'Made in-house', ['Fish']),
];

const IMG = (n) => `/assets/samples/${n}.jpg`;
const now = Date.UTC(2026, 10, 3);
const R = (o) => ({
  kind: 'dish', status: 'final', course: '', cuisine: '', tags: [], servings: 4, lines: [], method: [], story: '', plating: '',
  allergens: [], dietary: ['Halal'], price: 0, targetFc: 0, photos: [], favourite: false, signature: false, published: true,
  showRecipe: false, showCost: false, sample: true, trials: [], created: now, updated: now, ...o,
});

const RECIPES = [
  R({ id: 'b-saffron', kind: 'base', name: 'Saffron citrus butter sauce', yieldQty: 500, yieldUnit: 'ml', course: 'Sauce', published: false,
    lines: [L('i-shallot', 80, 'g', 'finely diced'), L('i-lemon', 200, 'g', 'juiced'), L('i-cream', 100, 'ml'), L('i-butter', 300, 'g', 'cold, cubed'), L('i-saffron', 0.3, 'g', 'bloomed')],
    method: ['Sweat the shallots, add lemon juice and reduce by two-thirds.', 'Add cream and saffron, simmer for two minutes.', 'Whisk in cold butter off the heat. Hold warm.'] }),
  R({ id: 'b-jus', kind: 'base', name: 'Beef jus', yieldQty: 500, yieldUnit: 'ml', course: 'Sauce', published: false,
    lines: [L('i-stock', 1.5, 'l'), L('i-shallot', 100, 'g', 'sliced'), L('i-butter', 40, 'g')],
    method: ['Sweat the shallots, add the stock and reduce to 500 ml.', 'Strain and finish with butter.'] }),
  R({ id: 'r-soup', sold: 64, name: 'Roasted pumpkin velouté', course: 'Soup', cuisine: 'Modern European', servings: 6, price: 38, dietary: ['Halal', 'Vegetarian', 'Gluten-free'], photos: [IMG('soup')],
    story: 'Slow-roasted pumpkin blended with cream, finished with toasted seeds and a little feta.',
    lines: [L('i-pumpkin', 1.2, 'kg', 'roasted'), L('i-cream', 200, 'ml'), L('i-shallot', 100, 'g'), L('i-butter', 40, 'g'), L('i-feta', 60, 'g', 'crumbled')],
    method: ['Roast the pumpkin until caramelised.', 'Sweat the shallots in butter, add the pumpkin and cover with water.', 'Blend with cream until silky. Season.', 'Finish with feta.'] }),
  R({ id: 'r-salad', sold: 88, name: 'Garden greens, feta and berries', course: 'Salad', cuisine: 'Mediterranean', servings: 4, price: 42, dietary: ['Halal', 'Vegetarian', 'Gluten-free'], photos: [IMG('salad')],
    story: 'Crisp leaves with feta, fresh berries and a light citrus dressing.',
    lines: [L('i-greens', 320, 'g'), L('i-feta', 120, 'g'), L('i-berries', 160, 'g'), L('i-oil', 50, 'ml'), L('i-lemon', 60, 'g', 'juiced')],
    method: ['Whisk the oil and lemon juice.', 'Dress the leaves lightly.', 'Top with feta and berries.'] }),
  R({ id: 'r-caesar', sold: 120, name: 'Romaine Caesar with sourdough croutons', course: 'Salad', cuisine: 'Classic', servings: 4, price: 40, photos: [IMG('caesar')],
    story: 'A classic dressing made to order, with crisp romaine and house croutons.',
    lines: [L('i-romaine', 480, 'g'), L('i-parmesan', 60, 'g', 'shaved'), L('i-bread', 120, 'g', 'toasted'), L('i-egg', 1, 'pc', 'yolk'), L('i-oil', 80, 'ml'), L('i-lemon', 40, 'g', 'juiced')],
    method: ['Toast the croutons.', 'Whisk the yolk, lemon and oil into a dressing.', 'Toss the leaves, top with parmesan and croutons.'] }),
  R({ id: 'r-salmon', sold: 142, name: 'Seared salmon with citrus greens', course: 'Main', cuisine: 'Modern Mediterranean', servings: 4, price: 118, favourite: true, signature: true, showRecipe: true, photos: [IMG('salmon')],
    story: 'Crisp-skinned salmon over citrus-dressed greens with a saffron butter sauce.',
    plating: 'Greens first, salmon skin-side up, sauce at the table.',
    lines: [L('i-salmon', 720, 'g', 'portioned'), L('b-saffron', 200, 'ml', '', 'recipe'), L('i-greens', 200, 'g'), L('i-oil', 40, 'ml')],
    method: ['Season the salmon and sear skin-side down until crisp.', 'Dress the greens with oil.', 'Plate and finish with warm sauce.'],
    trials: [
      { id: 't1', date: '2026-10-12', change: 'First test with a classic reduction', result: 'Sauce too sharp', score: 3 },
      { id: 't2', date: '2026-10-19', change: 'Reduced lemon, added cream to stabilise', result: 'Balanced, holds through service', score: 5 },
    ] }),
  R({ id: 'r-broth', sold: 46, name: 'Salmon in saffron broth with herb relish', course: 'Main', cuisine: 'Contemporary', servings: 4, price: 112, photos: [IMG('salmon-broth')],
    story: 'Gently cooked salmon in a light saffron fish broth, topped with a bright herb relish.',
    lines: [L('i-salmon', 680, 'g'), L('i-fishstock', 600, 'ml'), L('i-saffron', 0.2, 'g'), L('i-herbs', 40, 'g', 'chopped'), L('i-lemon', 40, 'g', 'juiced')],
    method: ['Warm the stock with saffron.', 'Poach the salmon until just set.', 'Spoon over the broth and relish.'] }),
  R({ id: 'r-curry', sold: 38, name: 'Baked fish in coconut saffron curry', course: 'Main', cuisine: 'Coastal', servings: 4, price: 92, favourite: true, dietary: ['Halal', 'Gluten-free'], photos: [IMG('fish-curry')],
    story: 'White fish baked in a golden coconut curry with lemon and fresh herbs.',
    lines: [L('i-whitefish', 720, 'g'), L('i-coconut', 400, 'ml'), L('i-spice', 12, 'g'), L('i-saffron', 0.2, 'g'), L('i-shallot', 100, 'g'), L('i-herbs', 20, 'g')],
    method: ['Cook the shallots with the spices.', 'Add coconut milk and saffron, simmer.', 'Bake the fish in the curry until just cooked.'] }),
  R({ id: 'r-prawn', sold: 74, name: 'Prawns and rice in spiced broth', course: 'Main', cuisine: 'Coastal', servings: 4, price: 98, dietary: ['Halal', 'Gluten-free'], photos: [IMG('prawn-bowl')],
    story: 'Sweet prawns over fragrant basmati in a warmly spiced broth.',
    lines: [L('i-prawn', 480, 'g', 'peeled'), L('i-rice', 280, 'g'), L('i-fishstock', 800, 'ml'), L('i-spice', 12, 'g'), L('i-herbs', 15, 'g')],
    method: ['Steam the rice.', 'Simmer the stock with the spices.', 'Poach the prawns in the broth and serve over rice.'] }),
  R({ id: 'r-beef', sold: 96, name: 'Sliced beef tenderloin with jus', course: 'Main', cuisine: 'Modern European', servings: 4, price: 165, favourite: true, signature: true, showCost: true, dietary: ['Halal', 'Gluten-free'], photos: [IMG('beef')],
    story: 'Beef tenderloin cooked to medium-rare, rested and sliced, served with a rich jus.',
    lines: [L('i-beef', 720, 'g', 'trimmed'), L('b-jus', 200, 'ml', '', 'recipe'), L('i-potato', 500, 'g'), L('i-butter', 60, 'g')],
    method: ['Sear the beef and roast to medium-rare.', 'Rest for ten minutes and slice.', 'Serve with potatoes and warm jus.'] }),
  R({ id: 'r-steak', sold: 58, name: 'Ribeye with hand-cut fries', course: 'Main', cuisine: 'Grill', servings: 4, price: 148, dietary: ['Halal', 'Gluten-free'], photos: [IMG('steak-fries')],
    story: 'A well-marbled ribeye grilled over high heat, with fries and fresh herbs.',
    lines: [L('i-ribeye', 880, 'g'), L('i-potato', 800, 'g', 'cut into fries'), L('i-oil', 60, 'ml'), L('i-herbs', 15, 'g')],
    method: ['Blanch and fry the potatoes.', 'Grill the ribeye and rest.', 'Slice and serve with the fries.'] }),
  R({ id: 'r-panna', sold: 110, name: 'Vanilla panna cotta with strawberries', course: 'Dessert', cuisine: 'Italian', servings: 6, price: 36, favourite: true, dietary: ['Halal', 'Gluten-free'], photos: [IMG('panna-cotta')],
    story: 'Silky vanilla cream set with halal gelatin, topped with fresh strawberries.',
    lines: [L('i-cream', 450, 'ml'), L('i-milk', 150, 'ml'), L('i-sugar', 80, 'g'), L('i-gelatin', 8, 'g'), L('i-vanilla', 5, 'g'), L('i-berries', 240, 'g')],
    method: ['Warm the cream, milk, sugar and vanilla.', 'Dissolve the gelatin and pour into glasses.', 'Chill for four hours and top with strawberries.'] }),
  R({ id: 'r-cake', sold: 41, name: 'Raspberry cream layer cake', course: 'Dessert', cuisine: 'Patisserie', servings: 8, price: 42, dietary: ['Halal', 'Vegetarian'], photos: [IMG('cake')],
    story: 'Light sponge layered with vanilla cream and fresh raspberries.',
    lines: [L('i-flour', 200, 'g'), L('i-egg', 6, 'pc'), L('i-sugar', 220, 'g'), L('i-cream', 500, 'ml'), L('i-raspberry', 300, 'g'), L('i-vanilla', 5, 'g')],
    method: ['Bake the sponge and cool.', 'Whip the cream with vanilla.', 'Layer with raspberries and chill.'] }),
  R({ id: 'r-ice', sold: 30, name: 'Vanilla ice cream, caramel and tuile', course: 'Dessert', cuisine: 'Contemporary', servings: 6, price: 34, dietary: ['Halal', 'Vegetarian'], photos: [IMG('ice-cream')],
    story: 'House vanilla ice cream with warm caramel and a crisp tuile.',
    lines: [L('i-cream', 400, 'ml'), L('i-milk', 300, 'ml'), L('i-egg', 5, 'pc', 'yolks'), L('i-sugar', 220, 'g'), L('i-vanilla', 6, 'g'), L('i-flour', 40, 'g'), L('i-butter', 40, 'g')],
    method: ['Make a custard and churn.', 'Cook the sugar to a caramel and loosen with cream.', 'Bake thin tuiles and serve together.'] }),
  R({ id: 'r-idea', name: 'Smoked date tart', course: 'Dessert', status: 'idea', servings: 8, published: false, story: 'An idea to test next.' }),
];

const SETMENUS = [{
  id: 'm-dinner', name: 'Private dinner', occasion: 'Three courses at home', description: 'A relaxed dinner for family and guests.',
  guests: 8, price: 0, targetFc: 0, published: true, showPrice: false, sample: true,
  courses: [{ course: 'Soup', recipeId: 'r-soup', note: '' }, { course: 'Main', recipeId: 'r-salmon', note: '' }, { course: 'Dessert', recipeId: 'r-panna', note: '' }],
  extras: [{ label: 'Service staff', amount: 600 }, { label: 'Transport', amount: 150 }],
}, {
  id: 'm-tasting', name: 'Celebration menu', occasion: 'Four courses for a special occasion', description: 'Plated service for a small celebration.',
  guests: 12, price: 0, targetFc: 0, published: true, showPrice: false, sample: true,
  courses: [{ course: 'Salad', recipeId: 'r-salad', note: '' }, { course: 'Main', recipeId: 'r-prawn', note: '' }, { course: 'Main', recipeId: 'r-beef', note: '' }, { course: 'Dessert', recipeId: 'r-cake', note: '' }],
  extras: [{ label: 'Service staff', amount: 1200 }, { label: 'Equipment and transport', amount: 400 }],
}];

const PH = (id, name, caption, category) => ({ id, url: IMG(name), caption, category, published: true, sample: true });
const PHOTOS = [
  PH('p-salmon', 'salmon', 'Seared salmon', 'Dishes'), PH('p-beef', 'beef', 'Beef tenderloin', 'Dishes'), PH('p-chop', 'chopping', 'Knife work', 'Kitchen'),
  PH('p-room', 'dining-room', 'Dinner service', 'Events'), PH('p-curry', 'fish-curry', 'Coconut saffron curry', 'Dishes'), PH('p-panna', 'panna-cotta', 'Panna cotta', 'Dishes'),
  PH('p-rest', 'restaurant', 'Dining room', 'Events'), PH('p-thai', 'thai-beef', 'Shared plates', 'Events'), PH('p-cake', 'cake', 'Raspberry cake', 'Dishes'),
];

export const SEED_VERSION = 2;
export const SEED = { profile: [PROFILE], settings: [{ id: 'main' }], ingredient: INGREDIENTS, recipe: RECIPES, setmenu: SETMENUS, photo: PHOTOS };
export const liveSeed = () => structuredClone(SEED);
export const previewSeed = () => structuredClone(SEED);
