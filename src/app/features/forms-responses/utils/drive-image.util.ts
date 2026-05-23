/**
 * 從 Google Drive 各種分享網址取出檔案 ID。
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) {
    return null;
  }

  const patterns = [/[?&]id=([^&]+)/, /\/file\/d\/([^/]+)/, /\/d\/([^/]+)/];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * 轉成較適合在網頁嵌入的縮圖網址（含尺寸參數）。
 */
export function toDisplayableDriveImageUrl(url: string, size = 400): string {
  const id = extractGoogleDriveFileId(url);
  if (!id) {
    return url;
  }

  return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
}

/**
 * 主網址載入失敗時的備用（uc export=view）。
 */
export function driveImageFallbackUrl(url: string): string | null {
  const id = extractGoogleDriveFileId(url);
  if (!id) {
    return null;
  }

  return `https://drive.google.com/uc?export=view&id=${id}`;
}
