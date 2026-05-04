# antedesign.be

Static site for Anté, an independent concept-validation practice based in Belgium.

Hosted on **GitHub Pages** at the custom domain [antedesign.be](https://antedesign.be).

No build step. No framework. Plain HTML and CSS that you can edit by hand and push to deploy.

---

## File structure

```
/
├── index.html               Home
├── approach/
│   └── index.html           Approach (the methodology, pricing, availability)
├── about/
│   └── index.html           About (founders, independence contract)
├── contact/
│   └── index.html           Contact (booking + message form)
├── scorecard/
│   └── index.html           4-minute self-diagnostic (standalone)
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

Each page is a single self-contained HTML file:

| To change | Open |
|---|---|
| Home page copy | `index.html` |
| Methodology, phases, pricing, availability | `approach/index.html` |
| About copy, founder bios | `about/index.html` |
| Contact copy, form labels, direct contact block | `contact/index.html` |
| Diagnostic questions, results | `scorecard/index.html` |

Open the file in any text editor, change the text between the tags, save, push.

Example. To change the home headline, find this line in `index.html`:

```html
<h1 class="h-display-xl ho-hero__title">Decide before you build.</h1>
```

…and edit the text between `<h1>` and `</h1>`. Don't touch the class attribute.

---

## How to add an image

1. Drop the file into `assets/images/`.
2. Reference it from HTML:

```html
<img src="/assets/images/your-image.jpg" alt="Short description" loading="lazy" />
```

The leading `/` is important — it's an absolute path from the site root, which is what GitHub Pages serves.

### Filename rules

- **lowercase only** — `foto-justin.jpg`, never `Foto-Justin.JPG`
- **hyphens, not spaces** — `workshop-01-preparation.jpg`, never `workshop 01 preparation.jpg`
- **no accented characters** — `cafe.jpg`, not `café.jpg`
- **lowercase extension** — `.jpg`, not `.JPG`

Browsers and Linux servers are case-sensitive. Following these rules keeps things from breaking when you push from macOS to GitHub.

### Phase placeholders that are still wired up

The Approach page references these filenames in image tags. Drop matching files into `assets/images/` and they will appear automatically. Until then, the layout reserves the space and shows a broken image icon — which is the intended cue to add the photo.

| Path the HTML expects | Used on |
|---|---|
| `assets/images/workshop-01-preparation.jpg` | Approach · Phase 1 |
| `assets/images/artifact-synthesis-dossier.jpg` | Approach · Phase 2 |
| `assets/images/workshop-03-definition.jpg` | Approach · Phase 3 |
| `assets/images/workshop-04-exploration.jpg` | Approach · Phase 4 |
| `assets/images/artifact-concept-render.jpg` | Approach · Phase 5 |
| `assets/images/artifact-tradeoff-matrix.jpg` | Approach · Phase 6 |
| `assets/images/artifact-handover-docs.jpg` | Approach · Phase 7 |
| `assets/images/archetype-product.jpg` | Approach · Archetype 1 |
| `assets/images/archetype-service.jpg` | Approach · Archetype 2 |
| `assets/images/archetype-digital.jpg` | Approach · Archetype 3 |
| `assets/images/sprint-01-listen.jpg` | Home · Sprint phase 1 |
| `assets/images/sprint-02-translate.jpg` | Home · Sprint phase 2 |
| `assets/images/sprint-03-decide.jpg` | Home · Sprint phase 3 |
| `assets/images/sprint-04-handover.jpg` | Home · Sprint phase 4 |
| `assets/images/foto-justin.jpg` | About · founder portrait (already in repo) |
| `assets/images/foto-jolan.jpg` | About · founder portrait (already in repo) |
| `assets/images/ante-logo.png` | Favicon (already in repo) |

### Optimising image size

Phone users on 4G will thank you. Before uploading, run the file through [squoosh.app](https://squoosh.app/) or `cwebp` and aim for under ~300 KB per image. The two founder portraits are still 5+ MB and 2+ MB; if you ever want to reduce them in place, just drop in lighter versions with the same filenames and push.

---

## How to update brand colors, typography, spacing

**Single file: `assets/css/shared.css`**

The top of the file has a `:root` block with every design token used across the site:

```css
:root {
  --shadow:  #28292B;     /* near-black */
  --azure:   #F0FDFF;     /* page background */
  --frosted: #9CE3F8;     /* light accent */
  --spruce:  #206A5B;     /* primary brand green */
  ...
}
```

Change a value once, and every page updates.

| To change | Edit |
|---|---|
| Brand primary color | `--spruce` |
| Brand accent | `--frosted` |
| Page background | `--azure` |
| All H1 sizes | `--text-display-xl` |
| All H2 sizes | `--text-display-md` / `--text-display-sm` |
| Spacing between sections | `--space-section-y` |
| Spacing inside sections | `--space-block` |
| Card corner radius | `--radius-card` |
| Pill button radius | `--radius-pill` |
| Maximum content width | `--container-max` |
| Heading font | `--display` |
| Body font | `--body` |
| Mono font | `--mono` |

Below `:root`, every reusable component has a named class:
- `.btn-primary`, `.btn-frosted`, `.btn-outline-light` — buttons
- `.eyebrow` — small mono uppercase label
- `.card`, `.media`, `.numlist` — containers
- `.phase-row`, `.pricing-row`, `.slot-row` — list rows
- `.site-nav`, `.site-footer` — site chrome

Edit a class once, every place it's used updates.

### Page-specific styles

A handful of styles are unique to one page and live in a `<style>` block at the top of that page's HTML (look at the `head` of `approach/index.html`, `about/index.html`, etc.). These are prefixed (`.ap-`, `.ho-`, `.ab-`, `.co-`) so they can't accidentally clash with shared styles.

---

## How to push changes to live

```bash
git add .
git commit -m "Update phase 3 photo"
git push
```

GitHub Pages picks up the push and re-publishes within a minute or two. The custom domain `antedesign.be` is wired through the `CNAME` file at the project root.

If GitHub Pages stops serving the custom domain after a CNAME change, check **Settings → Pages → Custom domain** in the repository, click "Save" again, and wait. DNS propagation can take 30 minutes.

---

## How to preview locally before pushing

You don't need npm. Python's built-in server works:

```bash
cd /path/to/this/repo
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080) in a browser.

