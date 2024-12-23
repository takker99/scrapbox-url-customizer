import { getWebPageTitle } from "@cosense/std/rest";
import { getWebPage } from "../internal/getWebPage.ts";
import { isString } from "@core/unknownutil/is/string";
import { isErr, unwrapErr, unwrapOk } from "option-t/plain_result";

/** URL先のデータを使って外部リンク記法にする関数を作る
 *
 * 任意のURLを受け付ける
 *
 * 変換方法を`format`で指定できる
 * - `GM_fetch`が使えるときはweb pageのDOMを、使えないときはページタイトルを受け取れる
 *
 *   @param format 変換関数。defaultだとページタイトルとURL fragmentを組み合わせた文字列を使って外部リンク記法を作る
 *   @return Middleware
 */
export const formatURL = (
  format: (material: Document | string, url: URL) => string = defaultFormat,
): (url: URL) => Promise<string> =>
async (url) => format(await getDocumentOrTitle(url), url);

const defaultFormat = (material: Document | string, url: URL) => {
  const title = (isString(material) ? material : material.title)
    .replace(/\s/g, " ") // スペースと改行を全て半角スペースにする
    .replaceAll("[", "［")
    .replaceAll("]", "］");
  return title
    ? `[${
      url.hash ? `${decodeURIComponent(url.hash.slice(1))} | ` : ""
    }${title} ${url}]`
    : `${url}`;
};

const getDocumentOrTitle = async (url: URL): Promise<Document | string> => {
  const promise = getWebPage(url);
  if (!promise) {
    const result = await getWebPageTitle(url);
    if (isErr(result)) throw unwrapErr(result);
    return unwrapOk(result);
  }

  const result = await promise;
  if (isErr(result)) throw unwrapErr(result);
  return new DOMParser().parseFromString(unwrapOk(result), "text/html");
};
