/* Anté film engine. Scenes are data below; wording comes from the live site (see README.md).
   ?cut=20 (default) | full   ?scenes=hook,answers,...   ?render=1 (paused, window.setT(t) for the renderer) */
(function () {
  var Q = new URLSearchParams(location.search), H = document.documentElement, R = Q.has('render');
  // W: words that rise out of a mask. "*word" = accent colour. s = local start (s), g = gap per word (s)
  function W(t, s, g) {
    return t.split(' ').map(function (w, i) {
      var a = w[0] === '*';
      return '<span class="w"><i' + (a ? ' class="g"' : '') + ' style="--s:' + (s + i * g).toFixed(2) + 's">' + (a ? w.slice(1) : w) + '</i></span>';
    }).join(' ');
  }
  function X(tag, cls, s, inner, at) { return '<' + tag + ' class="' + cls + ' r" style="--s:' + s + 's"' + (at || '') + '>' + inner + '</' + tag + '>'; }
  function card(a, b, s, r) { return '<div class="c" style="--s:' + s + 's;--r:' + r + '"><span class="chip">' + a + '</span><p>' + b + '</p></div>'; }
  function row(n, t, s) { return X('div', 'row', s, '<span class="n">' + n + '</span><p>' + t + '</p>'); }
  var S = {
    hook: { d: 4.4, bg: 'sp', h: '<div class="b"><p class="q big">' + W('You know AI should be part of what you make next,', .3, .08) + '<br>' + W('*but *not *what *that *is.', 1.9, .12) + '</p></div>' },
    quote: { d: 4, bg: 'sp', h: '<div class="b">' + X('p', 'lab', .2, 'What the team started with') + '<p class="q">' + W('“We should do something with AI in our products.”', .5, .1) + '</p></div>' },
    answers: { d: 4.6, bg: 'sp', h: '<div class="b b2">' + X('p', 'lab', .1, 'And your team sees it differently') + '<div class="cards">' +
      card('Sales', 'Something that beats the competitor\'s new app. A chatbot, maybe.', .9, '-1.6deg') + card('Engineering', 'Nothing that can stop or slow the line on its own.', 1.7, '1.4deg') + '</div></div>' },
    notbrief: { d: 4.2, bg: 'dk', h: '<div class="b"><p class="q">' + W('*“Something *with *AI” is not a brief anyone can build from.', .3, .1) + '</p></div>' },
    builder: { d: 5.8, bg: 'lt', h: '<div class="b"><p class="t">' + W('An AI agency starts from the technology, *not *from *your *product.', .3, .06) + '</p>' + X('hr', '', 2.0, '').replace('></hr>', '>') +
      '<p class="t">' + W('A builder quotes on the question you give it. A vague question gets a vague quote, and a *big *bill *later.', 2.5, .05) + '</p></div>' },
    define: { d: 4, bg: 'lt', h: '<div class="b"><h1 class="h">' + W('Define *your *next *AI *product.', .4, .13) + '</h1><p class="sub">' + W('Anté writes one product definition everyone backs, before you spend on development.', 1.6, .045) + '</p></div>' },
    what: { d: 5.4, bg: 'lt', h: '<div class="b"><h2 class="h">' + W('*Product *definition, not process automation.', .3, .1) + '</h2><p class="sub">' +
      W('We write down what your next product should be: who it is for, what it does, what role AI plays and what comes first.', 1.5, .04) + '</p></div>' },
    three: { d: 7, bg: 'sp', h: '<div class="b three"><h2 class="t2">' + W('Three things are hard to copy.', .2, .1) + '</h2><div class="rows">' +
      row('01', 'Independent: no commission from builders, no stake in who builds the final product.', 1.4) + row('02', 'We speak the language of every department.', 2.6) +
      row('03', 'Open-minded, so people tell us what they really need.', 3.8) + '</div></div>' },
    photos: { d: 2.2, bg: 'lt', h: '<div class="b b4">' + X('p', 'lab', .1, 'The definition workshop') + '<div class="phs">' +
      [1, 2, 3].map(function (n, i) { return '<div class="ph" style="--s:' + (.3 + i * .35).toFixed(2) + 's"><img src="img/p' + n + '.jpg" alt=""></div>'; }).join('') + '</div></div>' },
    check: { d: 4.8, bg: 'lf', h: '<div class="b">' + X('p', 'lab', .3, 'AI Product Check') + '<h1 class="h">' + W('Your idea, questioned.', .5, .13) + '</h1><p class="sub">' +
      W('Not sure where your idea stands? Take the AI Product Check and get the questions we would ask.', 1.3, .035) + '</p>' + X('a', 'pill', 2.5, 'antedesign.be/check &rarr;', ' href="/check/"') + '</div>' },
    decide: { d: 3.2, bg: 'dk', h: '<div class="b"><h1 class="h big">' + W('*Decide *before *you *build.', .3, .15) + '</h1>' + X('p', 'url', 1.6, 'antedesign.be') + '</div>' }
  };
  var CUTS = { 20: 'hook,answers,define,photos,check', full: 'hook,quote,answers,notbrief,builder,define,what,three,photos,check,decide' };
  var ids = (Q.get('scenes') || CUTS[Q.get('cut') || 20] || CUTS[20]).split(','), t0 = 0, meta = [], html = '';
  ids.forEach(function (id, i) {
    var s = S[id], last = i === ids.length - 1;
    html += '<section class="L ' + s.bg + (i ? '' : ' L0') + '" style="--b:' + t0.toFixed(2) + 's;--o:' + (last ? 999 : (s.d - .5).toFixed(2)) + 's;z-index:' + (i + 1) + '"><img class="wm" src="/assets/images/ante-wordmark-pastel.png" alt="">' + s.h + '</section>';
    meta.push({ id: id, start: t0, dur: s.d });
    t0 += s.d;
  });
  var stage = document.getElementById('stage'); stage.innerHTML = html;
  document.getElementById('sr').textContent = stage.textContent.replace(/\s+/g, ' ');
  window.FILM = { total: t0, scenes: meta };
  H.classList.add('hold'); if (R) H.classList.add('fr');
  window.setT = function (t) { H.style.setProperty('--t', t + 's'); };
  var imgs = [].map.call(document.images, function (i) { return i.decode().catch(function () {}); });
  Promise.all(imgs.concat(document.fonts.ready)).then(function () {
    window.__ready = true;
    if (R) return;
    H.classList.remove('hold');
    setTimeout(function () { document.querySelector('.replay').hidden = false; }, t0 * 1000);
  });
  document.querySelector('.replay').onclick = function () { location.reload(); };
})();
