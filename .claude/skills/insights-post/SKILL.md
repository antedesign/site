---
name: insights-post
description: Research and publish one Anté Insights post on antedesign.be. Takes a topic (a model, a habit, a piece of news), verifies it against primary sources, writes it in the Anté voice, builds the page, draws the cover, and wires it into the index and the sitemap. Use for "write the weekly Insights post", "new blog post about X", or /insights-post.
---

# Insights post

One post. Research, write, build, verify. Roughly 1,500 to 2,000 words of real
content, published as a static page under `/insights/<slug>/`.

## Rule zero: the firewall

**This skill runs in the `site` repository and nowhere else.**

Nothing from Anté's internal repository (the bedrijfsbrein) may appear on the
website. Not client names, not project details, not internal strategy, pricing,
positioning drafts, meeting notes, roadmap items or research. Not paraphrased,
not "anonymised", not as an example.

If you have the internal repo open in the same session, do not read from it for
this task. Everything in a post comes from one of two places:

1. **Public, citable sources** you have verified this session.
2. **Anté's own reasoning**, written fresh for this post.

The one exception is what is already published on antedesign.be itself. That is
public by definition, and linking to it is encouraged.

## Step 1: pick the topic

Take it from the user, or from `TOPICS.md` in this folder (top of a cluster
first). A topic qualifies if you can answer all three:

- What does a reader **do differently** on Monday after reading it?
- What is the **claim** that most write-ups on this topic get wrong or skip?
- Which **search** does it answer? Write the query down.

If you cannot answer the second one, the post will be a summary of things people
already know. Pick another topic or find a sharper angle.

## Step 2: verify before you write

Non-negotiable. The post carries Anté's name and the whole point of the company
is being right about things.

- Go to **primary sources**. The organisation that made the model, the paper,
  the original report. Not a listicle, not another blog.
- Where the popular version conflicts with the primary source, **say so in the
  post**. That contradiction is usually the most valuable paragraph you will
  write. The Double Diamond post is built on exactly this.
- Every date, name, number and attribution needs a source you actually opened.
- **Check every URL returns 200 before publishing.** Dead links in a Sources
  list are worse than no Sources list.
- If a claim cannot be sourced, cut it or mark it explicitly as Anté's view.

Keep the verified sources. They go in the `.sources` block at the end.

## Step 3: write it

Language: **English**. The whole site is English.

### Voice

Calm, specific, structured. The reader is a decision-maker who is about to
commit budget, not a design student. Assume intelligence, do not assume the
jargon.

Depth is demonstrated by specificity, never claimed. Never write that something
is thorough, deep, powerful or game-changing. Show the detail and let the reader
conclude it.

### Hard formatting rules

- **No em-dashes.** Use a comma, a colon or a full stop.
- **No exclamation marks.**
- No marketing language, no urgency, no superlatives about Anté.
- Short paragraphs. Two to four sentences.
- Bold is for the load-bearing phrase in a list item, not for emphasis sprinkled
  through prose.

### Words to avoid

delve, leverage (as a verb), robust, seamless, unlock, supercharge, game-changer,
best-in-class, journey (unless literal), synergy, holistic, revolutionise,
"in today's fast-paced world", "it's no secret that", "let's dive in".

### Structure

Follow the shape of `/insights/double-diamond-design-process/index.html`. It is
the reference implementation. Copy it as the starting point for every new post
rather than writing markup from scratch.

1. **Title.** A claim, not a topic. "The Double Diamond is two decisions, not
   four phases" rather than "Understanding the Double Diamond".
2. **Lede.** Two or three sentences that state the argument. No throat-clearing.
3. **Where it comes from.** The verified history. This is the section that earns
   the authority for everything after it.
4. **What it actually says.** Short and neutral, so a reader who does not know
   the model can follow. Add a diagram if it carries the argument.
5. **Where it breaks.** The core of the post. Concrete failure modes, each with
   a signal the reader can look for in their own project.
6. **What it does not give you.** The honest limits. This is the section that
   separates the post from every other post on the topic.
7. **How to run it so it holds.** Numbered, concrete, no new budget required.
8. **A diagnostic.** A short table the reader can apply to themselves this week.
   This is the part that gets screenshotted and shared.
