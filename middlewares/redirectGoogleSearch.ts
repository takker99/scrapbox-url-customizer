/** Googleの検索結果URLをリダイレクト先URLにする */
export const redirectGoogleSearch = (url: URL): URL => {
  if (!url.hostname.startsWith("www.google.")) return url;
  const encodedURL = url.searchParams.get("url");
  return encodedURL ? new URL(decodeURIComponent(encodedURL)) : url;
};
