(function () {
  var h = document.documentElement, q = location.search, o = document.querySelector('.intro'), b = document.querySelector('.intro-skip');
  document.fonts.ready.then(function () { window.__ready = true; });
  if (!o || !h.classList.contains('intro-on')) return;
  var t = /[?&]t=(-?[\d.]+)/.exec(q), done = false;
  function end() {
    if (done) return; done = true;
    h.classList.add('intro-done'); o.remove(); b.remove(); document.removeEventListener('keydown', key);
  }
  function skip() {
    if (done || h.classList.contains('intro-skip')) return;
    h.classList.add('intro-skip');
    [].forEach.call(document.querySelectorAll('.hero .hl-line,.hero-subhead,.hero .btn-group'), function (e, i) {
      e.getAnimations().forEach(function (a) { a.effect.updateTiming({ delay: 150 + i * 80 }); a.currentTime = 0; });
    });
    setTimeout(end, 950);
  }
  function key(e) { if (e.key === 'Escape') skip(); }
  if (t) { h.style.setProperty('--t', parseFloat(t[1]) + 's'); h.classList.add('intro-freeze'); }
  else setTimeout(end, 6400);
  o.addEventListener('click', skip); b.addEventListener('click', skip); document.addEventListener('keydown', key);
})();
