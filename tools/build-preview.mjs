// Builds one self-contained preview page. Not used by the live site.
import { build } from 'esbuild';
import fs from 'node:fs';
const out = process.argv[2];
const r = await build({ entryPoints: ['public/assets/app.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2021' });
const js = r.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const css = fs.readFileSync('public/assets/style.css', 'utf8');
const img = fs.readFileSync('public/assets/michael.jpg').toString('base64');
fs.writeFileSync(out, `<title>Michael Angelo Yerro</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=Hanken+Grotesk:wght@400;500;600&display=swap">
<style>${css}</style>
<div id="app"></div><div id="print"></div>
<script>window.__PREVIEW=true;window.__PORTRAIT="data:image/jpeg;base64,${img}";</script>
<script>${js}</script>`);
