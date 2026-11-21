/* Anté film engine. Scenes are data below; wording comes from the live site (see README.md).
   ?cut=final (default, slow) | 20   ?scenes=hook,combine:.6,...   ?k=1.3 (global speed, higher = slower)
   ?render=1 (paused, window.setT(t) for the renderer)   ?embed=1 (inside the home opening, posts "end" to the parent) */
(function () {
  var Q = new URLSearchParams(location.search), H = document.documentElement, R = Q.has('render'), E = Q.has('embed'), k = 1;
  function n(x) { return (x * k).toFixed(2); }
  // W: words that rise out of a mask. "*word" = accent colour. s = local start (s), g = gap per word (s)
  function W(t, s, g) {
    return t.split(' ').map(function (w, i) {
      var a = w[0] === '*';
      return '<span class="w"><i' + (a ? ' class="g"' : '') + ' style="--s:' + n(s + i * g) + 's">' + (a ? w.slice(1) : w) + '</i></span>';
    }).join(' ');
  }
  function X(tag, cls, s, inner, at) { return '<' + tag + ' class="' + cls + ' r" style="--s:' + n(s) + 's"' + (at || '') + '>' + inner + '</' + tag + '>'; }
  function P(tag, cls, s, inner, at) { return X(tag, cls, s, inner, at).replace(' r"', ' pop"'); }
  function ar(cls, s) { return '<i class="ar ' + cls + '" style="--s:' + n(s) + 's"></i>'; }
  function nd(cls, s, t, small) { return P('div', 'nd ' + cls, s, '<b>' + t + '</b><small>' + small + '</small>'); }
  var S = {
    hook: function () { return { d: 3.9, bg: 'sp', h: '<div class="b"><p class="q sm">' + W('Do you recognise this?', .3, .1) + '</p><p class="q big" style="margin-top:calc(var(--u)*3)">' + W('*“We *should *do *something *with *AI.”', 1.5, .1) + '</p></div>' }; },
    quotes: function () { return { d: 6.2, bg: 'dk', h: '<div class="b">' + P('p', 'bub e', .4, '<small>Engineering</small>“A service chatbot.”') + P('p', 'bub cl', 1.9, '<small>Client</small>“Some AI can fix this, right?”') + P('p', 'bub pt', 3.4, '<small>Partner</small>“We can implement the AI structure.”') + '</div>' }; },
    combine: function () { return { d: 8.2, bg: 'lf', h: '<div class="b cmb"><h2 class="h sh">' + W('We translate and *combine.', .3, .12) + '</h2><div class="cf"><div class="ins">' +
      P('span', 'in1', 1.2, 'User needs') + P('span', 'in1', 1.6, 'Team ideas') + P('span', 'in1', 2, 'Partner vision') + '</div>' + P('span', 'pl', 3, '+') + '<div class="ins">' +
      P('span', 'in1', 3.5, 'Product development') + P('span', 'in1', 3.9, 'AI technology') + '</div>' + ar('c2', 4.8) + P('div', 'res', 5.2, 'One clear product definition') + '</div></div>' }; },
    builders: function () { return { d: 7.6, bg: 'lt', h: '<div class="b"><p class="t3">' + W('An AI agency starts from the *technology.', .3, .12) + '</p><p class="t3">' + W('A builder works from a *vague *brief.', 2.8, .12) +
      '</p><p class="q fin">' + W('*The *wrong *product. *Expensive.', 5.1, .22) + '</p></div>' }; },
    checkmid: function () { return { d: 3.6, bg: 'dk', h: '<div class="b"><p class="q big">' + W('Not sure where your idea *stands?', .3, .12) + '</p><div class="fin">' + X('a', 'pill', 1.6, 'Take the AI Product Check &rarr;', ' href="/check/"') + '</div></div>' }; },
    notauto: function () { return { d: 5.2, bg: 'sp', h: '<div class="b"><h2 class="h">' + W('*Product *definition, not process automation.', .3, .1) + '</h2><div class="tags">' +
      ['Who it is for', 'What it does', 'What role AI plays', 'What comes first'].map(function (t, i) { return P('span', 'tg', 1.9 + i * .45, t); }).join('') + '</div></div>' }; },
    process: function () { return { d: 6.6, bg: 'lt', h: '<div class="b flow">' + nd('n1', 1.4, 'Opportunities', 'Find where AI can matter') + ar('a1', 1.2) + nd('def', .3, 'Product definition', 'A clear answer on what to build') + ar('a2', 2.5) +
      nd('n3', 2.7, 'MVP', 'Tested with real users') + ar('a3 ds', 3.8) + nd('n4 ho', 4, 'Handoff', 'Your team or a builder') + '</div>' }; },
    // the green "Product definition" box of the previous scene grows into this screen: the workshop is part of that step
    photos: function () { return { d: 4.6, bg: 'sp', grow: '.def', h: '<div class="b b4"><h2 class="h sh">' + W('*Product *definition', .9, .15) + '</h2>' + X('p', 'lab', 1.5, 'The definition workshop') + '<div class="phs">' +
      [1, 2, 3].map(function (m, i) { return '<div class="ph" style="--s:' + n(1.9 + i * .35) + 's"><img src="img/p' + m + '.jpg" alt=""></div>'; }).join('') + '</div></div>' }; },
    hard: function () { return { d: 5, bg: 'lf', h: '<div class="b hard">' + X('div', 'hd', .3, '<b>Independent</b><p>No commission from builders.</p>') + X('div', 'hd', 1.4, '<b>Fluent</b><p>In every department.</p>') + X('div', 'hd', 2.5, '<b>Open</b><p>So people say what they really need.</p>') + '</div>' }; },
    close: function () { return { d: 3.8, bg: 'sp', h: '<div class="b"><h1 class="h">' + W('We design your next generation of *AI-driven *products.', .3, .11) + '</h1>' + X('p', 'url', 2, 'antedesign.be') + '</div>' }; }
  };
  var CUTS = {
    final: 'hook,quotes,combine,builders,checkmid,notauto,process,photos,hard,close',
    20: 'hook:.72,combine:.6,checkmid:.55,notauto:.54,process:.55,photos:.43,close:.53'
  };
  var K0 = parseFloat(Q.get('k')) || 1.3, spec = (Q.get('scenes') || CUTS[Q.get('cut') || 'final'] || CUTS.final).split(','), t0 = 0, meta = [], html = '', grows = [];
  spec.forEach(function (x, i) {
    var p = x.split(':'), id = p[0], last = i === spec.length - 1;
    k = p[1] ? parseFloat(p[1]) : (Q.get('cut') === '20' && !Q.get('scenes') ? .6 : K0);
    var s = S[id](), d = s.d * k;
    if (s.grow && i) grows.push(i);
    html += '<section class="L ' + s.bg + (i ? '' : ' L0') + (s.grow && i ? ' Lg' : '') + '" style="--b:' + t0.toFixed(2) + 's;--o:' + (last ? 999 : (d - .5).toFixed(2)) + 's;z-index:' + (i + 1) + '"><img class="wm" src="/assets/images/ante-wordmark-pastel.png" alt="">' + s.h + '</section>';
    meta.push({ id: id, start: t0, dur: d, grow: s.grow });
    t0 += d;
  });
  var stage = document.getElementById('stage'); stage.innerHTML = html;
  document.getElementById('sr').textContent = stage.textContent.replace(/\s+/g, ' ');
  window.FILM = { total: t0, scenes: meta };
  H.classList.add('hold'); if (R) H.classList.add('fr'); if (E) H.classList.add('emb');
  window.setT = function (t) { H.style.setProperty('--t', t + 's'); };
  function place() { // where the previous scene's box sits, so the next screen can grow out of it
    var L = stage.children, w = innerWidth, h = innerHeight;
    grows.forEach(function (i) {
      var el = L[i - 1].querySelector(meta[i].grow);
      if (!el) { L[i].classList.remove('Lg'); return; }
      var r = el.getBoundingClientRect();
      [['T', r.top], ['R', w - r.right], ['B', h - r.bottom], ['L', r.left]].forEach(function (v) { L[i].style.setProperty('--c' + v[0], Math.max(0, v[1]).toFixed(1) + 'px'); });
    });
  }
  addEventListener('resize', place);
  var need = [document.fonts.ready].concat([].filter.call(document.images, function (i) { return R || /wordmark/.test(i.src); }).map(function (i) { return i.decode().catch(function () {}); }));
  Promise.all(need).then(function () {
    place(); window.__ready = true;
    if (R) return;
    H.classList.remove('hold');
    if (E) parent.postMessage({ film: 'start' }, location.origin);
    setTimeout(function () {
      if (E) parent.postMessage({ film: 'end' }, location.origin); else document.querySelector('.replay').hidden = false;
    }, (t0 + 1.2) * 1000);
  });
  document.querySelector('.replay').onclick = function () { location.reload(); };
})();
