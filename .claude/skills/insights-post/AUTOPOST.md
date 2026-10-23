# AUTOPOST: one Insights post per run, unattended

This is the whole procedure for the every-other-night routine. Read only this file,
then work. Do not read SKILL.md, the CSS, existing post HTML or the queue itself:
scripts do that work for you and cost almost no tokens.

## Rules that cannot bend

Read `.claude/skills/insights-post/GUARDRAILS.md` first (about 60 lines, numbered R1 to R16).
It is the law for every post. The ones that decide everything:

1. **Nothing internal, and AIPPD is never named or hinted at (R1, R2).** The DesignWorks
   project, AIPPD, PO-1, any course, student, teacher, partner, client, meeting or note: not
   as a source, not as an example, not anonymised, not as "a recent event". Work in
   `antedesign/site` only. If another repository is attached to the session, never open,
   list, search or read it, and never copy anything from it. If you notice that you know
   something from such a place, leave it out and do not mention it.
2. **Nothing copied, everything attributed (R4 to R8).** Own words, short verbatim quotes only
   from the research table (at most 25 words, at most 3 per post), no reproduced figures,
   tables, images, code or data, every claim linked to a page you opened this run.
3. **Approved topics only.** `python3 scripts/next-topic.py` decides. Never invent, reorder or
   approve topics yourself.
4. **Verified claims only (R8).** Every fact, name, date and number must be in the research
   table you built this run. Not in the table, not in the post.
5. **Hard go/no-go (Step 4).** Three independent agents and the scripted gates must all pass.
   A single FAIL, UNSURE or missing verdict means nothing is merged. A skipped post costs
   nothing, a wrong post costs the brand.
6. **Stay inside your files (R13).** Only the post's own files and the generated lines in the
   index, sitemap and queue. Never touch scripts, CSS, other pages or this procedure.
7. **One post per run.** English. Calm, specific, structured.

## Step 0. Preflight (one command, then decide)

```bash
git checkout main && git pull -q origin main
python3 scripts/check-post.py --selftest      # must print PASS, else stop: the guards are broken
cat posts-src/config.json
python3 scripts/next-topic.py
ls posts-src/*.json | tail -1   # newest source; check its "published" date
```

**Dry run.** If an extra message says `DRY RUN` (optionally with a topic id such as `T03`), take
that topic from `.claude/skills/insights-post/QUEUE.md` (grep its line) even if it is not approved,
do every step, and never merge: open the pull request, leave it open, and say so in the report.

A dry run never stops early for lack of approval and never merges.

Otherwise stop and report in one line if: `next-topic` prints `"none": true` (then open or update
one GitHub issue titled "Approve topics for the Insights routine" in the repo, body: how
many are waiting, link to `.claude/skills/insights-post/QUEUE.md`); or a post was already
published today (min_gap_days).

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
> `BLOCKED:` and the reason. Do not include any claim you did not read on the page. Quote at
> most 20 verbatim words per row and copy nothing else from a page. Use public pages only, and
> return no personal data. Never mention or search for AIPPD, DesignWorks or PO-1.

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

