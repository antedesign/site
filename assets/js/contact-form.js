/* Contact form: sends the message as an email through FormSubmit, without leaving the page.
   Without JavaScript the form still posts to FormSubmit's own page (same address, same fields). */
(function () {
  var form = document.getElementById('contact-form');
  var status = document.getElementById('contact-status');
  if (!form || !status || !window.fetch || !window.FormData) return;

  var ENDPOINT = 'https://formsubmit.co/ajax/hello@antedesign.be';
  var button = form.querySelector('button[type="submit"]');
  var label = button.textContent;

  function say(kind, html) {
    status.className = 'form-status form-status--' + kind;
    status.innerHTML = html;
    status.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.querySelector('[name="_honey"]').value) return;      // a bot filled the hidden field
    button.disabled = true;
    button.textContent = 'Sending...';
    status.hidden = true;

    var body = {};
    new FormData(form).forEach(function (value, key) { body[key] = value; });

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || String(j.success) === 'false') throw new Error('not sent');
        });
      })
      .then(function () {
        form.hidden = true;
        var intro = form.previousElementSibling;                        // "Fill out the form below ..."
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
