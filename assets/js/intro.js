(function () {
  var h = document.documentElement, o = document.querySelector('.intro'), b = document.querySelector('.intro-skip'), out = false;
  document.fonts.ready.then(function () { window.__ready = true; });
  if (!o || !h.classList.contains('intro-on')) return;
  var m = /[?&]film=(\w+)/.exec(location.search); // ?film=20 plays the short cut
  o.firstElementChild.src = '/film/?embed=1&cut=' + (m ? m[1] : 'final');
  function finish() {
    if (out) return; out = true;
    h.classList.add('intro-out');
    setTimeout(function () { h.classList.add('intro-done'); o.remove(); b.remove(); removeEventListener('message', msg); removeEventListener('keydown', key); }, 1100);
  }
  function msg(e) { if (e.origin === location.origin && e.data && e.data.film === 'end') finish(); }
  function key(e) { if (e.key === 'Escape') finish(); }
  addEventListener('message', msg); addEventListener('keydown', key); b.addEventListener('click', finish);
  var wait = setTimeout(finish, 8000); // film never started (offline, blocked): show the site instead
  addEventListener('message', function (e) { if (e.origin === location.origin && e.data && e.data.film === 'start') clearTimeout(wait); });
  setTimeout(finish, 110000);
})();
