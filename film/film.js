/* Anté film engine. Scenes are data below; wording comes from the live site (see README.md).
   ?cut=final (default) | 20   ?scenes=hook,answers,...   ?render=1 (paused, window.setT(t) for the renderer) */
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
  function nd(cls, s, t, small) { return X('div', 'nd ' + cls, s, '<b>' + t + '</b><small>' + small + '</small>').replace(' r"', ' pop"'); }
  function ar(cls, s) { return '<i class="ar ' + cls + '" style="--s:' + s + 's"></i>'; }
  function P(tag, cls, s, inner, at) { return X(tag, cls, s, inner, at).replace(' r"', ' pop"'); }
  var S = {
    hook: { d: 3.9, bg: 'sp', h: '<div class="b"><p class="q sm">' + W('Do you recognise this?', .3, .1) + '</p><p class="q big" style="margin-top:calc(var(--u)*3)">' + W('*“We *should *do *something *with *AI.”', 1.5, .1) + '</p></div>' },
    quotes: { d: 6.2, bg: 'dk', h: '<div class="b">' + P('p', 'bub e', .4, '<small>Engineering</small>“A service chatbot.”', ' style="--s:.4s"') + P('p', 'bub cl', 1.9, '<small>Client</small>“Some AI can fix this, right?”', ' style="--s:1.9s"') + P('p', 'bub pt', 3.4, '<small>Partner</small>“We can implement the AI structure.”', ' style="--s:3.4s"') + '</div>' },
    combine: { d: 7.8, bg: 'lf', h: '<div class="b cmb"><h2 class="h sh">' + W('We translate and *combine.', .3, .12) + '</h2><div class="cf"><div class="ins">' + P('span', 'in1', 1.2, 'User needs') + P('span', 'in1', 1.6, 'Team ideas') + P('span', 'in1', 2, 'Partner vision') + '</div>' + ar('c1', 2.6) +
      '<div class="mid">' + P('div', 'kn', 3, '<b>Product development</b>') + P('span', 'pl', 3.4, '+') + P('div', 'kn', 3.6, '<b>AI technology</b>') + '</div>' + ar('c2', 4.4) + P('div', 'res', 4.8, 'One clear product definition') + '</div></div>' },
    builders: { d: 7.6, bg: 'lt', h: '<div class="b"><p class="t3">' + W('An AI agency starts from the *technology.', .3, .12) + '</p><p class="t3">' + W('A builder works from a *vague *brief.', 2.8, .12) + '</p><p class="q fin">' + W('*The *wrong *product. *Expensive.', 5.1, .22) + '</p></div>' },
    checkmid: { d: 3.6, bg: 'dk', h: '<div class="b"><p class="q big">' + W('Not sure where your idea *stands?', .3, .12) + '</p><div class="fin">' + X('a', 'pill', 1.6, 'Take the AI Product Check &rarr;', ' href="/check/"') + '</div></div>' },
    notauto: { d: 5.2, bg: 'sp', h: '<div class="b"><h2 class="h">' + W('*Product *definition, not process automation.', .3, .1) + '</h2><div class="tags">' + ['Who it is for', 'What it does', 'What role AI plays', 'What comes first'].map(function (t, i) { return P('span', 'tg', 1.9 + i * .45, t); }).join('') + '</div></div>' },
    process: { d: 6.6, bg: 'lt', h: '<div class="b flow">' + nd('n1', 1.4, 'Opportunities', 'Find where AI can matter') + ar('a1', 1.2) + nd('def', .3, 'Product definition', 'A clear answer on what to build') + ar('a2', 2.5) + nd('n3', 2.7, 'MVP', 'Tested with real users') + ar('a3 ds', 3.8) + nd('n4 ho', 4, 'Handoff', 'Your team or a builder') + '</div>' },
    photos: { d: 2.4, bg: 'dk', h: '<div class="b b4">' + X('p', 'lab', .1, 'The definition workshop') + '<div class="phs">' +
      [1, 2, 3].map(function (n, i) { return '<div class="ph" style="--s:' + (.3 + i * .35).toFixed(2) + 's"><img src="img/p' + n + '.jpg" alt=""></div>'; }).join('') + '</div></div>' },
    hard: { d: 5.2, bg: 'lf', h: '<div class="b hard">' + X('p', 'lab', .1, 'Hard to copy') + X('div', 'hd', .5, '<b>Independent</b><p>No commission from builders.</p>') + X('div', 'hd', 1.5, '<b>Fluent</b><p>In every department.</p>') + X('div', 'hd', 2.5, '<b>Open</b><p>So people say what they really need.</p>') + '</div>' },
    close: { d: 3.6, bg: 'sp', h: '<div class="b"><h1 class="h">' + W('We design your next generation of *AI-driven *products.', .3, .11) + '</h1></div>' },
    cta: { d: 6, bg: 'lf', h: '<div class="b">' + X('p', 'lab', .3, 'AI Product Check') + '<h1 class="h">' + W('Your idea, questioned.', .5, .13) + '</h1><p class="sub">' +
      W('Nine questions, about ten minutes. Within one working day you get the questions we would ask before anyone builds it.', 1.3, .04) + '</p><div class="fin">' + X('a', 'pill', 3.1, 'antedesign.be/check &rarr;', ' href="/check/"') + '</div></div>' }
  };
  var CUTS = { final: 'hook,quotes,combine,builders,checkmid,notauto,process,photos,hard,close,cta', 20: 'hook,quotes,combine,notauto,cta' };
  var ids = (Q.get('scenes') || CUTS[Q.get('cut') || 'final'] || CUTS.final).split(','), t0 = 0, meta = [], html = '';
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
