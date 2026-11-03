// The public portfolio: what employers and guests see.
import { h, plateArt, mark, money, pct, printNode } from './ui.js';
import { imgUrl, isPreview } from './store.js';
import { animatePage } from './motion.js';

const PORTRAIT = window.__PORTRAIT || '/assets/michael.jpg';
const portraitOf = (p) => (p.portrait ? imgUrl(p.portrait) : PORTRAIT);
const ordered = (list) => [...list].sort((a, b) => (b.favourite - a.favourite) || (b.order - a.order));
const cleanName = (n) => n.replace(/^Sample( idea)?:\s*/, '');
const sampleTag = (o) => (o.sample ? h('span', { class: 'sample' }, 'Sample') : null);

function cover(d, cls = 'cover') {
  return h('span', { class: cls }, d.photos?.[0]
    ? h('img', { src: imgUrl(d.photos[0]), alt: cleanName(d.name), loading: 'lazy' })
    : plateArt(d.id, `Drawing of a plate for ${cleanName(d.name)}`));
}

function dishCard(d) {
  return h('a', { class: 'card rcard', href: `#dish-${d.id}` },
    h('span', { class: 'rthumb' }, cover(d, 'rthumb-in'),
      d.favourite && h('span', { class: 'fav', title: 'Chef’s favourite' }, '♥'),
      h('span', { class: 'badge' }, `${mark(d.course)} ${d.course || 'Dish'}`),
      d.sample && h('span', { class: 'sample at' }, 'Sample')),
    h('span', { class: 'rbody' }, h('strong', {}, cleanName(d.name)),
      d.story && h('span', { class: 'rstory' }, d.story.length > 92 ? `${d.story.slice(0, 92).trim()}…` : d.story),
      h('span', { class: 'kv' }, d.cuisine && h('span', {}, d.cuisine), (d.dietary || []).slice(0, 2).map((x) => h('span', {}, x)))));
}

function dishGrid(dishes) {
  const courses = [...new Set(dishes.map((d) => d.course).filter(Boolean))];
  let filter = 'All';
  const grid = h('div', { class: 'grid r' });
  const bar = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter by course' });
  const paint = () => {
    grid.replaceChildren(...ordered(dishes).filter((d) => filter === 'All' || d.course === filter).map(dishCard));
    bar.replaceChildren(...['All', ...courses].map((c) => h('button', { class: c === filter ? 'on' : '', 'aria-pressed': String(c === filter), onclick: () => { filter = c; paint(); } }, c)));
  };
  paint();
  return h('div', {}, courses.length > 1 ? bar : null, grid);
}

const contactLinks = (p) => [
  p.phone && ['Phone', p.phone, `tel:${p.phone.replace(/[^+\d]/g, '')}`],
  p.whatsapp && ['WhatsApp', 'Send a message', `https://wa.me/${p.whatsapp.replace(/\D/g, '')}`],
  p.email && ['Email', p.email, `mailto:${p.email}`],
  p.location && ['Based in', p.location, null],
].filter(Boolean);

function dishOfTheDay(dishes) {
  const list = ordered(dishes).filter((d) => d.favourite);
  const from = list.length ? list : dishes;
  const day = Math.floor(Date.now() / 864e5);
  const d = from[day % from.length];
  return h('a', { class: 'feature', href: `#dish-${d.id}` }, h('span', { class: 'feature-pic' }, cover(d, 'feature-img')),
    h('span', { class: 'feature-text' }, h('span', { class: 'feature-tag' }, '✦ Dish of the day'), d.sample && h('span', { class: 'sample' }, 'Sample'),
      h('strong', {}, cleanName(d.name)), h('span', { class: 'rule' }), d.story && h('span', { class: 'rstory' }, d.story),
      h('span', { class: 'kv' }, d.course && h('span', {}, d.course), d.cuisine && h('span', {}, d.cuisine))));
}

