# Anté film

One page that plays the Anté story as a film, built from CSS animation and real text (no video file).
Live: `/film/` (the full film, about 71 s). `/film/?cut=20` is a shorter cut.
`/film/?scenes=hook,answers,check` plays any sequence. `?render=1` pauses it for the renderer.

## Scenes (`film.js`, object `S`)

Colour changes every scene: spruce, charcoal, frosted, white. Texts are short on purpose, no sub-headings.

| Scene | base s | What and where the wording comes from |
|---|---|---|
| hook | 3.9 | "Do you recognise this?" and “We should do something with AI.” (all blue) |
| quotes | 6.2 | Three bubbles: engineering "A service chatbot.", client "Some AI can fix this, right?", partner "We can implement the AI structure." (partner line is a proposal) |
| combine | 8.2 | "We translate and combine." User needs, Team ideas, Partner vision, plus Product development and AI technology, into "One clear product definition". Not "everyone backs": we define what is best, not the middle way |
| builders | 7.6 | Home: AI agency and builder lines, shortened, slow reveal |
| checkmid | 3.6 | "Not sure where your idea stands?" with a link to the AI Product Check |
| notauto | 5.2 | Home: "Product definition, not process automation." plus who it is for, what it does, what role AI plays, what comes first |
| process | 6.6 | Opportunities, Product definition (centre), MVP, and the handoff to your team or a builder (home: lead paragraph) |
| photos | 4.6 | The green "Product definition" box grows into this screen, so the workshop photos read as part of that step. `img/p1-3.jpg` (case-01 to 03, resized) |
| hard | 5.0 | Home: "Three things are hard to copy", shortened to one word each, no sub-heading |
| close | 3.8 | "We design your next generation of AI-driven products." |

Every start time and duration is multiplied by a speed factor k (full film: 1.3, so about 71 s; higher = slower).
Per scene: `?scenes=hook:.7,combine:.6` . `?cut=20` is the 20 s essence (hook, combine, checkmid, notauto, process, photos, close) with its own k per scene.

## Home opening

The home page plays `/film/?embed=1` full screen in an iframe (`assets/js/intro.js`, `assets/css/intro.css`), then the hero reveals under a curtain.
Skip button and Esc skip it. It is off for reduced motion, for visitors coming from another page of the site, and with `?intro=0`.
`index.html?film=20` plays the short cut as the opening. No storage of any kind is used (cookie policy).
To change which cut is the default opening, change `'final'` in `intro.js`.

If the site copy changes, change the scene text here too. Tone rules: no em dashes, no exclamation marks.

## Make an MP4 (needs node, `npm i playwright`, ffmpeg)

```bash
node scripts/film-render.js --cut=final --size=1920x1080 --out=/tmp/film --clips # landscape, plus one MP4 per scene
node scripts/film-render.js --cut=final --size=1080x1920 --out=/tmp/film --clips # vertical
```

It takes about 1.5 min per 20 s of film. Clips run from the start of a scene's wipe to the end of its hold, so they cut cleanly.
Voice-over or music: add it in an editor or with `ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -shortest out.mp4`. Autoplay with sound does not work on the site.
Adding a scene: add an entry to `S` (duration `d`, background `sp|dk|lt|lf`, HTML `h` with `W()` word reveals), then use its name in `?scenes=`.
