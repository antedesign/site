/* ============================================================
   AI Product Check (v1): your idea, questioned
   Nine questions and an email address. On screen you see your own
   three team answers side by side (no AI). Within one working day a
   person at Anté sends the questions we would ask, written from your
   answers. The sending of that report is done by a daily routine,
   see 20-marketing/free-tools/ai-product-check/ in ante-base.

   Collecting: if FORM.action is set, the answers are posted to a
   Google Form with three fields (id, email, answers as one JSON
   block, see FORMULIER.md in ante-base). If not, the visitor's mail
   app opens with the answers filled in, addressed to Anté. The daily
   routine reads either source.

   Saving as you go: the first step asks for the email address and
   the consent. Nothing leaves the browser until the address is valid
   and confirmed (the field is left or Enter is pressed, never while
   typing, so a half-typed address is never stored) and the box is
   ticked. From that moment the address is saved, even if the visitor
   never presses Next. After that the answers so far are posted after
   every step, and once more when the visitor leaves the page with
   unsaved typing. Every post carries the same id, a counter (seq),
   the number of steps completed (step), complete ('yes' only on the
   last send) and the time spent (t_total, t_steps, in seconds, only
   counted while the page is visible), so the routine takes the
   highest seq per id. The mail path cannot save as you go: it sends
   once, at the end.
   ============================================================ */
