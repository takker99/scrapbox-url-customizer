import type { HTTPError } from "@cosense/std/rest";
import { makeHTTPError } from "../error.ts";
import { mapAsyncForResult, type Result } from "option-t/plain_result";

interface UnsafeWindow {
  GM_fetch?: typeof fetch;
}

/** twitterのhttps://t.co/xxx 形式の短縮URLを展開する
 *
 * @param shortId 短縮URLのID部分
 * @return 展開先URL, GM_fetchがなければ`undefined`を同期的に返す
 */
export const expandTwitterShortURL = (
  shortId: string,
): Promise<Result<URL | undefined, HTTPError>> | undefined =>
  (window as unknown as UnsafeWindow).GM_fetch?.(
    `https://t.co/${shortId}`,
  )?.then?.((res) =>
    mapAsyncForResult(
      makeHTTPError(res),
      async (res) => {
        const dom = new DOMParser().parseFromString(
          await res.text(),
          "text/html",
        );
        try {
          return new URL(dom.title);
        } catch (e: unknown) {
          if (e instanceof TypeError) return undefined;
          throw e;
        }
      },
    )
  );
