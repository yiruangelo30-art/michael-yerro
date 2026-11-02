// The public portfolio: what employers and guests see.
import { h, plateArt, mark, money, pct, printNode } from './ui.js';
import { imgUrl, isPreview } from './store.js';

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
  return h('a', { class: 'dish', href: `#dish-${d.id}` }, cover(d),
    h('span', { class: 'dish-meta' }, h('i', {}, `${mark(d.course)} ${d.course || 'Dish'}`), d.favourite && h('i', { class: 'fav' }, 'Chef’s favourite'), sampleTag(d)),
    h('strong', {}, cleanName(d.name)),
    d.story && h('span', { class: 'dish-story' }, d.story.length > 110 ? `${d.story.slice(0, 110).trim()}…` : d.story),
    h('span', { class: 'more' }, 'View dish'));
}

function dishGrid(dishes) {
  const courses = [...new Set(dishes.map((d) => d.course).filter(Boolean))];
  let filter = 'All';
  const grid = h('div', { class: 'dishes' });
  const bar = h('div', { class: 'filters', role: 'group', 'aria-label': 'Filter by course' });
  const paint = () => {
    grid.replaceChildren(...ordered(dishes).filter((d) => filter === 'All' || d.course === filter).map(dishCard));
    bar.replaceChildren(...['All', ...courses].map((c) => h('button', { class: c === filter ? 'on' : '', 'aria-pressed': String(c === filter), onclick: () => { filter = c; paint(); } }, c)));
  };
  paint();
  return h('div', {}, courses.length > 1 ? bar : null, grid);
}

function slider(dishes) {
  let i = 0;
  const stage = h('div', { class: 'slide' });
  const count = h('span', { class: 'count' });
  const pad = (n) => String(n).padStart(2, '0');
  const paint = () => {
    const d = dishes[i];
    stage.replaceChildren(cover(d, 'slide-img'), h('div', { class: 'slide-text' },
      h('i', {}, `${mark(d.course)} ${d.course || 'Dish'}`, d.cuisine ? `, ${d.cuisine}` : ''), sampleTag(d),
      h('h3', {}, h('a', { href: `#dish-${d.id}` }, cleanName(d.name))),
      d.story && h('p', {}, d.story)));
    count.textContent = `${pad(i + 1)} / ${pad(dishes.length)}`;
  };
  paint();
  const go = (n) => { i = (i + n + dishes.length) % dishes.length; paint(); };
  return h('div', {}, stage, dishes.length > 1 && h('div', { class: 'slide-nav' },
    h('button', { 'aria-label': 'Previous dish', onclick: () => go(-1) }, '‹'), count, h('button', { 'aria-label': 'Next dish', onclick: () => go(1) }, '›')));
}

const contactLinks = (p) => [
  p.phone && ['Phone', p.phone, `tel:${p.phone.replace(/[^+\d]/g, '')}`],
  p.whatsapp && ['WhatsApp', 'Send a message', `https://wa.me/${p.whatsapp.replace(/\D/g, '')}`],
  p.email && ['Email', p.email, `mailto:${p.email}`],
  p.location && ['Based in', p.location, null],
].filter(Boolean);

function home(pub) {
  const { profile: p, dishes, setMenus, photos } = pub;
  const favs = ordered(dishes).filter((d) => d.favourite);
  const tiles = [
    dishes.length && ['#dishes', '◆', 'Dishes', `${dishes.length} ${dishes.length === 1 ? 'dish' : 'dishes'} and how they came to be`],
    setMenus.length && ['#menus', '✦', 'Set menus', 'Courses planned for private dining and events'],
    ['#chef', '◇', 'The chef', 'Career, training and what he teaches'],
  ].filter(Boolean);
  return h('main', {},
    h('section', { class: 'hero wrap' },
      h('div', { class: 'hero-text' },
        h('p', { class: 'hero-title' }, p.title),
        h('h1', {}, p.name),
        h('p', { class: 'lede' }, p.tagline),
        h('div', { class: 'row' }, h('a', { class: 'btn', href: dishes.length ? '#dishes' : '#chef' }, dishes.length ? 'View dishes' : 'Read his story'), h('a', { class: 'btn ghost', href: '#contact' }, 'Contact Michael'))),
      h('div', { class: 'medal' }, h('img', { src: portraitOf(p), alt: `Portrait of ${p.name}`, width: 640, height: 640 }))),
    h('section', { class: 'wrap tiles' }, tiles.map(([href, m, a, b]) => h('a', { href, class: 'tile' }, h('i', {}, m), h('strong', {}, a), h('span', {}, b)))),
    favs.length ? h('section', { class: 'band' }, h('div', { class: 'wrap' }, h('h2', {}, 'Chef’s favourites'), slider(favs))) : null,
    dishes.length ? h('section', { class: 'wrap sec' }, h('h2', {}, 'Dishes'), dishGrid(dishes.slice(0, 6)), dishes.length > 6 && h('a', { class: 'more', href: '#dishes' }, 'See all dishes')) : null,
    photos.length ? h('section', { class: 'wrap sec' }, h('h2', {}, 'From the kitchen'), photoGrid(photos.slice(0, 6))) : null);
}

