# AUTOPOST: one Insights post per run, unattended

This is the whole procedure for the every-other-night routine. Read only this file,
then work. Do not read SKILL.md, the CSS, existing post HTML or the queue itself:
scripts do that work for you and cost almost no tokens.

## Rules that cannot bend

1. **Firewall.** Work in the `antedesign/site` repository only. If another repository
   is attached to the session, do not open, search or read it. Nothing internal goes
   on the site: no client names, no projects, no meeting notes, no strategy. Sources
   are public pages you opened this run, plus Anté's own reasoning.
2. **Approved topics only.** `python3 scripts/next-topic.py` decides the topic. Never
   invent, reorder or approve topics yourself.
3. **Verified claims only.** Every fact, name, date and number in the post must be in
   the research table you built this run. Not in the table, not in the post.
4. **Fail closed.** If any gate fails and you cannot fix it in two rounds, do not merge.
   Leave the pull request open with the reason. A skipped post costs nothing, a wrong
   post costs the brand.
5. **One post per run.** Output language: English. Voice: calm, specific, structured.

## Step 0. Preflight (one command, then decide)

```bash
git checkout main && git pull -q origin main
cat posts-src/config.json
python3 scripts/next-topic.py
ls posts-src/*.json | tail -1   # newest source; check its "published" date
```

Stop and report in one line if: `next-topic` prints `"none": true` (then open or update
one GitHub issue titled "Approve topics for the Insights routine" in the repo, body: how
many are waiting, link to `.claude/skills/insights-post/QUEUE.md`); or a post was already
published today (min_gap_days); or a dry-run instruction was given (then never merge,
open the PR only).

Test the network once: fetch `https://arxiv.org/abs/2603.16021`. If it cannot be opened,
the environment blocks research. Stop and report which host was denied.

## Step 1. Research (delegate, keep it small)

Spawn **one** research subagent (model from `reviewer_model`/`research_model` in config,
default sonnet) with this prompt, filling the braces from `next-topic.py` output:

> Research for one blog post. Topic: {title}. Angle: {angle}. Target search: {search}.
> Open these first: {verify}. You may run at most 6 web searches and open at most 8
> pages. Prefer primary sources: the paper, the publisher, the organisation that made the
> thing. Return ONLY a markdown table, at most 350 words, with columns:
> `# | claim (one sentence) | exact figure or date | URL | opened (yes/no) | verbatim quote of at most 20 words`.
> Add one line at the end: `CONFLICT:` where the popular version differs from the
> primary source (or `none`). If the key paper cannot be opened, start the answer with
> `BLOCKED:` and the reason. Do not include any claim you did not read on the page.

Save the table to `posts-src/<slug>.research.md` (slug: lowercase words with hyphens that
contain the target search). If it starts with `BLOCKED`, mark nothing, post nothing: open
or update a GitHub issue naming the topic and the reason, then try the next approved
topic once. If that also fails, stop.

## Step 2. Write the JSON (never write HTML)

Write `posts-src/<slug>.json`, 1,500 to 2,000 words of prose. Build the argument from the
research table and your own reasoning. Schema:

```json
{
  "slug": "target-search-words", "topic_id": "T03", "published": "YYYY-MM-DD",
  "title": "A claim, not a topic, at most 95 characters",
  "title_html": "optional: the same title with <span class=\"text-spruce\">one phrase</span>",
  "crumb": "short breadcrumb", "tag": "Method | Evidence | Practice | Decision quality",
  "lede": "Two or three sentences stating the argument.",
  "description": "90 to 175 characters for search results.",
  "og_description": "optional social text",
  "keywords": ["3 to 6 phrases"],
  "cover": {"motif": "funnel|nodes|bars|scale|diamonds|layers", "alt": "what the drawing shows"},
  "sections": [
    {"id": "origin", "heading": "Where it comes from", "toc": "optional short label", "blocks": [
      {"p": "Paragraph with <a href=\"https://...\">links</a>, <strong>bold</strong>, <em>italic</em>."},
      {"h3": "Subheading"}, {"ul": ["item", "item"]}, {"ol": ["item"]},
      {"callout": {"eyebrow": "The short version", "text": "..."}},
      {"quote": "One load-bearing sentence."},
      {"table": {"head": ["If this is true", "Then"], "rows": [["...", "..."]]}}]}
  ],
  "faq": [{"q": "Question", "a": "Answer. Separate paragraphs with a blank line."}],
  "prompt": {"eyebrow": "Apply it to your own project", "heading": "Use AI as a sparring partner, not an oracle",
             "intro": "Two or three sentences.", "text": "The prompt, plain text.", "howto": "Two notes on using it."},
  "sources": [{"text": "Author, <em>Title</em>, venue, year.", "url": "https://...", "verified_via": "webfetch"}]
}
```

