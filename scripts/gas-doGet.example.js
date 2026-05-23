/**
 * Google Apps Script 範例（貼到 script.google.com 專案）
 *
 * 部署設定（重要）：
 * - 執行身分：我
 * - 具有存取權的使用者：任何人（匿名訪客也要能讀）
 *
 * JSONP：Angular 以 callback 參數呼叫，避開 302 / CORS 問題。
 */
const SPREADSHEET_ID = '1VVBJ2d9Ou9sd5N3nQz_uguUzSJdxIsKtb8q08rtpLTg';
const SHEET_NAME = 'allUserResponse';

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const payload = getResponses_();
  const json = JSON.stringify(payload);

  if (params.callback) {
    return ContentService.createTextOutput(params.callback + '(' + json + ')').setMimeType(
      ContentService.MimeType.JAVASCRIPT,
    );
  }

  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function getResponses_() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const range = sheet.getDataRange();
  const values = range.getValues();
  const rich = range.getRichTextValues();
  const headers = values[0];
  const rows = values.slice(1);
  const richRows = rich.slice(1);
  const photoCol = headers.indexOf('imgUrl');

  const data = rows
    .map((row, ri) => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = row[i]));

      if (photoCol >= 0) {
        let url = row[photoCol];
        if (typeof url !== 'string' || !url.includes('drive.google.com')) {
          const rt = richRows[ri][photoCol];
          url = rt ? rt.getLinkUrl() || '' : '';
        }
        const fileId = parseDriveFileId_(url);
        obj.imgUrl = fileId
          ? 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400'
          : '';
      }

      return obj;
    })
    .reverse();

  return { success: true, data: data };
}

function parseDriveFileId_(url) {
  if (!url || typeof url !== 'string') return null;
  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (let i = 0; i < patterns.length; i++) {
    const m = url.match(patterns[i]);
    if (m) return m[1];
  }
  return null;
}
