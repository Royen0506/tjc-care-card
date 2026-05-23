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
 * 轉成可在網頁嵌入的 Drive 縮圖（GAS exec?img= 無法給 <img> 匿名載入）。
 */
export function resolveAvatarImageUrl(url: string, size = 400): string {
  const id = extractDriveFileId(url);
  if (!id) {
    return url;
  }

  return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
}

/** 縮圖載入失敗時的備用網址。 */
export function avatarImageFallbackUrl(url: string): string | null {
  const id = extractDriveFileId(url);
  if (!id) {
    return null;
  }

  return `https://drive.google.com/uc?export=view&id=${id}`;
}
