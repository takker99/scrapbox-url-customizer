import { expandTwitterShortURL } from "../internal/expandTwitterShortURL.ts";

declare global {
  interface Window {
    GM_fetch: (typeof fetch) | undefined;
  }
}

/** 各種の短縮URLを展開する
 *
 * 対応している短縮URL
 * - bit.ly
 * - amzn.to
 * - amzn.asia
 * - goo.gl
 * - s.nikkei.com
 * - apple.co
 * - t.co
 * - nico.ms
 * - w.wiki
 */
export const expandShortURL = (url: URL): Promise<URL> | URL => {
  if (
    [
      "bit.ly",
      "amzn.to",
      "amzn.asia",
      "goo.gl",
      "s.nikkei.com",
      "apple.co",
      "nico.ms",
      "w.wiki",
    ].includes(
      url.hostname,
      // deno-lint-ignore no-window
    ) && window.GM_fetch
  ) {
    // deno-lint-ignore no-window
    return window.GM_fetch(url).then((res) => res.ok ? new URL(res.url) : url);
  }

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
