#!/usr/bin/env python3
"""Render one Insights post from its JSON source.

    python3 scripts/build-post.py <slug>            # reads posts-src/<slug>.json
    python3 scripts/build-post.py <slug> --root DIR # work in another checkout (tests)

Writes, all derived from the JSON:
  insights/<slug>/index.html
  assets/images/insights/<slug>.svg and .png        (cover, generated)
  insights/index.html   new card at the top of "Already published", Blog JSON-LD
  sitemap.xml           new <url>, bumped <lastmod> for /insights/
  .claude/skills/insights-post/QUEUE.md   topic marked PUBLISHED
  .claude/skills/insights-post/TOPICS.md  row in the Published table

Standard library only. Prints one status line per file written.
The JSON schema is documented in .claude/skills/insights-post/AUTOPOST.md.
"""
import argparse, hashlib, html, json, math, os, re, shutil, subprocess, sys
from pathlib import Path

SITE = "https://antedesign.be"
WORDS_PER_MIN = 220
LOGO_RE = re.compile(r'(<svg x="72" y="542".*?</svg>)\s*</svg>\s*$', re.S)


def esc(s):
    return html.escape(s, quote=True)


def strip_tags(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


def fail(msg):
    print("build-post: " + msg, file=sys.stderr)
    sys.exit(1)


# ------------------------------------------------------------------ schema
REQUIRED = ["slug", "topic_id", "title", "lede", "tag", "description", "published",
            "cover", "sections", "faq", "prompt", "sources", "keywords"]


def load(root, slug):
    p = root / "posts-src" / f"{slug}.json"
    if not p.exists():
        fail(f"{p} not found")
    d = json.loads(p.read_text(encoding="utf-8"))
    for k in REQUIRED:
        if k not in d:
            fail(f"missing key: {k}")
    if d["slug"] != slug:
        fail("slug in JSON does not match file name")
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", slug):
        fail("slug must be lowercase words with hyphens")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", d["published"]):
        fail("published must be YYYY-MM-DD")
    return d


# ------------------------------------------------------------------ body rendering
def block_html(b):
    if "p" in b:
        return f"<p>{b['p']}</p>"
    if "h3" in b:
        return f"<h3>{b['h3']}</h3>"
    if "ul" in b:
        return "<ul>" + "".join(f"<li>{i}</li>" for i in b["ul"]) + "</ul>"
    if "ol" in b:
        return "<ol>" + "".join(f"<li>{i}</li>" for i in b["ol"]) + "</ol>"
    if "callout" in b:
        c = b["callout"]
        return (f'<div class="callout"><span class="eyebrow">{c["eyebrow"]}</span>'
                f'<p>{c["text"]}</p></div>')
    if "quote" in b:
        return f'<div class="pullquote"><p>{b["quote"]}</p></div>'
    if "table" in b:
        t = b["table"]
        head = "".join(f'<th scope="col">{h}</th>' for h in t["head"])
        rows = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in t["rows"])
        return (f'<div class="article-table-wrap"><table class="article-table"><thead><tr>{head}</tr></thead>'
                f'<tbody>{rows}</tbody></table></div>')
    fail(f"unknown block: {list(b)}")


