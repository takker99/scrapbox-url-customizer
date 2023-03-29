/** wikipediaのリンクを変換する */
export const formatWikipedia = (url: URL): string | URL => {
  if (!/^\w+\.wikipedia\.org$/.test(url.hostname)) return url;
  if (!url.pathname.startsWith("/wiki/")) return url;

  const title = decodeURIComponent(url.pathname.slice(6));
  const section = url.hash ? decodeURIComponent(url.hash.slice(1)) : "";

  const href = `${url.origin}/wiki/${title}`;
  return section
    ? `[${section} | ${title} - Wikipedia ${href}#${section}]`
    : `[${title} - Wikipedia ${href}]`;
};
