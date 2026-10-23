#!/usr/bin/env python3
"""Deterministic quality, confidentiality and copyright gates for one Insights post.

    python3 scripts/check-post.py <slug> [--root DIR] [--offline] [--diff BASE] [--final]
    python3 scripts/check-post.py --selftest

Exit code 0 only if every gate passes. Prints failures only, one per line, plus a final
PASS/FAIL line, so the output costs almost no tokens. Fail closed: a missing guard file,
an empty term list or an unreadable source is a failure, not a pass.

Gates, with the rule numbers of .claude/skills/insights-post/GUARDRAILS.md:
  R1/R2  hard firewall terms in EVERY file the post touches (json, research, review, html)
  R3     no claimed experience ("we interviewed ...")
  R4     every source is referenced in the text; claims with numbers carry a source link
  R5     quotation limits and traceability, no 8-word runs copied from the research quotes
  R6/R14 no external images, scripts, iframes or embeds; no secrets
  R8     every number in the text appears in the research file
  R9     no email addresses (except hello@antedesign.be), phone numbers or handles
  R13    scope guard: with --diff, only the post's own files may change
  R15    the closing prompt warns against pasting confidential data
  plus voice rules, length, structure, JSON-LD, wiring and live source URLs.
"""
import argparse, html, json, re, subprocess, sys, urllib.request, urllib.error
from pathlib import Path

BANNED = ["delve", "leverage", "robust", "seamless", "unlock", "supercharge", "game-changer", "game changer",
          "best-in-class", "journey", "synergy", "holistic", "revolutionise", "revolutionize", "cutting-edge",
          "in today's fast-paced world", "it's no secret", "let's dive in", "dive into", "unleash", "empower",
          "transformative", "paradigm shift", "at the end of the day", "navigate the landscape"]
ALLOWED_TAGS = {"a", "strong", "em", "code", "br"}
UA = "Mozilla/5.0 (compatible; AnteInsightsCheck/1.0; +https://antedesign.be)"
OK_HOSTS = ("fonts.googleapis.com", "fonts.gstatic.com", "tracker.metricool.com", "www.linkedin.com", "www.instagram.com",
            "www.youtube.com", "www.facebook.com", "www.tiktok.com", "antedesign.be", "www.antedesign.be")
SECRETS = [r"ghp_[A-Za-z0-9]{20,}", r"github_pat_[A-Za-z0-9_]{20,}", r"sk-[A-Za-z0-9]{20,}", r"AKIA[0-9A-Z]{16}",
           r"-----BEGIN [A-Z ]*PRIVATE KEY", r"xox[abp]-[A-Za-z0-9-]{10,}", r"AIza[0-9A-Za-z_-]{30,}",
           r"(?i)\b(api[_-]?key|secret|password|token)\b\s*[:=]\s*\S{8,}"]
CLAIMED = re.compile(r"\b(we|our team|anté|ante)\s+(have\s+)?(interviewed|surveyed|tested|observed|ran|run|worked with|spoke (to|with)|"
                     r"studied|analysed|analyzed|measured|found that|saw that)\b", re.I)


