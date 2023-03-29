import { expandTwitterShortURL } from "../internal/expandTwitterShortURL.ts";

/** Twitterの短縮URLを変換するmiddleware
 *
 * @param url URL
 * @return t.coの場合は展開先URLで解決するPromise。それ以外のURLのときは、それをそのまま返す
 */
export const redirectTco = (url: URL): Promise<URL> | URL => {
  if (url.hostname !== "t.co") return url;
  const promise = expandTwitterShortURL(url.pathname.slice(1));
  if (!promise) return url;

  return (async () => {
    const result = await promise;
    if (!result.ok) throw result.value;

    try {
      return new URL(result.value);
    } catch (e: unknown) {
      if (e instanceof TypeError) return url;
      throw e;
    }
  })();
};
