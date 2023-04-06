import {
  convert,
  convertScrapboxURL,
  expandShortURL,
  formatTweet,
  formatURL,
  formatWikipedia,
  Middleware,
  redirectGoogleSearch,
  redirectWikiwand,
} from "../mod.ts";
import { insertText, Scrapbox } from "../deps/scrapbox.ts";
declare const scrapbox: Scrapbox;

// 毎回functionsを作るのは無駄なので、globalに保持しておく
const middlewares: Middleware[] = [
  redirectGoogleSearch,
  convertScrapboxURL(),
  expandShortURL,
  formatTweet(),
  redirectWikiwand,
  formatWikipedia,
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
