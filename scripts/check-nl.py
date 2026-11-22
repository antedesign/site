#!/usr/bin/env python3
"""Checks that every English page and its Dutch counterpart are still the same page.

The two versions share one structure: the same sections, in the same order, with the same
classes, ids, images and forms. Only the text differs. When someone changes the English page
(a new section, a different order, a removed image) and forgets the Dutch one, this script
fails and says where the two first part ways.

    python3 scripts/check-nl.py          # all pairs
    python3 scripts/check-nl.py about    # one pair, by its English folder name

It also checks the things that tie a pair together: canonical, the three hreflang lines,
the language switch and the sitemap.

What it ignores on purpose: text, and the inline elements that only shape a line of text
(span, br, strong, em, b, i, a, sup, sub, small, abbr, time). A Dutch heading may need
an extra line break where the English does not. Everything else must match.

Exit code 0 = all pairs match. 1 = at least one difference, listed on screen.
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://antedesign.be"

# English path -> Dutch path. Add a line here when a page gets a Dutch version.
PAIRS = {
    "/": "/nl/",
    "/approach/": "/nl/aanpak/",
    "/cases/": "/nl/cases/",
    "/example/": "/nl/voorbeeld/",
    "/check/": "/nl/check/",
    "/about/": "/nl/over-ons/",
    "/contact/": "/nl/contact/",
}

INLINE = {"span", "br", "strong", "em", "b", "i", "a", "sup", "sub", "small", "abbr", "time", "wbr"}
# attributes that carry structure, not language
KEEP = ("class", "id", "src", "name", "type", "value", "action", "method", "for", "role")
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}


def file_of(path):
    return ROOT / (path.strip("/") + "/index.html" if path != "/" else "index.html")


class Skeleton(HTMLParser):
    """The body as a list of (depth, tag, structural attributes), without text and inline tags."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.items, self.depth, self.in_body, self.skip = [], 0, False, 0

    def handle_starttag(self, tag, attrs):
        if tag == "body":
            self.in_body = True
            return
        if not self.in_body:
            return
        if tag in ("script", "style", "noscript"):
            self.skip += 1
        if self.skip or tag in INLINE:
            return
        a = dict(attrs)
        sig = []
        for k in KEEP:
            if k in a and a[k] is not None:
                v = a[k]
                if k == "src":
                    v = v.split("?")[0]
                sig.append(f"{k}={v}")
        sig += sorted(f"{k}" for k in a if k.startswith("data-"))
        self.items.append((self.depth, tag, " ".join(sig)))
        if tag not in VOID:
            self.depth += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript") and self.skip:
            self.skip -= 1
            return
        if not self.in_body or self.skip or tag in INLINE or tag in VOID:
            return
        self.depth = max(0, self.depth - 1)


def skeleton(text):
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    # the language switch and the mobile language link point the other way on purpose
    text = re.sub(r'<div class="lang-switch".*?</div>', "", text, flags=re.S)
    text = re.sub(r'<li class="mobile-menu-lang">.*?</li>', "", text, flags=re.S)
    p = Skeleton()
    p.feed(text)
    return p.items


def head_checks(text, own, en, nl, lang):
    errs = []
    if f'<html lang="{lang}"' not in text:
        errs.append(f'<html lang="{lang}"> missing')
    if f'<link rel="canonical" href="{SITE}{own}">' not in text:
        errs.append(f"canonical is not {SITE}{own}")
    for h, target in (("en", en), ("nl", nl), ("x-default", en)):
        if f'<link rel="alternate" hreflang="{h}" href="{SITE}{target}">' not in text:
            errs.append(f"hreflang {h} -> {target} missing")
    sw = re.search(r'<div class="lang-switch".*?</div>', text, re.S)
    if not sw:
        errs.append("language switch missing")
    else:
        s = sw.group(0)
        if f'href="{en}"' not in s or f'href="{nl}"' not in s:
            errs.append(f"language switch does not link {en} and {nl}")
        if not re.search(rf'href="{re.escape(own)}" class="is-active"', s):
            errs.append("language switch: this page's language is not the active one")
    return errs


def compare(en, nl):
    errs = []
    te, tn = file_of(en).read_text(encoding="utf-8"), file_of(nl).read_text(encoding="utf-8")
    errs += [f"EN {en}: {e}" for e in head_checks(te, en, en, nl, "en")]
    errs += [f"NL {nl}: {e}" for e in head_checks(tn, nl, en, nl, "nl")]
    a, b = skeleton(te), skeleton(tn)
    for i, (x, y) in enumerate(zip(a, b)):
        if x != y:
            errs.append(
                f"structure differs at element {i + 1}:\n"
                f"      EN {en}: {'  ' * x[0]}<{x[1]} {x[2]}>\n"
                f"      NL {nl}: {'  ' * y[0]}<{y[1]} {y[2]}>"
            )
            break
    else:
        if len(a) != len(b):
            longer, path, items = ("EN", en, a) if len(a) > len(b) else ("NL", nl, b)
            extra = items[min(len(a), len(b))]
            errs.append(f"{longer} {path} has {abs(len(a) - len(b))} more element(s), first: <{extra[1]} {extra[2]}>")
    return errs


def sitemap_checks():
    errs = []
    s = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    for en, nl in PAIRS.items():
        for own in (en, nl):
            block = re.search(rf"<url>\s*<loc>{re.escape(SITE + own)}</loc>.*?</url>", s, re.S)
            if not block:
                errs.append(f"sitemap: no <url> for {own}")
                continue
            for h, target in (("en", en), ("nl", nl), ("x-default", en)):
                if f'hreflang="{h}" href="{SITE}{target}"' not in block.group(0):
                    errs.append(f"sitemap: {own} lacks xhtml:link {h} -> {target}")
    return errs


def main():
    only = sys.argv[1:]
    pairs = {e: n for e, n in PAIRS.items() if not only or e.strip("/") in only or (e == "/" and "home" in only)}
    errs = []
    for en, nl in pairs.items():
        for p in (en, nl):
            if not file_of(p).exists():
                errs.append(f"{p}: file missing ({file_of(p).relative_to(ROOT)})")
        if not errs:
            found = compare(en, nl)
            print(f"{'ok  ' if not found else 'FOUT'} {en} <-> {nl}")
            errs += found
    if not only:
        errs += sitemap_checks()
    if errs:
        print("\n" + "\n".join("  - " + e for e in errs))
        print(f"\n{len(errs)} difference(s). Bring the Dutch page in line with the English one (or the other way round).")
        return 1
    print("\nAll English and Dutch pages match.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
