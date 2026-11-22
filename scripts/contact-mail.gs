/**
 * Anté contact form -> email in our own inbox (Google Apps Script).
 *
 * The message is placed straight into the inbox of the Google account that runs this script, as
 * new, unread mail from the visitor (name and address as typed in the form), so it looks like any
 * other mail someone sent us, and "Reply" goes to the visitor. It never travels over the internet,
 * so it cannot land in spam. If that is not possible (see step 2 below) the script falls back to a
 * normal email from this account to RECIPIENT, which Gmail files under "Sent" when both are the
 * same address.
 *
 * FIRST TIME (about 5 minutes):
 *  1. Open https://script.google.com while signed in to the account that receives the mail
 *     (hello@antedesign.be). "New project", paste this whole file over the default code, save.
 *  2. In the left sidebar click "Services" (+), choose "Gmail API", click "Add".
 *  3. In the toolbar pick the function "testDelivery" and click "Run". Allow the permissions
 *     (Advanced > Go to ... (unsafe) > Allow). A test message appears in the inbox.
 *  4. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone. Deploy.
 *     Copy the "Web app" URL (ends in /exec) into assets/js/contact-form.js (ENDPOINT) and the
 *     form action in contact/index.html.
 *
 * UPDATING THIS CODE LATER: paste it over the old code, do steps 2 and 3 if they are new, then
 * Deploy > Manage deployments > pencil > Version: New version > Deploy. The /exec URL stays the same.
 *
 * What it does: it takes name, email and message from the form, checks them, and delivers them to
 * RECIPIENT. It can only ever deliver to RECIPIENT, so it cannot be used to mail anyone else.
 */

var RECIPIENT = 'hello@antedesign.be';
var INSERT_INTO_OWN_INBOX = true;   // true: put the message straight into this account's inbox as new mail
var LABEL_NAME = 'Website contact'; // label added to every message (empty = no label)
var SHEET_ID = '';                  // optional: id of a Google Sheet that keeps a copy of every message (empty = off)
var DAILY_LIMIT = 60;               // more messages than this in a day are dropped, so nobody can flood the inbox

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

    deliver(name, email, message);
    if (SHEET_ID) SpreadsheetApp.openById(SHEET_ID).getSheets()[0].appendRow([new Date(), name, email, message]);
    return reply(wantsJson, true);
  } catch (err) {
    return reply(wantsJson, false);
  }
}

function doGet() {
  return ContentService.createTextOutput('The Anté contact form is running.');
}

/** Run this once from the editor (pick "testDelivery" in the toolbar, click Run): it asks for permission and a test message arrives. */
function testDelivery() {
  deliver('Test Persoon', 'test@example.com', 'This is a test message sent from the script editor.');
}

function deliver(name, email, message) {
  if (INSERT_INTO_OWN_INBOX) {
    try {
      insertIntoInbox(name, email, message);
      return;
    } catch (err) {
      // The Gmail API service is not added yet, or not allowed: fall back to a normal email below.
    }
  }
  MailApp.sendEmail({
    to: RECIPIENT,
    replyTo: email,
    name: 'antedesign.be',
    subject: subjectFor(name),
    body: plainBody(name, email, message),
    htmlBody: htmlBody(name, email, message)
  });
}

function insertIntoInbox(name, email, message) {
  var labelIds = ['INBOX', 'UNREAD'];
  try {
    var id = labelId(LABEL_NAME);
    if (id) labelIds.push(id);
  } catch (err) {
    // the label is a nicety, the message is not
  }
  Gmail.Users.Messages.insert(
    { raw: Utilities.base64EncodeWebSafe(rawMessage(name, email, message), Utilities.Charset.UTF_8), labelIds: labelIds },
    'me'
  );
}

function labelId(name) {
  if (!name) return null;
  var labels = Gmail.Users.Labels.list('me').labels || [];
  for (var i = 0; i < labels.length; i++) if (labels[i].name === name) return labels[i].id;
  return Gmail.Users.Labels.create({ name: name, labelListVisibility: 'labelShow', messageListVisibility: 'show' }, 'me').id;
}

function rawMessage(name, email, message) {
  var CRLF = '\r\n';
  var boundary = 'ante-' + Utilities.getUuid();
  function b64(s) { return Utilities.base64Encode(s, Utilities.Charset.UTF_8); }
  function word(s) { return '=?UTF-8?B?' + b64(s) + '?='; }
  function wrap(s) { return s.replace(/(.{76})/g, '$1' + CRLF); }
  return [
    'From: ' + word(name) + ' <' + email + '>',
    'To: ' + RECIPIENT,
    'Reply-To: ' + email,
    'Subject: ' + word(subjectFor(name)),
    'Date: ' + new Date().toUTCString(),
    'Message-ID: <' + Utilities.getUuid() + '@antedesign.be>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    '',
    '--' + boundary,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap(b64(plainBody(name, email, message))),
    '--' + boundary,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap(b64(htmlBody(name, email, message))),
    '--' + boundary + '--',
    ''
  ].join(CRLF);
}

function subjectFor(name) {
  return 'New message via antedesign.be from ' + name;
}

function plainBody(name, email, message) {
  return 'Name: ' + name + '\nEmail: ' + email + '\n\n' + message + '\n\n(Sent through the contact form on antedesign.be)';
}

function htmlBody(name, email, message) {
  return '<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">' +
    '<tr><td><b>Name</b></td><td>' + esc(name) + '</td></tr>' +
    '<tr><td><b>Email</b></td><td><a href="mailto:' + esc(email) + '">' + esc(email) + '</a></td></tr>' +
    '<tr><td valign="top"><b>Message</b></td><td>' + esc(message).replace(/\n/g, '<br>') + '</td></tr>' +
    '</table><p style="font-family:Arial,sans-serif;font-size:12px;color:#777">Sent through the contact form on antedesign.be</p>';
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
