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
  var VO = [['Engineering', 'Nothing that can slow down the line.'], ['Sales', 'Something that beats the competitor\'s new app.'], ['Marketing', 'Something we can launch.'], ['Partners', 'We can implement the AI structure.'], ['The board', 'A new product line, not just a feature.']];
  function step(i, s, name, small, extra, def) {
    var ab = ['--la:50%;--lb:0%;--ta:0;--tb:50%', '--la:0%;--lb:0%;--ta:0;--tb:0', '--la:0%;--lb:50%;--ta:50%;--tb:0'][i];
    return '<div class="st" style="' + ab + '"><i class="lk" style="--s:' + n(s) + 's"></i>' + P('i', 'dt', s + .2, '') + P('div', 'stc' + (def ? ' def' : ''), s + .3, '<small>0' + (i + 1) + '</small><b>' + name + '</b><i>' + small + '</i>') + (extra || '') + '</div>';
  }
  var S = {
    hook: function () { return { d: 3.9, bg: 'sp', h: '<div class="b"><p class="q sm">' + W('Do you recognise this?', .3, .1) + '</p><p class="q big" style="margin-top:calc(var(--u)*3)">' + W('*“We *should *do *something *with *AI.”', 1.5, .1) + '</p></div>' }; },
    voices: function () { return { d: 6.6, bg: 'dk', h: '<div class="b"><div class="vx">' + VO.map(function (v, i) { return '<p class="vb" style="--s:' + n(.3 + i * .6) + 's;--r:' + [-1.4, 1.2, -.8, 1.5, -1.2][i] + 'deg"><small>' + v[0] + '</small>“' + v[1] + '”</p>'; }).join('') + '</div><p class="q">' + W('*Everyone *has *a *different *vision.', 3.8, .13) + '</p></div>' }; },
    combine: function () { return { d: 8.2, bg: 'lf', h: '<div class="b cmb"><h2 class="h sh">' + W('We translate and *combine.', .3, .12) + '</h2><div class="cf"><div class="ins">' +
      P('span', 'in1', 1.2, 'User needs') + P('span', 'in1', 1.6, 'Team ideas') + P('span', 'in1', 2, 'Partner vision') + '</div>' + P('span', 'pl', 3, '+') + '<div class="ins">' +
      P('span', 'in1', 3.5, 'Product development') + P('span', 'in1', 3.9, 'AI knowledge') + '</div>' + ar('c2', 4.8) + P('div', 'res', 5.2, 'One clear product definition') + '</div></div>' }; },
    agencies: function () { return { d: 6.6, bg: 'lt', h: '<div class="b"><p class="t3">' + W('An AI agency knows the *technology but not your product.', .3, .09) + '</p><p class="t3">' + W('A design agency knows your *product but not enough about AI.', 2.2, .09) +
      '</p><p class="q fin">' + W('*We *bring *both.', 4.4, .22) + '</p></div>' }; },
    cost: function () { return { d: 8, bg: 'lt', h: '<div class="b cost"><h2 class="h sh">' + W('The earlier you define it, the *less *it *costs.', .3, .09) + '</h2><svg class="cv" viewBox="0 0 640 280">' +
      '<g class="r" style="--s:' + n(1.1) + 's"><path d="M50 18V242H622" fill="none" stroke="currentColor" stroke-width="3"/><text x="58" y="14">Cost of undoing a mistake</text><text x="622" y="270" text-anchor="end">Time in the process</text></g>' +
      '<path class="dr" pathLength="1" style="--s:' + n(1.6) + 's" d="M50 234C230 228 360 206 450 140S570 46 612 24" fill="none" stroke="#206A5B" stroke-width="6" stroke-linecap="round"/>' +
      '<g id="mk"><line x1="0" y1="0" x2="0" y2="150" stroke="currentColor" stroke-width="2" stroke-dasharray="6 6" class="r" style="--s:' + n(2.7) + 's"/><g class="pop" style="--s:' + n(2.6) + 's"><circle r="20" fill="#206A5B"/><path d="M-8 -8L8 8M8 -8L-8 8" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>' +
      '<g class="pop" style="--s:' + n(2.9) + 's"><rect x="-82" y="-70" width="164" height="34" rx="17" fill="#206A5B"/><text class="mkl" x="0" y="-48" text-anchor="middle">Product definition</text></g></g></svg>' +
      '<p class="sub">' + W('A clear product definition costs less than the wrong product.', 5.1, .06) + '</p></div>' }; },
    notauto: function () { return { d: 5.2, bg: 'sp', h: '<div class="b"><h2 class="h">' + W('*Product *definition, not process automation.', .3, .1) + '</h2><div class="tags">' +
      ['Who it is for', 'What it does', 'What role AI plays', 'What comes first'].map(function (t, i) { return P('span', 'tg', 1.9 + i * .45, t); }).join('') + '</div></div>' }; },
    timeline: function () { return { d: 7.4, bg: 'lt', h: '<div class="b tl">' + step(0, .3, 'AI Opportunity Exploration', 'Find where AI fits') +
      step(1, 1.5, 'AI Product Definition', 'Define what to build', P('span', 'ho2', 4, 'Or hand off to your team or a builder'), true) + step(2, 2.7, 'Prototype &amp; Validation', 'MVP tested with real users') + '</div>' }; },
    // the green "AI Product Definition" card of the timeline grows into this screen: the workshop is part of that step
    photos: function () { return { d: 4.6, bg: 'sp', grow: '.def', h: '<div class="b b4"><h2 class="h sh">' + W('*AI *Product *Definition', .9, .15) + '</h2>' + X('p', 'lab', 1.5, 'User research · interviews · workshops') + '<div class="phs">' +
      [1, 2, 3].map(function (m, i) { return '<div class="ph" style="--s:' + n(1.9 + i * .35) + 's"><img src="img/p' + m + '.jpg" alt=""></div>'; }).join('') + '</div></div>' }; },
    why: function () { return { d: 6.4, bg: 'lf', h: '<div class="b why">' + X('div', 'wy', .3, '<b>Independent advice</b><p>We don\'t build the final product, so our advice stays objective.</p>') +
      X('div', 'wy', 1.9, '<b>Fresh eyes on your product</b><p>We are the generation that will use tomorrow\'s products.</p>') + X('div', 'wy', 3.5, '<b>Everyone feels heard</b><p>We know enough about every field to understand users, stakeholders and your team.</p>') + '</div>' }; },
    cta: function () { return { d: 7.6, bg: 'sp', h: '<div class="b cta"><h1 class="h">' + W('We define your *next *AI *product.', .3, .12) + '</h1><p class="sub">' +
      W('Contact us for more info, or take the free AI Product Check to see where you stand.', 1.6, .05) + '</p><div class="pills">' + X('a', 'pill', 3.7, 'Get in touch &rarr;', ' href="/contact/"') + X('a', 'pill o', 4.1, 'Free AI Product Check &rarr;', ' href="/check/"') + '</div>' + X('p', 'url', 4.7, 'antedesign.be') + '</div>' }; }
  };
  var CUTS = {
    final: 'hook,voices,combine,agencies,cost,notauto,timeline,photos,why,cta',
    20: 'hook:.57,combine:.56,agencies:.5,notauto:.46,timeline:.43,photos:.39,cta:.46'
  };
  var K0 = parseFloat(Q.get('k')) || .85, spec = (Q.get('scenes') || CUTS[Q.get('cut') || 'final'] || CUTS.final).split(','), t0 = 0, meta = [], html = '', grows = [];
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
  (function () { var p = stage.querySelector('.dr'), g = stage.querySelector('#mk'); if (p && g) { var q = p.getPointAtLength(p.getTotalLength() * .17); g.setAttribute('transform', 'translate(' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) + ')'); g.querySelector('line').setAttribute('y2', (242 - q.y).toFixed(1)); } })();
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
    }, (t0 + 1.8) * 1000);
  });
  document.querySelector('.replay').onclick = function () { location.reload(); };
})();
