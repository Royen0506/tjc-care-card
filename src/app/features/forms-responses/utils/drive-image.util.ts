import { GAS_EXEC_URL } from '../service/sheets-api.service';

/**
 * 從 GAS 代理網址（exec?img=）或 Google Drive 網址取出檔案 ID。
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) {
    return null;
  }

  const patterns = [
    /[?&]img=([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * 轉成 GAS 圖片代理網址（匿名訪客可載入，不需登入 Google Drive）。
 */
export function resolveAvatarImageUrl(url: string): string {
  const id = extractDriveFileId(url);
  if (!id) {
    return url;
  }

  return `${GAS_EXEC_URL}?img=${id}`;
}
