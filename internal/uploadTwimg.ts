import { upload } from "@takker/gyazo";
import { getGyazoToken, uploadToGCS } from "@cosense/std/rest";
import { uploadToGyazoGIF } from "./uploadVideo.ts";
import { isErr, unwrapErr, unwrapOk } from "option-t/plain_result";
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
    if (isErr(result)) throw Error(unwrapErr(result).name);
    const fileURL = new URL(unwrapOk(result).embedUrl);

    cache.set(url.href, fileURL);

    return fileURL;
  }
  if (url.hostname !== "pbs.twimg.com") return;
  if (!url.pathname.startsWith("/media")) return;

  if (!checked) {
    const result = await getGyazoToken();
    checked = true;
    if (isErr(result)) {
      alert(
        "You haven't logged in Gyazo yet, so you can only upload images to scrapbox.io.",
      );
      return;
    }
    token = unwrapOk(result) || "";
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
  if (isErr(result)) throw Error(unwrapErr(result).name);

  const gyazoURL = new URL(unwrapOk(result).permalink_url);

  cache.set(url.href, gyazoURL);

  return gyazoURL;
};