function home(pub) {
  const { profile: p, dishes, setMenus, photos } = pub;
  const favs = ordered(dishes).filter((d) => d.favourite);
  return h('div', {},
    h('div', { class: 'welcome' },
      h('div', { class: 'welcome-banner' }, h('canvas', { class: 'spices', 'aria-hidden': 'true' }), h('div', { class: 'eyebrow' }, 'CHEF PORTFOLIO'), h('h2', {}, `Welcome to ${p.name.split(' ')[0]}’s kitchen`), h('p', {}, p.tagline)),
      h('div', { class: 'stats' }, [['Dishes', dishes.length, '#dishes'], ['Set menus', setMenus.length, '#menus'], ['Favourites', favs.length, '#favourites'], ['Photos', photos.length, '#gallery']]
        .map(([a, b, href]) => h('a', { class: 'stat', href }, h('b', {}, b), h('span', {}, a))))),
    dishes.length ? dishOfTheDay(dishes) : h('div', { class: 'empty' }, 'New dishes are being photographed. Please check back soon.'),
    favs.length ? h('section', {}, h('h2', { class: 'sub' }, 'Chef’s favourites'), h('div', { class: 'grid r' }, favs.slice(0, 4).map(dishCard))) : null,
    photos.length ? h('section', {}, h('h2', { class: 'sub' }, 'From the kitchen'), photoGrid(photos.slice(0, 6))) : null);
}

function favouritesPage(pub) {
  const favs = ordered(pub.dishes).filter((d) => d.favourite);
  return h('div', {}, head('Chef’s favourites', 'The dishes he is proudest to serve.'), favs.length ? h('div', { class: 'grid r' }, favs.map(dishCard)) : h('div', { class: 'empty' }, 'Favourites will appear here.'));
}

const head = (title, text) => h('div', { class: 'section-head' }, h('h1', {}, title), text && h('p', {}, text));

function dishesPage(pub) {
  return h('div', {}, head('Dishes', 'Open any dish to see its story and details.'),
    pub.dishes.length ? dishGrid(pub.dishes) : h('div', { class: 'empty' }, 'New dishes are being photographed. Please check back soon.'));
}

function scaler(d, list) {
  let guests = Number(d.servings) || 1;
  const base = Number(d.servings) || 1;
  const out = h('output', { for: 'pub-guests' }, guests);
  const fmt = (q) => { const n = (Number(q) * guests) / base; return n ? Math.round(n * 100) / 100 : ''; };
  const paint = () => {
    out.textContent = guests;
    list.replaceChildren(...d.lines.map((l) => h('li', {}, h('b', {}, `${fmt(l.qty)} ${l.unit || ''}`), ` ${l.name}`, l.prep ? `, ${l.prep}` : '')));
  };
  paint();
  return h('div', { class: 'stepper' }, h('span', {}, 'Guests'),
    h('button', { 'aria-label': 'Fewer guests', onclick: () => { guests = Math.max(1, guests - 1); paint(); } }, '−'), out,
    h('button', { 'aria-label': 'More guests', onclick: () => { guests += 1; paint(); } }, '+'));
}

