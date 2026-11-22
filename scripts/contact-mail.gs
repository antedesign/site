/**
 * Anté contact form -> email, sent from this Google account (Google Apps Script).
 *
 * Why: mail relayed by a third-party form service often lands in spam. Mail sent from
 * the Google account itself, to our own address, does not.
 *
 * Set up (about 5 minutes, once):
 *  1. Open https://script.google.com while signed in to the account that should send the
 *     mail (best: hello@antedesign.be). Click "New project" and paste this whole file over
 *     the default code. Save (name it "Anté contact form").
 *  2. Click Deploy > New deployment > type "Web app".
 *       Execute as: Me
 *       Who has access: Anyone
 *     Click Deploy. Google asks for permission to send email: choose your account,
 *     "Advanced", "Go to Anté contact form (unsafe)", "Allow". (The warning appears
 *     because the script is not published as an app. It only runs in your own account.)
 *  3. Copy the "Web app" URL (it ends in /exec) and send it to whoever maintains the site.
 *     It goes into assets/js/contact-form.js (APPS_SCRIPT_URL) and into the form action
 *     in contact/index.html.
 *
 * After changing this code, deploy again: Deploy > Manage deployments > pencil > Version:
 * New version > Deploy. The /exec URL stays the same.
 *
 * What it does: it takes name, email and message from the form, checks them, and emails
 * them to RECIPIENT with the visitor as reply-to. It can only ever email RECIPIENT, so it
 * cannot be used to mail anyone else.
 */

var RECIPIENT = 'hello@antedesign.be';
var SHEET_ID = '';        // optional: id of a Google Sheet that keeps a copy of every message (empty = off)
var DAILY_LIMIT = 60;     // more messages than this in a day are dropped, so nobody can flood the inbox

function doPost(e) {
  var p = (e && e.parameter) || {};
  var wantsJson = p.ajax === '1';                     // the site's script asks for JSON, a plain form post gets a page
  try {
    if (p._honey) return reply(wantsJson, true);      // a bot filled the hidden field: pretend it worked, send nothing
    var name = clean(p.name, 120, true);
    var email = clean(p.email, 200, true);
    var message = clean(p.message, 5000, false);
    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(wantsJson, false);
    if (!underLimit()) return reply(wantsJson, false);

    MailApp.sendEmail({
      to: RECIPIENT,
      replyTo: email,
      name: 'antedesign.be',
      subject: 'New message via antedesign.be from ' + name,
      body: 'Name: ' + name + '\nEmail: ' + email + '\n\n' + message,
      htmlBody:
        '<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">' +
        '<tr><td><b>Name</b></td><td>' + esc(name) + '</td></tr>' +
        '<tr><td><b>Email</b></td><td><a href="mailto:' + esc(email) + '">' + esc(email) + '</a></td></tr>' +
        '<tr><td valign="top"><b>Message</b></td><td>' + esc(message).replace(/\n/g, '<br>') + '</td></tr>' +
        '</table>'
    });
    if (SHEET_ID) SpreadsheetApp.openById(SHEET_ID).getSheets()[0].appendRow([new Date(), name, email, message]);
    return reply(wantsJson, true);
  } catch (err) {
    return reply(wantsJson, false);
  }
}

function doGet() {
  return ContentService.createTextOutput('The Anté contact form is running.');
}

function clean(value, max, singleLine) {
  var s = String(value == null ? '' : value);
  s = singleLine ? s.replace(/[\u0000-\u001F\u007F]+/g, ' ') : s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return s.trim().slice(0, max);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function underLimit() {
  var cache = CacheService.getScriptCache();
  var key = 'n_' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMdd');
  var n = Number(cache.get(key) || 0);
  if (n >= DAILY_LIMIT) return false;
  cache.put(key, String(n + 1), 86400);
  return true;
}

function reply(json, ok) {
  if (json) {
    return ContentService.createTextOutput(JSON.stringify({ ok: ok })).setMimeType(ContentService.MimeType.JSON);
  }
  var title = ok ? 'Thank you.' : 'That did not go through.';
  var text = ok ? 'Your message is on its way. We respond within one working day.' : 'Please email us at hello@antedesign.be.';
  return HtmlService.createHtmlOutput(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.5rem;line-height:1.6;color:#28292B">' +
    '<h1 style="margin:0 0 .5rem">' + title + '</h1><p>' + text + '</p>' +
    '<p><a href="https://antedesign.be/" style="color:#206A5B">Back to antedesign.be</a></p></body>'
  );
}