function dishesPage(pub) {
  return h('main', { class: 'wrap sec' }, h('h1', { class: 'page' }, 'Dishes'),
    pub.dishes.length ? dishGrid(pub.dishes) : h('p', { class: 'empty' }, 'New dishes are being photographed. Please check back soon.'));
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
  if (!d) return h('main', { class: 'wrap sec' }, h('p', { class: 'empty' }, 'This dish is not available.'), h('a', { class: 'more', href: '#dishes' }, 'See all dishes'));
  const lines = h('ul', { class: 'ings' });
  const facts = [
    d.cuisine && ['Style', d.cuisine],
    d.dietary?.length && ['Suitable for', d.dietary.join(', ')],
    d.allergens?.length && ['Contains', d.allergens.join(', ')],
    d.price && ['Menu price', money(d.price, pub.currency, 0)],
    d.fc && ['Food cost', pct(d.fc)],
  ].filter(Boolean);
  return h('main', { class: 'wrap sec dish-page' },
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
  return h('main', { class: 'wrap sec' }, h('h1', { class: 'page' }, 'Set menus'),
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
    img.replaceChildren(p.art ? plateArt(p.id, p.caption) : h('img', { src: imgUrl(p.id), alt: p.caption || 'Photo' }));
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
    p.art ? plateArt(p.id, p.caption) : h('img', { src: imgUrl(p.id), alt: p.caption || 'Photo', loading: 'lazy' }), p.sample && h('span', { class: 'sample' }, 'Sample'))));
}

function galleryPage(pub) {
  const cats = [...new Set(pub.photos.map((p) => p.category).filter(Boolean))];
  let f = 'All';
  const box = h('div', {});
  const bar = h('div', { class: 'filters', role: 'group', 'aria-label': 'Filter photos' });
  const paint = () => {
    box.replaceChildren(photoGrid(pub.photos.filter((p) => f === 'All' || p.category === f)));
    bar.replaceChildren(...['All', ...cats].map((c) => h('button', { class: c === f ? 'on' : '', 'aria-pressed': String(c === f), onclick: () => { f = c; paint(); } }, c)));
  };
  paint();
  return h('main', { class: 'wrap sec' }, h('h1', { class: 'page' }, 'Gallery'), pub.photos.length ? [cats.length > 1 ? bar : null, box] : h('p', { class: 'empty' }, 'Photos are on their way.'));
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
  return h('main', { class: 'wrap sec' },
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
  return h('main', { class: 'wrap sec contact' }, h('h1', { class: 'page' }, 'Contact'), h('p', { class: 'lede' }, `Available for exclusive chef and kitchen management roles. Write to ${p.name.split(' ')[0]} directly.`),
    h('dl', { class: 'facts big' }, contactLinks(p).map(([a, b, href]) => h('div', {}, h('dt', {}, a), h('dd', {}, href ? h('a', { href, target: href.startsWith('http') ? '_blank' : null, rel: 'noopener' }, b) : b)))));
}

function chrome(pub, route, content) {
  const nav = [['#dishes', 'Dishes', pub.dishes.length], ['#menus', 'Set menus', pub.setMenus.length], ['#gallery', 'Gallery', pub.photos.length], ['#chef', 'The chef', 1], ['#contact', 'Contact', 1]].filter((n) => n[2]);
  const links = h('nav', { class: 'nav', 'aria-label': 'Main' }, nav.map(([href, t]) => h('a', { href, class: `#${route}` === href ? 'on' : '' }, t)));
  const toggle = h('button', { class: 'menu-btn', 'aria-label': 'Menu', 'aria-expanded': 'false', onclick: () => { const o = links.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(o)); } }, 'Menu');
  return [
    h('header', { class: 'top' }, h('div', { class: 'wrap top-in' }, h('a', { class: 'brand', href: '#home' }, pub.profile.name), toggle, links)),
    content,
    h('footer', { class: 'foot' }, h('div', { class: 'wrap foot-in' },
      h('div', {}, h('strong', {}, pub.profile.name), h('p', {}, pub.profile.title)),
      h('div', {}, contactLinks(pub.profile).filter((c) => c[2]).map(([a, b, href]) => h('a', { href, target: href.startsWith('http') ? '_blank' : null, rel: 'noopener' }, a))),
      h('a', { href: '#studio', class: 'studio-link' }, 'Chef login'))),
  ];
}

export function renderSite(root, pub, route) {
  const [name, ...rest] = route.split('-');
  let page;
  if (name === 'dish') page = dishPage(pub, rest.join('-'));
  else if (name === 'dishes') page = dishesPage(pub);
  else if (name === 'menus') page = menusPage(pub);
  else if (name === 'gallery') page = galleryPage(pub);
  else if (name === 'chef') page = chefPage(pub);
  else if (name === 'contact') page = contactPage(pub);
  else page = home(pub);
  root.replaceChildren(...chrome(pub, route, page));
  document.title = name === 'dish' ? `${cleanName(pub.dishes.find((d) => d.id === rest.join('-'))?.name || 'Dish')} | ${pub.profile.name}` : `${pub.profile.name} | Exclusive Chef`;
  window.scrollTo(0, 0);
}
export { cleanName };