def strip_tags(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


def load_terms(root):
    f = root / "scripts/firewall-terms.txt"
    if not f.exists():
        return None
    ci, cs = [], []
    for ln in f.read_text(encoding="utf-8").splitlines():
        ln = ln.strip()
        if not ln or ln.startswith("#"):
            continue
        (cs if ln.startswith("=") else ci).append(ln[1:] if ln.startswith("=") else ln.lower())
    return ci, cs


def scan_terms(text, terms):
    hits = []
    low = text.lower()
    for t in terms[0]:
        if t in low:
            hits.append(t)
    for t in terms[1]:
        if re.search(r"(?<![A-Za-z])" + re.escape(t) + r"(?![A-Za-z])", text):
            hits.append(t)
    return hits


def scan_privacy(text):
    out = []
    for m in re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", text):
        if m.lower() != "hello@antedesign.be":
            out.append(f"email address: {m}")
    cleaned = re.sub(r"\b(19|20)\d{2}[-/]\d{2}[-/]\d{2}\b|arXiv:?\s?\d+\.\d+|doi[: ]\S+|10\.\d{4,}/\S+", "", text)
    if re.search(r"(?<![\w])\+\d{1,3}[ .-]?\d[\d ./-]{7,}\d|(?<![\w])0\d{1,2}[ /.-]\d{2,3}[ .-]\d{2}[ .-]\d{2}(?![\w])", cleaned):
        out.append("possible phone number")
    for pat in SECRETS:
        if re.search(pat, text):
            out.append("secret-like string")
            break
    return out


def all_text(d):
    parts = [d["title"], d.get("title_html", ""), d["lede"], d["description"], d.get("og_description", "")]
    for s in d["sections"]:
        parts.append(s["heading"])
        for b in s["blocks"]:
            parts.append(json.dumps(b, ensure_ascii=False))
    for f in d["faq"]:
        parts += [f["q"], f["a"]]
    p = d["prompt"]
    parts += [p["heading"], p["intro"], p["text"], p["howto"], p["eyebrow"]]
    parts += [json.dumps(s, ensure_ascii=False) for s in d["sources"]]
    return "\n".join(parts)


def prose(d):
    """What a reader reads (no JSON syntax), as HTML-bearing strings."""
    parts = [d["lede"]]
    for s in d["sections"]:
        parts.append(s["heading"])
        for b in s["blocks"]:
            for v in b.values():
                if isinstance(v, str):
                    parts.append(v)
                elif isinstance(v, list):
                    parts += [x if isinstance(x, str) else " ".join(map(str, x)) for x in v]
                elif isinstance(v, dict):
                    parts += [" ".join(map(str, x)) if isinstance(x, list) else str(x) for x in v.values()]
    parts += [f["a"] for f in d["faq"]]
    return parts


def words_of(s):
    return re.findall(r"[a-z0-9']+", s.lower())


def check(root, slug, offline):
    errs = []
    E = errs.append
    src = root / "posts-src" / f"{slug}.json"
    if not src.exists():
        return [f"missing {src}"]
    d = json.loads(src.read_text(encoding="utf-8"))
    text = all_text(d)
    raw = text.replace('\\"', '"')
    parts = prose(d)
    vis = strip_tags(" ".join(parts))
    low = text.lower()

    # ---- R1/R2: firewall over every file the post touches
    terms = load_terms(root)
    if not terms or not (terms[0] or terms[1]):
        E("R1: scripts/firewall-terms.txt missing or empty (fail closed)")
    else:
        files = [src, root / "posts-src" / f"{slug}.research.md", root / "posts-src" / f"{slug}.review.md",
                 root / "posts-src" / f"{slug}.compliance.md", root / "insights" / slug / "index.html",
                 root / "assets/images/insights" / f"{slug}.svg"]
        for f in files:
            if f.exists():
                for h in scan_terms(f.read_text(encoding="utf-8", errors="ignore"), terms):
                    E(f"R1/R2 firewall term '{h}' in {f.relative_to(root)}")
        q = root / ".claude/skills/insights-post/QUEUE.md"
        if q.exists():
            for ln in q.read_text(encoding="utf-8").splitlines():
                if re.match(rf"- \[[ xX]\] {re.escape(d['topic_id'])} \|", ln):
                    for h in scan_terms(ln, terms):
                        E(f"R1/R2 firewall term '{h}' in the queue line of {d['topic_id']}")

    # ---- R9/R14 privacy and secrets in the post files
    for issue in scan_privacy(text):
        E(f"R9/R14 {issue}")

    # ---- R3 claimed experience
    m = CLAIMED.search(vis)
    if m:
        E(f"R3 claims experience or own research: '{m.group(0)}'. Rephrase as reasoning ('in our reading')")

    # ---- voice
    if "—" in text or "–" in text.replace("0–9", ""):
        E("voice: em-dash or en-dash present")
    if "!" in text:
        E("voice: exclamation mark present")
    for w in BANNED:
        if re.search(r"(?<![a-z])" + re.escape(w) + r"(?![a-z])", low):
            E(f"voice: banned phrase '{w}'")
    if re.search(r"\b(game|life)-changing\b", low):
        E("voice: game/life-changing")

    # ---- length and shape
    n = len(vis.split())
    if not 1300 <= n <= 2400:
        E(f"length {n} words, expected 1300 to 2400")
    title = strip_tags(d["title"])
    if len(title) > 95 or title.endswith("?"):
        E("title must be a claim (no question mark), max 95 characters")
    if not 90 <= len(d["description"]) <= 175:
        E("meta description must be 90 to 175 characters")
    for s in d["sections"]:
        for b in s["blocks"]:
            if "p" in b and len(re.findall(r"[.!?](?:\s|$)", strip_tags(b["p"]))) > 5:
                E(f"paragraph too long in section {s['id']} (2 to 4 sentences)")
    ids = [s["id"] for s in d["sections"]]
    if len(ids) != len(set(ids)) or any(not re.fullmatch(r"[a-z0-9-]+", i) for i in ids):
        E("section ids must be unique lowercase slugs")
    if not 6 <= len(ids) <= 10:
        E("expected 6 to 10 sections")
    if not any("table" in b for s in d["sections"] for b in s["blocks"]):
        E("no diagnostic table")
    if not any("callout" in b for s in d["sections"] for b in s["blocks"]):
        E("no callout")
    if not 4 <= len(d["faq"]) <= 5:
        E("FAQ must have 4 or 5 questions")
    pt = d["prompt"]["text"]
    if len(re.findall(r"^\d+\.\s", pt, re.M)) < 5:
        E("prompt needs at least 5 numbered steps")
    if len(re.findall(r"\[[^\]]{4,}\]", pt)) < 3:
        E("prompt needs at least 3 bracketed placeholders")
    if not re.search(r"evidence|check|verify", pt.split("\n")[-1] + pt[-400:], re.I):
        E("prompt must end by asking what to check with real evidence")
    if not re.search(r"confidential|personal data", d["prompt"]["howto"] + pt, re.I):
        E("R15 prompt block must warn against pasting confidential or personal data")
    if re.search(r"ignore (all |any )?(previous|prior|your) (instructions|rules)|jailbreak|bypass|disable (safety|filters)", pt, re.I):
        E("R15 prompt contains instruction-override or safeguard-bypass language")
    if len(d["sources"]) < 4 or any(not s.get("url", "").startswith("https://") for s in d["sources"]):
        E("need at least 4 sources, each with an https URL")
    if not re.search(r'href="/(tools|insights)/', raw):
        E("no internal link to /tools/ or /insights/ in the body")
    for mm in re.finditer(r"<(/?)([a-zA-Z0-9]+)", "\n".join(parts)):
        if mm.group(2).lower() not in ALLOWED_TAGS:
            E(f"R6/R14 tag not allowed in text: <{mm.group(2)}> (no images, scripts, iframes)")
            break

    # ---- R5 quotations
    quotes = re.findall(r"[“\"]([^”\"]{12,})[”\"]", re.sub(r"<[^>]+>", "", " ".join(parts)))
    quotes = [q for q in quotes if len(q.split()) >= 4]
    if len(quotes) > 3:
        E(f"R5 {len(quotes)} quotations, maximum 3")
    rf = root / "posts-src" / f"{slug}.research.md"
    research = rf.read_text(encoding="utf-8") if rf.exists() else ""
    rnorm = " ".join(words_of(research))
    for q in quotes:
        if len(q.split()) > 25:
            E(f"R5 quotation longer than 25 words: '{q[:50]}...'")
        if " ".join(words_of(q)) not in rnorm:
            E(f"R5 quotation not verbatim in the research table: '{q[:50]}...'")
    # 8-word runs copied from research quotes outside quotation marks
    prose_no_q = re.sub(r"[“\"][^”\"]{12,}[”\"]", " ", re.sub(r"<[^>]+>", "", " ".join(parts)))
    pw = words_of(prose_no_q)
    rw = words_of(research)
    rgrams = {tuple(rw[i:i + 8]) for i in range(len(rw) - 7)}
    for i in range(len(pw) - 7):
        if tuple(pw[i:i + 8]) in rgrams:
            E("R5 eight-word run copied from the research quotes: '" + " ".join(pw[i:i + 8]) + "'. Paraphrase it")
            break

    # ---- R8 numbers must be in research; research must exist
    if not rf.exists():
        E("R4/R8 missing posts-src/<slug>.research.md (the verified claims table)")
    else:
        if "BLOCKED" in research.upper().split("\n")[0]:
            E("R7 research file says BLOCKED: key sources could not be opened")
        nums = set(re.findall(r"\b(?:1[89]|20)\d{2}\b|\b\d+(?:[.,]\d+)?\s?%|\b\d{3,}\b|\bn\s?=\s?\d+", vis))
        for num in sorted(nums):
            if num not in research and num.replace(" ", "") not in research.replace(" ", ""):
                E(f"R8 number not in the research file: {num}")

    # ---- R4 sources: each referenced in the text, each opened
    body_low = (vis + " " + raw).lower()
    for s in d["sources"]:
        url = s.get("url", "")
        surname = re.sub(r"<[^>]+>", "", s["text"]).strip().split(",")[0].split(" and ")[0].split(" ")[-1].lower().strip(".")
        host_path = url.split("//", 1)[-1].split("#")[0].rstrip("/").lower()
        if host_path not in raw.lower() and surname not in vis.lower() and strip_tags(s["text"]).split(",")[0].lower() not in vis.lower():
            E(f"R4 source not referenced in the text: {url[:70]}")
        if rf.exists() and url.split("#")[0].rstrip("/") not in research and "verified_via" not in s:
            E(f"R4/R7 source not opened (not in research file): {url[:70]}")
    # sentences with a year or percentage need an inline link or an author-year pattern in the same paragraph
    for pgraph in parts:
        t = strip_tags(pgraph)
        if re.search(r"\b(19|20)\d{2}\b|\d\s?%", t) and not re.search(r'href="https?://', pgraph) and not re.search(r"\b[A-Z][a-z]+(?: and [A-Z][a-z]+| et al\.?| \([^)]*\d{4}\))", t):
            if len(t) > 40 and not t.startswith("Source"):
                E("R4 paragraph with a date or percentage but no inline link or author attribution: '" + t[:60] + "...'")
                break

    # ---- R14 rendered page: external resources
    page = root / "insights" / slug / "index.html"
    if not page.exists():
        E("page not built")
    else:
        h = page.read_text(encoding="utf-8")
        for mm in re.finditer(r'<(img|script|iframe|link|embed|object|video|audio|source)\b[^>]*?(?:src|href)="(https?://[^"/]+)', h):
            host = mm.group(2).split("//", 1)[1]
            if mm.group(1).lower() in ("img", "iframe", "embed", "object", "video", "audio", "source") or host not in OK_HOSTS:
                E(f"R14 external resource in page: <{mm.group(1)}> {host}")
        blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S)
        try:
            ld = [json.loads(b) for b in blocks]
            faq = next(x for g in ld for x in g["@graph"] if x["@type"] == "FAQPage")["mainEntity"]
            if [strip_tags(qq["acceptedAnswer"]["text"]) for qq in faq] != [strip_tags(f["a"].replace("\n\n", " ")) for f in d["faq"]]:
                E("FAQ schema differs from visible FAQ")
        except Exception as ex:
            E(f"JSON-LD invalid: {ex}")
        for need in ['rel="canonical"', 'property="og:image"', "twitter:image", f"/insights/{slug}/", 'class="sources-note"']:
            if need not in h:
                E(f"page missing {need}")
        if "{{" in h or "None" in re.sub(r"<script.*?</script>", "", h, flags=re.S):
            E("template leftovers in page")
    for img in (f"assets/images/insights/{slug}.svg", f"assets/images/insights/{slug}.png"):
        if not (root / img).exists():
            E(f"missing {img}")
    if f"/insights/{slug}/" not in (root / "sitemap.xml").read_text(encoding="utf-8"):
        E("not in sitemap.xml")
    if f"/insights/{slug}/" not in (root / "insights/index.html").read_text(encoding="utf-8"):
        E("not in insights/index.html")
    dup = [p.name for p in (root / "posts-src").glob("*.json") if p.stem != slug and p.name != "config.json" and
           json.loads(p.read_text(encoding="utf-8")).get("topic_id") == d["topic_id"]]
    if dup:
        E(f"topic already used by {dup}")

    # ---- live sources
    if not offline:
        for s in d["sources"]:
            url = s.get("url", "")
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                code = urllib.request.urlopen(req, timeout=25).status
            except urllib.error.HTTPError as ex:
                code = ex.code
            except Exception as ex:
                code = type(ex).__name__
            ok = code == 200 or (code in (401, 403, 405, 429) and s.get("verified_via") == "webfetch")
            if not ok:
                E(f"source URL not 200 ({code}): {url[:90]}")
    return errs