Section plan (6 to 10 sections): where it comes from (verified history, with the
primary-source correction if there is one) · what it actually says (short, neutral) ·
where it breaks (concrete failure modes, each with a signal the reader can look for) ·
what it does not give you (honest limits) · how to run it so it holds (numbered, no new
budget) · **a diagnostic table** the reader can apply this week · at least one
`callout`. FAQ: 4 or 5 questions, plain answers. Link at least once to another page in
`/tools/` or `/insights/` (for example `/tools/111-decide-before-build-checklist/` or
`/insights/double-diamond-design-process/`).

Voice rules, checked by script: no em-dashes or en-dashes (use comma, colon, full stop);
no exclamation marks; paragraphs of two to four sentences; bold only for the load-bearing
phrase in a list item; never write that something is thorough, powerful or game-changing,
show the detail instead; avoid: delve, leverage, robust, seamless, unlock, holistic,
journey, synergy, empower, cutting-edge. Where the popular version conflicts with the
primary source, say so in the post. If a claim cannot be sourced, cut it or label it
"our view". The reader is a decision-maker about to commit budget, not a student.

**The closing prompt** makes the reader's own AI apply the post to their project. It is a
sparring partner that finds thin thinking, never an oracle. At least 3 bracketed
`[fill this in]` sections, at least 5 numbered instructions each producing a separate
answer, and the last step asks what to check with real evidence before committing. Because
the reader's AI knows nothing about the post, the prompt must state the one idea it needs
in a short background paragraph at the top.

Sources: at least 4, each an `https` URL you opened. Put `"verified_via": "webfetch"` on
every source you opened, so publisher sites that block scripts do not fail the link gate.

## Step 3. Build and check (loop at most twice)

```bash
pip install -q cairosvg 2>/dev/null || true
python3 scripts/build-post.py <slug>
python3 scripts/check-post.py <slug>
```

`check-post` prints failures only. Fix the JSON (never the generated HTML), rebuild, recheck.
It enforces voice rules, length, structure, internal links, firewall terms, that every
number in the text also appears in the research table, JSON-LD and FAQ parity, wiring in
the index and sitemap, images, and that each source URL returns 200.

## Step 4. Independent review (a fresh agent, not you)

Spawn a reviewer subagent. Give it **only**: the rendered post text (`strip` of
`insights/<slug>/index.html` body is fine, or the JSON), and the research file. Do not give
it your reasoning. Prompt:

> You review a blog post for Anté, an independent concept validation consultancy. The
> reader is a decision-maker. Using only the research table, answer in at most 10 bullets
> and end with `VERDICT: PASS` or `VERDICT: FAIL`. Check: (1) any claim, name, date or
> number not supported by the table; (2) any statement that overreaches its source;
> (3) generic failure modes that could apply to any topic; (4) sentences that sound
> generated or promotional; (5) whether the argument is a real claim someone could
> disagree with; (6) whether the prompt would work in an AI that has never heard of the
> topic. Be strict. A FAIL needs at least one concrete fix.

Save the answer to `posts-src/<slug>.review.md`. On FAIL, fix once, rebuild, recheck, review
again. Two FAILs: stop, open the PR as draft, do not merge.

## Step 5. Publish

```bash
git checkout -b claude/insights-<slug>
git add -A && git commit -m "Insights: <title>" && git push -u origin claude/insights-<slug>
```

Open a pull request into `main` (title `Insights: <title>`). Body, at most 12 lines: topic id,
gate result (`PASS`), reviewer verdict and its bullets, the sources list, and the line
"Automated by the Insights routine. Revert this PR to unpublish."

Merge it (merge commit) **only if** `autopublish` is true in `posts-src/config.json`,
`check-post` printed PASS, the reviewer said PASS, and this is not a dry run. Otherwise
leave the PR open and say why. Never push to `main` directly.

## Step 6. Report (at most 8 lines)

Topic id and title, URL, word count, gate result, reviewer verdict, merged or left open,
approved topics still waiting (`python3 scripts/next-topic.py --stats`).

## Token budget

Typical run: one research subagent (small output), one JSON of about 3,000 tokens, one
reviewer subagent, three short command outputs. Do not paste file contents back into the
conversation, do not re-read generated files, and do not fetch pages yourself that the
research subagent already opened.
