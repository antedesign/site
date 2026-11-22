/* Beslisboom op /approach/: drie ja/nee-vragen → het juiste startpunt. */
(function () {
  'use strict';
  var root = document.getElementById('tree');
  if (!root) return;
  var steps = root.querySelectorAll('.tree-step');
  var title = document.getElementById('tree-title');
  var text = document.getElementById('tree-text');
  var eyebrow = document.getElementById('tree-eyebrow');
  var cta = document.getElementById('tree-cta');
  var reset = document.getElementById('tree-reset');
  var initial = { t: title.textContent, p: text.textContent };
  var NL = document.documentElement.lang === 'nl'; // /nl/ pages: Dutch strings

  var OUT = NL ? {
    exploration: ['Begin met een AI Opportunity Exploration.', 'In twee weken brengen we in kaart waar AI waarde toevoegt, en zeggen we welk idee het waard is om verder te gaan, of dat je beter niets doet.'],
    definition: ['Begin met een AI Product Definition.', 'Het idee heb je. Wij helpen je vastleggen wat het product doet, voor wie, welke rol AI speelt en welke functies eerst komen, zodat je een bouwer kunt briefen.'],
    prototype: ['Begin met Prototype & Validation.', 'Je weet wat je wilt bouwen. Zet een eerste versie voor echte gebruikers en meet de eerste tractie, voor de volledige bouw.'],
    ready: ['Misschien ben je klaar om te bouwen.', 'Je weet wat je bouwt, en gebruikers hebben het gezien. Wil je een tweede blik voor je je vastlegt, dan is het gesprek gratis.']
  } : {
    exploration: ['Start with an AI Opportunity Exploration.', 'In two weeks we map where AI can add value, and tell you which idea is worth pursuing, or that it is better to do nothing.'],
    definition: ['Start with an AI Product Definition.', 'You have the idea. We help you define what the product does, for whom, what role AI plays and which features come first, so you can brief a builder.'],
    prototype: ['Start with Prototype & Validation.', 'You know what to build. Put a first version in front of real users and measure early traction, before the full build.'],
    ready: ['You may be ready to build.', 'You know what to build, and users have seen it. If you want a second look before you commit, the review call is free.']
  };

  function setStep(n) {
    steps.forEach(function (s, i) {
      var active = i + 1 <= n;
      s.setAttribute('aria-disabled', active ? 'false' : 'true');
      s.classList.toggle('is-current', i + 1 === n);
      s.querySelectorAll('.tree-btn').forEach(function (b) { b.disabled = !(i + 1 === n); });
    });
  }
  function show(key) {
    eyebrow.textContent = NL ? 'Jouw startpunt' : 'Your starting point';
    title.textContent = OUT[key][0];
    text.textContent = OUT[key][1];
    cta.hidden = false;
    reset.hidden = false;
    steps.forEach(function (s) { s.classList.remove('is-current'); s.querySelectorAll('.tree-btn').forEach(function (b) { b.disabled = true; }); });
  }

  root.addEventListener('click', function (e) {
    var btn = e.target.closest('.tree-btn');
    if (!btn || btn.disabled) return;
    var step = +btn.closest('.tree-step').dataset.step;
    btn.closest('.tree-answers').querySelectorAll('.tree-btn').forEach(function (b) { b.classList.toggle('is-picked', b === btn); });
    var yes = btn.dataset.a === 'yes';
    if (step === 1) { yes ? setStep(2) : show('exploration'); }
    else if (step === 2) { yes ? setStep(3) : show('definition'); }
    else { show(yes ? 'ready' : 'prototype'); }
  });

  reset.addEventListener('click', function () {
    root.querySelectorAll('.tree-btn').forEach(function (b) { b.classList.remove('is-picked'); });
    title.textContent = initial.t; text.textContent = initial.p;
    cta.hidden = true; reset.hidden = true;
    setStep(1);
  });
})();
