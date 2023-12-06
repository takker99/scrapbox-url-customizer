import { expandTwitterShortURL } from "../internal/expandTwitterShortURL.ts";
import { getWebPageTitle, Project } from "../deps/scrapbox-rest.ts";
import { getWebPage } from "../internal/getWebPage.ts";
import { isString } from "../is.ts";
import { Scrapbox } from "../deps/scrapbox.ts";
declare const scrapbox: Scrapbox;

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

export const formatWork4ai =
  (format: (material: Document | string, url: URL) => string = defaultFormat): ((url: URL) => Promise<string>) =>
  async (url) =>
    format(await getDocumentOrTitle(url), url);

const defaultFormat = (material: Document | string, url: URL) => {
  const title = (isString(material) ? material : material.title)
    .replace(/\s/g, " ") // スペースと改行を全て半角スペースにする
    .replaceAll("[", "［")
    .replaceAll("]", "］");
  if (scrapbox.Project.name !== "work4ai") return `${url}`;
  if (url.host === "arxiv.org") {
    return title ? `[. ${url.hash ? `${decodeURIComponent(url.hash.slice(1))} | ` : ""}${url}][${title.replace(/\［[\d\.]+\］\s/, "")}]` : `${url}`;
  } else if (url.host.includes("github.io")) {
    return title ? `[. ${url.hash ? `${decodeURIComponent(url.hash.slice(1))} | ` : ""}${url}][${title}]` : `${url}`;
  } else if (url.host === "github.com") {
    const lastTwoSegments = url.href.split("/").slice(3, 5);
    return `[. ${url}][${lastTwoSegments[0]}]/[${lastTwoSegments[1]}]`;
  } else if (url.href.includes("huggingface.co/papers")) {
    return title ? `[. ${url.hash ? `${decodeURIComponent(url.hash.slice(1))} | ` : ""}${url}][${title.replace(/Paper page -\s/, "")}]` : `${url}`;
  }
  return title ? `[${url.hash ? `${decodeURIComponent(url.hash.slice(1))} | ` : ""}${title} ${url}]` : `${url}`;
};

const getDocumentOrTitle = async (url: URL): Promise<Document | string> => {
  const promise = getWebPage(url);
  if (!promise) {
    const result = await getWebPageTitle(url);
    if (!result.ok) throw result.value;
    return result.value;
  }

  const result = await promise;
  if (!result.ok) throw result.value;
  return new DOMParser().parseFromString(result.value, "text/html");
};
