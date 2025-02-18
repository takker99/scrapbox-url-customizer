import type { RefTweet, Tweet } from "./getTweet.ts";
import { unescape } from "@std/html";

/** APIから取得したTweet objectを、使いやすいよう変換して返す
 *
 * 内容
 * - tweet本文中のhashtagやURLを展開する
 * - 短縮URLを元のURLにする
 * - OGPのtitleとdescriptionを反映する
 *
 * pollは無視している
 *
 * @param tweet 変換したいtweet object
 * @return 変換後のtweet object
 */
export const processTweet = (
  tweet: Tweet | RefTweet,
): ProcessedTweet => {
  const author = {
    name: tweet.user.name,
    screenName: tweet.user.screen_name,
  };

  const posted = new Date(tweet.created_at);

  const entities = [
    ...tweet.entities.hashtags.map((hashtag) =>
      ({
        type: "hashtag",
        ...hashtag,
      }) as const
    ),
    ...tweet.entities.symbols.map((symbol) =>
      ({
        type: "symbol",
        ...symbol,
      }) as const
    ),
    ...tweet.entities.user_mentions.map((mention) =>
      ({
        type: "mention",
        name: mention.name,
        screenName: mention.screen_name,
        indices: mention.indices,
      }) as const
    ),
    ...tweet.entities.urls.map((url) => {
      const entity = {
        type: "url",
        indices: url.indices,
        url: new URL(url.expanded_url),
      } as {
        type: "url";
        indices: [number, number];
        url: URL;
        title?: string;
        description?: string;
      };

      if (tweet.card && tweet.card?.url === url.url) {
        const { description, title } = tweet.card.binding_values;
        const key = "STRING";
        if (description?.type === key) {
          entity.description = description.string_value;
        }
        if (title?.type === key) {
          entity.title = title.string_value;
        }
      }

      return entity;
    }),
    ...tweet.entities.media?.map?.((media) =>
      ({
        type: "media",
        indices: media.indices,
        media: tweet.mediaDetails?.flatMap?.((detail) =>
          detail.url === media.url
            ? [{
              type: detail.type,
              url: new URL(
                detail.video_info?.variants?.sort?.((a, b) =>
                  (b.bitrate ?? 0) - (a.bitrate ?? 0)
                )?.[0].url ?? detail.media_url_https,
              ),
            }]
            : []
        ) ?? [],
      }) as const
    ) ?? [],
  ].sort((a, b) => a.indices[0] - b.indices[0]);

  const content: TweetNode[] = [];
  {
    let offset = 0;
    let text = tweet.text;
    for (const { indices, ...entity } of entities) {
      const before = [...text].slice(0, indices[0] - offset).join("");
      content.push({ type: "plain", text: unescape(before) });

      content.push(entity);

      text = [...text].slice(indices[1] - offset).join("");
      offset = indices[1];
    }
    if (text) content.push({ type: "plain", text: unescape(text) });
  }

  const processed: ProcessedTweet = {
    id: tweet.id_str,
    content,
    author,
    posted,
    replyCount: "reply_count" in tweet
      ? tweet.reply_count
      : tweet.conversation_count,
  };
  if (tweet.self_thread) processed.rootId = tweet.self_thread.id_str;
  if (tweet.in_reply_to_status_id_str) {
    processed.replyId = tweet.in_reply_to_status_id_str;
  }
  if (tweet.parent) processed.replyTo = processTweet(tweet.parent);
  if (tweet.quoted_tweet) processed.quote = processTweet(tweet.quoted_tweet);

  return processed;
};

/** 加工したTweet data */
export interface ProcessedTweet {
  /** tweet id */
  id: string;

  /** tweet本文 */
  content: TweetNode[];

  /** 投稿者 */
  author: ProcessedUser;

  /** 投稿日時 */
  posted: Date;

  /** self threadだった場合の、最初のtweetのid */
  rootId?: string;

  /** 返信先tweetのid */
  replyId?: string;

  /** 返信先tweet */
  replyTo?: ProcessedTweet;

  /** 返信数 */
  replyCount: number;

  /** 引用元tweet */
  quote?: ProcessedTweet;
}

export interface ProcessedUser {
  /** 表示上の名前 */
  name: string;

  /** 一意なusername */
  screenName: string;
}

/** tweet本文の解析情報 */
export type TweetNode =
  | PlainText
  | Hashtag
  | SymbolTag
  | UrlNode
  | Mention
  | MediaNode;

export interface Hashtag {
  type: "hashtag";
  text: string;
}
export interface SymbolTag {
  type: "symbol";
  text: string;
}

export interface UrlNode {
  type: "url";
  url: URL;
  title?: string;
  description?: string;
}

export interface MediaNode {
  type: "media";
  media: Media[];
}
export interface Media {
  type: "photo" | "video" | "animated_gif";
  url: URL;
}

export interface Mention {
  type: "mention";
  name: string;
  screenName: string;
}

export interface PlainText {
  type: "plain";
  text: string;
}
