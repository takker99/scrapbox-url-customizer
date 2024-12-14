import { expandTwitterShortURL } from "../internal/expandTwitterShortURL.ts";
import type { UnsafeWindow } from "../internal/UnsafeWindow.ts";
import { mapOrElseForResult } from "option-t/plain_result";

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
  const fetch_ = (window as unknown as UnsafeWindow).GM_fetch;
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
    ) && fetch_
  ) {
    return fetch_(url).then((res) => res.ok ? new URL(res.url) : url);
  }

  if (url.hostname !== "t.co") return url;
  const promise = expandTwitterShortURL(url.pathname.slice(1));
  if (!promise) return url;

  return promise.then((result) =>
    mapOrElseForResult(result, () => url, (expanded) => expanded ?? url)
  );
};
