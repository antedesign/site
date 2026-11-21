# Anté film

One page that plays the Anté story as a film, built from CSS animation and real text (no video file).
Live: `/film/` (the 20-second cut). `/film/?cut=full` plays all scenes (about 50 s).
`/film/?scenes=hook,answers,check` plays any sequence. `?render=1` pauses it for the renderer.

## Scenes (`film.js`, object `S`)

| Scene | s | Wording comes from |
|---|---|---|
| hook | 4.4 | Home hero: "You know AI should be part of what you make next, but not what that is" |
| quote | 4.0 | Home: "We should do something with AI in our products." |
| answers | 4.6 | Home: "your team sees it differently", plus the Sales and Engineering cards |
| notbrief | 4.2 | Home: "Something with AI" is not a brief anyone can build from |
| builder | 5.8 | Home: the AI agency and builder lines |
| define | 4.0 | Home hero: H1 and first sentence of the subhead |
| what | 5.4 | Home: "Product definition, not process automation." and the lead paragraph |
| three | 7.0 | Home: "Three things are hard to copy." |
| photos | 2.2 | `img/p1-3.jpg` (case-01 to 03, workshop photos, resized) |
| check | 4.8 | Home: the AI Product Check line, link to `/check/` |
| decide | 3.2 | "Decide before you build." |

The 20 s cut is `hook, answers, define, photos, check`. Change cuts in `CUTS` in `film.js`.
If the site copy changes, change the scene text here too. Tone rules: no em dashes, no exclamation marks.

## Make an MP4 (needs node, `npm i playwright`, ffmpeg)

```bash
node scripts/film-render.js --cut=20 --size=1920x1080 --out=/tmp/film          # landscape
node scripts/film-render.js --cut=20 --size=1080x1920 --out=/tmp/film          # vertical
node scripts/film-render.js --cut=full --size=1920x1080 --out=/tmp/film --clips # plus one MP4 per scene
```

It takes about 1.5 min per 20 s. Clips run from the start of a scene's wipe to the end of its hold, so they cut cleanly.
Voice-over or music: add it in an editor or with `ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -shortest out.mp4`. Autoplay with sound does not work on the site.
Adding a scene: add an entry to `S` (duration `d`, background `sp|dk|lt|lf`, HTML `h` with `W()` word reveals), then use its name in `?scenes=`.
