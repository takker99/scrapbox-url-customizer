import { getTweet, RefTweet, Tweet } from "../internal/getTweet.ts";
import { getTweetInfo, TweetInfo } from "../deps/scrapbox-rest.ts";
import {
  Media,
  ProcessedTweet,
  processTweet,
} from "../internal/processTweet.ts";
import { convertScrapboxURL } from "./convertScrapboxURL.ts";

/** tweetを展開する */
export const formatTweet = (
  format: (tweet: Tweet | TweetInfo, url: URL) => string = defaultFormat,
): (url: URL) => Promise<string> | URL =>
(url) => {
  // from https://scrapbox.io/asset/index.js
  const match = url.href.match(/^https:\/\/(?:www\.|mobile\.|m\.|)((vx|fx)?twitter|(fixup)?x)\.com\/[\w\d_]+\/(?:status|statuses)\/(\d+)/);
  const id = match ? match.slice(-1)[0] : undefined;
  if (!id) return url;

  return (async () => {
    const result = await (getTweet(id) ?? getTweetInfo(url.href));
    if (!result.ok) throw result.value;
    return format(result.value, url);
  })();
};

/** scrapbox.ioが使っているformatに、返信先と引用元tweetを加えたもの */
const defaultFormat = (tweet: Tweet | RefTweet | TweetInfo, url: URL) => {
  if ("images" in tweet) {
    return [
      `[${escapeForEmbed(tweet.screenName)}(@${
        escapeForEmbed(tweet.userName)
      }) ${url.origin}${url.pathname}]`,
      ...tweet.description.split("\n").map((line) =>
        `> ${escapeForEmbed(line)}`
      ),
      ...(tweet.images.length > 0
        ? [`> ${tweet.images.map((image) => `[${image}]`)}`]
        : []),
    ].join("\n");
  }

  const { quote, replyTo, ...processed } = processTweet(tweet);

  return [
    ...(replyTo
      ? [
        ...stringify(replyTo).map((line) => ` > ${line}`),
        ...(replyTo.quote
          ? stringify(replyTo.quote).map((line) => `  > ${line}`)
          : []),
      ]
      : []),
    ...stringify(processed).map((line) => `> ${line}`),
    ...(quote ? stringify(quote).map((line) => `> > ${line}`) : []),
  ].join("\n");
};

const stringify = ({ content, author, id }: ProcessedTweet) => {
  const url = `https://twitter.com/${author.screenName}/status/${id}`;

  return [
    `[${escapeForEmbed(author.name)}(@${
      escapeForEmbed(author.screenName)
    }) ${url}]`,
    ...content.map((node) => {
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
              `${makeEmbed(node.media[i - 1])} ${makeEmbed(node.media[i])}`,
            );
          }
          if (i === node.media.length) lines.push(makeEmbed(node.media[i - 1]));
          return `\n${lines.join("\n")}\n`;
        }
        case "url":
          return `${convertScrapboxURL()(node.url)} `;
      }
    }).join("").split("\n"),
  ];
};

const makeEmbed = (media: Media["media"][0]) =>
  `[${media.url}${
    media.type === "photo"
      ? /\.(?:png|jpe?g|gif|svg)$/.test(`${media.url}`) ? "" : "#.jpg"
      : /\.(?:mp4|webm)$/.test(`${media.url}`)
      ? ""
      : "#.mp4"
  }]`;

// from https://scrapbox.io/asset/index.js
const escapeForEmbed = (text: string) =>
  text
    .replace(/\b/gm, "")
    .replace(/[\s\r\n\u2028\u2029]+/gm, " ")
    .replace(/\s*[[\]`]\s*/g, " ")
    .trim();
