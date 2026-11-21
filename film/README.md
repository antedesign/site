# Anté film

One page that plays the Anté story as a film, built from CSS animation and real text (no video file).
Live: `/film/` (the full film, about 58 s). `/film/?cut=20` is a shorter cut.
`/film/?scenes=hook,answers,check` plays any sequence. `?render=1` pauses it for the renderer.

## Scenes (`film.js`, object `S`)

Colour changes every scene: spruce, charcoal, frosted, white. Texts are short on purpose, no sub-headings.

| Scene | s | What and where the wording comes from |
|---|---|---|
| hook | 3.9 | "Do you recognise this?" and “We should do something with AI.” (all blue) |
| quotes | 6.2 | Three bubbles: engineering "A service chatbot.", client "Some AI can fix this, right?", partner "We can implement the AI structure." (partner line is a proposal) |
| combine | 7.8 | "We translate and combine." User needs, Team ideas, Partner vision, then our product development plus AI technology, into "One clear product definition". Not "everyone backs": we define what is best, not the middle way |
| builders | 7.6 | Home: AI agency and builder lines, shortened, slow reveal |
| checkmid | 3.6 | "Not sure where your idea stands?" with a link to the AI Product Check |
| notauto | 5.2 | Home: "Product definition, not process automation." plus who it is for, what it does, what role AI plays, what comes first |
| process | 6.6 | Opportunities, Product definition (centre), MVP, and the handoff to your team or a builder (home: lead paragraph) |
| photos | 2.4 | `img/p1-3.jpg` (case-01 to 03, workshop photos, resized) |
| hard | 5.2 | Home: "Three things are hard to copy", shortened to one word each |
| close | 3.6 | "We design your next generation of AI-driven products." |
| cta | 6.0 | AI Product Check, "Your idea, questioned.", link to `/check/` (check page wording) |

`/film/` plays `final` (all scenes, about 58 s). `?cut=20` is a short cut (hook, quotes, combine, notauto, cta), change cuts in `CUTS`.
If the site copy changes, change the scene text here too. Tone rules: no em dashes, no exclamation marks.

## Make an MP4 (needs node, `npm i playwright`, ffmpeg)

```bash
node scripts/film-render.js --cut=final --size=1920x1080 --out=/tmp/film --clips # landscape, plus one MP4 per scene
node scripts/film-render.js --cut=final --size=1080x1920 --out=/tmp/film --clips # vertical
```

It takes about 1.5 min per 20 s of film. Clips run from the start of a scene's wipe to the end of its hold, so they cut cleanly.
Voice-over or music: add it in an editor or with `ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -shortest out.mp4`. Autoplay with sound does not work on the site.
Adding a scene: add an entry to `S` (duration `d`, background `sp|dk|lt|lf`, HTML `h` with `W()` word reveals), then use its name in `?scenes=`.
