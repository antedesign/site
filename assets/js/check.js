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

  var MIN = { idea: 60, alternative: 12, without_ai: 12, payer: 12, 'return': 12, evidence: 12, avoided: 8 };
  var MESSAGES = {
    idea: 'A little more detail, please: at least 60 characters.',
    team: 'Please fill in at least two of the three. Short is fine.',
    stage: 'Please pick where you are now.',
    contact: 'Please add a valid email address and tick the box.'
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
    if (q === 'contact') return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('email')) && form.elements.consent.checked;
    return true;
  }

  function show(i, focus) {
    current = i;
    steps.forEach(function (s, n) { s.classList.toggle('is-active', n === i); });
    label.textContent = 'Step ' + (i + 1) + ' of ' + steps.length;
    fill.style.width = ((i + 1) / steps.length * 100) + '%';
    back.hidden = i === 0;
    next.innerHTML = i === steps.length - 1 ? 'Send me my questions <span class="arrow">→</span>' : 'Next <span class="arrow">→</span>';
    err.hidden = true;
    if (focus) {
      var el = steps[i].querySelector('textarea, input[type=text], input[type=email]');
      if (el) el.focus({ preventScroll: true });
    }
  }

  function advance() {
    if (!stepValid(current)) {
      var q = steps[current].getAttribute('data-q');
      err.textContent = MESSAGES[q] || 'Please answer this one with at least a sentence.';
      err.hidden = false;
      return;
    }
    if (current < steps.length - 1) show(current + 1, true);
    else finish();
  }

  back.addEventListener('click', function () { if (current > 0) show(current - 1, true); });
  form.addEventListener('submit', function (e) { e.preventDefault(); advance(); });

  function makeId() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'chk-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + Math.floor(1000 + Math.random() * 9000);
  }

  function payload() {
    return {
      id: makeId(),
      idea: val('idea'), alternative: val('alternative'), without_ai: val('without_ai'), payer: val('payer'),
      'return': val('return'), evidence: val('evidence'), avoided: val('avoided'),
      team_management: val('team_management'), team_sales: val('team_sales'), team_technical: val('team_technical'),
      stage: val('stage'), blocker: val('blocker'),
      name: val('name'), company: val('company'), role: val('role'), email: val('email'),
      consent: form.elements.consent.checked ? 'yes' : ''
    };
  }

  function send(data) {
    if (FORM.action) {
      var body = new FormData();
      body.append(FORM.fields.id, data.id);
      body.append(FORM.fields.email, data.email);
      body.append(FORM.fields.answers, JSON.stringify(data));
      fetch(FORM.action, { method: 'POST', mode: 'no-cors', body: body }).catch(function () {});
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
    [['Management', data.team_management], ['Sales or marketing', data.team_sales], ['Engineering or production', data.team_technical]].forEach(function (r) {
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
    sent = true;
    next.disabled = true;
    var data = payload();
    var trap = form.elements.website && form.elements.website.value;
    var viaMail = trap ? false : send(data); // a filled trap field is a bot: show the thanks, send nothing
    showResult(data, viaMail);
  }

  show(0, false);
})();