Attribution rules, checked by script and by agents (full list in GUARDRAILS.md): a paragraph that
states a date, number or finding names the author and year and links the page, in the same
paragraph; quote only with curly quotation marks, verbatim from the research table, at most 25
words and at most 3 times; otherwise paraphrase in your own words and structure; never name or
hint at AIPPD, DesignWorks, PO-1 or anything internal; never write that Anté interviewed, tested
or surveyed anyone; mark invented examples "illustrative"; label Anté's own reasoning "our view".

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
python3 scripts/check-post.py <slug> --diff origin/main
```

`check-post` prints failures only. Fix the JSON (never the generated HTML), rebuild, recheck.
It enforces: hard firewall terms in every file the post touches (R1, R2), claimed experience
(R3), every source referenced in the text and opened (R4), quotation limits and verbatim
traceability plus no eight-word runs copied from the research quotes (R5), no external
images, scripts or embeds (R6, R14), every number in the research table (R8), no email
addresses, phone numbers or secrets (R9, R14), a safe closing prompt (R15), a scope guard
that fails if any file outside the post's own set changed (R13), voice rules, length,
structure, JSON-LD and FAQ parity, wiring, and that each source URL returns 200.

## Step 4. Hard go/no-go: three independent agents, in parallel

Spawn **three fresh subagents in one message**, model from config (default sonnet). Give each
only what its prompt says. Never give them your reasoning or the other agents' answers. Each
ends with exactly `VERDICT: PASS`, `VERDICT: FAIL` or `VERDICT: UNSURE`, at most 10 bullets,
each bullet citing a rule number and quoting the passage.

**Agent A, confidentiality and privacy.** Input: the post text (title, lede, sections, FAQ,
prompt, sources from the JSON), the research file, and GUARDRAILS.md sections A and C.
> You are a paranoid confidentiality reviewer for the public website of Anté, an independent
> concept validation consultancy. The post may contain nothing from non-public sources. It must
> never mention or hint at the AIPPD programme or event, the DesignWorks project, PO-1, any
> university course, student, teacher, partner, client, meeting, workshop or internal note,
> not even anonymised or rephrased. Report: (1) any passage that could come from non-public
> knowledge; (2) any mention or hint of AIPPD, DesignWorks, PO-1, an event, programme,
> course or partner; (3) any claimed Anté experience, interview, survey or research (R3);
> (4) any private person, contact detail or personal data (R9); (5) insider-sounding phrases
> such as "recently", "a team we know", "in our sessions"; (6) any promise, guarantee,
> client name or hype (R12). If unsure, say UNSURE. Never explain away a suspicion.

**Agent B, sources, copyright and accuracy.** Input: the post text, the research file, the
sources list, and GUARDRAILS.md section B plus R10 and R11. It may open web pages.
> You review a blog post for source fidelity and copyright. Open the three sources that carry
> the post's most important claims and compare. Report: (1) any claim, number, name or date
> the sources do not support, or that overreaches them; (2) any sentence that copies or
> closely follows source wording, outside a quotation of at most 25 words; any quotation not
> verbatim; more than 3 quotations (R5); (3) any reproduced figure, table, data, image,
> code or full prompt from a source (R6); (4) any claim without author, year and link in the
> same paragraph (R4); (5) weak sources used alone, preprints not called preprints, abstract-
> only reading presented as full reading (R7); (6) anything invented: numbers, studies,
> quotes, cases, testimonials (R8); (7) statements about named companies or people that are
> not neutral, sourced facts, any ranking or endorsement of vendors (R10); (8) legal, medical,
> financial or security advice (R11). If you cannot verify something, say UNSURE.

**Agent C, editorial quality.** Input: the post text and the research file.
> You review a blog post for Anté. The reader is a decision-maker about to commit budget.
> Report: (1) claims not in the research table; (2) statements that overreach their source;
> (3) generic failure modes that fit any topic; (4) sentences that sound generated or
> promotional; (5) whether the headline is a claim someone could disagree with; (6) whether
> the closing prompt works in an AI that has never heard of the topic and tells the reader not
> to paste confidential or personal data. Be strict.

Write the three answers into `posts-src/<slug>.compliance.md`, each under its own heading, and
after each answer a line by itself: `AGENT A VERDICT: PASS` (or `FAIL`, `UNSURE`), and the same
for B and C. Copy the agent's verdict exactly; never soften it.

**All three must say PASS.** If any says FAIL or UNSURE: remove or rewrite the flagged
passage (never argue with a confidentiality finding, delete the passage), rebuild, rerun
`check-post.py <slug> --diff origin/main`, and rerun **all three** agents, once. A second round
with any non-PASS: stop, leave the pull request open as a draft, and report the findings.
Then run `python3 scripts/check-post.py <slug> --diff origin/main --final`; it must print PASS.

## Step 5. Publish

```bash
git checkout -b claude/insights-<slug>
git add -A && git commit -m "Insights: <title>" && git push -u origin claude/insights-<slug>
```

Open a pull request into `main` (title `Insights: <title>`). Body, at most 12 lines: topic id,
gate result (`PASS`), the three agent verdicts with their bullets, the sources list, and the line
"Automated by the Insights routine. Revert this PR to unpublish."

If pull request tools are not available in this session, push the branch, say so in the report,
and stop. Never push to `main`.

Merge it (merge commit) **only if** `autopublish` is true in `posts-src/config.json`,
`check-post.py <slug> --diff origin/main --final` printed PASS (which includes all three agents),
and this is not a dry run. Otherwise
leave the PR open and say why. Never push to `main` directly.

## Step 6. Report (at most 8 lines)

Topic id and title, URL, word count, gate result, the three agent verdicts, merged or left open,
approved topics still waiting (`python3 scripts/next-topic.py --stats`).

## Token budget

Typical run: one research subagent (small output), one JSON of about 3,000 tokens, three
review subagents with small inputs (the post text only), a few short command outputs. Do not paste file contents back into the
conversation, do not re-read generated files, and do not fetch pages yourself that the
research subagent already opened.