def body_html(d):
    out = []
    for s in d["sections"]:
        out.append(f'<h2 id="{s["id"]}">{s["heading"]}</h2>')
        out.extend(block_html(b) for b in s["blocks"])
    # FAQ
    items = "".join(
        f'<details class="faq-item"><summary>{esc(f["q"])}</summary><div class="faq-answer">'
        + "".join(f"<p>{p}</p>" for p in f["a"].split("\n\n")) + "</div></details>"
        for f in d["faq"])
    out.append('<h2 id="faq">Common questions</h2>')
    out.append(f'<div class="faq-list">{items}</div>')
    # prompt
    p = d["prompt"]
    out.append(f"""<div class="prompt-block" data-prompt-block>
              <span class="eyebrow">{p['eyebrow']}</span>
              <h2 id="prompt">{p['heading']}</h2>
              <p>{p['intro']}</p>
              <pre class="prompt-pre" id="prompt-text">{esc(p['text'])}</pre>
              <div class="prompt-actions">
                <button class="btn-primary" type="button" data-copy-prompt>Copy the prompt <span class="arrow">→</span></button>
                <span class="prompt-note" role="status" aria-live="polite"></span>
              </div>
              <p class="prompt-howto">{p['howto']}</p>
            </div>""")
    # sources
    src = "".join("<li>" + (f'<a href="{esc(s["url"])}" target="_blank" rel="noopener">{s["text"]}</a>' if s.get("url") else s["text"])
                  + (f' {s["note"]}' if s.get("note") else "") + "</li>" for s in d["sources"])
    out.append(f'<div class="sources"><span class="eyebrow">Sources</span><ol>{src}</ol></div>')
    out.append("""<div class="author-card">
              <div class="author-mark"><span>a</span></div>
              <div>
                <h4>Anté</h4>
                <p>An independent concept validation consultancy in Antwerp. We do not build, and we take no stake in what you decide, which is the only reason our answer on direction is worth anything. Decide before you build.</p>
              </div>
            </div>""")
    return "\n\n            ".join(out)


def reading_minutes(d):
    parts = [d["lede"]]
    for s in d["sections"]:
        for b in s["blocks"]:
            parts.append(json.dumps(b, ensure_ascii=False))
    parts += [f["a"] for f in d["faq"]]
    n = len(strip_tags(" ".join(parts)).split())
    return max(1, round(n / WORDS_PER_MIN)), n


# ------------------------------------------------------------------ cover
GRID = '''<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#9CE3F8" stroke-width="1" stroke-opacity="0.045"/></pattern>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#9CE3F8" stop-opacity="0.38"/><stop offset="100%" stop-color="#9CE3F8" stop-opacity="0"/></radialGradient>
    <linearGradient id="vignette" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#28292B" stop-opacity="0"/><stop offset="100%" stop-color="#1B1C1E" stop-opacity="0.55"/></linearGradient>'''
FILL = 'fill="#206A5B" fill-opacity="{o}" stroke="#9CE3F8" stroke-opacity="{s}" stroke-width="2"'


def dot(x, y):
    return (f'<circle cx="{x}" cy="{y}" r="90" fill="url(#glow)"/>'
            f'<circle cx="{x}" cy="{y}" r="32" fill="none" stroke="#9CE3F8" stroke-opacity="0.16" stroke-width="1.5"/>'
            f'<circle cx="{x}" cy="{y}" r="20" fill="none" stroke="#9CE3F8" stroke-opacity="0.34" stroke-width="1.5"/>'
            f'<circle cx="{x}" cy="{y}" r="9" fill="#9CE3F8"/>')


