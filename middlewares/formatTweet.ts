import { getTweet, RefTweet, Tweet } from "../internal/getTweet.ts";
import { uploadTwimg } from "../internal/uploadTwimg.ts";
import { getTweetInfo, TweetInfo } from "../deps/scrapbox-rest.ts";
import {
  Media,
  ProcessedTweet,
  processTweet,
} from "../internal/processTweet.ts";
import { convertScrapboxURL } from "./convertScrapboxURL.ts";

/** tweetをscrapboxに書き込む際の変換format */
export type TweetFormatter = (
  tweet: Tweet | TweetInfo,
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
    const result = await (getTweet(id) ?? getTweetInfo(url.href));
    if (!result.ok) throw result.value;
    return format(result.value, url);
  })();
};

/** scrapbox.ioが使っているformatに、返信先と引用元tweetを加えたもの */
const defaultFormat = async (
  tweet: Tweet | RefTweet | TweetInfo,
  url: URL,
): Promise<string> => {
  if ("images" in tweet) {
    return [
      `> [@${escapeForEmbed(tweet.screenName)} ${url.origin}${url.pathname}]`,
      ...(tweet.description?.split?.("\n")?.map?.((line) =>
        `> ${escapeForEmbed(line)}`
      ) ?? ["[/ no description provided]"]),
      ...(tweet.images.length > 0
        ? [`> ${tweet.images.map((image) => `[${image}]`)}`]
        : []),
    ].join("\n");
  }

  const { quote, replyTo, ...processed } = processTweet(tweet);

  return [
    ...(replyTo
      ? [
        ...(await stringify(replyTo)).map((line) => ` > ${line}`),
        ...(replyTo.quote
          ? (await stringify(replyTo.quote)).map((line) => `  > ${line}`)
          : []),
      ]
      : []),
    ...(await stringify(processed)).map((line) => `> ${line}`),
    ...(quote ? (await stringify(quote)).map((line) => `> > ${line}`) : []),
  ].join("\n");
};

const stringify = async ({ content, author, id }: ProcessedTweet) => {
  const url = new URL(`https://twitter.com/${author.screenName}/status/${id}`);

  return [
    `[@${escapeForEmbed(author.screenName)} ${url}]`,
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
              `${await makeEmbed(node.media[i - 1], url)} ${await makeEmbed(
                node.media[i],
                url,
              )}`,
            );
          }
          if (i === node.media.length) {
            lines.push(await makeEmbed(node.media[i - 1], url));
          }
          return `\n${lines.join("\n")}\n`;
        }
        case "url":
          return `${convertScrapboxURL()(node.url)} `;
      }
    }))).join("").split("\n"),
  ];
};

const makeEmbed = async (media: Media["media"][0], tweetURL: URL) =>
  media.type === "photo"
    ? `${media.url}`.endsWith(".svg")
      ? `[${media.url}]`
      : `[${(await uploadTwimg(media.url, tweetURL, "")) ?? media.url}]`
    : `[${media.url}${/\.(?:mp4|webm)$/.test(`${media.url}`) ? "" : "#.mp4"}]`;

// from https://scrapbox.io/asset/index.js
const escapeForEmbed = (text: string) =>
  text
    .replace(/\b/gm, "")
    .replace(/[\s\r\n\u2028\u2029]+/gm, " ")
    .replace(/\s*[[\]`]\s*/g, " ")
    .trim();
