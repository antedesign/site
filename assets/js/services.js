/* Diensten op /approach/: "More info" opent de details van alle drie de
   kaarten tegelijk, zodat de tussentitels op dezelfde hoogte staan. */
(function () {
  'use strict';
  var grid = document.querySelector('.services-grid');
  if (!grid) return;
  var buttons = grid.querySelectorAll('.service-toggle');
  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.service-toggle');
    if (!btn) return;
    var open = !grid.classList.contains('is-open');
    grid.classList.toggle('is-open', open);
    buttons.forEach(function (b) {
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.textContent = open ? 'Less info' : 'More info';
    });
  });
})();
