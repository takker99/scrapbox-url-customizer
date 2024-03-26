import { upload } from "../deps/deno-gyazo.ts";
import { getGyazoToken } from "../deps/scrapbox-rest.ts";
declare const GM_fetch: typeof fetch;

let token = "";
let checked = false;
const cache = new Map<string, URL>();

export const uploadTwimg = async (
  url: URL,
  tweetURL: URL,
  description: string,
): Promise<URL | undefined> => {
  if (url.hostname !== "pbs.twimg.com") return;
  if (!url.pathname.startsWith("/media")) return;
  const cachedGyazoURL = cache.get(url.href);
  if (cachedGyazoURL) return cachedGyazoURL;

  if (!checked) {
    const result = await getGyazoToken();
    checked = true;
    if (!result.ok) {
      alert(
        "You haven't logged in Gyazo yet, so you can only upload images to scrapbox.io.",
      );
      return;
    }
    token = result.value || "";
    if (!token) {
      alert(
        "You haven't connect Gyazo to scrapbox.io yet.",
      );
      return;
    }
  } else if (!token) {
    return;
  }

  const res = await GM_fetch(url);
  if (!res.ok) return;

  const result = await upload(await res.blob(), {
    accessToken: token,
    refererURL: tweetURL,
    description,
  });
  if (!result.ok) throw Error(result.value.name);

  const gyazoURL = new URL(result.value.permalink_url);

  cache.set(url.href, gyazoURL);

  return gyazoURL;
};
