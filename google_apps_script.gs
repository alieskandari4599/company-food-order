/**
 * Google Apps Script to handle food order submissions and queries.
 *
 * This script defines two entry points:
 * - doPost: Accepts JSON payloads from the front‌end and appends each order
 *   as a row in the "orders" sheet.
 * - doGet: Reads orders from the "orders" sheet and returns them in JSON
 *   format. Supports optional `from` and `to` query parameters (Jalali date
 *   strings in the format YYYY/MM/DD) to filter rows by date range.
 *
 * Before deploying:
 * 1. Create a Google Sheet and name a worksheet "orders".
 * 2. In the first row of the "orders" sheet, create these columns:
 *    code | name | section | jdate | weekday | meal | side | created_at
 * 3. Replace SHEET_ID below with your Google Sheet ID (found in the URL).
 * 4. Save this script in the same project as the spreadsheet or bind it.
 * 5. Deploy as a web app: New deployment → Web app → select `doPost` and
 *    `doGet` as entry points and "Anyone" access. The deployment URL (ending
 *    with `/exec`) becomes the value of SHEET_URL in your HTML.
 */
const SHEET_ID = 'PUT_YOUR_SHEET_ID_HERE'; // <-- update this to your sheet ID
const ORDERS_SHEET_NAME = 'orders';
function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(ORDERS_SHEET_NAME);
    if (!sheet) {
      return respond({ ok: false, error: 'Sheet not found: ' + ORDERS_SHEET_NAME });
    }
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : null;
    if (!body || !Array.isArray(body) || !body.length) {
      return respond({ ok: false, error: 'Invalid payload' });
    }
    const now = new Date();
    body.forEach(item => {
      const row = [
        item.code || '',
        item.name || '',
        item.section || '',
        item.jdate || '',
        item.weekday || '',
        item.meal || '',
        item.side || '',
        Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
      ];
      sheet.appendRow(row);
    });
    return respond({ ok: true, inserted: body.length });
  } catch (error) {
    return respond({ ok: false, error: String(error) });
  }
}
function doGet(e) {
  try {
    const from = e.parameter.from || '';
    const to = e.parameter.to || '';
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(ORDERS_SHEET_NAME);
    if (!sheet) {
      return respond({ ok: false, error: 'Sheet not found: ' + ORDERS_SHEET_NAME });
    }
    const values = sheet.getDataRange().getValues();
    const header = values.shift();
    const rows = [];
    values.forEach(row => {
      const record = {
        code: row[0] || '',
        name: row[1] || '',
        section: row[2] || '',
        jdate: row[3] || '',
        weekday: row[4] || '',
        meal: row[5] || '',
        side: row[6] || '',
        created_at: row[7] || ''
      };
      if (from && record.jdate < from) return;
      if (to && record.jdate > to) return;
      rows.push(record);
    });
    return respond({ ok: true, rows: rows });
  } catch (error) {
    return respond({ ok: false, error: String(error) });
  }
}
function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