function dishPage(pub, id) {
  const d = pub.dishes.find((x) => x.id === id);
  if (!d) return h('div', {}, h('p', { class: 'empty' }, 'This dish is not available.'), h('a', { class: 'more', href: '#dishes' }, 'See all dishes'));
  const lines = h('ul', { class: 'ings' });
  const facts = [
    d.cuisine && ['Style', d.cuisine],
    d.dietary?.length && ['Suitable for', d.dietary.join(', ')],
    d.allergens?.length && ['Contains', d.allergens.join(', ')],
    d.price && ['Menu price', money(d.price, pub.currency, 0)],
    d.fc && ['Food cost', pct(d.fc)],
  ].filter(Boolean);
  return h('div', { class: 'dish-page' },
    h('a', { class: 'back-link', href: '#dishes' }, 'All dishes'),
    h('div', { class: 'dish-top' },
      h('div', { class: 'dish-photos' }, cover(d, 'dish-hero'), d.photos?.length > 1 && h('div', { class: 'thumbs' }, d.photos.slice(1).map((id2) => h('img', { src: imgUrl(id2), alt: cleanName(d.name), loading: 'lazy' })))),
      h('div', { class: 'dish-head' },
        h('i', { class: 'label' }, `${mark(d.course)} ${d.course || 'Dish'}`), sampleTag(d),
        h('h1', {}, cleanName(d.name)),
        d.story && h('p', { class: 'lede' }, d.story),
        facts.length ? h('dl', { class: 'facts' }, facts.map(([a, b]) => h('div', {}, h('dt', {}, a), h('dd', {}, b)))) : null,
        d.plating && h('div', {}, h('h2', { class: 'small' }, 'On the plate'), h('p', {}, d.plating)))),
    d.lines?.length ? h('div', { class: 'recipe' },
      h('div', {}, h('h2', {}, 'Ingredients'), scaler(d, lines), lines),
      h('div', {}, h('h2', {}, 'Method'), h('ol', { class: 'steps' }, (d.method || []).map((s) => h('li', {}, s))))) : null);
}

function menusPage(pub) {
  return h('div', {}, head('Set menus', 'Courses planned for private dining and events.'),
    pub.setMenus.length ? h('div', { class: 'menus' }, pub.setMenus.map((m) => h('article', { class: 'menu' },
      sampleTag(m), h('h2', {}, m.name.replace(/^Sample:\s*/, '')), m.occasion && h('i', {}, m.occasion),
      h('ol', {}, m.courses.map((c) => h('li', {}, h('small', {}, c.course), c.dishId ? h('a', { href: `#dish-${c.dishId}` }, cleanName(c.name)) : cleanName(c.name), c.note && h('em', {}, c.note)))),
      m.description && h('p', {}, m.description),
      m.price && h('p', { class: 'price' }, `${money(m.price, pub.currency, 0)} per guest`))))
      : h('p', { class: 'empty' }, 'Set menus are prepared on request.'));
}

function lightbox(items, start) {
  let i = start;
  const img = h('div', { class: 'lb-img' });
  const cap = h('p', {});
  const close = () => { lb.remove(); document.removeEventListener('keydown', key); };
  const go = (n) => { i = (i + n + items.length) % items.length; paint(); };
  const key = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); };
  const paint = () => {
    const p = items[i];
    img.replaceChildren(h('img', { src: imgUrl(p.id), alt: p.caption || 'Photo' }));
    cap.textContent = p.caption || '';
  };
  const lb = h('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Photo viewer', onclick: (e) => { if (e.target === lb) close(); } },
    h('button', { class: 'x', 'aria-label': 'Close', onclick: close }, '×'), img, cap,
    items.length > 1 && h('div', { class: 'slide-nav' }, h('button', { 'aria-label': 'Previous photo', onclick: () => go(-1) }, '‹'), h('button', { 'aria-label': 'Next photo', onclick: () => go(1) }, '›')));
  paint();
  document.body.append(lb);
  document.addEventListener('keydown', key);
  lb.querySelector('.x').focus();
}

function photoGrid(photos) {
  return h('div', { class: 'photos' }, photos.map((p, i) => h('button', { 'aria-label': `Open ${p.caption || 'photo'}`, onclick: () => lightbox(photos, i) },
    h('img', { src: imgUrl(p.id), alt: p.caption || 'Photo', loading: 'lazy' }), p.sample && h('span', { class: 'sample' }, 'Sample'))));
}

function galleryPage(pub) {
  const cats = [...new Set(pub.photos.map((p) => p.category).filter(Boolean))];
  let f = 'All';
  const box = h('div', {});
  const bar = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter photos' });
  const paint = () => {
    box.replaceChildren(photoGrid(pub.photos.filter((p) => f === 'All' || p.category === f)));
    bar.replaceChildren(...['All', ...cats].map((c) => h('button', { class: c === f ? 'on' : '', 'aria-pressed': String(c === f), onclick: () => { f = c; paint(); } }, c)));
  };
  paint();
  return h('div', {}, head('Gallery'), pub.photos.length ? [cats.length > 1 ? bar : null, box] : h('p', { class: 'empty' }, 'Photos are on their way.'));
}

