/* E-maillaag voor de tools op /insights/.
   Eén keer een e-mailadres, daarna openen alle tools zonder vraag.
   Verzenden: als GATE.action ingevuld is, gaat het adres naar een Google Form
   (zoals de scorecard). Zonder action wordt niets verstuurd: de laag werkt dan
   wel, maar verzamelt nog geen adressen. */
(function () {
  'use strict';
  var GATE = {
    action: '', // bv. 'https://docs.google.com/forms/d/e/<id>/formResponse'
    fields: { email: '', news: '', tool: '' }
  };
  var KEY = 'ante_tools_email';
  var dialog = document.getElementById('tools-gate');
  var form = document.getElementById('gate-form');
  if (!dialog || !form) return;
  var err = document.getElementById('gate-error');
  var target = null;

  function unlocked() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-gate]');
    if (!a || unlocked()) return;
    e.preventDefault();
    target = a.getAttribute('href');
    err.hidden = true;
    if (typeof dialog.showModal === 'function') dialog.showModal(); else window.location.href = target;
    setTimeout(function () { form.elements.email.focus(); }, 50);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = form.elements.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Please enter a valid email address.'; err.hidden = false; return; }
    var news = form.elements.news.checked ? 'yes' : 'no';
    if (GATE.action) {
      var d = new FormData(), f = GATE.fields;
      if (f.email) d.append(f.email, email);
      if (f.news) d.append(f.news, news);
      if (f.tool) d.append(f.tool, target || '');
      fetch(GATE.action, { method: 'POST', mode: 'no-cors', body: d }).catch(function () {});
    }
    try { localStorage.setItem(KEY, '1'); } catch (x) {}
    dialog.close();
    if (target) window.location.href = target;
  });

  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
})();
