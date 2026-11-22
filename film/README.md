# Anté film

One page that plays the Anté story as a film, built from CSS animation and real text (no video file).
Live: `/film/` (the full film, about 55 s). `/film/?cut=20` is a shorter cut.
`/film/?scenes=hook,answers,check` plays any sequence. `?render=1` pauses it for the renderer.

## Scenes (`film.js`, object `S`)

Order follows the landing page: the problem, what we do, why us, what you get. Wording is taken from the live site (home, approach, about, cases) and from `ante-base/30-sales/doelgroep.md` for the stakeholder voices. Colour changes every scene.

| Scene | base s | What and where the wording comes from |
|---|---|---|
| hook | 3.9 | "Do you recognise this?" and “We should do something with AI.” |
| voices | 6.6 | Five roles, each wants something else: Engineering, Sales, Marketing, Partners, The board (lines from the approach example and the buyer profile). Then "Everyone has a different vision." |
| combine | 8.2 | "We translate and combine." User needs, Team ideas, Partner vision, plus Product development, plus AI knowledge (about page), into "One clear product definition" |
| agencies | 6.6 | Home: "An AI agency knows the technology but not your product. A design agency knows your product but not enough about AI." and "We bring both." |
| cost | 8.0 | Home: "The earlier you define it, the less it costs." Animated cost curve, a cross where the product definition sits, then "A clear product definition costs less than the wrong product." |
| notauto | 5.2 | Home: "Product definition, not process automation." plus who it is for, what it does, what role AI plays, what comes first |
| timeline | 7.4 | The three services of the approach page as a timeline: left to right on landscape, bottom to top on portrait (one flex-direction in `film.css`, search `column-reverse`). Handoff to your team or a builder hangs under step 2 |
| photos | 4.6 | The green "AI Product Definition" card grows into this screen, so the workshop photos read as part of that step. `img/p1-3.jpg` (case-01 to 03, resized) |
| why | 6.4 | Home: Independent advice, Fresh eyes on your product, Everyone feels heard, with the site's own sentences |
| cta | 7.6 | "We define your next AI product." then contact or the free AI Product Check. The two pills link to `/contact/` and `/check/` on the live page |

Every start time and duration is multiplied by a speed factor k (full film: .85, about 55 s; higher = slower).
Per scene: `?scenes=hook:.7,combine:.6`. `?cut=20` is the 20 s essence (hook, combine, agencies, notauto, timeline, photos, cta) with its own k per scene.
If the site copy changes, change the scene text here too. Tone rules: no em dashes, no exclamation marks.

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
