# antedesign.be — werkregels voor Claude Code

De site is een statische HTML-site (GitHub Pages). Alles over de structuur staat in
`README.md`; dit bestand bevat alleen de regels die bij elke wijziging gelden.

## Engels en Nederlands zijn gekoppeld

Zeven pagina's bestaan in twee talen (tabel in `README.md` § Dutch version). Ze zijn
**één pagina in twee talen**, geen twee pagina's.

- **Pas je een Engelse pagina aan, pas dan in dezelfde commit de Nederlandse aan**, en
  omgekeerd. Dat geldt voor tekst, volgorde, nieuwe of geschrapte secties, beelden,
  knoppen en links. Een nieuwe sectie in het Engels krijgt dezelfde sectie in het
  Nederlands, vertaald.
- **Draai voor je commit `python3 scripts/check-nl.py`.** Het vergelijkt de opbouw van
  elk paar (secties, volgorde, classes, ids, beelden, formulieren), de taalswitch, de
  `hreflang`-regels en de sitemap. Nul verschillen is de norm. Dezelfde controle draait
  op GitHub bij elke push en pull request (`.github/workflows/check-nl.yml`).
- **Een nieuwe pagina in twee talen:** voeg het paar toe aan `PAIRS` in
  `scripts/check-nl.py`, geef beide versies dezelfde drie `hreflang`-regels en de
  taalswitch, en zet beide in `sitemap.xml` met hun `xhtml:link`-regels.
- **Toon van de Nederlandse tekst:** Belgisch Nederlands, `je`-vorm (voorstel, nog niet
  beslist), geen gedachtestreepjes, geen uitroeptekens, dienstnamen en de tagline
  "Decide before you build." blijven Engels.

## De taalswitch

`.lang-switch` staat op elke pagina met een menubalk, rechts onder de balk. De actieve
taal is gevuld. Wijzig je de navigatie, dan ook `scripts/shell/nav.html` (nieuwe posts).

## Stylesheet

`shared.css` wordt geladen als `shared.css?v=<hash>`. Wijzig je `shared.css`, zet dan op
alle pagina's en in `scripts/build-post.py` de `v` op de eerste tien tekens van
`sha1sum assets/css/shared.css`. Anders kan een browser tot tien minuten een nieuwe
pagina met een oude stijl tonen (GitHub Pages: `Cache-Control: max-age=600`).
