import { upload } from "../deps/deno-gyazo.ts";
import { getGyazoToken, uploadToGCS } from "../deps/scrapbox-rest.ts";
import { uploadToGyazoGIF } from "./uploadVideo.ts";
/** TamperMonkeyから注入された函数
 *
 * このmoduleの函数は、GM_fetchがある条件でしか使わないので、`undefined`の可能性を排除している
 */
declare const GM_fetch: typeof fetch;

let token = "";
let checked = false;
const cache = new Map<string, URL>();

export const uploadTwimg = async (
  url: URL,
  tweetURL: URL,
  projectId: string,
  description: string,
): Promise<URL | undefined> => {
  const cachedURL = cache.get(url.href);
  if (cachedURL) return cachedURL;
  if (url.hostname === "video.twimg.com" || `${url}`.endsWith(".svg")) {
    // upload the video to scrapbox.io
    const res = await GM_fetch(url);
    if (!res.ok) return;
    const type = res.headers.get("content-type")?.split?.(";")?.[0] ??
        `${url}`.endsWith(".mp4")
      ? "video/mp4"
      : "video/webm";
    const file = new File([await res.blob()], description || `${tweetURL}`, {
      type,
    });
    if (type === "video/mp4") {
      const res = await uploadToGyazoGIF(file);
      if (res.ok) {
        const fileURL = new URL(await res.text());
        cache.set(url.href, fileURL);
        return fileURL;
      }
    }
    const result = await uploadToGCS(file, projectId);
    if (!result.ok) throw Error(result.value.name);
    const fileURL = new URL(result.value.embedUrl);

    cache.set(url.href, fileURL);

    return fileURL;
  }
  if (url.hostname !== "pbs.twimg.com") return;
  if (!url.pathname.startsWith("/media")) return;

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
