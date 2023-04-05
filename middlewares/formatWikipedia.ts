/** wikipediaのリンクを変換する */
export const formatWikipedia = (url: URL): string | URL => {
  if (!url.pathname.startsWith("/wiki/")) return url;
  if (!/^\w+\.wikipedia\.org$/.test(url.hostname)) {
    const [, lang] = url.hostname.match(/^(\w+)\.m\.wikipedia\.org$/) ?? [];
    if (!lang) {
      return url;
    }
    url.hostname = `${lang}.wikipedia.org`;
  }

  const title = decodeURIComponent(url.pathname.slice(6));
  const section = url.hash ? decodeURIComponent(url.hash.slice(1)) : "";

  const href = `${url.origin}/wiki/${title}`;
  return section
    ? `[${section} | ${title} - Wikipedia ${href}#${section}]`
    : `[${title} - Wikipedia ${href}]`;
};
