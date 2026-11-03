// Builds one self-contained preview page. Not used by the live site.
import { build } from 'esbuild';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
const out = process.argv[2];
const r = await build({ entryPoints: ['public/assets/app.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2021' });
const js = r.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
// Smaller copies of the sample photos, embedded so the preview needs no other files.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pv-'));
execFileSync('python3', ['-c', `
import glob, os, sys
from PIL import Image
for f in glob.glob('public/assets/samples/*.jpg'):
    i = Image.open(f).convert('RGB'); i.thumbnail((1700 if 'hero' in f or 'dining-room' in f else 980, 1100)); i.save(os.path.join(sys.argv[1], os.path.basename(f)), quality=62)
`, dir]);
const samples = {};
for (const f of fs.readdirSync(dir)) samples[`/assets/samples/${f}`] = `data:image/jpeg;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}`;
let css = fs.readFileSync('public/assets/style.css', 'utf8');
css = css.replace(/url\('(\/assets\/samples\/[^']+)'\)/g, (m, u) => `url('${samples[u]}')`);
const img = fs.readFileSync('public/assets/michael.jpg').toString('base64');
fs.writeFileSync(out, `<title>Michael Angelo Yerro</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Hanken+Grotesk:wght@400;500;600&display=swap">
<style>${css}</style>
<div id="app"></div><div id="print"></div>
<script>window.__PREVIEW=true;window.__SAMPLES=${JSON.stringify(samples)};window.__PORTRAIT="data:image/jpeg;base64,${img}";</script>
<script>${js}</script>`);
