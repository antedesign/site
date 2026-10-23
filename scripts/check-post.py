#!/usr/bin/env python3
"""Deterministic quality gates for one Insights post. Cheap, no model involved.

    python3 scripts/check-post.py <slug> [--root DIR] [--offline]

Exit code 0 only if every gate passes. Prints failures only, one per line,
plus a final PASS/FAIL line, so the output costs almost no tokens.

Gates: schema, voice rules (no em-dash, no exclamation marks, banned words),
length, structure (diagnostic table, 4 to 5 FAQ, prompt with numbered steps and
placeholders, 4+ sources), internal links, firewall terms, numbers that are not
in the research file, JSON-LD validity and FAQ parity, wiring (index, sitemap,
images), and live source URLs.
"""
import argparse, html, json, re, sys, urllib.request, urllib.error
from pathlib import Path

BANNED = ["delve", "leverage", "robust", "seamless", "unlock", "supercharge", "game-changer", "game changer",
          "best-in-class", "journey", "synergy", "holistic", "revolutionise", "revolutionize", "cutting-edge",
          "in today's fast-paced world", "it's no secret", "let's dive in", "dive into", "unleash", "empower",
          "transformative", "paradigm shift", "at the end of the day", "navigate the landscape"]
ALLOWED_TAGS = {"a", "strong", "em", "code", "br"}
UA = "Mozilla/5.0 (compatible; AnteInsightsCheck/1.0; +https://antedesign.be)"


