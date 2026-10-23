#!/usr/bin/env python3
"""Print the next approved, unpublished topic from the queue as JSON.

    python3 scripts/next-topic.py            # next approved topic, or {"none": true, ...}
    python3 scripts/next-topic.py --stats    # counts only

A topic is approved when its line starts with "- [x]" and has no PUBLISHED
marker. The first such line in the file wins, so reordering the file sets the
priority. Reading only this output keeps the routine from loading the queue.
"""
import json, re, sys
from pathlib import Path

Q = Path(__file__).resolve().parent.parent / ".claude/skills/insights-post/QUEUE.md"
FIELDS = ["id", "cluster", "title", "search", "angle", "verify"]


def parse():
    rows = []
    for ln in Q.read_text(encoding="utf-8").splitlines():
        m = re.match(r"- \[( |x|X)\] (.*)$", ln)
        if not m:
            continue
        parts = [p.strip() for p in m.group(2).split(" | ")]
        if len(parts) < 6:
            continue
        r = dict(zip(FIELDS, parts[:6]))
        r["approved"] = m.group(1).lower() == "x"
        r["published"] = any(p.startswith("PUBLISHED") for p in parts[6:])
        rows.append(r)
    return rows


rows = parse()
open_ = [r for r in rows if r["approved"] and not r["published"]]
if "--stats" in sys.argv:
    print(json.dumps({"total": len(rows), "approved_waiting": len(open_),
                      "published": sum(r["published"] for r in rows),
                      "unapproved": sum(not r["approved"] for r in rows)}))
elif open_:
    out = {k: v for k, v in open_[0].items() if k not in ("approved", "published")}
    out["approved_waiting"] = len(open_)
    print(json.dumps(out, ensure_ascii=False))
else:
    print(json.dumps({"none": True, "unapproved": sum(not r["approved"] for r in rows)}))
