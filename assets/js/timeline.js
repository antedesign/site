/* Approach: the vertical timeline fills while you scroll, and each phase lights up when reached. */
(function () {
  var tl = document.querySelector('.timeline');
  if (!tl) return;
  var rail = tl.querySelector('.timeline-rail');
  var fill = tl.querySelector('.timeline-fill');
  var steps = [].slice.call(tl.querySelectorAll('.timeline-step'));
  var NODE = 23;            /* half the node height: the rail runs from node centre to node centre */
  var railTop = 0, railH = 0;

  function update() {
    var r = tl.getBoundingClientRect();
    var mid = window.innerHeight * 0.5;
    var f = Math.max(0, Math.min(railH, mid - r.top - railTop));
    fill.style.height = f + 'px';
    steps.forEach(function (s) { s.classList.toggle('is-reached', mid >= r.top + s.offsetTop + NODE); });
  }
  function layout() {
    railTop = steps[0].offsetTop + NODE;
    railH = steps[steps.length - 1].offsetTop - steps[0].offsetTop;
    rail.style.top = railTop + 'px';
    rail.style.height = railH + 'px';
    update();
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  /* Arriving on /approach/#phase-N from another page: the web fonts load after the browser has
     scrolled to the anchor and make the page taller, so the phase ends up too low. Scroll to it again. */
  function reanchor() {
    var id = location.hash.slice(1);
    var t = id && document.getElementById(id);
    if (t && tl.contains(t)) t.scrollIntoView();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); reanchor(); });
  layout();
})();
