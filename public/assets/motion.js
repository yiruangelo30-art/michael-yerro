// Decorative motion for the public site. Everything here is skipped when the
// visitor's device asks for reduced motion.
export const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sprites = [];

function sprite(size, draw) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const x = c.getContext('2d');
  x.translate(size / 2, size / 2);
  x.lineCap = 'round';
  draw(x, size / 2);
  return c;
}

function buildSprites() {
  if (sprites.length) return;
  const leaf = (fill, rib) => (x, r) => {
    x.rotate(-0.5);
    x.beginPath(); x.moveTo(-r * 0.9, 0);
    x.quadraticCurveTo(0, -r * 0.72, r * 0.9, 0);
    x.quadraticCurveTo(0, r * 0.72, -r * 0.9, 0);
    x.fillStyle = fill; x.fill();
    x.strokeStyle = rib; x.lineWidth = r * 0.05;
    x.beginPath(); x.moveTo(-r * 0.85, 0); x.lineTo(r * 0.8, 0); x.stroke();
    for (let i = -2; i <= 2; i += 1) {
      x.beginPath(); x.moveTo(i * r * 0.25, 0); x.lineTo(i * r * 0.25 + r * 0.16, -r * 0.24);
      x.moveTo(i * r * 0.25, 0); x.lineTo(i * r * 0.25 + r * 0.16, r * 0.24); x.stroke();
    }
  };
  const pepper = (x, r) => {
    const g = x.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.05, 0, 0, r * 0.5);
    g.addColorStop(0, '#6b4a2d'); g.addColorStop(1, '#22150c');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, r * 0.46, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#120b06'; x.lineWidth = r * 0.05;
    x.beginPath(); x.arc(r * 0.05, 0, r * 0.3, 0.4, 2.4); x.stroke();
  };
  const anise = (x, r) => {
    for (let i = 0; i < 8; i += 1) {
      x.save(); x.rotate((i * Math.PI) / 4);
      x.beginPath(); x.moveTo(0, 0);
      x.quadraticCurveTo(r * 0.3, -r * 0.3, r * 0.92, 0);
      x.quadraticCurveTo(r * 0.3, r * 0.3, 0, 0);
      x.fillStyle = '#6a3f20'; x.fill();
      x.fillStyle = '#c99a5b';
      x.beginPath(); x.ellipse(r * 0.5, 0, r * 0.13, r * 0.07, 0, 0, Math.PI * 2); x.fill();
      x.restore();
    }
  };
  const chili = (x, r) => {
    x.rotate(0.5);
    x.beginPath(); x.moveTo(-r * 0.62, -r * 0.14);
    x.quadraticCurveTo(r * 0.2, -r * 0.34, r * 0.9, r * 0.38);
    x.quadraticCurveTo(r * 0.1, r * 0.22, -r * 0.62, r * 0.14);
    x.closePath();
    x.fillStyle = '#b53a27'; x.fill();
    x.strokeStyle = '#e88a70'; x.lineWidth = r * 0.04;
    x.beginPath(); x.moveTo(-r * 0.4, -r * 0.1); x.quadraticCurveTo(r * 0.1, -r * 0.16, r * 0.55, r * 0.14); x.stroke();
    x.strokeStyle = '#6f8b45'; x.lineWidth = r * 0.12;
    x.beginPath(); x.moveTo(-r * 0.6, 0); x.quadraticCurveTo(-r * 0.8, -r * 0.05, -r * 0.92, -r * 0.3); x.stroke();
  };
  const saffron = (x, r) => {
    x.strokeStyle = '#d9662b'; x.lineWidth = r * 0.07;
    [[-0.5, -0.6], [0, -0.85], [0.5, -0.55]].forEach(([a, b]) => {
      x.beginPath(); x.moveTo(0, r * 0.75); x.quadraticCurveTo(a * r * 0.3, 0, a * r, b * r); x.stroke();
    });
  };
  const lemon = (x, r) => {
    x.fillStyle = '#e4bb45';
    x.beginPath(); x.arc(0, 0, r * 0.88, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#f6edc4';
    x.beginPath(); x.arc(0, 0, r * 0.76, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 8; i += 1) {
      x.save(); x.rotate((i * Math.PI) / 4 + 0.2);
      x.beginPath(); x.moveTo(r * 0.08, 0);
      x.lineTo(r * 0.68, -r * 0.23); x.quadraticCurveTo(r * 0.76, 0, r * 0.68, r * 0.23); x.closePath();
      x.fillStyle = '#eec94f'; x.fill();
      x.restore();
    }
  };
  sprites.push(
    sprite(72, leaf('#6f8f47', '#c6d79a')), sprite(72, leaf('#88993f', '#dbe2a8')),
    sprite(36, pepper), sprite(36, pepper), sprite(36, pepper),
    sprite(72, anise), sprite(84, chili), sprite(64, saffron), sprite(84, lemon),
  );
}

