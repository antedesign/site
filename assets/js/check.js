/* ============================================================
   AI Product Check (v0)
   Ten questions → a rule-based readiness profile and next step,
   shown on screen. The full first read is written by a person
   (with AI help) and sent by email within one working day.

   Sending: if FORM.action is set, answers are posted to a Google
   Form (same pattern as the scorecard). If not, the visitor's mail
   app opens with the answers filled in, addressed to Anté.
   ============================================================ */
(function () {
  'use strict';

  var FORM = {
    action: '', // e.g. 'https://docs.google.com/forms/d/e/<id>/formResponse'
    fields: {   // Google Form entry IDs, one short-answer question per field
      email: '', answers: '', profile: '', route: '',
      optinReport: '', optinResearch: '', optinMarketing: ''
    }
  };
  var MAILTO = 'hello@antedesign.be';

  var form = document.getElementById('check-form');
  if (!form) return;
  var result = document.getElementById('check-result');
  var idea = form.elements.idea;
  var ideaCount = document.getElementById('idea-count');
  var progress = document.getElementById('check-progress');
  var MIN_IDEA = 150;

  var LABELS = {
    type: { new: 'A new product', existing: 'AI in an existing product', internal: 'A tool for our own team', unsure: 'Not sure yet' },
    size: { s1: '1–10', s2: '11–50', s3: '51–250', s4: '250+' },
    evidence: { users: 'We talked to users', customers: 'Customers asked for it', competitors: 'Competitors are doing it', gut: 'Gut feeling' },
    help: { time: 'Save time', decisions: 'Improve decisions', content: 'Personalise or create content', predict: 'Detect or predict', talk: 'Talk with the user', unsure: 'Not sure yet' },
    data: { own: 'Our own', customers: "Our customers'", public: 'Public', none: 'None yet', unknown: "Don't know" },
    stage: { idea: 'Idea', concept: 'Concept', quote: 'Quote from a builder in hand', prototype: 'Prototype', live: 'Live' },
    budget: { under5: 'Under €5k', mid: '€5–15k', over15: 'Over €15k', notset: 'Not set' }
  };

  function val(name) {
    var el = form.elements[name];
    if (!el) return '';
    return (el.value || '').trim();
  }

  /* ── Live feedback ────────────────────────────────────── */
  function updateCount() {
    var n = idea.value.trim().length;
    ideaCount.textContent = n >= MIN_IDEA ? n + ' characters. Enough to work with.' : n + ' / ' + MIN_IDEA + ' characters minimum';
    ideaCount.classList.toggle('is-ok', n >= MIN_IDEA);
  }
  idea.addEventListener('input', updateCount);
  updateCount();

  var REQUIRED = ['type', 'size', 'sector', 'idea', 'users', 'evidence', 'help', 'data', 'stage', 'blocker', 'decider', 'budget'];
  // Ten questions; question 2 and 10 each have two fields.
  var QUESTIONS = [['type'], ['size', 'sector'], ['idea'], ['users'], ['evidence'], ['help'], ['data'], ['stage'], ['blocker'], ['decider', 'budget']];
  function done1(k) { return k === 'idea' ? val(k).length >= MIN_IDEA : !!val(k); }
  function answered() {
    return QUESTIONS.filter(function (q) { return q.every(done1); }).length;
  }
  function updateProgress() { progress.textContent = answered() + ' of ' + QUESTIONS.length + ' questions answered'; }
  form.addEventListener('input', updateProgress);
  form.addEventListener('change', updateProgress);
  updateProgress();

  var sector = form.elements.sector;
  var sectorOther = document.getElementById('sector-other-wrap');
  sector.addEventListener('change', function () { sectorOther.hidden = sector.value !== 'other'; });

  /* ── Profile (rules) ──────────────────────────────────── */
  var TEXT = {
    users: ['You have not yet described who will use it. That is the first thing to pin down.',
            'You know roughly who it is for. How they solve this today needs more detail.',
            'You can describe the user and how they work today. A good base.'],
    evidence: ['The problem rests on a feeling so far. Worth checking before you spend.',
               'Competitors show interest in the space, not that your users need it.',
               'People asked for this or told you about it. Strong evidence.'],
    ai: ["It is not yet clear what the AI should do. That is normal at this stage, and the first thing to define.",
         'You know where AI should help, but not yet what the product is.',
         'You have a clear idea of where AI should help.'],
    data: ['It is unclear what data the AI would use. Often the deciding question.',
           'Public data is a start, but rarely what makes a product different.',
           'You have data of your own or your customers. Check that you may use it.'],
    decision: ['Who decides and what budget is available is still open.',
               'Part of the decision is in place.',
               'Someone decides, there is a budget and the idea has taken shape.']
  };

  function profile() {
    var u = val('users').length;
    var users = u < 25 ? 1 : (u < 90 ? 2 : 3);
    var ev = { users: 3, customers: 3, competitors: 2, gut: 1 }[val('evidence')] || 1;
    var ai = val('help') === 'unsure' ? 1 : (val('type') === 'unsure' ? 2 : 3);
    var data = { own: 3, customers: 3, public: 2, none: 1, unknown: 1 }[val('data')] || 1;
    var d = 0;
    if (val('budget') && val('budget') !== 'notset') d++;
    if (val('decider').length > 2) d++;
    if (['concept', 'quote', 'prototype', 'live'].indexOf(val('stage')) > -1) d++;
    var decision = d <= 1 ? 1 : d;
    return [
      { key: 'users', label: 'User clarity', level: users },
      { key: 'evidence', label: 'Problem evidence', level: ev },
      { key: 'ai', label: 'AI role clarity', level: ai },
      { key: 'data', label: 'Data', level: data },
      { key: 'decision', label: 'Decision readiness', level: decision }
    ];
  }

  /* ── Routing (rules, in this order) ───────────────────── */
  var ROUTES = {
    early: {
      eyebrow: 'Your next step', title: 'Sharpen the idea first.',
      text: 'There is no budget yet, and the idea is still early. A call would come too soon. Your first read lists the questions to answer first. Our principles and the example definition help you get there.',
      primary: ['/principles/', 'Read the eight principles'], secondary: ['/example/', 'See an example definition']
    },
    quote: {
      eyebrow: 'Your next step', title: "Before you sign, let's check the brief.",
      text: 'You have a quote from a builder. In a 30-minute review call we look at what the quote is based on, and what is still missing before you commit.',
      primary: ['/contact/', 'Book a 30-minute review call'], secondary: ['/example/', 'See what a full definition looks like']
    },
    ready: {
      eyebrow: 'Your next step', title: 'You may be ready to build.',
      text: 'You have something live or a prototype, and evidence from real users. You may not need us. If you want a second look before the next investment, a review call is free.',
      primary: ['/contact/', 'Book a 30-minute review call'], secondary: ['/principles/', 'Check it against our principles']
    },
    exploration: {
      eyebrow: 'Your next step', title: 'Start with an AI Opportunity Exploration.',
      text: 'You know AI could help, but not yet with which idea. In two weeks we map the opportunities and tell you which one is worth it, or that it is better to do nothing.',
      primary: ['/contact/', 'Book a 30-minute review call'], secondary: ['/approach/#blocks', 'See the three services']
    },
    definition: {
      eyebrow: 'Your next step', title: 'You are ready for an AI Product Definition.',
      text: 'You have one clear idea and room to invest. A definition tells you exactly what to have built, so you can brief a builder and compare quotes on the same question.',
      primary: ['/contact/', 'Book a 30-minute review call'], secondary: ['/example/', 'See an example definition']
    }
  };

  function route() {
    var stage = val('stage'), budget = val('budget');
    if (budget === 'notset' && stage === 'idea') return 'early';
    if (stage === 'quote') return 'quote';
    if ((stage === 'prototype' || stage === 'live') && (val('evidence') === 'users' || val('evidence') === 'customers')) return 'ready';
    if (val('type') === 'unsure' || val('help') === 'unsure') return 'exploration';
    if (budget === 'mid' || budget === 'over15') return 'definition';
    return 'exploration';
  }

  /* ── Validation ───────────────────────────────────────── */
  function firstMissing() {
    for (var i = 0; i < REQUIRED.length; i++) {
      var k = REQUIRED[i];
      if (!val(k)) return k;
      if (k === 'idea' && val(k).length < MIN_IDEA) return k;
    }
    return null;
  }

  var err = document.getElementById('check-error');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var miss = firstMissing();
    if (miss) {
      var q = document.querySelector('[data-q="' + miss + '"]');
      err.textContent = miss === 'idea' && val('idea')
        ? 'Describe your idea in a bit more detail (at least ' + MIN_IDEA + ' characters).'
        : 'Please answer every question. The first open one is highlighted.';
      err.hidden = false;
      if (q) { q.scrollIntoView({ behavior: 'smooth', block: 'center' }); q.style.borderColor = 'var(--spruce)'; }
      return;
    }
    err.hidden = true;
    render();
  });

  /* ── Render result ────────────────────────────────────── */
  var LEVEL = ['', 'Open', 'Partly clear', 'Clear'];
  function render() {
    var p = profile();
    var rows = document.getElementById('profile-rows');
    rows.innerHTML = '';
    p.forEach(function (d) {
      var row = document.createElement('div');
      row.className = 'profile-row';
      var left = document.createElement('div');
      var s = document.createElement('strong'); s.textContent = d.label;
      var sm = document.createElement('small'); sm.textContent = TEXT[d.key][d.level - 1];
      left.appendChild(s); left.appendChild(sm);
      var meter = document.createElement('div');
      meter.className = 'profile-meter';
      meter.setAttribute('data-level', d.level);
      meter.setAttribute('aria-label', d.label + ': ' + LEVEL[d.level]);
      meter.innerHTML = '<i></i><i></i><i></i>';
      var lvl = document.createElement('span'); lvl.className = 'profile-level'; lvl.textContent = LEVEL[d.level];
      row.appendChild(left); row.appendChild(meter); row.appendChild(lvl);
      rows.appendChild(row);
    });

    var r = ROUTES[route()];
    document.getElementById('next-eyebrow').textContent = r.eyebrow;
    document.getElementById('next-title').textContent = r.title;
    document.getElementById('next-text').textContent = r.text;
    var a1 = document.getElementById('next-primary'); a1.href = r.primary[0]; a1.textContent = r.primary[1];
    var a2 = document.getElementById('next-secondary'); a2.href = r.secondary[0]; a2.textContent = r.secondary[1];

    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── Send for the first read ──────────────────────────── */
  function summary() {
    var lines = [
      '1. Which describes you best: ' + LABELS.type[val('type')],
      '2. Company: ' + LABELS.size[val('size')] + ' people, ' + (val('sector') === 'other' ? val('sectorOther') || 'other' : sector.options[sector.selectedIndex].text),
      '3. Idea: ' + val('idea'),
      '4. Users and today: ' + val('users'),
      '5. Evidence: ' + LABELS.evidence[val('evidence')],
      '6. Where AI should help: ' + LABELS.help[val('help')],
      '7. Data: ' + LABELS.data[val('data')],
      '8. Stage: ' + LABELS.stage[val('stage')],
      '9. Blocking, and why now: ' + val('blocker'),
      '10. Who decides: ' + val('decider') + '. Budget: ' + LABELS.budget[val('budget')]
    ];
    return lines.join('\n');
  }
  function profileText() {
    return profile().map(function (d) { return d.label + ': ' + LEVEL[d.level]; }).join(' · ');
  }

  var send = document.getElementById('send-form');
  var sendErr = document.getElementById('send-error');
  send.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = send.elements.email.value.trim();
    var okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!okMail) { sendErr.textContent = 'Please enter a valid email address.'; sendErr.hidden = false; return; }
    if (!send.elements.optinReport.checked) { sendErr.textContent = 'Tick the first box so we may email you your first read.'; sendErr.hidden = false; return; }
    sendErr.hidden = true;

    var research = send.elements.optinResearch.checked ? 'yes' : 'no';
    var marketing = send.elements.optinMarketing.checked ? 'yes' : 'no';

    if (FORM.action) {
      var data = new FormData();
      var f = FORM.fields;
      var put = function (k, v) { if (f[k]) data.append(f[k], v); };
      put('email', email); put('answers', summary()); put('profile', profileText()); put('route', route());
      put('optinReport', 'yes'); put('optinResearch', research); put('optinMarketing', marketing);
      fetch(FORM.action, { method: 'POST', mode: 'no-cors', body: data }).catch(function () {});
      done(email, false);
    } else {
      var body = 'AI Product Check\n\n' + summary() + '\n\nProfile: ' + profileText() + '\nSuggested next step: ' + route() +
        '\n\nReply to: ' + email + '\nUse answers for research (anonymous): ' + research + '\nOccasional emails: ' + marketing;
      window.location.href = 'mailto:' + MAILTO + '?subject=' + encodeURIComponent('AI Product Check: first read') + '&body=' + encodeURIComponent(body);
      done(email, true);
    }
  });

  function done(email, viaMail) {
    send.hidden = true;
    var t = document.getElementById('send-thanks');
    document.getElementById('send-thanks-email').textContent = email;
    document.getElementById('send-thanks-mail').hidden = !viaMail;
    t.hidden = false;
  }
})();
