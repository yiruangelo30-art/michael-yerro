// Decorative motion for the public site: slow gold dust, light and fine lines.
// Everything here is skipped when the device asks for reduced motion.
export const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let glint = null;

function makeGlint() {
  if (glint) return;
  glint = document.createElement('canvas');
  glint.width = 32; glint.height = 32;
  const x = glint.getContext('2d');
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,240,205,1)');
  g.addColorStop(0.18, 'rgba(232,197,132,.85)');
  g.addColorStop(0.5, 'rgba(211,173,118,.18)');
  g.addColorStop(1, 'rgba(211,173,118,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 32, 32);
}

/** Fine gold dust that rises slowly and catches the light. */
export function startGold(canvas, { count = 60, opacity = 0.8, speed = 1 } = {}) {
  if (calm() || !canvas) return () => {};
  makeGlint();
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0; let h = 0;
  const size = () => {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  };
  size();
  const rnd = (a, b) => a + Math.random() * (b - a);
  const fresh = (p, anywhere) => Object.assign(p, {
    x: rnd(0, w), y: anywhere ? rnd(0, h) : h + 10, r: rnd(0.7, 2.6) ** 1.6,
    vy: rnd(-16, -5) * speed, sway: rnd(4, 16), ph: rnd(0, 6.28), tw: rnd(0.6, 2.2),
  });
  const items = Array.from({ length: count }, () => fresh({}, true));
  let last = performance.now();
  let raf = 0;
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);
  const ro = new ResizeObserver(size);
  ro.observe(canvas);
  const stop = () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  const frame = (t) => {
    if (!canvas.isConnected) { stop(); return; }
    raf = requestAnimationFrame(frame);
    if (!visible) { last = t; return; }
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of items) {
      p.y += p.vy * dt;
      if (p.y < -12) fresh(p, false);
      const x = p.x + Math.sin(t / 2400 + p.ph) * p.sway;
      const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(t / 1000 * p.tw + p.ph)) ** 3;
      const edge = Math.min(1, p.y / (h * 0.25) + 0.15);
      ctx.globalAlpha = opacity * twinkle * edge;
      const d = p.r * 5;
      ctx.drawImage(glint, x - d / 2, p.y - d / 2, d, d);
    }
  };
  raf = requestAnimationFrame(frame);
  return stop;
}

function reveal(root) {
  const io = new IntersectionObserver((list) => {
    list.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  root.querySelectorAll('.rv').forEach((el) => { if (el.getBoundingClientRect().top > window.innerHeight * 0.9) { el.classList.add('pre'); io.observe(el); } });
}

function navState(root) {
  const nav = root.querySelector('.f-nav');
  if (!nav || !root.querySelector('.fine.is-home')) { nav?.classList.add('solid'); return; }
  const hero = root.querySelector('.f-hero-img');
  const on = () => {
    if (!nav.isConnected) { window.removeEventListener('scroll', on); return; }
    nav.classList.toggle('solid', window.scrollY > 60);
    if (hero && !calm()) hero.style.translate = `0 ${Math.min(window.scrollY, 900) * 0.18}px`;
  };
  window.addEventListener('scroll', on, { passive: true });
  on();
}

/** Starts the decorations after a page of the public site renders. */
export function animatePage(root) {
  navState(root);
  if (calm()) return;
  const small = window.innerWidth < 820;
  startGold(root.querySelector('.f-hero canvas'), { count: small ? 40 : 90, opacity: 0.8 });
  reveal(root);
}