function cvNode(p) {
  return h('div', { class: 'cv' },
    h('header', {}, h('img', { src: portraitOf(p), alt: '' }), h('div', {}, h('h1', {}, p.name), h('p', { class: 'cv-role' }, p.title), h('p', {}, p.tagline),
      h('p', { class: 'cv-contact' }, [p.phone, p.email, p.location, p.age, p.nationality].filter(Boolean).join('   |   ')))),
    h('section', {}, h('h2', {}, 'Experience'), (p.experience || []).map((e) => h('div', { class: 'cv-job' }, h('div', {}, h('strong', {}, e.role), `, ${e.place}`, h('span', {}, e.period)), h('p', {}, e.detail)))),
    h('div', { class: 'cv-cols' },
      h('section', {}, h('h2', {}, 'Core competencies'), h('ul', {}, (p.competencies || []).map((c) => h('li', {}, c)))),
      h('section', {}, h('h2', {}, 'Key skills'), h('ul', {}, (p.skills || []).map((c) => h('li', {}, c)))),
      h('section', {}, h('h2', {}, 'Education'), h('ul', {}, (p.education || []).map((c) => h('li', {}, c))))));
}

function chefPage(pub) {
  const p = pub.profile;
  const list = (title, items) => (items?.length ? h('div', {}, h('h3', {}, title), h('ul', { class: 'plain' }, items.map((x) => h('li', {}, x)))) : null);
  return h('div', {},
    h('div', { class: 'chef-top' },
      h('div', { class: 'medal small' }, h('img', { src: portraitOf(p), alt: `Portrait of ${p.name}` })),
      h('div', {}, h('h1', { class: 'page' }, p.name), h('p', { class: 'hero-title' }, p.title), h('p', { class: 'lede' }, p.tagline),
        !isPreview && h('button', { class: 'btn ghost', onclick: () => printNode(cvNode(p)) }, 'Print or save CV as PDF'))),
    h('h2', {}, 'Career'),
    h('ol', { class: 'timeline' }, (p.experience || []).map((e) => h('li', {}, h('span', { class: 'when' }, e.period || 'Teaching'), h('div', {}, h('h3', {}, e.role), h('i', {}, e.place), h('p', {}, e.detail))))),
    (p.expertise || []).length ? h('div', { class: 'expertise' }, p.expertise.map((e) => h('div', {}, h('h3', {}, e.title), h('p', {}, e.text)))) : null,
    h('div', { class: 'lists' }, list('Core competencies', p.competencies), list('Key skills', p.skills), list('Personal attributes', p.attributes), list('Education', p.education)));
}

function contactPage(pub) {
  const p = pub.profile;
  return h('div', { class: 'contact' }, head('Contact'), h('p', { class: 'lede' }, `Available for exclusive chef and kitchen management roles. Write to ${p.name.split(' ')[0]} directly.`),
    h('dl', { class: 'facts big' }, contactLinks(p).map(([a, b, href]) => h('div', {}, h('dt', {}, a), h('dd', {}, href ? h('a', { href, target: href.startsWith('http') ? '_blank' : null, rel: 'noopener' }, b) : b)))));
}

