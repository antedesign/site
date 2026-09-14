# Anté — antedesign.be

Static website for Anté, an independent concept validation consultancy. Built as plain HTML/CSS/JS — no build step required.

---

## Folder structure

```
/
├── index.html              Home page
├── approach/index.html     Approach page
├── cases/index.html        Cases page
├── insights/index.html     Insights (blog) index
│   └── <slug>/index.html   One folder per post
├── about/index.html        About page
├── contact/index.html      Contact page
├── tools/                  Standalone interactive tools
├── assets/
│   ├── css/
│   │   ├── shared.css      All design tokens, components, utilities
│   │   └── insights.css    Blog-only styles, layered on shared.css
│   ├── js/
│   │   ├── reveal.js       Scroll fade-in (IntersectionObserver)
│   │   ├── nav.js          Mobile menu
│   │   └── insights.js     Reading progress, TOC, copy-prompt button
│   └── images/
│       └── insights/       Post covers (.svg for the page, .png for social)
├── sitemap.xml             Add one <url> block per new post
├── robots.txt
├── CNAME                   antedesign.be
├── README.md
└── .gitattributes
```

---

## How to edit text

Every page is a plain HTML file. Open it in any text editor, find the text between the tags, change it, save, push.

| Page | File | What's in it |
|---|---|---|
| Home | `index.html` | Hero, showcases, trust bar, independence section, failure narrative, testimonials, CTA |
| Approach | `approach/index.html` | Hero, 5 phases, deliverables, who-for, pricing, availability, closing CTA |
| Cases | `cases/index.html` | Hero with disclosure note, diagnostic CTA |
| About | `about/index.html` | Hero, independence section, founders, CTA |
| Contact | `contact/index.html` | Hero, Calendly card, contact form card, direct contact |
| Insights | `insights/index.html` | Hero, featured post, what's coming, tools, CTA |

---

## Insights (the blog)

One post per folder: `insights/<slug>/index.html`. No build step, no CMS. Each
post is a self-contained HTML file using `shared.css` plus `insights.css`.

**To write a new post, run `/insights-post` in Claude Code.** The skill lives in
`.claude/skills/insights-post/` and contains:

| File | What it is |
|---|---|
| `SKILL.md` | The full procedure: research, voice rules, structure, checklists |
| `TOPICS.md` | The topic backlog, grouped into clusters, with target searches |
| `make-cover-png.py` | Renders a cover SVG to the PNG that social platforms need |

`/insights/double-diamond-design-process/index.html` is the reference
implementation. Copy it to start a new post rather than writing markup fresh.

### Three rules that matter

1. **Nothing from the internal Anté repository goes on this site.** No client
   names, no project detail, no internal strategy. Posts are built from public
   sources plus original reasoning. This is why the whole publishing system
   lives in this repo and not in the other one.
2. **Every factual claim needs a source that was actually opened**, and every
   URL in a Sources list must return 200 before the post ships.
3. **Every post ends with a prompt** the reader can paste into their own AI.

### Doing it every week

Set up a Routine in Claude Code on the web pointing at this repository, with a
prompt along the lines of:

> Run /insights-post. Take the next topic from TOPICS.md, verify it against
> primary sources, and open a PR. Do not read from any other repository.

Review the PR before merging. The research and the markup can be automated. The
judgement about whether the claim is true and worth making cannot.

### After publishing

- [ ] `sitemap.xml`: add the post, bump `<lastmod>` on `/insights/`
- [ ] Resubmit the sitemap in Google Search Console
- [ ] The `og:image` must point at the **PNG**, never the SVG

---

## Gating the prompt behind an email capture (later)

The closing prompt is deliberately built as one self-contained block
(`.prompt-block` in `insights.css`) so it can be gated without touching the
article. When you are ready:

1. Keep the `<h2>`, the eyebrow and the intro paragraph visible, so the page
   still makes sense to a reader and to a crawler.
2. Wrap everything from `.prompt-pre` down in the gate.
3. Do not gate it with `display: none` alone. Hidden-but-present text that a
   crawler can read and a visitor cannot is exactly what search engines
   penalise. Inject the prompt after the form is submitted instead.

---

## How to add or replace an image

1. Drop the file into `assets/images/` — use lowercase filenames with hyphens, no spaces, no accents. Example: `workshop-hero.jpg`
2. Find the matching `<div class="placeholder ...">` in the HTML file
3. Replace the whole `<div class="placeholder ...">...</div>` block with an `<img>` tag:

```html
<img src="/assets/images/workshop-hero.jpg" alt="Workshop session" class="hero-img">
```

4. Add a matching rule in `shared.css` if you need specific sizing (e.g. `border-radius: var(--radius-img)`).

### Placeholder labels and what they map to

| Label | File | Notes |
|---|---|---|
| `[WORKSHOP PHOTO — hero]` | `index.html` | 4:5 ratio, right column of hero |
| `[CASE PHOTO 1-6]` | `index.html` | 4:5 ratio, case grid |
| `[LOGO 1-5]` | `index.html` | Trust bar logos |
| `[FOUNDER PORTRAIT - JUSTIN]` | `about/index.html` | 1:1 square |
| `[FOUNDER PORTRAIT - JOLAN]` | `about/index.html` | 1:1 square |
| `[TESTIMONIAL 1-3]` | `index.html` | Quote, name, company |

---

## How to change brand colors

Open `assets/css/shared.css`. All colors are in the `:root` block at the very top:

```css
:root {
  --white:      #FFFFFF;
  --charcoal:   #28292B;
  --spruce:     #206A5B;
  --frosted:    #9CE3F8;
  --rule:       rgba(40, 41, 43, 0.08);
  --ink-soft:   rgba(40, 41, 43, 0.6);
  --ink-muted:  rgba(40, 41, 43, 0.4);
}
```

Change the value, save, push. Every component that uses that token updates automatically.

---

## How to change spacing rhythm

Spacing tokens are also in the `:root` block of `assets/css/shared.css`:

```css
:root {
  --space-section: clamp(96px, 14vw, 180px);   /* between top-level sections */
  --space-block:   clamp(48px, 7vw, 96px);     /* between blocks within a section */
  --space-stack:   32px;                        /* heading to body */
  --space-tight:   16px;                        /* closely related items */
  --hero-pad-top:    clamp(120px, 16vw, 200px);
  --hero-pad-bottom: clamp(96px, 12vw, 160px);
}
```

---

## Placeholders to replace before launch

Search the HTML files for these strings:

- `[CALENDLY_URL_PLACEHOLDER]` in `contact/index.html`
- `[FORM_ACTION_PLACEHOLDER]` in `contact/index.html`
- `[TESTIMONIAL 1-3]` in `index.html`
- `[Month 1-3]` in `approach/index.html`

---

## Filename conventions

- Lowercase only
- Hyphens instead of spaces: `workshop-photo.jpg` not `Workshop Photo.jpg`
- No accents or special characters: `ante-logo.svg` not `ante-logo.svg`

---

## How to push to GitHub Pages

```bash
git add .
git commit -m "Your message"
git push
```

In GitHub > Settings > Pages > set Source to **Deploy from branch** > `main` > `/ (root)`.

The `CNAME` file makes GitHub Pages serve the site at `antedesign.be`. Point your domain DNS to GitHub Pages as described in the GitHub Pages docs.
