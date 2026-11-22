/* Contact form: sends the message as an email without leaving the page.
   Two ways, chosen by APPS_SCRIPT_URL:
   - empty:  through FormSubmit (formsubmit.co), the set-up that is live now;
   - filled: through the Google Apps Script in scripts/contact-mail.gs, which mails from our own
             Google account (does not land in spam, no third party).
   Without JavaScript the form posts to the address in the form's action attribute. */
(function () {
  var form = document.getElementById('contact-form');
  var status = document.getElementById('contact-status');
  if (!form || !status || !window.fetch || !window.FormData) return;

  var APPS_SCRIPT_URL = '';   /* paste the Web app URL (ends in /exec), see scripts/contact-mail.gs */
  var FORMSUBMIT_URL = 'https://formsubmit.co/ajax/hello@antedesign.be';

  var button = form.querySelector('button[type="submit"]');
  var label = button.textContent;

  function say(kind, html) {
    status.className = 'form-status form-status--' + kind;
    status.innerHTML = html;
    status.hidden = false;
  }

  function viaAppsScript(fields) {
    var params = new URLSearchParams();
    params.append('ajax', '1');
    Object.keys(fields).forEach(function (key) { params.append(key, fields[key]); });
    /* no-cors: the answer cannot be read, but the request is delivered. A network failure still rejects. */
    return fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: params });
  }

  function viaFormSubmit(fields) {
    return fetch(FORMSUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(fields)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || String(j.success) === 'false') throw new Error('not sent');
      });
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.querySelector('[name="_honey"]').value) return;      // a bot filled the hidden field
    button.disabled = true;
    button.textContent = 'Sending...';
    status.hidden = true;

    var fields = {};
    new FormData(form).forEach(function (value, key) { fields[key] = value; });

    (APPS_SCRIPT_URL ? viaAppsScript(fields) : viaFormSubmit(fields))
      .then(function () {
        form.hidden = true;
        var intro = form.previousElementSibling;                  // "Fill out the form below ..."
        if (intro && intro.tagName === 'P') intro.hidden = true;
        say('ok', '<strong>Thank you.</strong> Your message is on its way. We respond within one working day.');
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = label;
        say('error', 'That did not go through. Please email us at <a href="mailto:hello@antedesign.be">hello@antedesign.be</a> or <a href="https://cal.com/ante-design/30min" target="_blank" rel="noopener">book a call</a>.');
      });
  });
})();