const ICON = {
  home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
  dish: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  menu: '<path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4"/>',
  photo: '<path d="M3 6h18v13H3z"/><circle cx="9" cy="11" r="2"/><path d="M3 17l5-4 4 3 4-5 5 5"/>',
  chef: '<path d="M7 14a4 4 0 1 1 1.5-7.7A4.5 4.5 0 0 1 17 7a3.6 3.6 0 0 1-.5 7v5h-9.5z"/>',
  mail: '<path d="M3 6h18v12H3z"/><path d="M3 7l9 7 9-7"/>',
  lock: '<path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
  tools: '<path d="M6 3v8M4 3v5a2 2 0 0 0 4 0V3M6 11v10M17 3c-2 2-3 5-3 8h3v10"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  link: '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
};
export const icon = (name) => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = ICON[name] || ICON.dish;
  return h('span', { class: 'ic' }, s);
};
export const hatSvg = () => {
  const w = document.createElement('span');
  w.className = 'hat';
  w.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><path pathLength="1" d="M18 40a13 13 0 1 1 5-25 12 12 0 0 1 20 1 12 12 0 0 1 3 24v12H18z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path pathLength="1" d="M18 44h28M26 40v-9M38 40v-9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  return w;
};
export const profileBlock = (p, tag) => h('div', { class: 'profile' },
  h('img', { class: 'avatar', src: portraitOf(p), alt: `Portrait of ${p.name}` }),
  h('div', {}, h('h3', {}, p.name), h('p', {}, tag || p.title)));

function chrome(pub, route, content) {
  const name = route.split('-')[0];
  const active = name === 'dish' ? 'dishes' : (route === 'home' ? 'home' : name);
  const groups = [
    ['Explore', [['home', 'Home', 'home', 1], ['dishes', 'Dishes', 'dish', pub.dishes.length], ['favourites', 'Favourites', 'heart', pub.dishes.some((d) => d.favourite)], ['menus', 'Set menus', 'menu', pub.setMenus.length], ['gallery', 'Gallery', 'photo', pub.photos.length]]],
    ['The chef', [['chef', 'Career', 'chef', 1], ['contact', 'Contact', 'mail', 1]]],
  ];
  const link = ([r, t, ic]) => h('a', { href: `#${r}`, class: r === active ? 'active' : '', 'aria-current': r === active ? 'page' : null }, icon(ic), t);
  const p = pub.profile;
  return [h('div', { class: 'layout' },
    h('aside', { class: 'app-side' }, profileBlock(p),
      h('nav', { class: 'navlist', 'aria-label': 'Main' }, groups.map(([g, items]) => [h('div', { class: 'navlabel' }, g), items.filter((i) => i[3]).map(link)])),
      h('div', { class: 'quote' }),
      h('a', { class: 'side-login', href: '#studio' }, icon('lock'), 'Chef login')),
    h('div', { class: 'app-main' },
      h('header', { class: 'mast' }, h('canvas', { class: 'spices', 'aria-hidden': 'true' }), h('span', { class: 'sheen', 'aria-hidden': 'true' }),
        h('div', { class: 'mast-text' }, h('div', { class: 'eyebrow' }, 'EXCLUSIVE CHEF  ·  RESTAURANT MANAGER'),
          h('div', { class: 'wordline' }, h('span', { class: 'wordmark' }, 'Chef Michael'), hatSvg()),
          h('p', {}, p.name)),
        h('div', { class: 'mast-tools' }, h('a', { class: 'pill', href: '#contact' }, 'Contact'),
          !isPreview && h('a', { class: 'pill', href: '#chef' }, 'View CV'))),
      h('main', { class: 'content enter' }, content),
      h('footer', { class: 'foot' }, `${p.name}  ·  ${p.title}`)))];
}

export function renderSite(root, pub, route) {
  const [name, ...rest] = route.split('-');
  let page;
  if (name === 'dish') page = dishPage(pub, rest.join('-'));
  else if (name === 'dishes') page = dishesPage(pub);
  else if (name === 'favourites') page = favouritesPage(pub);
  else if (name === 'menus') page = menusPage(pub);
  else if (name === 'gallery') page = galleryPage(pub);
  else if (name === 'chef') page = chefPage(pub);
  else if (name === 'contact') page = contactPage(pub);
  else page = home(pub);
  root.replaceChildren(...chrome(pub, route, page));
  animatePage(root);
  document.title = name === 'dish' ? `${cleanName(pub.dishes.find((d) => d.id === rest.join('-'))?.name || 'Dish')} | ${pub.profile.name}` : `${pub.profile.name} | Exclusive Chef`;
  window.scrollTo(0, 0);
}
export { cleanName };