def motif_svg(motif, seed):
    r = lambda i, lo, hi: lo + (seed >> (i * 5)) % (hi - lo + 1)
    if motif == "funnel":      # many options narrowing to one decision
        lines = "".join(
            f'<line x1="{170 + k * 56}" y1="{150 + (k % 3) * 18}" x2="{790 + (k % 2) * 10}" y2="{315 + (k - 5) * 7}" stroke="#9CE3F8" stroke-opacity="0.32" stroke-width="2"/>'
            for k in range(11))
        return (lines + f'<polygon points="170,150 790,305 790,325 170,480" {FILL.format(o=0.30, s=0.5)}/>'
                f'<line x1="790" y1="315" x2="1030" y2="315" stroke="#9CE3F8" stroke-opacity="0.5" stroke-width="2"/>' + dot(1030, 315))
    if motif == "nodes":       # a network of evidence points
        pts = [(240 + (i * 97 + r(i, 0, 60)) % 700, 160 + (i * 61 + r(i + 3, 0, 50)) % 300) for i in range(9)]
        pts.append((960, 315))
        edges = "".join(f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="#9CE3F8" stroke-opacity="0.22" stroke-width="1.5"/>'
                        for a, b in zip(pts, pts[1:] + pts[:2]))
        nodes = "".join(f'<circle cx="{x}" cy="{y}" r="{10 + (i % 3) * 5}" {FILL.format(o=0.55, s=0.6)}/>' for i, (x, y) in enumerate(pts[:-1]))
        return edges + nodes + dot(*pts[-1])
    if motif == "bars":        # ranked evidence
        bars = "".join(
            f'<rect x="{200}" y="{150 + i * 62}" width="{760 - i * 120 + r(i, 0, 30)}" height="40" rx="8" {FILL.format(o=0.46 - i * 0.05, s=0.6 - i * 0.07)}/>'
            for i in range(5))
        return bars + dot(200, 170)
    if motif == "scale":       # a balance of two considerations
        return (f'<line x1="600" y1="170" x2="600" y2="470" stroke="#9CE3F8" stroke-opacity="0.4" stroke-width="2"/>'
                f'<line x1="270" y1="{250 + r(1, 0, 40)}" x2="930" y2="{330 - r(1, 0, 40)}" stroke="#9CE3F8" stroke-opacity="0.6" stroke-width="3"/>'
                f'<polygon points="200,330 340,330 320,420 220,420" {FILL.format(o=0.42, s=0.55)}/>'
                f'<polygon points="860,360 1000,360 980,450 880,450" {FILL.format(o=0.30, s=0.45)}/>' + dot(600, 170))
    if motif == "diamonds":    # two decisions
        return (f'<polygon points="170,315 370,160 570,315 370,470" {FILL.format(o=0.42, s=0.55)}/>'
                f'<polygon points="630,315 830,160 1030,315 830,470" {FILL.format(o=0.28, s=0.42)}/>' + dot(570, 315) + dot(1030, 315))
    # default "layers": stacked folders
    out = []
    for i, w in enumerate([300, 440, 580, 720, 860]):
        x, y, h = 600 - w // 2, 120 + i * 70, 54
        out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" {FILL.format(o=0.5 - i * 0.07, s=0.62 - i * 0.08)}/>')
    return "".join(out) + dot(450, 150)


def make_cover(root, slug, motif, wordmark):
    seed = int(hashlib.sha1(slug.encode()).hexdigest()[:8], 16)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Anté Insights cover">
  <!-- generated by scripts/build-post.py: no <text> elements, labels are HTML overlays -->
  <defs>{GRID}</defs>
  <rect width="1200" height="630" fill="#28292B"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <g>{motif_svg(motif, seed)}</g>
  <g stroke="#9CE3F8" stroke-width="2" stroke-linecap="square"><line x1="1056" y1="72" x2="1056" y2="100" stroke-opacity="0.9"/><line x1="1072" y1="72" x2="1072" y2="100" stroke-opacity="0.45"/><line x1="1088" y1="72" x2="1088" y2="100" stroke-opacity="0.2"/></g>
  <line x1="72" y1="516" x2="1128" y2="516" stroke="#9CE3F8" stroke-opacity="0.14" stroke-width="1"/>
  <rect width="1200" height="630" fill="url(#vignette)"/>
  {wordmark}