/**
 * Draws herbs and spices on a canvas. "drift" floats them gently in place,
 * "fall" scatters them down the screen for the opening.
 */
export function startSpices(canvas, { count = 16, mode = 'drift', opacity = 0.5 } = {}) {
  if (calm() || !canvas) return () => {};
  buildSprites();
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
  const fresh = (p = {}, anywhere = true) => Object.assign(p, {
    s: sprites[Math.floor(Math.random() * sprites.length)],
    x: rnd(0, w), y: anywhere ? rnd(0, h) : rnd(-90, -30),
    z: rnd(0.45, 1.15), a: rnd(0, Math.PI * 2),
    va: rnd(-0.5, 0.5), vx: rnd(-8, 8), vy: mode === 'fall' ? rnd(70, 190) : rnd(-4, 4),
    ph: rnd(0, Math.PI * 2),
  });
  const items = Array.from({ length: count }, () => fresh());
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
    for (const p of items) {
      p.a += p.va * dt;
      p.x += (p.vx + Math.sin(t / 1400 + p.ph) * 12) * dt;
      p.y += (p.vy + (mode === 'drift' ? Math.cos(t / 1800 + p.ph) * 9 : 0)) * dt;
      if (mode === 'fall' && p.y > h + 60) fresh(p, false);
      if (mode === 'drift') {
        if (p.x < -50) p.x = w + 40; if (p.x > w + 50) p.x = -40;
        if (p.y < -50) p.y = h + 40; if (p.y > h + 50) p.y = -40;
      }
      ctx.save();
      ctx.globalAlpha = opacity * Math.min(1, p.z + 0.1);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      const d = p.s.width * p.z * (w < 560 ? 0.42 : 0.62);
      ctx.drawImage(p.s, -d / 2, -d / 2, d, d);
      ctx.restore();
    }
  };
  raf = requestAnimationFrame(frame);
  return stop;
}

const QUOTES = [
  'Good food starts with good ingredients.',
  'A great plate is planned before the fire is lit.',
  'Taste everything. Twice.',
  'Consistency is the real signature dish.',
  'Cook for the guest in front of you.',
];

function rotateQuotes(el) {
  if (!el) return;
  let i = Math.floor(Date.now() / 864e5) % QUOTES.length;
  el.textContent = QUOTES[i];
  if (calm()) return;
  const timer = setInterval(() => {
    if (!el.isConnected) { clearInterval(timer); return; }
    el.classList.add('qout');
    setTimeout(() => { i = (i + 1) % QUOTES.length; el.textContent = QUOTES[i]; el.classList.remove('qout'); }, 600);
  }, 7000);
}

function countUp(el) {
  const end = Number(el.textContent);
  if (!(end > 0)) return;
  const start = performance.now();
  const tick = (t) => {
    const k = Math.min((t - start) / 900, 1);
    el.textContent = Math.round(end * (1 - (1 - k) ** 3));
    if (k < 1 && el.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function parallax(mast) {
  if (!mast || !window.matchMedia('(pointer: fine)').matches) return;
  mast.addEventListener('mousemove', (e) => {
    const r = mast.getBoundingClientRect();
    mast.style.setProperty('--px', `${((e.clientX - r.left) / r.width - 0.5) * -14}px`);
    mast.style.setProperty('--py', `${((e.clientY - r.top) / r.height - 0.5) * -10}px`);
  });
}

/** Starts the decorations after a page of the public site renders. */
export function animatePage(root, isFirstHome) {
  rotateQuotes(root.querySelector('.quote'));
  if (calm()) return;
  const small = window.innerWidth < 820;
  startSpices(root.querySelector('.mast canvas'), { count: small ? 11 : 18, opacity: 0.62 });
  startSpices(root.querySelector('.welcome-banner canvas'), { count: small ? 5 : 10, opacity: 0.32 });
  parallax(root.querySelector('.mast'));
  if (isFirstHome) root.querySelectorAll('.stat b').forEach(countUp);
}
