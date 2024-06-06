/** TamperMonkeyから注入された函数
 *
 * このmoduleの函数は、GM_fetchがある条件でしか使わないので、`undefined`の可能性を排除している
 */
declare const GM_fetch: typeof fetch;

export const uploadToGyazoGIF = (
  video: File,
  options?: { teams?: boolean },
): Promise<Response> => {
  const formData = new FormData();
  formData.append("data", video);
  formData.append(
    "metadata",
    JSON.stringify({
      app: "Gyazo",
      title: video.name,
    }),
  );
  return GM_fetch(
    `https://gif.gyazo.com/${options?.teams ? "teams" : "gif"}/upload`,
    {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: {
        Origin: "https://gyazo.com",
        "sec-fetch-site": "same-site",
      },
      referrer: "https://gyazo.com/",
    },
  );
};
