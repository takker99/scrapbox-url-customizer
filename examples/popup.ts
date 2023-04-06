import {
  convert,
  convertScrapboxURL,
  expandShortURL,
  formatTweet,
  formatURL,
  formatWikipedia,
  Middleware,
  redirectWikiwand,
} from "../mod.ts";
import { insertText, Scrapbox } from "../deps/scrapbox.ts";
declare const scrapbox: Scrapbox;

// 毎回functionsを作るのは無駄なので、globalに保持しておく
const middlewares: Middleware[] = [
  convertScrapboxURL(),
  expandShortURL,
  formatTweet(),
  redirectWikiwand,
  formatWikipedia,
  // コードを画像にする
  (url) => {
    if (url.hostname === "raw.githubusercontent.com") {
      return `[https://code2svg.vercel.app/svg/${url.origin}${url.pathname}#.svg ${url}]`;
    }
    if (url.hostname !== "github.com") return url;
    const [user, repo, filepath] =
      url.pathname.match(/^\/([^\\]+)\/([^\\]+)\/blob\/(.+)$/)?.slice?.(1) ??
        [];
    if (!user || !repo || !filepath) return url;
    const [, start, end] = url.hash.match(/L(\d+)-L(\d+)/) ??
      url.hash.match(/L(\d+)/) ?? [];
    return `[https://code2svg.vercel.app/svg/${
      start && end ? `L${start}-${end}/` : start ? `L${start}/` : ""
    }https://raw.githubusercontent.com/${user}/${repo}/${filepath}#.svg ${url}]`;
  },
  // githubはそのまま返す
  (url) => url.hostname === "github.com" ? `${url}` : url,
  formatURL(),
];

scrapbox.PopupMenu.addButton({
  title: (text) => /https?:\/\/\S+/.test(text) ? "URL" : "",
  onClick: (text) => {
    const promise = convert(text, ...middlewares);
    if (typeof promise === "string") {
      // 文字列に違いがあるときのみ更新
      return text === promise ? undefined : promise;
    }
    // 選択範囲を一旦消してから、変換後の文字列を貼り付ける
    // 変換中にカーソルを動かされると、ずれた位置に挿入されるので注意
    promise.then((converted) => insertText(converted));
    return "";
  },
});
