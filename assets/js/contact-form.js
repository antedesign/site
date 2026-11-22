/* Contact form: sends the message as an email without leaving the page.
   The form posts to the Google Apps Script in scripts/contact-mail.gs, which emails it from our own
   Google account to hello@antedesign.be (so it does not land in spam). Without JavaScript the form
   posts to the same address and Google shows a thank-you page. */
(function () {
  var form = document.getElementById('contact-form');
  var status = document.getElementById('contact-status');
  if (!form || !status || !window.fetch || !window.FormData || !window.URLSearchParams) return;

  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbw_ErQseu_VXnVbTl-THyuH3fmOZwlGD7SpRVYpUba9ZHGMfRX21gWORWTcXTFKl-ENfg/exec';

  var NL = document.documentElement.lang === 'nl';
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
    button.textContent = NL ? 'Bezig met versturen...' : 'Sending...';
    status.hidden = true;

    var params = new URLSearchParams();
    params.append('ajax', '1');
    new FormData(form).forEach(function (value, key) { params.append(key, value); });

    /* no-cors: Google's answer cannot be read, but the request is delivered. A network failure still rejects. */
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: params })
      .then(function () {
        form.hidden = true;
        var intro = form.previousElementSibling;                  // "Fill out the form below ..."
        if (intro && intro.tagName === 'P') intro.hidden = true;
        say('ok', NL ? '<strong>Bedankt.</strong> Je bericht is onderweg. We antwoorden binnen één werkdag.' : '<strong>Thank you.</strong> Your message is on its way. We respond within one working day.');
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = label;
        say('error', NL ? 'Dat is niet gelukt. Mail ons op <a href="mailto:hello@antedesign.be">hello@antedesign.be</a> of <a href="https://cal.com/ante-design/30min" target="_blank" rel="noopener">plan een gesprek</a>.' : 'That did not go through. Please email us at <a href="mailto:hello@antedesign.be">hello@antedesign.be</a> or <a href="https://cal.com/ante-design/30min" target="_blank" rel="noopener">book a call</a>.');
      });
  });
})();
