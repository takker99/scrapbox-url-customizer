import { HTTPError, makeHTTPError } from "../error.ts";
import { Result } from "../deps/scrapbox-rest.ts";
declare const GM_fetch: (typeof fetch) | undefined;

/** twitterのhttps://t.co/xxx 形式の短縮URLを展開する
 *
 * @param shortId 短縮URLのID部分
 * @return 展開先URL, GM_fetchがなければ`undefined`を同期的に返す
 */
export const expandTwitterShortURL = (
  shortId: string,
): Promise<Result<string, HTTPError>> | undefined => {
  if (!GM_fetch) return;

  return (async () => {
    const res = await GM_fetch(`https://t.co/${shortId}`);
    const error = makeHTTPError(res);
    if (error) return { ok: false, value: error };
    const dom = new DOMParser().parseFromString(await res.text(), "text/html");
    return { ok: true, value: dom.title };
  })();
};
