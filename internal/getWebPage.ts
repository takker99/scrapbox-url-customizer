import type { HTTPError } from "@cosense/std/rest";
import { makeHTTPError } from "../error.ts";
import type { UnsafeWindow } from "./UnsafeWindow.ts";
import { mapAsyncForResult, type Result } from "option-t/plain_result";

const charsetRegExp = /charset=([^;]+)/;

/** web pageを取得する
 *
 * @param url 取得したいweb pageのURL
 * @return html text. GM_fetchがなければ`undefined`を同期的に返す
 */
export const getWebPage = (
  url: URL,
): Promise<Result<string, HTTPError>> | undefined =>
  (window as unknown as UnsafeWindow).GM_fetch?.(
    `${url}`,
  )?.then?.((res) =>
    mapAsyncForResult(
      makeHTTPError(res),
      async (res) => {
        const contentType =
          res.headers.get("content-type")?.match?.(charsetRegExp)?.[1] ??
            await detectEncoding(res.clone());
        return new TextDecoder(contentType).decode(await res.arrayBuffer());
      },
    )
  );

const detectEncoding = async (res: Response): Promise<string> => {
  const dom = new DOMParser().parseFromString(await res.text(), "text/html");
  return dom.querySelector("meta[charset]")?.getAttribute?.("charset") ??
    dom.querySelector('meta[http-equiv="content-type"]')?.getAttribute?.(
      "content",
    )?.match?.(charsetRegExp)?.[1] ?? "utf-8";
};
