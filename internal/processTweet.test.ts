/// <reference lib="deno.ns" />

import { assertSnapshot } from "../deps/testing.ts";
import { processTweet } from "./processTweet.ts";
import type { RefTweet, Tweet } from "./getTweet.ts";
import tweet from "./1572401761092239362.json" assert { type: "json" };
import tweetWithGIF from "./1162409260627611648.json" assert { type: "json" };
import tweetWithOGP from "./1168966000135606274.json" assert { type: "json" };

Deno.test("processTweet()", async (t) => {
  for (
    const tw of [
      tweet,
      tweet.parent,
      tweetWithGIF,
      tweetWithGIF.quoted_tweet,
      tweetWithOGP,
    ]
  ) {
    await t.step(
      `(@${tw.user.screen_name}) ${tw.text.slice(0, 10)}`,
      async (t) => {
        await assertSnapshot(
          t,
          processTweet(tw as unknown as (Tweet | RefTweet)),
        );
      },
    );
  }
});
