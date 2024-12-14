import {
  convert,
  convertGyazoURL,
  convertScrapboxURL,
  expandShortURL,
  formatTweet,
  formatURL,
  formatWikipedia,
  redirectGoogleSearch,
  redirectWikiwand,
  shortenAmazonURL,
} from "../mod.ts";
import { insertText } from "@cosense/std/browser/dom";
import type { Scrapbox } from "@cosense/types/userscript";
declare const scrapbox: Scrapbox;

// 毎回functionsを作るのは無駄なので、globalに保持しておく
const middlewares = [
  redirectGoogleSearch,
  expandShortURL,
  redirectGoogleSearch,
  redirectWikiwand,
  shortenAmazonURL,
  convertScrapboxURL(),
  convertGyazoURL,
  formatTweet(),
  formatWikipedia,
  formatURL(),
] as const;

scrapbox.PopupMenu.addButton({
  title: (text) => /https?:\/\/\S+/.test(text) ? "URL" : "",
  onClick: (text) => {
    const promise = convert(text, ...middlewares);
    if (typeof promise === "string") {
      // 文字列に違いがあるときのみ更新
      return text === promise ? undefined : promise;
    }
    // 選択範囲に変換後の文字列を上書きする
    // 変換中に選択範囲が変わると、ずれた位置に挿入されるので注意
    promise.then((converted) => {
      if (text === converted) return;
      return insertText(converted);
    });
    return undefined;
  },
});
