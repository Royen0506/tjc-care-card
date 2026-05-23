/**
 * Google Apps Script 範例（貼到 script.google.com 專案）
 *
 * 部署設定：
 * - 執行身分：我
 * - 具有存取權的使用者：任何人
 *
 * 圖片以 data URL（base64）嵌入 JSON。
 * 測試：在編輯器執行 testImageEncode() 看 Logger。
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

/** 在 GAS 編輯器手動執行，確認能否讀到 Drive 圖片 */
function testImageEncode() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const range = sheet.getDataRange();
  const values = range.getValues();
  const rich = range.getRichTextValues();
  const headers = values[0];
  const photoCol = headers.indexOf('imgUrl');

  Logger.log('imgUrl column index: ' + photoCol);

  if (photoCol < 0) {
    Logger.log('找不到 imgUrl 欄位，headers=' + JSON.stringify(headers));
    return;
  }

  const row = values[1];
  const fileId = resolveDriveFileIdFromCell_(row[photoCol], rich[1][photoCol]);
  Logger.log('fileId=' + fileId);

  if (!fileId) {
    Logger.log('cell value=' + row[photoCol]);
    return;
  }

  const dataUrl = fileIdToDataUrl_(fileId);
  Logger.log('dataUrl prefix=' + dataUrl.substring(0, 40));
  Logger.log('dataUrl length=' + dataUrl.length);
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
        const fileId = resolveDriveFileIdFromCell_(row[photoCol], richRows[ri][photoCol]);
        obj.imgFileId = fileId || '';
        obj.imgUrl = fileId ? fileIdToDataUrl_(fileId) : '';
      }

      return obj;
    })
    .reverse();

  return { success: true, data: data };
}

function resolveDriveFileIdFromCell_(value, richText) {
  const fromValue = parseDriveFileId_(value);
  if (fromValue) {
    return fromValue;
  }

  if (!richText) {
    return null;
  }

  const fromLink = parseDriveFileId_(richText.getLinkUrl());
  if (fromLink) {
    return fromLink;
  }

  const runs = richText.getRuns();
  for (let i = 0; i < runs.length; i++) {
    const fromRun = parseDriveFileId_(runs[i].getLinkUrl());
    if (fromRun) {
      return fromRun;
    }
  }

  return null;
}

function isImageBlob_(blob) {
  const mime = (blob.getContentType() || '').toLowerCase();
  if (mime.indexOf('image/') === 0) {
    return true;
  }

  const bytes = blob.getBytes();
  if (bytes.length < 4) {
    return false;
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) return true;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return true;

  return false;
}

function fileIdToDataUrl_(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const mime = file.getMimeType() || '';
    const blob = file.getBlob();

    if (mime.indexOf('image/') === 0) {
      return 'data:' + mime + ';base64,' + Utilities.base64Encode(blob.getBytes());
    }

    if (isImageBlob_(blob)) {
      const safeMime = blob.getContentType() || 'image/jpeg';
      const normalized = safeMime.indexOf('image/') === 0 ? safeMime : 'image/jpeg';
      return 'data:' + normalized + ';base64,' + Utilities.base64Encode(blob.getBytes());
    }
  } catch (err) {
    // 改試 Drive API
  }

  return fetchDriveFileAsDataUrl_(fileId);
}

function fetchDriveFileAsDataUrl_(fileId) {
  try {
    const token = ScriptApp.getOAuthToken();
    const mediaUrl =
      'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media&supportsAllDrives=true';
    const resp = UrlFetchApp.fetch(mediaUrl, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true,
    });

    if (resp.getResponseCode() !== 200) {
      return '';
    }

    let mime = (resp.getHeaders()['Content-Type'] || resp.getBlob().getContentType() || '')
      .split(';')[0]
      .trim();

    if (!mime || mime.indexOf('image/') !== 0) {
      mime = lookupDriveMimeType_(fileId, token) || '';
    }

    if (mime.indexOf('image/') === 0) {
      return 'data:' + mime + ';base64,' + Utilities.base64Encode(resp.getBlob().getBytes());
    }

    if (isImageBlob_(resp.getBlob())) {
      return 'data:image/jpeg;base64,' + Utilities.base64Encode(resp.getBlob().getBytes());
    }
  } catch (err) {
    return '';
  }

  return '';
}

function lookupDriveMimeType_(fileId, token) {
  try {
    const metaUrl =
      'https://www.googleapis.com/drive/v3/files/' + fileId + '?fields=mimeType&supportsAllDrives=true';
    const resp = UrlFetchApp.fetch(metaUrl, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true,
    });

    if (resp.getResponseCode() === 200) {
      return JSON.parse(resp.getContentText()).mimeType || null;
    }
  } catch (err) {
    return null;
  }

  return null;
}

function parseDriveFileId_(input) {
  if (input === null || input === undefined) {
    return null;
  }

  const url = String(input).trim();
  if (!url) {
    return null;
  }

  if (/^[a-zA-Z0-9_-]{20,}$/.test(url)) {
    return url;
  }

  const patterns = [
    /[?&]img=([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /IMAGE\("([^"]+)"/i,
    /IMAGE\('([^']+)'/i,
  ];

  for (let i = 0; i < patterns.length; i++) {
    const m = url.match(patterns[i]);
    if (m) {
      const nested = parseDriveFileId_(m[1]);
      return nested || m[1];
    }
  }

  return null;
}