9. **Common questions.** Four or five, mirrored exactly into FAQPage schema.
10. **The prompt.** See below. Every post has one.
11. **Sources, author card, CTA.**

### The closing prompt

Every post ends with one. It is the thing readers keep.

- It makes the reader's own AI apply the post to their own project.
- It never decides for them. Frame the model as a sparring partner that finds
  thin thinking, not an oracle that hands over an answer.
- Bracketed `[fill this in]` sections for the reader's own context.
- Numbered, sequential instructions, each producing a separate answer.
- It ends by asking what must be checked with real evidence before committing.

Keep it in one `<pre class="prompt-pre" id="prompt-text">` inside the
`.prompt-block`. The block is deliberately self-contained: to put it behind an
email gate later, wrap everything from `.prompt-pre` down and leave the heading
and the intro paragraph visible so the page still makes sense to a crawler.

## Step 4: build the page

```
insights/<slug>/index.html
```

Slug: lowercase, hyphens, contains the search term you wrote down in step 1.

Copy the Double Diamond post and replace the content. Then check every one of
these, because they are all easy to leave stale:

- [ ] `<title>`, meta description, canonical URL
- [ ] All Open Graph and Twitter tags, including `og:image` pointing at the
      **PNG**, not the SVG. Social platforms do not render SVG.
- [ ] JSON-LD: BlogPosting headline, description, image, dates, plus a
      BreadcrumbList and a FAQPage whose answers match the visible FAQ **word
      for word**. Mismatched schema is a manual-action risk, not a clever trick.
- [ ] `datePublished` and `dateModified`
- [ ] The breadcrumb, the byline, the reading time (count the words, 220 per
      minute, round to the nearest minute)
- [ ] The table of contents matches the `id`s on the `<h2>`s
- [ ] Nav and footer carry `Insights` with `active` on the nav link

## Step 5: draw the cover

Two files in `assets/images/insights/`, both named after the slug:

- `<slug>.svg` for the page
- `<slug>.png` for `og:image`

Use `assets/images/insights/double-diamond-design-process.svg` as the template.
It documents the system in its own header comment. The fixed parts:

- 1200 x 630, charcoal `#28292B` ground, blueprint grid at 40px
- One geometric motif that **carries the post's argument**, in spruce `#206A5B`
  fills with frosted `#9CE3F8` strokes. Not decoration: someone who has read the
  post should recognise the idea in the drawing.
- Three signature ticks top right, baseline rule, anté wordmark bottom left
- **No `<text>` elements anywhere.** Brand fonts do not load inside an `<img>`
  or in a PNG export, so any text would render in a fallback face. The label on
  top of the cover is HTML (`.cover-label`), not part of the drawing.

Render the PNG:

```bash
python3 .claude/skills/insights-post/make-cover-png.py <slug>
```

## Step 6: wire it in

- [ ] Add the post to `insights/index.html`: it becomes the new featured post,
      and the previous featured post moves into the grid as a `.post-card`
- [ ] Add it to the `blogPost` array in the Blog JSON-LD on that page
- [ ] Add a `<url>` block to `sitemap.xml`, and bump `<lastmod>` on
      `https://antedesign.be/insights/`
- [ ] Cross-link: at least one link to another Insights post or to a tool under
      `/tools/`, and one from the new post to `/approach/` or `/scorecard/`
- [ ] Move the topic from `TOPICS.md` into the Published list at the bottom

## Step 7: verify before committing

Serve it and actually look at it. Do not skip this.

```bash
python3 -m http.server 8899          # from the repo root
```

- [ ] Render at 1400px and at 390px wide. No horizontal scroll on the body.
- [ ] Every link in the Sources list returns 200
- [ ] The JSON-LD parses (`json.loads` each `application/ld+json` block)
- [ ] The copy button copies the prompt
- [ ] No em-dashes: `grep -n "—" insights/<slug>/index.html`
- [ ] Read the whole thing once, out loud if possible. If a sentence sounds like
      it was generated, rewrite it.

Commit in English, one commit for the post.

## What a bad post looks like

So you can recognise it in your own draft:

- It explains the model accurately and stops there. No claim, nothing at risk.
- The failure modes are generic ("communication is important").
- The history is taken from another blog and repeats its errors.
- The prompt is "act as an expert and help me with X".
- It uses the word "journey".
