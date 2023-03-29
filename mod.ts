import { useStatusBar } from "./deps/scrapbox.ts";
import { convert as convertURL, Middleware } from "./convert.ts";
import { isString } from "./is.ts";
export type { Middleware };
export * from "./middlewares/mod.ts";
export { convertURL };

/** URLもしくはURLを0個以上含んだテキストを変換する
 *
 * @param text URLもしくはURLを0個以上含んだテキスト
 * @param middlewares URLを変換する関数。最初に指定したものから順に適用される。文字列を返すとそこで処理が終わり、その文字列が元のURLの変換後の文字列として採用される
 * @return 変換後の文字列。使用されたmiddlewaresのどれか一つが非同期処理した場合、Promiseで返される
 */
export const convert = (
  text: string | URL,
  ...middlewares: Middleware[]
): Promise<string> | string => {
  if (text instanceof URL) {
    return convertURL(new URL(text), ...middlewares);
  }
  let total = 0;
  let done = 0;
  let failed = 0;
  let hasPromise = false;
  const nodes = text.split(/(https?:\/\/\S+)/g).map((node) => {
    if (!/^https?:\/\/\S+$/.test(node)) return node;
    total++;
    try {
      const converted = convertURL(new URL(node), ...middlewares);
      // 同期で変換された場合は、ここで成否をカウントする
      if (isString(converted)) {
        done++;
        return converted;
      }
      hasPromise = true;
      // wordsは変換失敗時のfallback用に保持しておく
      return [converted, node] as const;
    } catch (e: unknown) {
      // 同期で変換された場合は、ここで成否をカウントする
      console.error(e);
      failed++;
      return node;
    }
  });

  if (!hasPromise) return (nodes as string[]).join("");

  // 非同期変換が発生した場合は、進捗状況を表示する
  const { render, dispose } = useStatusBar();
  try {
    const render_ = () =>
      render({
        type: "text",
        text: `URL: ${done}/${total} converted, ${failed} failed`,
      });
    render_();
    return Promise.all(
      nodes.map(async (node) => {
        if (!Array.isArray(node)) return node;
        try {
          const converted = await node[0];
          done++;
          return converted;
        } catch (e: unknown) {
          // 変換に失敗したときは、元の文字列を返す
          console.error(e);
          failed++;
          return node[1];
        } finally {
          render_();
        }
      }),
    ).then((fragments) => {
      render(
        { type: "check-circle" },
        {
          type: "text",
          text: `URL: ${done}/${total} converted, ${failed} failed`,
        },
      );
      return fragments.join("");
    });
  } finally {
    setTimeout(dispose, 1000);
  }
};
