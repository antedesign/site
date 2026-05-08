# antedesign.be

Static site for Anté, an independent concept-validation practice based in Belgium.

Hosted on **GitHub Pages** at the custom domain [antedesign.be](https://antedesign.be).

No build step. No framework. Plain HTML and CSS — edit by hand, push to deploy.

---

## File structure

```
/
├── index.html               Home
├── approach/
│   └── index.html           Approach (methodology, pricing, availability)
├── about/
│   └── index.html           About (founders, independence contract)
├── contact/
│   └── index.html           Contact (booking + message form)
├── scorecard/
│   └── index.html           4-minute self-diagnostic (standalone — do not touch shared.css here)
├── assets/
│   ├── css/
│   │   └── shared.css       Single source of truth for design tokens & components
│   └── images/              Drop image files here, reference from HTML
├── CNAME                    GitHub Pages → custom domain
├── .gitattributes           Diff hygiene
└── README.md                This file
```

---

## How to edit text content

Each page is a single self-contained HTML file.

| To change | Open |
|---|---|
| Home page copy | `index.html` |
| Methodology, phases, pricing, availability | `approach/index.html` |
| About copy, founder bios | `about/index.html` |
| Contact copy, form labels, direct contact block | `contact/index.html` |
| Diagnostic questions and results | `scorecard/index.html` |

Open the file in any text editor, change the text between the tags, save, push.

Example — to change the home headline, find this in `index.html`:

```html
<h1 class="ho-hero__title fade-in">Decide before you build.</h1>
```

…and edit the text between `<h1>` and `</h1>`. Don't touch the class attribute.

---

## How to add an image

1. Drop the file into `assets/images/`.
2. Reference it from HTML:

```html
<img src="/assets/images/your-image.jpg" alt="Short description" loading="lazy" />
```

The leading `/` is an absolute path from the site root — required for GitHub Pages.

### Filename rules

- **lowercase only** — `foto-justin.jpg`, never `Foto-Justin.JPG`
- **hyphens, not spaces** — `case-client-name.jpg`
- **no accented characters** — `cafe.jpg`, not `café.jpg`
- **lowercase extension** — `.jpg`, not `.JPG`

Browsers and Linux servers are case-sensitive. These rules prevent silent breakage when pushing from macOS.

### Images currently referenced

| Path | Used on |
|---|---|
| `assets/images/ante-logo.png` | Nav + footer (all pages) |
| `assets/images/foto-justin.jpg` | Home mosaic · About founders |
| `assets/images/foto-jolan.jpg` | Home mosaic · About founders |

Founder portraits display at a **4:5 aspect ratio**. Crop to that ratio before replacing to avoid letterboxing.

### Optimising image size

Aim for under ~300 KB per image. Run files through [squoosh.app](https://squoosh.app/) or `cwebp` before uploading.

---

## How to update brand colors, typography, spacing

**Single file: `assets/css/shared.css`**

The `:root` block at the top of `shared.css` holds every design token used across all pages:

```css
:root {
  --white:    #FFFFFF;
  --charcoal: #28292B;   /* near-black — headings, text */
  --spruce:   #206A5B;   /* primary brand green — used ONCE per page max */
  --frosted:  #9CE3F8;   /* light accent — small highlights */
  --ink-soft: rgba(40,41,43,0.6);   /* body text */
  --rule:     rgba(40,41,43,0.08);  /* borders, dividers */
}
```

Change a value once, every page updates.

| To change | Token |
|---|---|
| Brand primary color | `--spruce` |
| Brand light accent | `--frosted` |
| Heading / near-black | `--charcoal` |
| Body text color | `--ink-soft` |
| Largest display size | `--text-display-xl` |
| Section headings | `--text-display-md` |
| Section vertical spacing | `--space-section` |
| Card corner radius | `--radius-card` |
| Button corner radius | `--radius-button` |
| Maximum content width | `--container-max` |
| Heading font | `--display` |
| Body font | `--body` |
| Mono / label font | `--mono` |

### Page-specific styles

Styles unique to one page live in a `<style>` block inside that page's `<head>`. They're prefixed so they can't clash with shared styles:

| Prefix | Page |
|---|---|
| `.ho-` | Home (`index.html`) |
| `.ap-` | Approach (`approach/index.html`) |
| `.ab-` | About (`about/index.html`) |
| `.co-` | Contact (`contact/index.html`) |

---

## Filling in placeholder content

Several values are left as placeholders that need to be swapped for live data:

| Placeholder | File | Replace with |
|---|---|---|
| `[CALENDLY_URL]` | `contact/index.html` | Your Calendly booking URL |
| `[FORMSPREE_OR_GOOGLE_FORMS_URL]` | `contact/index.html` | Form POST endpoint (Formspree recommended) |
| `[TESTIMONIAL QUOTE 01/02/03]` | `index.html` | Real client quotes |
| `[month 1]`, `[month 2]`, `[month 3]` | `approach/index.html` | Actual availability months |

---

## How to push changes to live

```bash
git add .
git commit -m "Update: describe what you changed"
git push
```

GitHub Pages picks up the push and re-publishes within a minute or two. The custom domain is wired through the `CNAME` file.

If the custom domain stops working after a push, go to **Settings → Pages → Custom domain**, click Save, and wait up to 30 minutes for DNS.

---

## How to preview locally before pushing

You don't need npm. Python's built-in server works:

```bash
cd /path/to/this/repo
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

A server is needed (not just `open index.html`) because absolute paths like `/assets/css/shared.css` only resolve correctly from a root URL.

---

## A note on the scorecard

`scorecard/index.html` is a self-contained interactive diagnostic with its own embedded CSS and JS. It does **not** use `shared.css`. Treat it as a standalone widget — changes to `shared.css` tokens do not affect the scorecard. That's intentional; it makes the scorecard portable.

---

## Browser support

Plain HTML/CSS/vanilla JS targeting evergreen browsers (Chrome, Safari, Firefox, Edge) from the last two years. Uses Grid, custom properties, `aspect-ratio`, `backdrop-filter`, and `IntersectionObserver` — all stable since 2021.

Internet Explorer is not supported.
