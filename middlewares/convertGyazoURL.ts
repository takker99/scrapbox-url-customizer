/** GyazoのURLを画像にする
 *
 * @param url URL
 * @return GyazoのURLのとき、画像記法にして返す。それ以外の場合は元のURLをそのまま返す
 */
export const convertGyazoURL = (url: URL): string | URL => {
  if (!/(?:[0-9a-z-]\.)?gyazo\.com/.test(url.hostname)) return url;
  const [, gyazoId] = url.pathname.match(/^\/([0-9a-f]{32})(?:\/raw)?$/) ?? [];
  if (!gyazoId) return url;
  return `[https://gyazo.com/${gyazoId}]`;
};
