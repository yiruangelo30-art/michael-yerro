# Michael Angelo Yerro: chef portfolio

Public portfolio plus Chef Studio (recipes, automatic costing and pricing, set-menu quotes, photos, profile).

Stack: static files in `public/`, Cloudflare Pages Functions in `functions/`, Cloudflare D1 for data and photos.

## Deploy on Cloudflare Pages

1. Workers & Pages > Create > Pages > Connect to Git, then pick this repo.
2. Framework preset: None. Build command: leave empty. Build output directory: `public`.
3. Storage & Databases > D1 > Create a database named `michael-yerro`.
4. In the Pages project: Settings > Bindings > Add > D1 database. Variable name `DB`, database `michael-yerro`.
5. Deployments > Retry deployment.
6. Open `/#studio`, enter the setup code and choose a password.

Tables are created on first use. The setup code works once and only its hash is stored here.

## Local preview page

`node tools/build-preview.mjs out.html` builds a single-file preview with sample content (needs esbuild).
