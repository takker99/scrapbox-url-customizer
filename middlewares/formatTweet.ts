import { getTweet, type RefTweet, type Tweet } from "../internal/getTweet.ts";
import { uploadTwimg } from "../internal/uploadTwimg.ts";
import {
  type FetchError,
  getProject,
  getTweetInfo,
  type HTTPError,
  type TweetInfoError,
} from "@cosense/std/rest";
import {
  type Media,
  type ProcessedTweet,
  processTweet,
} from "../internal/processTweet.ts";
import { convertScrapboxURL } from "./convertScrapboxURL.ts";
import type { Scrapbox } from "@cosense/types/userscript";
import type { TweetInfo } from "@cosense/types/rest";
import { isErr, type Result, unwrapErr, unwrapOk } from "option-t/plain_result";
declare const scrapbox: Scrapbox;

export type { Media, ProcessedTweet, Tweet, TweetInfo };
export interface TweetViaProxy extends TweetInfo {
  /** tweet id */
  id: string;
}

/** tweetをscrapboxに書き込む際の変換format */
export type TweetFormatter = (
  tweet: Tweet | TweetViaProxy,
  url: URL,
) => Promise<string>;

/** tweetを展開する */
export const formatTweet = (
  format: TweetFormatter = defaultFormat,
): (url: URL) => Promise<string> | URL =>
(url) => {
  // from https://scrapbox.io/asset/index.js
  const [, id] = url.href.match(
    /^https:\/\/(?:(?:www\.|mobile\.|m\.)?twitter|x)\.com\/[\w\d_]+\/(?:status|statuses)\/(\d+)/,
  ) ?? [];
  if (!id) return url;

  return (async () => {
    const result: Result<
      Tweet | TweetInfo,
      TweetInfoError | FetchError | HTTPError
    > = await (getTweet(id) ?? getTweetInfo(url.href));

    if (isErr(result)) throw unwrapErr(result);
    const tweet = unwrapOk(result);

    return format(
      "images" in tweet ? { ...tweet, id } : tweet,
      url,
    );
  })();
};

/** scrapbox.ioが使っているformatに、返信先と引用元tweetを加えたもの */
const defaultFormat = async (
  tweet: Tweet | RefTweet | TweetViaProxy,
): Promise<string> => {
  if ("images" in tweet) return stringify(tweet);

  const { quote, replyTo, ...processed } = processTweet(tweet);

  return [
    ...(replyTo
      ? [
        ...(await stringify(replyTo)).split("\n").map((line) => ` > ${line}`),
        ...(replyTo.quote
          ? (await stringify(replyTo.quote)).split("\n").map((line) =>
            `  > ${line}`
          )
          : []),
      ]
      : []),
    ...(await stringify(processed)).split("\n").map((line) => `> ${line}`),
    ...(quote
      ? (await stringify(quote)).split("\n").map((line) => `> > ${line}`)
      : []),
  ].join("\n");
};

/** Converts a processed tweet or a tweet via /api/embed-text/twitter into a formatted string.
 *
 * @param tweet The processed tweet or tweet via proxy object.
 * @returns A promise that resolves to the formatted string.
 */
export const stringify = async (
  tweet: ProcessedTweet | TweetViaProxy,
): Promise<string> => {
  const url = new URL(
    `https://twitter.com/${
      "author" in tweet ? tweet.author.screenName : tweet.screenName
    }/status/${tweet.id}`,
  );
  if ("images" in tweet) {
    return [
      `> [@${escapeForEmbed(tweet.screenName)} ${url.origin}${url.pathname}]`,
      ...(tweet.description?.split?.("\n")?.map?.((line) =>
        `> ${escapeForEmbed(line)}`
      ) ?? ["> [/ no description provided]"]),
      ...(tweet.images.length > 0
        ? [`> ${tweet.images.map((image) => `[${image}]`)}`]
        : []),
    ].join("\n");
  }

  const content = tweet.content;
  const screenName = tweet.author.screenName;

  return [
    `[@${escapeForEmbed(screenName)} ${url}]`,
    ...(await Promise.all(content.map(async (node) => {
      switch (node.type) {
        case "plain":
          return node.text;
        case "hashtag":
          return ` #${node.text} `;
        case "symbol":
          return ` #$${node.text} `;
        case "mention":
          return `[@${node.screenName} https://twitter.com/${node.screenName}]`;
        case "media": {
          const lines: string[] = [];
          let i = 1;
          for (; i < node.media.length; i += 2) {
            lines.push(
              `[${await uploadMedia(
                node.media[i - 1],
                url,
              )}] [${await uploadMedia(
                node.media[i],
                url,
              )}]`,
            );
          }
          if (i === node.media.length) {
            lines.push(`[${await uploadMedia(node.media[i - 1], url)}]`);
          }
          return `\n${lines.join("\n")}\n`;
        }
        case "url":
          return `${convertScrapboxURL()(node.url)} `;
      }
    }))).join("").split("\n"),
  ].join("\n");
};

let projectId = "";
const getProjectId = async () => {
  if (projectId) return projectId;
  const result = await getProject(scrapbox.Project.name);
  if (isErr(result)) throw new Error(unwrapErr(result).name);
  projectId = unwrapOk(result).id;
  return projectId;
};

/** Uploads media to Gyazo or scrapbox.io and returns the URL of the uploaded media.
 * If the upload fails, it returns the original media URL.
 *
 * @param media - The media to upload.
 * @param tweetURL - The URL of the tweet.
 * @returns The URL of the uploaded media or the original media URL.
 */
export const uploadMedia = async (media: Media, tweetURL: URL): Promise<URL> =>
  (await uploadTwimg(media.url, tweetURL, await getProjectId(), "")) ??
    media.url;

/** scrapboxの記法と干渉する文字を取り除く
 *
 * ported from https://scrapbox.io/asset/index.js
 *
 * @param text 変換前の文字列
 * @returns 変換後の文字列
 */
export const escapeForEmbed = (text: string): string =>
  text
    .replace(/\b/gm, "")
    .replace(/[\s\r\n\u2028\u2029]+/gm, " ")
    .replace(/\s*[[\]`]\s*/g, " ")
    .trim();
