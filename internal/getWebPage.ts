import { HTTPError, makeHTTPError } from "../error.ts";
import { Result } from "../deps/scrapbox-rest.ts";
declare global {
  interface Window {
    GM_fetch: (typeof fetch) | undefined;
  }
}

const charsetRegExp = /charset=([^;]+)/;

/** web pageを取得する
 *
 * @param url 取得したいweb pageのURL
 * @return html text. GM_fetchがなければ`undefined`を同期的に返す
 */
export const getWebPage = (
  url: URL,
): Promise<Result<string, HTTPError>> | undefined => {
  // deno-lint-ignore no-window
  if (!window.GM_fetch) return;
  // deno-lint-ignore no-window
  const fetch_ = window.GM_fetch;

  return (async () => {
    const res = await fetch_(`${url}`);
    const error = makeHTTPError(res);
    if (error) return { ok: false, value: error };

    const contentType =
      res.headers.get("content-type")?.match?.(charsetRegExp)?.[1] ??
        await detectEncoding(res.clone());
    const html = new TextDecoder(contentType).decode(await res.arrayBuffer());
    return { ok: true, value: html };
  })();
};

const detectEncoding = async (res: Response): Promise<string> => {
  const dom = new DOMParser().parseFromString(await res.text(), "text/html");
  return dom.querySelector("meta[charset]")?.getAttribute?.("charset") ??
    dom.querySelector('meta[http-equiv="content-type"]')?.getAttribute?.(
      "content",
    )?.match?.(charsetRegExp)?.[1] ?? "utf-8";
};
