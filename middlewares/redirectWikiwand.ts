/** wikiwandをwikipediaのURLにする */
export const redirectWikiwand = (url: URL): URL => {
  if (url.hostname !== "www.wikiwand.com") return url;
  const [, lang, pageName] = url.pathname.match(/^\/([^\/]+)\/([^\/]+)/) ??
    [];
  if (!lang || !pageName) return url;
  url.hostname = `${lang}.wikipedia.org`;
  url.pathname = `/wiki/${pageName}`;
  url.hash = url.hash.startsWith("#/") ? `#${url.hash.slice(2)}` : url.hash;
  return url;
};