(function () {
  'use strict';

  var FORM = {
    action: 'https://docs.google.com/forms/d/e/1FAIpQLScurjk-1U6s6atbb2d3-qabHroNIbZ0P8u21CRbia-5thkn0w/formResponse',
    fields: {   // 'entry.<number>' for each of the three questions of the form, in the order id, email, answers
      id: 'entry.2041225216',
      email: 'entry.510587862',
      answers: 'entry.24848750'
    }
  };
  var MAILTO = 'hello@antedesign.be';

  var form = document.getElementById('check-form');
  if (!form) return;
  var stage = document.getElementById('check-stage');
  var result = document.getElementById('check-result');
  var back = document.getElementById('check-back');
  var label = document.getElementById('check-step-label');
  var fill = document.getElementById('check-bar-fill');
  var next = document.getElementById('check-next');
  var err = document.getElementById('check-error');
  var steps = Array.prototype.slice.call(form.querySelectorAll('.check-q'));
  var current = 0;
  var sent = false;
  var started = false;    // a valid, confirmed email and the consent: from here on we save
  var confirmedEmail = ''; // the address as it was when the field was left; never a half-typed one
  var lastSaved = '';     // the content of the last save, to see whether anything changed since
  var seq = 0;

  // time spent, counted only while the page is visible
  var clock = { active: 0, since: document.visibilityState === 'hidden' ? 0 : Date.now() };
  var stepMs = [];
  var stepMark = 0;
  function activeMs() { return clock.active + (clock.since ? Date.now() - clock.since : 0); }

  var MIN = { idea: 60, alternative: 12, without_ai: 12, payer: 12, 'return': 12, evidence: 12, avoided: 8 };
  var NL = document.documentElement.lang === 'nl'; // /nl/check/: Dutch strings
  var MESSAGES = NL ? {
    idea: 'Iets meer detail graag: minstens 60 tekens.',
    team: 'Vul er minstens twee van de drie in. Kort mag.',
    stage: 'Kies waar je nu staat.',
    start: 'Vul een geldig e-mailadres in en vink het vakje aan.'
  } : {
    idea: 'A little more detail, please: at least 60 characters.',
    team: 'Please fill in at least two of the three. Short is fine.',
    stage: 'Please pick where you are now.',
    start: 'Please add a valid email address and tick the box.'
  };

  function val(name) {
    var el = form.elements[name];
    return el && el.value ? el.value.trim() : '';
  }

  function stepValid(i) {
    var q = steps[i].getAttribute('data-q');
    if (MIN[q]) return val(q).length >= MIN[q];
    if (q === 'team') {
      var n = ['team_management', 'team_sales', 'team_technical'].filter(function (k) { return val(k).length >= 8; }).length;
      return n >= 2;
    }
    if (q === 'stage') return !!val('stage');
    if (q === 'start') return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('email')) && form.elements.consent.checked;
    return true;
  }

  function show(i, focus) {
    stepMs[current] = (stepMs[current] || 0) + (activeMs() - stepMark);
    stepMark = activeMs();
    current = i;
    steps.forEach(function (s, n) { s.classList.toggle('is-active', n === i); });
    label.textContent = (NL ? 'Stap ' : 'Step ') + (i + 1) + (NL ? ' van ' : ' of ') + steps.length;
    fill.style.width = ((i + 1) / steps.length * 100) + '%';
    back.hidden = i === 0;
    next.innerHTML = i === steps.length - 1 ? (NL ? 'Stuur me mijn vragen' : 'Send me my questions') + ' <span class="arrow">→</span>' : (NL ? 'Volgende' : 'Next') + ' <span class="arrow">→</span>';
    err.hidden = true;
    if (focus) {
      var el = steps[i].querySelector('textarea, input[type=text], input[type=email]');
      if (el) el.focus({ preventScroll: true });
    }
  }

  function advance() {
    if (!stepValid(current)) {
      var q = steps[current].getAttribute('data-q');
      err.textContent = MESSAGES[q] || (NL ? 'Beantwoord deze met minstens één zin.' : 'Please answer this one with at least a sentence.');
      err.hidden = false;
      return;
    }
    if (steps[current].getAttribute('data-q') === 'start') {
      confirmedEmail = val('email'); // the step is valid, so this is a complete address
      if (armed()) started = true;   // the save follows below, once, with the step completed
    }
    if (current < steps.length - 1) {
      show(current + 1, true);
      if (started) save(false);
    } else finish();
  }

  back.addEventListener('click', function () { if (current > 0) show(current - 1, true); });
  form.addEventListener('submit', function (e) { e.preventDefault(); advance(); });

  function makeId() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'chk-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + Math.floor(1000 + Math.random() * 9000);
  }

  var ID = makeId();

  function payload() {
    return {
      id: ID,
      idea: val('idea'), alternative: val('alternative'), without_ai: val('without_ai'), payer: val('payer'),
      'return': val('return'), evidence: val('evidence'), avoided: val('avoided'),
      team_management: val('team_management'), team_sales: val('team_sales'), team_technical: val('team_technical'),
      stage: val('stage'), blocker: val('blocker'),
      name: val('name'), company: val('company'), role: val('role'), email: confirmedEmail,
      consent: form.elements.consent.checked ? 'yes' : '',
      lang: NL ? 'nl' : 'en' // the page language, stored for reference; the review reads the language from the answers themselves
    };
  }

  function trapped() { return !!(form.elements.website && form.elements.website.value); }

  // the payload plus the bookkeeping the routine needs to pick the latest row per id
  function snapshot(complete) {
    var d = payload();
    d.seq = ++seq;
    d.step = complete ? steps.length : current; // steps completed so far
    d.complete = complete ? 'yes' : '';
    var live = stepMs.slice(0, steps.length);
    live[current] = (live[current] || 0) + (activeMs() - stepMark);
    d.t_total = Math.round(activeMs() / 1000);
    d.t_steps = steps.map(function (_, n) { return Math.round((live[n] || 0) / 1000); });
    return d;
  }

  function formBody(data) {
    var body = new FormData();
    body.append(FORM.fields.id, data.id);
    body.append(FORM.fields.email, data.email);
    body.append(FORM.fields.answers, JSON.stringify(data));
    return body;
  }

  // a partial save: only with the form connected, after the consent, never for a bot
  function save(complete) {
    if (!FORM.action || trapped() || sent) return;
    lastSaved = JSON.stringify(payload());
    fetch(FORM.action, { method: 'POST', mode: 'no-cors', body: formBody(snapshot(complete)) }).catch(function () {});
  }

  // the visitor leaves with typing that was not saved yet
  function saveOnLeave() {
    if (!FORM.action || !started || sent || trapped() || JSON.stringify(payload()) === lastSaved) return;
    var body = formBody(snapshot(false));
    lastSaved = JSON.stringify(payload());
    var queued = false;
    try { queued = !!(navigator.sendBeacon && navigator.sendBeacon(FORM.action, body)); } catch (e) { queued = false; }
    if (!queued) fetch(FORM.action, { method: 'POST', mode: 'no-cors', body: body, keepalive: true }).catch(function () {});
  }
  var EMAIL_OK = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  // the address counts once the field is left (or Enter) and it is valid; then, with the box ticked, we start saving
  function confirmEmail() {
    var v = val('email');
    if (EMAIL_OK.test(v)) confirmedEmail = v;
    maybeStart();
  }
  function armed() { return !started && !!confirmedEmail && form.elements.consent.checked && !!FORM.action && !trapped(); }
  function maybeStart() {
    if (!armed()) return;
    started = true;
    save(false);
  }
  form.elements.email.addEventListener('change', confirmEmail);
  form.elements.consent.addEventListener('change', maybeStart);

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      if (clock.since) { clock.active += Date.now() - clock.since; clock.since = 0; }
      saveOnLeave();
    } else if (!clock.since) {
      clock.since = Date.now();
    }
  });
  window.addEventListener('pagehide', saveOnLeave);

  function send(data) {
    if (FORM.action) {
      fetch(FORM.action, { method: 'POST', mode: 'no-cors', body: formBody(data) }).catch(function () {});
      return false;
    }
    var text = [
      'Reference: ' + data.id, '',
      'Idea: ' + data.idea, '', 'Who uses it, and what they do today: ' + data.alternative, '',
      'Best version without AI, and what AI adds: ' + data.without_ai, '',
      'Who pays, how much, why every month: ' + data.payer, '',
      'Why they come back, and what they lose if it disappears: ' + data['return'], '',
      'What a user did or said: ' + data.evidence, '',
      'The question I hope nobody asks: ' + data.avoided, '',
      'Management would say: ' + data.team_management, 'Sales would say: ' + data.team_sales, 'Engineering would say: ' + data.team_technical, '',
      'Stage: ' + data.stage, 'Blocker: ' + data.blocker, '',
      'Name: ' + data.name, 'Company: ' + data.company, 'Role: ' + data.role, 'Email: ' + data.email, 'Consent: ' + (data.consent || 'no')
    ].join('\n');
    window.location.href = 'mailto:' + MAILTO + '?subject=' + encodeURIComponent('AI Product Check: ' + data.id) + '&body=' + encodeURIComponent(text);
    return true;
  }

  function quote(text) {
    var el = document.createElement('p');
    el.style.fontStyle = 'italic';
    el.textContent = '“' + text + '”';
    return el;
  }

  function showResult(data, viaMail) {
    var grid = document.getElementById('mirror-grid');
    grid.textContent = '';
    [[NL ? 'Directie' : 'Management', data.team_management], [NL ? 'Sales of marketing' : 'Sales or marketing', data.team_sales], [NL ? 'Engineering of productie' : 'Engineering or production', data.team_technical]].forEach(function (r) {
      if (!r[1]) return;
      var card = document.createElement('div');
      card.className = 'mirror-card';
      var role = document.createElement('span');
      role.className = 'mirror-role';
      role.textContent = r[0];
      card.appendChild(role);
      card.appendChild(quote(r[1]));
      grid.appendChild(card);
    });
    var av = document.getElementById('mirror-avoided');
    av.hidden = !data.avoided;
    document.getElementById('mirror-avoided-text').textContent = data.avoided ? '“' + data.avoided + '”' : '';
    document.getElementById('result-email').textContent = data.email;
    document.getElementById('result-ref').textContent = data.id;
    document.getElementById('result-mail-note').hidden = !viaMail;
    stage.hidden = true;
    document.querySelector('.check-fineprint').hidden = true;
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function finish() {
    if (sent) return;
    next.disabled = true;
    var data = snapshot(true);
    var viaMail = trapped() ? false : send(data); // a filled trap field is a bot: show the thanks, send nothing
    sent = true;
    showResult(data, viaMail);
  }

  show(0, false);
})();