Why a server and not just `open index.html`? Because the pages use absolute paths (`/assets/css/shared.css`), which only resolve correctly when served from a root URL.

---

## How to change the booking link

The 30-minute intake link is `https://cal.com/ante-design/30min`. It appears on every page. To change it, search the repo for that URL and replace.

```bash
grep -rl "cal.com/ante-design/30min" .
```

---

## How to change the contact form behavior

The contact form at `contact/index.html` posts to a Google Form via a hidden iframe (so the page doesn't navigate away). The Google Form ID and the three field IDs (`entry.1892390230` for Name, `entry.1237768883` for Email, `entry.1566169903` for Message) live in the form's `action` and `name` attributes. If you create a new Google Form, update those four IDs.

The "thanks" confirmation card shows after a 900 ms delay — Google Forms' cross-origin redirect is unreadable from the page, so we optimistically assume success. If you want stricter confirmation, you'd need to switch from Google Forms to something like [Formspree](https://formspree.io/) or [Netlify Forms](https://docs.netlify.com/forms/setup/).

---

## A note on the scorecard

`scorecard/index.html` is a self-contained interactive diagnostic with its own embedded CSS and JS. It does **not** use `shared.css`. Treat it as a standalone widget — if you change a token in `shared.css`, the scorecard won't follow. That's intentional; it makes the scorecard portable and resistant to design drift on the marketing pages.

---

## Browser support

The site is plain HTML/CSS/vanilla JS, targeting evergreen browsers (Chrome, Safari, Firefox, Edge) from the last two years. CSS uses Grid, custom properties, `aspect-ratio`, and `scroll-behavior: smooth` — all stable since 2021.

Internet Explorer is not supported and never will be.
