/**
 * Google Apps Script 範例（貼到 script.google.com 專案）
 *
 * 部署設定：
 * - 執行身分：我
 * - 具有存取權的使用者：任何人
 *
 * 圖片以 data URL（base64）嵌入 JSON，避免 exec?img= 回傳 HTML 無法顯示。
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
        obj.imgUrl = fileId ? fileIdToDataUrl_(fileId) : '';
      }

      return obj;
    })
    .reverse();

  return { success: true, data: data };
}

/** 確認 blob 為圖片（避免把 Google 登入 HTML 誤編碼成 base64） */
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

/** 以 Drive API（部署者 OAuth）讀取檔案，轉成 data URL */
function fileIdToDataUrl_(fileId) {
  const fromApi = fetchDriveFileAsDataUrl_(fileId);
  if (fromApi) {
    return fromApi;
  }

  try {
    const file = DriveApp.getFileById(fileId);
    const mime = file.getMimeType() || '';
    if (mime.indexOf('image/') === 0) {
      return encodeBlobAsDataUrl_(file.getBlob(), mime);
    }
  } catch (err) {
    return '';
  }

  return '';
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

    return encodeBlobAsDataUrl_(resp.getBlob(), mime);
  } catch (err) {
    return '';
  }
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

function encodeBlobAsDataUrl_(blob, mime) {
  const normalizedMime = mime && mime.indexOf('image/') === 0 ? mime : '';

  if (normalizedMime) {
    return 'data:' + normalizedMime + ';base64,' + Utilities.base64Encode(blob.getBytes());
  }

  if (!isImageBlob_(blob)) {
    return '';
  }

  const fallbackMime = blob.getContentType() || 'image/jpeg';
  const safeMime = fallbackMime.indexOf('image/') === 0 ? fallbackMime : 'image/jpeg';
  return 'data:' + safeMime + ';base64,' + Utilities.base64Encode(blob.getBytes());
}

function parseDriveFileId_(url) {
  if (!url || typeof url !== 'string') return null;
  const patterns = [
    /[?&]img=([a-zA-Z0-9_-]+)/,
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