def scope_guard(root, slug, base):
    """R13/R1/R14: only the post's own files may change; scan every changed file."""
    errs = []
    def git(*args):
        return subprocess.run(["git", "-C", str(root), *args], capture_output=True, text=True, check=True).stdout.splitlines()
    try:
        names = git("diff", "--name-status", f"{base}...HEAD") + git("diff", "--name-status") + \
            ["A\t" + x for x in git("ls-files", "--others", "--exclude-standard")]
    except Exception as ex:
        return [f"R13 cannot compute the diff against {base}: {ex}"]
    allowed_exact = {"insights/index.html", "sitemap.xml", ".claude/skills/insights-post/QUEUE.md", ".claude/skills/insights-post/TOPICS.md"}
    allowed_prefix = (f"posts-src/{slug}.", f"insights/{slug}/", f"assets/images/insights/{slug}.")
    terms = load_terms(root)
    for ln in names:
        parts = ln.split("\t")
        status, path = parts[0], parts[-1]
        if status.startswith("D"):
            errs.append(f"R13 deletion not allowed: {path}")
            continue
        if path not in allowed_exact and not path.startswith(allowed_prefix):
            errs.append(f"R13 file outside the post's scope changed: {path}")
            continue
        f = root / path
        if f.exists() and f.suffix in (".json", ".md", ".html", ".svg", ".xml", ".txt"):
            t = f.read_text(encoding="utf-8", errors="ignore")
            if terms:
                for h in scan_terms(t, terms):
                    # generated lines in shared files are scanned as a whole; the shared files must stay clean too
                    errs.append(f"R1/R2 firewall term '{h}' in changed file {path}")
            for issue in scan_privacy(t) if path not in allowed_exact else [i for i in scan_privacy(t) if "secret" in i]:
                errs.append(f"R9/R14 {issue} in {path}")
    return errs


