/**
 * Google Apps Script 範例（貼到 script.google.com 專案）
 *
 * 部署設定：
 * - 執行身分：我
 * - 具有存取權的使用者：任何人
 *
 * 若 imgUrl 仍為空：
 * 1. 專案設定 → 勾選「在編輯器中顯示 appsscript.json」→ 貼上 scripts/appsscript.json.example
 * 2. 先執行 authorizeDrive() 完成 Drive 授權
 * 3. 再執行 testImageEncode()，最後部署新版本
 */
const SPREADSHEET_ID = '1VVBJ2d9Ou9sd5N3nQz_uguUzSJdxIsKtb8q08rtpLTg';
const SHEET_NAME = 'allUserResponse';

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const debug = params.debug === '1';
  const payload = getResponses_(debug);
  const json = JSON.stringify(payload);

  if (params.callback) {
    return ContentService.createTextOutput(params.callback + '(' + json + ')').setMimeType(
      ContentService.MimeType.JAVASCRIPT,
    );
  }

  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/** 第一次請先執行此函式，跳出授權時務必允許「Google 雲端硬碟」 */
function authorizeDrive() {
  DriveApp.getRootFolder();
  Logger.log('Drive 授權成功');
}

function testImageEncode() {
  const id = '1lVfWd0DGOBWKb4aKyGojIz0TwxmgrLRt';
  Logger.log(getImageFetchStatus_(id));
  const dataUrl = fileIdToDataUrl_(id);
  Logger.log('length=' + dataUrl.length);
  Logger.log('prefix=' + dataUrl.substring(0, 50));
}

function getResponses_(debug) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const range = sheet.getDataRange();
  const values = range.getValues();
  const rich = range.getRichTextValues();
  const headers = values[0];
  const rows = values.slice(1);
  const richRows = rich.slice(1);
  const photoCol = headers.indexOf('imgUrl');

  const data = rows
    .map(function (row, ri) {
      const obj = {};
      headers.forEach(function (h, i) {
        obj[h] = row[i];
      });

      if (photoCol >= 0) {
        const fileId = resolveDriveFileIdFromCell_(row[photoCol], richRows[ri][photoCol]);
        obj.imgFileId = fileId || '';
        obj.imgUrl = fileId ? fileIdToDataUrl_(fileId) : '';
        if (debug && fileId && !obj.imgUrl) {
          obj.imgDebug = getImageFetchStatus_(fileId);
        }
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
  const blob = fetchDriveImageBlob_(fileId);
  if (!blob) {
    return '';
  }

  let mime = (blob.getContentType() || 'image/jpeg').split(';')[0].trim();
  if (mime.indexOf('image/') !== 0) {
    mime = isImageBlob_(blob) ? 'image/jpeg' : '';
  }

  if (!mime) {
    return '';
  }

  // 多數瀏覽器不支援 HEIC，若 bytes 不是 JPEG/PNG 則略過
  if (mime === 'image/heic' || mime === 'image/heif') {
    if (!isImageBlob_(blob)) {
      return '';
    }
    mime = 'image/jpeg';
  }

  return 'data:' + mime + ';base64,' + Utilities.base64Encode(blob.getBytes());
}

/** 以部署者 OAuth 讀取縮圖（重點：帶 Authorization，才拿得到 JPEG 而非 HTML） */
function fetchDriveImageBlob_(fileId) {
  const token = ScriptApp.getOAuthToken();

  const attempts = [
    function () {
      return UrlFetchApp.fetch(
        'https://www.googleapis.com/drive/v3/files/' + fileId + '/thumbnail?sz=w400',
        {
          headers: { Authorization: 'Bearer ' + token },
          muteHttpExceptions: true,
          followRedirects: true,
        },
      );
    },
    function () {
      return UrlFetchApp.fetch('https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400', {
        headers: { Authorization: 'Bearer ' + token },
        muteHttpExceptions: true,
        followRedirects: true,
      });
    },
    function () {
      return UrlFetchApp.fetch(
        'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media&supportsAllDrives=true',
        {
          headers: { Authorization: 'Bearer ' + token },
          muteHttpExceptions: true,
        },
      );
    },
  ];

  for (let i = 0; i < attempts.length; i++) {
    try {
      const resp = attempts[i]();
      if (resp.getResponseCode() === 200 && isImageBlob_(resp.getBlob())) {
        return resp.getBlob();
      }
    } catch (err) {
      // try next
    }
  }

  try {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const mime = file.getMimeType() || '';
    if (mime.indexOf('image/') === 0 || isImageBlob_(blob)) {
      return blob;
    }
  } catch (err) {
    return null;
  }

  return null;
}

function getImageFetchStatus_(fileId) {
  const token = ScriptApp.getOAuthToken();
  const parts = [];

  try {
    DriveApp.getFileById(fileId);
    parts.push('driveApp:ok');
  } catch (err) {
    parts.push('driveApp:' + err.message);
  }

  try {
    const metaResp = UrlFetchApp.fetch(
      'https://www.googleapis.com/drive/v3/files/' +
        fileId +
        '?fields=mimeType,name&supportsAllDrives=true',
      {
        headers: { Authorization: 'Bearer ' + token },
        muteHttpExceptions: true,
      },
    );
    parts.push('meta:' + metaResp.getResponseCode());
  } catch (err) {
    parts.push('metaErr:' + err.message);
  }

  try {
    const mediaResp = UrlFetchApp.fetch(
      'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media&supportsAllDrives=true',
      {
        headers: { Authorization: 'Bearer ' + token },
        muteHttpExceptions: true,
      },
    );
    parts.push('media:' + mediaResp.getResponseCode());
  } catch (err) {
    parts.push('mediaErr:' + err.message);
  }

  return parts.join('|');
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
