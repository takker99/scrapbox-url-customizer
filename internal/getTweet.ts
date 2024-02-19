// 説明の一部は https://developer.twitter.com/en/docs/twitter-api からコピペした
import { HTTPError, makeHTTPError } from "../error.ts";
import { Result } from "../deps/scrapbox-rest.ts";
declare global {
  interface Window {
    GM_fetch: (typeof fetch) | undefined;
  }
}

/** tweetを取得する
 *
 * @param tweetId 取得したいtweetのID
 * @return 成功するとtweetypeof converted === "string"tの各種情報を返す。`GM_fetch`がないときは`undefined`を同期で返す
 */
export const getTweet = (
  tweetId: string,
): Promise<Result<Tweet, HTTPError>> | undefined => {
  // deno-lint-ignore no-window
  if (!window.GM_fetch) return;
  // deno-lint-ignore no-window
  const fetch_ = window.GM_fetch;

  return (async () => {
    const res = await fetch_(
      `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=x`,
    );
    const error = makeHTTPError(res);
    if (error) return { ok: false, value: error };
    const tweet = (await res.json()) as Tweet;
    return { ok: true, value: tweet };
  })();
};

/** The response of `https://cdn.syndication.twimg.com/tweet-result?id=:tweetId` */
export interface Tweet {
  __typename: "Tweet";

  /** the screen name of the user the author reply to */
  in_reply_to_screen_name?: string;
  /** the user id of the user the author reply to */
  in_reply_to_user_id_str?: string;
  /** the id of the tweet the author reply to */
  in_reply_to_status_id_str?: string;
  self_thread?: {
    id_str: string;
  };

  place?: Place;

  /** the tweet id */
  id_str: string;

  /** the language of the tweet */
  lang: string;

  /** the tweet content */
  text: string;

  /** the author of the tweet */
  user: User;

  /** the number of favorite */
  favorite_count: number;

  /** the number of replies */
  conversation_count: number;

  display_text_range: Indices;
  created_at: string;

  entities: Entities;
  mediaDetails?: MediaDetail[];
  photos?: Photo[];
  video?: Video;

  news_action_type: "covid19" | "conversation";

  /** the tweet to be replied to */
  parent?: RefTweet;

  /** the tweet to be quoted */
  quoted_tweet?: RefTweet;

  card?: Card;

  possibly_sensitive?: boolean;

  edit_control: Record<string, unknown>;
  isEdited: boolean;

  isStaleEdit: boolean;
}

export interface User {
  /** user id */
  id_str: string;

  /** Display name of the referenced user.
   *
   * @example name: "Twitter API"
   */
  name: string;

  /** Screen name of the referenced user
   *
   * @example screen_name: "twitterapi"
   */
  screen_name: string;

  /** profile image URL */
  profile_image_url_https: string;

  /** whether to a verified account */
  verified: boolean;

  verified_type?: string;

  /** whether to a blue-verified account */
  is_blue_verified: boolean;

  highlighted_label?: {
    description: string;
    user_label_type: string;
    badge: { url: string };
  };
}

export interface Place {
  /** ID representing this place */
  id: string;

  /** Full human-readable representation of the place’s name */
  full_name: string;
}

export interface RefTweet
  extends Omit<Tweet, "__typename" | "conversation_count"> {
  /** the number of replies */
  reply_count: number;

  /** the number of retweets */
  retweet_count: number;
}

export interface Entities {
  hashtags: HashtagEntity[];
  urls: UrlEntity[];
  user_mentions: UserMentionEntity[];
  symbols: SymbolEntity[];
  media?: UrlEntity[];
}

export interface HashtagEntity extends Entity {
  /** Name of the hashtag, minus the leading ‘#’ character */
  text: string;
}

export interface SymbolEntity extends Entity {
  /** Name of the cashtag, minus the leading ‘$’ character */
  text: string;
}

export interface UrlEntity extends Entity {
  /** Wrapped URL, corresponding to the value embedded directly into the raw Tweet text, and the values for the indices parameter.
   *
   * @example "url":"https://t.co/yzocNFvJuL"
   */
  url: string;

  /** Expanded version of `display_url`
   *
   * @example "expanded_url":"http://bit.ly/2so49n2"
   */
  expanded_url: string;

  /** URL pasted/typed into Tweet
   *
   * @example "display_url":"bit.ly/2so49n2"
   */
  display_url: string;
}

export interface UserMentionEntity extends Entity {
  /** the mentioned user id */
  id_str: string;

  /** Display name of the mentioned user */
  name: string;

  /** Screen name of the mentioned user */
  screen_name: string;
}

export interface Entity {
  /** An array of integers representing offsets within the Tweet text where the entity begins and ends.
   * The first integer represents the location of the first character of the entity in the Tweet text.
   * The second integer represents the location of the first non-entity character after the end of the entity.
   *
   * @example "indices":[30,53]
   */
  indices: Indices;
}

export interface MediaDetail extends UrlEntity {
  type: "photo" | "video" | "animated_gif";
  ext_media_availability: MediaAvailability;
  ext_media_stats?: {
    view_count: number;
  };
  ext_alt_text?: string;
  media_url_https: string;
  original_info: {
    height: number;
    width: number;
    focus_rects?: Coordinate[];
  };
  sizes: Record<
    "large" | "medium" | "small" | "thumb",
    { w: number; h: number; resize: "fit" | "crop" }
  >;
  additional_media_info?: {
    description: string;
    title: string;
    embeddable: boolean;
  };
  sensitive_media_warning?: { size: string };
  video_info?: {
    aspect_ratio: [number, number];
    duration_millis?: number;
    variants: { bitrate?: number; content_type: string; url: string }[];
  };
}

export interface Video {
  aspectRatio: [number, number];
  poster: string;
  contentType?: "media_entity" | "gif" | "vmap" | "broadcast";
  durationMs?: number;
  mediaAvailability?: MediaAvailability;
  videoId?: VideoId;
  viewCount?: number;
}
export interface MediaAvailability {
  status: "Available";
}

export interface Variant {
  type: string;
  src: string;
}

export interface VideoId {
  type: "tweet" | "dm" | "broadcast" | "static_broadcast" | "audio_space";
  id: string;
}

export interface Photo {
  accessibilityLabel?: string;
  backgroundColor: Color;
  cropCoordinates: Coordinate[];
  expandedUrl: string;
  url: string;
  width: number;
  height: number;
}

export interface Color {
  red: number;
  green: number;
  blue: number;
}
export interface Coordinate {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Indices = [number, number];

export interface Card {
  card_platform: {
    platform: {
      audience: { name: string };
      device: {
        name: string;
        version: string;
      };
    };
  };
  name: string;
  url: string;
  binding_values: Record<
    string,
    StringValue | BooleanValue | ImageValue | ImageColorValue | UserValue
  >;
}

export interface StringValue {
  type: "STRING";
  string_value: string;
  scribe_key?: string;
}

export interface BooleanValue {
  type: "BOOLEAN";
  boolean_value: boolean;
  scribe_key?: string;
}

export interface ImageValue {
  type: "IMAGE";
  image_value: {
    height: number;
    width: number;
    url: string;
  };
  scribe_key?: string;
}

export interface ImageColorValue {
  type: "IMAGE_COLOR";
  image_color_value: {
    palette: {
      rgb: Color;
      percentage: number;
    }[];
  };
  scribe_key?: string;
}

export interface UserValue {
  type: "USER";
  user_value: {
    id_str: string;
    path: unknown[];
  };
  scribe_key?: string;
}
