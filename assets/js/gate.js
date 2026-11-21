/* E-maillaag op /insights/.
   Twee ingangen, hetzelfde formulier:
   - de drie tools (a[data-gate]): een keer een e-mailadres, daarna openen ze zonder vraag;
   - een samenvatting per e-mail (a[data-gate-summary]): alleen het adres, geen tool, de tools blijven dicht.
   De insights zelf staan nooit achter de laag.

   Verzenden: een Google Form ("EMAIL-WEBSITE") met twee vragen, id en email. Het formulier heeft geen
   derde vraag, dus de bron en de keuze voor nieuwsbrief gaan samen in het eerste veld, als
   "tool=<naam>; news=yes|no" of "summary; news=yes". Zie 20-marketing/free-tools/ai-product-check/FORMULIER.md
   in ante-base voor de koppeling en wat er in de Sheet komt. */
(function () {
  'use strict';
  var GATE = {
    action: 'https://docs.google.com/forms/d/e/1FAIpQLSeva0t3p1BJNqAtKhJJf4vfnVyxVeyDdJHaMgTjqj9nflbUwQ/formResponse',
    fields: { source: 'entry.158966334', email: 'entry.447247219' } // in de volgorde van de vragen: id, email
  };
  var KEY = 'ante_tools_email';
  var dialog = document.getElementById('tools-gate');
  var form = document.getElementById('gate-form');
  if (!dialog || !form) return;
  var err = document.getElementById('gate-error');
  var eyebrow = document.getElementById('gate-eyebrow');
  var title = document.getElementById('gate-title');
  var intro = document.getElementById('gate-intro');
  var optin = document.getElementById('gate-optin');
  var submit = document.getElementById('gate-submit');
  var thanks = document.getElementById('gate-thanks');
  var COPY = {
    tools: { eyebrow: eyebrow.textContent, title: title.textContent, intro: intro.textContent, submit: submit.firstChild.textContent },
    summary: {
      eyebrow: 'Insights',
      title: 'Get each new piece by email.',
      intro: 'A short summary of each new piece, about twice a month. Nothing else, and you can unsubscribe anytime. This does not open the tools.',
      submit: 'Send me the summaries '
    }
  };
  var mode = 'tools';
  var target = null;

  function unlocked() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }

  function open(m) {
    mode = m;
    var c = COPY[m];
    eyebrow.textContent = c.eyebrow;
    title.textContent = c.title;
    intro.textContent = c.intro;
    submit.firstChild.textContent = c.submit;
    optin.hidden = m === 'summary';
    form.hidden = false;
    thanks.hidden = true;
    err.hidden = true;
    if (typeof dialog.showModal === 'function') dialog.showModal(); else return false;
    setTimeout(function () { form.elements.email.focus(); }, 50);
    return true;
  }

  function slug(href) {
    var m = /\/tools\/([^\/]+)\/?/.exec(href || '');
    return m ? m[1] : (href || '');
  }

  document.addEventListener('click', function (e) {
    var s = e.target.closest('a[data-gate-summary]');
    if (s) { e.preventDefault(); open('summary'); return; }
    var a = e.target.closest('a[data-gate]');
    if (!a || unlocked()) return;
    e.preventDefault();
    target = a.getAttribute('href');
    if (!open('tools')) window.location.href = target;
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = form.elements.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Please enter a valid email address.'; err.hidden = false; return; }
    var news = mode === 'summary' || form.elements.news.checked ? 'yes' : 'no';
    var source = (mode === 'summary' ? 'summary' : 'tool=' + slug(target)) + '; news=' + news;
    if (GATE.action) {
      var d = new FormData(), f = GATE.fields;
      d.append(f.source, source);
      d.append(f.email, email);
      fetch(GATE.action, { method: 'POST', mode: 'no-cors', body: d }).catch(function () {});
    }
    if (mode === 'summary') {
      form.hidden = true;
      thanks.hidden = false;
      form.reset();
      return;
    }
    try { localStorage.setItem(KEY, '1'); } catch (x) {}
    dialog.close();
    if (target) window.location.href = target;
  });

  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
})();