def selftest():
    """Prove the guards bite: each probe must be caught, a clean sentence must not."""
    root = Path(__file__).resolve().parent.parent
    terms = load_terms(root)
    bad = 0
    if not terms or not (terms[0] and terms[1]):
        print("FAIL selftest: firewall terms missing")
        sys.exit(1)
    probes = ["We met at the AIPPD launch", "from the DesignWorks project", "PO-1 notes", "Teach the Teacher session",
              "Elke said so", "at the University of Antwerp", "mail me at someone@example.com", "token = abcd1234efgh5678"]
    for p in probes:
        if not (scan_terms(p, terms) or scan_privacy(p)):
            print(f"FAIL selftest: not caught: {p}")
            bad += 1
    for ok in ["Each team chooses a direction.", "Contact hello@antedesign.be for questions."]:
        if scan_terms(ok, terms) or scan_privacy(ok):
            print(f"FAIL selftest: false positive: {ok}")
            bad += 1
    if not CLAIMED.search("We interviewed twelve teams."):
        print("FAIL selftest: claimed-experience pattern broken")
        bad += 1
    print("PASS selftest" if not bad else f"FAIL selftest ({bad})")
    sys.exit(1 if bad else 0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", nargs="?")
    ap.add_argument("--root", default=str(Path(__file__).resolve().parent.parent))
    ap.add_argument("--offline", action="store_true", help="skip live URL checks (never use in the routine)")
    ap.add_argument("--diff", metavar="BASE", help="also enforce the scope guard against BASE, for example origin/main")
    ap.add_argument("--final", action="store_true", help="also require the three independent agent verdicts to be PASS (run before merging)")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        selftest()
    if not a.slug:
        ap.error("slug required")
    root = Path(a.root)
    errs = check(root, a.slug, a.offline)
    if a.diff:
        errs += scope_guard(root, a.slug, a.diff)
    if a.final:
        cf = root / "posts-src" / f"{a.slug}.compliance.md"
        ct = cf.read_text(encoding="utf-8") if cf.exists() else ""
        for ag in "ABC":
            if not re.search(rf"^AGENT {ag} VERDICT: PASS\s*$", ct, re.M):
                errs.append(f"GO/NO-GO: agent {ag} has no 'AGENT {ag} VERDICT: PASS' line in posts-src/{a.slug}.compliance.md")
        if re.search(r"^AGENT [ABC] VERDICT: (FAIL|UNSURE)", ct, re.M):
            errs.append("GO/NO-GO: at least one agent said FAIL or UNSURE")
    for e in errs:
        print("FAIL: " + e)
    print(("FAIL" if errs else "PASS") + f" ({len(errs)} issue{'s' if len(errs) != 1 else ''})")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