def strip_tags(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


def all_text(d):
    parts = [d["title"], d["lede"], d["description"]]
    for s in d["sections"]:
        parts.append(s["heading"])
        for b in s["blocks"]:
            parts.append(json.dumps(b, ensure_ascii=False))
    for f in d["faq"]:
        parts += [f["q"], f["a"]]
    p = d["prompt"]
    parts += [p["heading"], p["intro"], p["text"], p["howto"]]
    return "\n".join(parts)


def visible_text(d):
    """Prose only: what a reader reads, without JSON syntax."""
    parts = [d["lede"]]
    for s in d["sections"]:
        parts.append(s["heading"])
        for b in s["blocks"]:
            for v in b.values():
                if isinstance(v, str):
                    parts.append(v)
                elif isinstance(v, list):
                    for x in v:
                        parts.append(x if isinstance(x, str) else " ".join(map(str, x)))
                elif isinstance(v, dict):
                    parts += [str(x) if not isinstance(x, list) else " ".join(map(str, x)) for x in v.values()]
    parts += [f["a"] for f in d["faq"]]
    return strip_tags(" ".join(parts))


def check(root, slug, offline):
    errs = []
    E = errs.append
    src = root / "posts-src" / f"{slug}.json"
    if not src.exists():
        return [f"missing {src}"]
    d = json.loads(src.read_text(encoding="utf-8"))
    text = all_text(d)
    vis = visible_text(d)
    low = text.lower()

    # voice
    if "—" in text or "–" in text.replace("0–9", ""):
        E("em-dash or en-dash present: use a comma, colon or full stop")
    if "!" in text:
        E("exclamation mark present")
    for w in BANNED:
        if re.search(r"(?<![a-z])" + re.escape(w) + r"(?![a-z])", low):
            E(f"banned phrase: {w}")
    if re.search(r"\b(game|life)-changing\b", low):
        E("banned superlative: game/life-changing")

    # length and shape
    words = len(vis.split())
    if not 1300 <= words <= 2400:
        E(f"length {words} words, expected 1300 to 2400")
    title = strip_tags(d["title"])
    if len(title) > 95 or title.endswith("?"):
        E("title must be a claim, not a question, and at most 95 characters")
    if len(d["description"]) > 175 or len(d["description"]) < 90:
        E("meta description must be 90 to 175 characters")
    for s in d["sections"]:
        for b in s["blocks"]:
            if "p" in b and len(re.findall(r"[.!?](?:\s|$)", strip_tags(b["p"]))) > 5:
                E(f"paragraph too long in section {s['id']}: keep paragraphs to 2 to 4 sentences")
    ids = [s["id"] for s in d["sections"]]
    if len(ids) != len(set(ids)) or any(not re.fullmatch(r"[a-z0-9-]+", i) for i in ids):
        E("section ids must be unique lowercase slugs")
    if not 6 <= len(ids) <= 10:
        E("expected 6 to 10 sections")
    if not any("table" in b for s in d["sections"] for b in s["blocks"]):
        E("no diagnostic table")
    if not any("callout" in b for s in d["sections"] for b in s["blocks"]):
        E("no callout (short version)")
    if not 4 <= len(d["faq"]) <= 5:
        E("FAQ must have 4 or 5 questions")
    pt = d["prompt"]["text"]
    if len(re.findall(r"^\d+\.\s", pt, re.M)) < 5:
        E("prompt needs at least 5 numbered steps")
    if len(re.findall(r"\[[^\]]{4,}\]", pt)) < 3:
        E("prompt needs at least 3 bracketed [fill this in] placeholders")
    if not re.search(r"evidence|check|verify", pt, re.I):
        E("prompt must end by asking what to check with real evidence")
    if len(d["sources"]) < 4 or any(not s.get("url", "").startswith("https://") for s in d["sources"]):
        E("need at least 4 sources, each with an https URL")
    if not re.search(r'href=\\?"/(tools|insights)/', text):
        E("no internal link to /tools/ or /insights/ in the body")
    for m in re.finditer(r"<(/?)([a-zA-Z0-9]+)", "\n".join([d["lede"]] + [json.dumps(b) for s in d["sections"] for b in s["blocks"]])):
        if m.group(2).lower() not in ALLOWED_TAGS:
            E(f"tag not allowed in inline text: <{m.group(2)}>")
            break

    # firewall
    ft = (root / "scripts/firewall-terms.txt")
    if ft.exists():
        for term in [t.strip() for t in ft.read_text(encoding="utf-8").splitlines() if t.strip() and not t.startswith("#")]:
            if term.lower() in low:
                E(f"firewall term in text: {term}")

    # numbers must be traceable to the research file
    rf = root / "posts-src" / f"{slug}.research.md"
    if not rf.exists():
        E("missing posts-src/<slug>.research.md (the verified claims table)")
    else:
        research = rf.read_text(encoding="utf-8")
        if "BLOCKED" in research.upper().split("\n")[0]:
            E("research file says BLOCKED: key sources could not be opened")
        nums = set(re.findall(r"\b(?:1[89]|20)\d{2}\b|\b\d+(?:[.,]\d+)?\s?%|\b\d{3,}\b|\bn\s?=\s?\d+", vis))
        for n in sorted(nums):
            if n not in research and n.replace(" ", "") not in research.replace(" ", ""):
                E(f"number not in research file: {n}")
        low_r = research.lower()
        for s in d["sources"]:
            if s.get("url") and s["url"].split("#")[0].rstrip("/") not in research and "verified_via" not in s:
                E(f"source not opened (not in research file): {s['url'][:80]}")

    # rendered page and wiring
    page = root / "insights" / slug / "index.html"
    if not page.exists():
        E("page not built")
    else:
        h = page.read_text(encoding="utf-8")
        blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S)
        try:
            ld = [json.loads(b) for b in blocks]
            faq = next(x for g in ld for x in g["@graph"] if x["@type"] == "FAQPage")["mainEntity"]
            if [strip_tags(q["acceptedAnswer"]["text"]) for q in faq] != [strip_tags(f["a"].replace("\n\n", " ")) for f in d["faq"]]:
                E("FAQ schema differs from visible FAQ")
        except Exception as ex:
            E(f"JSON-LD invalid: {ex}")
        for need in ['rel="canonical"', 'property="og:image"', "twitter:image", f"/insights/{slug}/"]:
            if need not in h:
                E(f"page missing {need}")
        if "{{" in h or "None" in re.sub(r"<script.*?</script>", "", h, flags=re.S):
            E("template leftovers in page ('{{' or 'None')")
    for img in (f"assets/images/insights/{slug}.svg", f"assets/images/insights/{slug}.png"):
        if not (root / img).exists():
            E(f"missing {img}")
    if f"/insights/{slug}/" not in (root / "sitemap.xml").read_text(encoding="utf-8"):
        E("not in sitemap.xml")
    if f"/insights/{slug}/" not in (root / "insights/index.html").read_text(encoding="utf-8"):
        E("not in insights/index.html")
    dup = [p.name for p in (root / "posts-src").glob("*.json") if p.stem != slug and
           json.loads(p.read_text(encoding="utf-8")).get("topic_id") == d["topic_id"]]
    if dup:
        E(f"topic already used by {dup}")

    # live sources
    if not offline:
        for s in d["sources"]:
            url = s.get("url", "")
            if not url:
                continue
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                code = urllib.request.urlopen(req, timeout=25).status
            except urllib.error.HTTPError as ex:
                code = ex.code
            except Exception as ex:
                code = f"{type(ex).__name__}"
            ok = code == 200 or (code in (401, 403, 405, 429) and s.get("verified_via") == "webfetch")
            if not ok:
                E(f"source URL not 200 ({code}): {url[:90]}")
    return errs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--root", default=str(Path(__file__).resolve().parent.parent))
    ap.add_argument("--offline", action="store_true", help="skip live URL checks (never use in the routine)")
    a = ap.parse_args()
    errs = check(Path(a.root), a.slug, a.offline)
    for e in errs:
        print("FAIL: " + e)
    print(("FAIL" if errs else "PASS") + f" ({len(errs)} issue{'s' if len(errs) != 1 else ''})")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
