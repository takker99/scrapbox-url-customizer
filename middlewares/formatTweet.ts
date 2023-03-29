import { getTweet, RefTweet, Tweet } from "../internal/getTweet.ts";
import { ProcessedTweet, processTweet } from "../internal/processTweet.ts";
import { convertScrapboxURL } from "./convertScrapboxURL.ts";

/** tweetを展開する */
export const formatTweet = (
  format: (tweet: Tweet, url: URL) => string = defaultFormat,
): (url: URL) => Promise<string> | URL =>
(url) => {
  // from https://scrapbox.io/asset/index.js
  const [, id] = url.href.match(
    /^https:\/\/(?:www\.|mobile\.|m\.|)twitter\.com\/[\w\d_]+\/(?:status|statuses)\/(\d+)/,
  ) ?? [];
  if (id === undefined) return url;

  const res = getTweet(id);
  if (!res) return url;

  return (async () => {
    const result = await res;
    if (!result.ok) throw result.value;
    return format(result.value, url);
  })();
};

/** scrapbox.ioが使っているformatに、返信先と引用元tweetを加えたもの */
const defaultFormat = (tweet: Tweet | RefTweet) => {
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
            lines.push(`[${node.media[i - 1].url}] [${node.media[i].url}]`);
          }
          if (i === node.media.length) lines.push(`[${node.media[i - 1].url}]`);
          return `\n${lines.join("\n")}\n`;
        }
        case "url":
          return `${convertScrapboxURL()(node.url)} `;
      }
    }).join("").split("\n"),
  ];
};

// from https://scrapbox.io/asset/index.js
const escapeForEmbed = (text: string) =>
  text
    .replace(/\b/gm, "")
    .replace(/[\s\r\n\u2028\u2029]+/gm, " ")
    .replace(/\s*[[\]`]\s*/g, " ")
    .trim();
