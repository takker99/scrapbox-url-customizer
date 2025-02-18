
import { isString } from "@core/unknownutil/is/string";
import { getWebPageTitle } from "@cosense/std/rest";
import { scrapbox } from "@cosense/types/userscript";
import { isErr, unwrapErr, unwrapOk } from "option-t/plain_result";
import { getWebPage } from "../internal/getWebPage.ts";

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
): (url: URL) => Promise<string> => {
  return async (url) => {
    const ProjectName = scrapbox.Project.name
    const MyProjects = ["work4ai", "wogikaze-study"]
    if (MyProjects.includes(ProjectName)) {
      if (url.host === "github.com") {
        const lastTwoSegments = url.href.split("/").slice(-2);
        return `[. ${url}][${lastTwoSegments[0]}]/[${lastTwoSegments[1]}]`;
      } else if (url.host === "huggingface.co" && !url.href.includes("huggingface.co/papers") && !url.href.includes("huggingface.co/blog")) {
        const lastTwoSegments = url.href.split("/").slice(-2);
        return `[. ${url}][${lastTwoSegments[0]}]/[${lastTwoSegments[1]}]`;
      }
    }
    return format(await getDocumentOrTitle(url), url);
  }
}

const defaultFormat = (material: Document | string, url: URL) => {
  const title = (isString(material) ? material : material.title)
    .replace(/\s/g, " ") // スペースと改行を全て半角スペースにする
    .replaceAll("[", "［")
    .replaceAll("]", "］");
  const ProjectName = scrapbox.Project.name
  const MyProjects = ["work4ai", "wogikaze-study"]
  if (MyProjects.includes(ProjectName)) {
    if (url.host === "arxiv.org") {
      return title ? `[. ${url.hash ? `${decodeURIComponent(url.hash.slice(1))} | ` : ""}${url}][${title.replace(/\［[\d\.]+\］\s/, "")}]` : `${url}`;
    } else if (url.host.includes("github.io")) {
      return title ? `[. ${url.hash ? `${decodeURIComponent(url.hash.slice(1))} | ` : ""}${url}][${title}]` : `${url}`;
    } else if (url.href.includes("huggingface.co/papers")) {
      return title ? `[. ${url.hash ? `${decodeURIComponent(url.hash.slice(1))} | ` : ""}${url}][${title.replace(/Paper page -\s/, "")}]` : `${url}`;
    } else {
      return title ? `[. ${url.hash ? `${decodeURIComponent(url.hash.slice(1))} | ` : ""}${url}]${title.split("|")[0]}` : `${url}`;
    }
    return title ? `[${url.hash ? `${decodeURIComponent(url.hash.slice(1))} | ` : ""}${title} ${url}]` : `${url}`;
  }
  return title
    ? `[${url.hash ? `${decodeURIComponent(url.hash.slice(1))} | ` : ""
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
