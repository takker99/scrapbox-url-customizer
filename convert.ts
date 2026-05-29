import { isString } from "@core/unknownutil/is/string";

/** URL変換用関数
 *
 * @param url 変換するURL
 * @return 変換後のURL。変換が不要だったときは`url`をそのまま返す。これ以上変換が不要な場合は、文字列にして返す
 */
export type Middleware = (
  url: Readonly<URL>,
) => URL | string | Promise<URL | string>;

/** URLを変換する
 * @param text URLもしくはURLを0個以上含んだテキスト
 * @param middlewares URLを変換する関数。最初に指定したものから順に適用される。文字列を返すとそこで処理が終わり、その文字列が元のURLの変換後の文字列として採用される
 * @return 変換後の文字列。使用されたmiddlewaresのどれか一つが非同期処理した場合、Promiseで返される
 */
export const convert = (
  url: URL,
  ...middlewares: Middleware[]
): string | Promise<string> => {
  const final = middlewares.reduce(
    (prev, middleware) =>
      isString(prev)
        ? prev
        : prev instanceof Promise
        ? prev.then((url) => isString(url) ? url : middleware(url))
        : middleware(prev),
    url as URL | string | Promise<URL | string>,
  );
  return final instanceof Promise ? final.then((url) => `${url}`) : `${final}`;
};
