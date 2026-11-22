/* Tab title: a calm line while the visitor is on another tab, the normal title when they come back.
   Usage: <script src="assets/js/tab-title.js" data-away="Your line | Anté" defer></script>
   The page's own <title> is read at load, so it works on any page. */
(function () {
  var tag = document.currentScript;
  var away = tag && tag.getAttribute('data-away');
  if (!away) return;
  var home = document.title;
  function sync() { document.title = document.hidden ? away : home; }
  document.addEventListener('visibilitychange', sync);
  sync();
})();
