# Anté | Website

Static site for [antedesign.be](https://antedesign.be), hosted on GitHub Pages.

---

## File structure

```
studio-ante-website/
├── index.html              ← Main site (all 5 tabs in one file)
├── scan/
│   └── index.html          ← Free concept audit / quickscan tool
├── scorecard/
│   └── index.html          ← Diagnostic tool (copy-as-is, do not edit)
├── assets/
│   ├── css/
│   │   └── shared.css      ← ⭐ Single source of truth for all styling
│   └── images/
│       ├── foto-justin.JPG
│       ├── foto-jolan.JPG
│       └── PNG_LOGO_Transparent_Black.png
├── CNAME                   ← Contains: antedesign.be
└── README.md               ← This file
```

---

## How the site works

`index.html` is a single file with five "pages" (sections) that show/hide via JavaScript:

| Hash URL | Section |
|---|---|
| `/` | Home (landing) |
| `/#solutions` | Solutions & pricing |
| `/#cases` | Cases (coming soon) |
| `/#about` | About / team |
| `/#contact` | Contact form |

Navigation links call `showPage('about')` etc. Browser back/forward works normally via `pushState`.

`/scan/` and `/scorecard/` are separate files, not part of the SPA.

---

## How to edit content

**Page text:** Open `index.html`. Each section starts with a comment like:
```html
<!-- PAGE: SOLUTIONS (#solutions) -->
```
Find the section you want, edit the text directly in the HTML. Save, commit, push.

**Pricing:** In `index.html`, search for `pricing-grid`. Each `.pricing-card` is one tier. Edit the price, timeline, feature list, or tier name there.

**Team bios:** In `index.html`, search for `§ 01 — The team`. The two `<article>` blocks are Justin and Jolan respectively.

**Scan/quickscan copy:** Open `scan/index.html`. Screen titles, labels, and dropdown options are all plain text — edit directly.

---

## How to add or replace an image

1. Drop the file into `assets/images/` (lowercase, hyphens, no spaces — e.g. `foto-client-xyz.jpg`)
2. Reference it in HTML: `<img src="/assets/images/foto-client-xyz.jpg" alt="Descriptive text" loading="lazy">`

**To replace a founder portrait:**
- Drop `foto-justin.JPG` or `foto-jolan.JPG` into `assets/images/` (same filenames, same case)
- The `<img>` tags in `index.html` already point to these paths — no HTML edit needed

**To add phase/workshop photos (Approach section if added):**
- Naming convention from JSX source: `workshop-01-preparation.jpg`, `artifact-synthesis-dossier.jpg`, etc.
- Replace the `.photo-ph` placeholder divs with `<img class="portrait" src="/assets/images/[filename]" alt="[...]" loading="lazy">`

---

## How to change brand colours or typography

Open `assets/css/shared.css`. All design tokens are in the `:root` block at the top:

```css
:root {
  --spruce:   #206A5B;   /* primary green — CTAs, headings */
  --frosted:  #9CE3F8;   /* accent blue — highlights, badges */
  --azure:    #F0FDFF;   /* light background */
  --shadow:   #28292B;   /* text / dark footer */
  /* ... */
}
```

- **Change primary colour:** edit `--spruce` and `--spruce-ink`
- **Change body background:** edit `--azure`
- **Increase heading size:** edit `--text-hero` or `--text-display-xl`
- **More section breathing room:** edit `--section-y`
- **Rounder/squarer buttons:** edit `--radius-btn`

One edit in `:root` updates the whole site.

---

## How to push changes to GitHub Pages

```bash
git add .
git commit -m "update: [describe what you changed]"
git push origin main
```

Changes go live within ~30 seconds. No build step, no npm, no compilation needed.

---

## How to wire up the Quickscan Google Form

1. Create a Google Form with these fields:
   - Name, Company, Email, Sector, Company size, Idea/project description, Timestamp

2. Publish the form. View the form source or use the network tab to find:
   - The **formResponse URL** (ends in `/formResponse`)
   - The **entry IDs** for each field (format: `entry.XXXXXXXXX`)

3. Open `scan/index.html` and update the `FORM_CONFIG` object near the bottom:

```js
var FORM_CONFIG = {
  url: 'https://docs.google.com/forms/u/0/d/e/YOUR_FORM_ID/formResponse',
  fields: {
    name:    'entry.XXXXXXXXX',
    company: 'entry.XXXXXXXXX',
    email:   'entry.XXXXXXXXX',
    sector:  'entry.XXXXXXXXX',
    size:    'entry.XXXXXXXXX',
    idea:    'entry.XXXXXXXXX',
    ts:      'entry.XXXXXXXXX'
  }
};
```

The contact form on the main site (`index.html`) is already wired up — its `FORM_CONFIG` uses the existing Google Form URL and entry IDs from `contact.jsx`.

---

## File naming conventions

- Lowercase only: `foto-justin.jpg` not `Foto-Justin.jpg`
- Hyphens, not spaces or underscores: `artifact-tradeoff-matrix.jpg`
- No accented characters: `ante` not `anté` in filenames
- Images: descriptive, prefixed by type — `foto-`, `artifact-`, `workshop-`

---

## Scorecard / Diagnostic

`scorecard/index.html` is a standalone file — **do not edit** the HTML structure. It has its own self-contained styles and logic. If you need to update it, replace the file entirely.

---

## Quick reference

| Task | File | What to search for |
|---|---|---|
| Edit hero headline | `index.html` | `hero__h1` |
| Edit pricing | `index.html` | `pricing-grid` |
| Edit team bios | `index.html` | `§ 01 — The team` |
| Change primary colour | `assets/css/shared.css` | `--spruce` |
| Update nav links | `index.html` | `nav__links` |
| Edit scan copy | `scan/index.html` | `screen__title` |
| Add client logo | `index.html` | `trust-bar__logos` |
| Add a case study | `index.html` | `id="cases"` |
