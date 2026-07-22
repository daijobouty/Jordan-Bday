// ─────────────────────────────────────────────────────────
// Paste this into script.google.com (see README step 2).
// It writes each RSVP as a new row in the active Google Sheet.
// ─────────────────────────────────────────────────────────

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);

  // Add header row once, if the sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Submitted At', 'Name', 'Attending', 'Guests', 'Message']);
  }

  sheet.appendRow([
    data.submittedAt || new Date().toISOString(),
    data.name || '',
    data.attending || '',
    data.guests || '',
    data.message || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
