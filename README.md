# Veil marketing website

The public marketing site for **Veil** (working name), Nectral's browser-native AI usage security platform. Product source material lives in [`nectral/product-ideations`](https://github.com/nectral/product-ideations) under `product/veil/`.

It is a plain static site: one HTML page, one stylesheet, one script, no build step and no dependencies.

```
index.html          page content and sections
styles.css          all styling (warm paper theme from the Veil Landing v2 design, responsive to phone width)
main.js             hero demo, console sample data, FAQ, early-access form and mobile nav
assets/favicon.svg  shield-check favicon
```

## Run locally

Any static file server works. From the repo root:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Then open http://localhost:8080.

## Before launch

1. **Wire up the early-access form.** In `main.js`, set `CONFIG.FORM_ENDPOINT` to a URL that accepts a JSON POST (Formspree, Basin, HubSpot, a serverless function). Until then the form opens the visitor's email app addressed to `CONFIG.CONTACT_EMAIL`.
2. **Confirm the contact address.** `CONFIG.CONTACT_EMAIL` is a placeholder (`hello@nectral.ai`); change it to a real inbox.
3. **Name and trademark.** "Veil" is a working name pending a trademark check. It appears in `index.html` (title, meta tags, nav, footer) and this README.
4. **Pricing.** Paid tiers deliberately say "Contact us"; the PRD prices are hypotheses still being validated with design partners.
5. **Claims.** Copy marks agentic controls, compliance packs and non-browser sensors as roadmap. Revisit it as features ship.

## Deploy

The site is static, so any host works. Point it at the repo root with no build command and `.` (or `/`) as the output directory.

- **Cloudflare Pages / Netlify / Vercel:** import the repo, framework preset "None", build command empty, output directory `/`.
- **GitHub Pages:** Settings → Pages → Deploy from a branch → `main`, folder `/ (root)`.
- **S3 + CloudFront or any web server:** upload the four files and `assets/` as-is.