</svg>
'''
    out = root / "assets/images/insights"
    out.mkdir(parents=True, exist_ok=True)
    (out / f"{slug}.svg").write_text(svg, encoding="utf-8")
    png = out / f"{slug}.png"
    try:
        import cairosvg
        cairosvg.svg2png(bytestring=svg.encode(), write_to=str(png), output_width=1200, output_height=630)
        return "cairosvg"
    except Exception:
        pass
    chrome = next((str(c) for pat in ("/opt/pw-browsers/chromium-*/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome")
                   for c in sorted(Path("/").glob(pat.lstrip("/")))), None) or shutil.which("chromium") or shutil.which("google-chrome")
    if chrome and shutil.which("convert"):
        tmp = out / f"_{slug}.html"
        tmp.write_text(f'<html><body style="margin:0"><img src="{slug}.svg" width="1200" height="630" style="display:block"></body></html>')
        raw = out / f"_{slug}.png"
        subprocess.run([chrome, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1200,800",
                        f"--screenshot={raw}", f"file://{tmp}"], capture_output=True, timeout=60)
        subprocess.run(["convert", str(raw), "-crop", "1200x630+0+0", "+repage", str(png)], check=True)
        tmp.unlink(missing_ok=True); raw.unlink(missing_ok=True)
        return "chromium"
    fail("cannot render the cover PNG: install cairosvg (pip install cairosvg) or provide chromium + imagemagick")


# ------------------------------------------------------------------ page
def page_html(root, d, minutes, number):
    slug, title = d["slug"], d["title"]
    url = f"{SITE}/insights/{slug}/"
    img = f"{SITE}/assets/images/insights/{slug}.png"
    date_h = d["published"]
    y, m, dd = date_h.split("-")
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    date_h = f"{int(dd)} {months[int(m) - 1]} {y}"
    toc_items = [(s["id"], s.get("toc") or strip_tags(s["heading"])) for s in d["sections"]] + [("faq", "Common questions"), ("prompt", "The prompt")]
    toc = "\n".join(f'              <li><a href="#{i}">{esc(t)}</a></li>' for i, t in toc_items)
    faq_ld = [{"@type": "Question", "name": f["q"],
               "acceptedAnswer": {"@type": "Answer", "text": strip_tags(f["a"].replace("\n\n", " "))}} for f in d["faq"]]
    title_plain = strip_tags(title)
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "BlogPosting", "@id": url + "#article", "headline": title_plain, "description": d["description"], "image": img,
         "datePublished": d["published"], "dateModified": d["published"], "inLanguage": "en-GB", "articleSection": d["tag"],
         "keywords": ", ".join(d["keywords"]),
         "author": {"@type": "Organization", "name": "Anté", "url": SITE + "/"},
         "publisher": {"@type": "Organization", "name": "Anté", "url": SITE + "/",
                       "logo": {"@type": "ImageObject", "url": SITE + "/assets/images/ante-logo.svg"}},
         "mainEntityOfPage": {"@type": "WebPage", "@id": url}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Insights", "item": SITE + "/insights/"},
            {"@type": "ListItem", "position": 3, "name": d.get("crumb") or title_plain[:40]}]},
        {"@type": "FAQPage", "mainEntity": faq_ld}]}
    nav = (root / "scripts/shell/nav.html").read_text(encoding="utf-8")
    foot = (root / "scripts/shell/footer.html").read_text(encoding="utf-8")
    label = f'{d["tag"]} · {number:02d}'
    h1 = d.get("title_html") or esc(title_plain)
    og_desc = d.get("og_description") or d["description"]
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title_plain)} | Anté</title>
  <meta name="description" content="{esc(d['description'])}">
  <link rel="canonical" href="{url}">
  <meta name="robots" content="index, follow, max-image-preview:large">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Anté">
  <meta property="og:locale" content="en_GB">
  <meta property="og:title" content="{esc(title_plain)}">
  <meta property="og:description" content="{esc(og_desc)}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{img}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{esc(d['cover'].get('alt', title_plain))}">
  <meta property="article:published_time" content="{d['published']}">
  <meta property="article:section" content="{esc(d['tag'])}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title_plain)}">
  <meta name="twitter:description" content="{esc(og_desc)}">
  <meta name="twitter:image" content="{img}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&family=Plus+Jakarta+Sans:ital,wght@1,800&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="icon" href="/assets/images/favicon.png">
  <link rel="stylesheet" href="/assets/css/shared.css">
  <link rel="stylesheet" href="/assets/css/insights.css">

  <script type="application/ld+json">
  {json.dumps(ld, indent=2, ensure_ascii=False)}
  </script>
</head>
  <script>function loadScript(a){{var b=document.getElementsByTagName("head")[0],c=document.createElement("script");c.type="text/javascript",c.src="https://tracker.metricool.com/resources/be.js",c.onreadystatechange=a,c.onload=a,b.appendChild(c)}}loadScript(function(){{beTracker.t({{hash:"68ea92b283d5d6d8bad1366116d1438b"}})}});</script>
<body>

{nav}
  <article>

    <header class="hero">
      <div class="container">
        <nav class="crumb reveal" aria-label="Breadcrumb">
          <a href="/">Home</a> <span>/</span> <a href="/insights/">Insights</a> <span>/</span> <span>{esc(d.get('crumb') or title_plain[:40])}</span>
        </nav>
        <h1 class="article-title reveal">{h1}</h1>
        <p class="article-lede reveal">{d['lede']}</p>
        <div class="article-byline reveal">
          <span class="topic" style="color:var(--spruce)">{esc(d['tag'])}</span>
          <span>·</span>
          <span>{date_h}</span>
          <span>·</span>
          <span>{minutes} min read</span>
          <span>·</span>
          <span>By <strong>Anté</strong></span>
        </div>
      </div>
    </header>

    <div class="container">
      <div class="cover reveal" style="margin-bottom: var(--space-block)">
        <img src="/assets/images/insights/{slug}.svg" alt="{esc(d['cover'].get('alt', title_plain))}" width="1200" height="630">
        <span class="cover-label">{esc(label)}</span>
      </div>
    </div>

    <section class="section section--snug" style="padding-top:0">
      <div class="container">
        <div class="article-layout">

          <div class="article-body">

            {body_html(d)}

          </div>

          <aside class="toc" aria-label="On this page">
            <span class="toc-title">On this page</span>
            <ul>
{toc}
            </ul>
          </aside>

        </div>
      </div>
    </section>

    <section class="section section--snug">
      <div class="container">
        <div class="green-cta-block reveal">
          <h2>{esc(d.get('cta_heading') or 'Which decision are you about to make?')}</h2>
          <p>Our 4 minute assessment shows where your concept stands today across 5 key dimensions. No preparation needed. No email required to see results.</p>
          <div class="btn-group">
            <a href="/scorecard/" class="btn-primary">Take free assessment</a>
            <a href="/approach/" class="btn-secondary">See the Decision Sprint</a>
          </div>
        </div>
      </div>
    </section>

  </article>

{foot}"""


# ------------------------------------------------------------------ site wiring
def card_html(d, number):
    slug = d["slug"]
    y, m, dd = d["published"].split("-")
    mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][int(m) - 1]
    return f"""        <a href="/insights/{slug}/" class="post-card reveal">
          <div class="cover">
            <img src="/assets/images/insights/{slug}.svg"
                 alt="{esc(d['cover'].get('alt', ''))}"
                 width="1200" height="630" loading="lazy">
            <span class="cover-label">{esc(d['tag'])} · {number:02d}</span>
          </div>
          <div class="post-card-body">
            <div class="post-meta">
              <span class="topic">{esc(d['tag'])}</span>
              <span class="sep"></span>
              <span>{int(dd)} {mon} {y}</span>
              <span class="sep"></span>
              <span>{d['_minutes']} min read</span>
            </div>
            <h3>{esc(strip_tags(d['title']))}</h3>
            <p class="post-excerpt">{esc(d['description'])}</p>
            <span class="post-more">Read the piece <span class="arrow">→</span></span>
          </div>
        </a>
"""


def wire_index(root, d, number):
    p = root / "insights/index.html"
    s = p.read_text(encoding="utf-8")
    if f'href="/insights/{d["slug"]}/"' in s and "AUTOPOST:CARD:" + d["slug"] in s:
        return "index already wired"
    marker = "<!-- AUTOPOST:GRID -->"
    if marker not in s:
        fail("insights/index.html has no AUTOPOST:GRID marker")
    s = s.replace(marker, marker + f"\n        <!-- AUTOPOST:CARD:{d['slug']} -->\n" + card_html(d, number), 1)
    entry = {"@type": "BlogPosting", "headline": strip_tags(d["title"]), "url": f"{SITE}/insights/{d['slug']}/",
             "datePublished": d["published"], "image": f"{SITE}/assets/images/insights/{d['slug']}.png",
             "author": {"@type": "Organization", "name": "Anté"}}
    ld_marker = '"blogPost": ['
    s = s.replace(ld_marker, ld_marker + "\n      " + json.dumps(entry, ensure_ascii=False) + ",", 1)
    p.write_text(s, encoding="utf-8")
    return "index wired"


def wire_sitemap(root, d):
    p = root / "sitemap.xml"
    s = p.read_text(encoding="utf-8")
    loc = f"{SITE}/insights/{d['slug']}/"
    if loc in s:
        return "sitemap already wired"
    block = f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{d['published']}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.8</priority>\n  </url>\n\n"
    anchor = "  <url>\n    <loc>" + SITE + "/insights/double-diamond-design-process/</loc>"
    if anchor not in s:
        anchor = "  <url>\n    <loc>" + SITE + "/scorecard/</loc>"
    s = s.replace(anchor, block + anchor, 1)
    s = re.sub(r"(<loc>" + re.escape(SITE) + r"/insights/</loc>\s*<lastmod>)[^<]+(</lastmod>)", r"\g<1>" + d["published"] + r"\g<2>", s, count=1)
    p.write_text(s, encoding="utf-8")
    return "sitemap wired"


def wire_queue(root, d):
    q = root / ".claude/skills/insights-post/QUEUE.md"
    if q.exists():
        lines = q.read_text(encoding="utf-8").splitlines()
        for i, ln in enumerate(lines):
            if re.match(rf"- \[[ xX]\] {re.escape(d['topic_id'])} \|", ln) and "PUBLISHED" not in ln:
                lines[i] = ln.replace("- [ ]", "- [x]", 1) + f" | PUBLISHED {d['published']} /insights/{d['slug']}/"
        q.write_text("\n".join(lines) + "\n", encoding="utf-8")
    t = root / ".claude/skills/insights-post/TOPICS.md"
    if t.exists():
        s = t.read_text(encoding="utf-8")
        row = f"| {d['published']} | {strip_tags(d['title'])} | `/insights/{d['slug']}/` |"
        if row not in s:
            s = s.rstrip("\n") + "\n" + row + "\n"
            t.write_text(s, encoding="utf-8")
    return "queue and topics log updated"


def next_number(root):
    return len([x for x in (root / "insights").iterdir() if x.is_dir()]) + 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--root", default=str(Path(__file__).resolve().parent.parent))
    a = ap.parse_args()
    root = Path(a.root)
    d = load(root, a.slug)
    minutes, words = reading_minutes(d)
    d["_minutes"] = minutes
    number = next_number(root) + (0 if (root / "insights" / a.slug).exists() else 1)
    ref_svg = (root / "assets/images/insights/double-diamond-design-process.svg").read_text(encoding="utf-8")
    m = LOGO_RE.search(ref_svg)
    if not m:
        fail("could not find the wordmark in the reference cover")
    how = make_cover(root, a.slug, d["cover"].get("motif", "layers"), m.group(1))
    out = root / "insights" / a.slug
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(page_html(root, d, minutes, number), encoding="utf-8")
    notes = [wire_index(root, d, number), wire_sitemap(root, d), wire_queue(root, d)]
    print(f"built {a.slug}: {words} words, {minutes} min, cover via {how}; " + "; ".join(notes))


if __name__ == "__main__":
    main()
