import type { Scrapbox } from "../deps/scrapbox.ts";
declare const scrapbox: Scrapbox;

const reservedNames = [
  "landing",
  "product",
  "enterprise",
  "pricing",
  "try-enterprise",
  "contact",
  "terms",
  "privacy",
  "jp-commercial-act",
  "support",
  "case",
  "features",
  "business",
  "auth",
  "login",
  "logout",
  "oauth2",
  "_",
  "api",
  "app.html",
  "assets",
  "file",
  "files",
  "billing",
  "billings",
  "config",
  "feed",
  "index",
  "io",
  "new",
  "opensearch",
  "project",
  "projects",
  "search",
  "setting",
  "settings",
  "setup-profile",
  "slide",
  "socket.io",
  "stream",
  "user",
  "users",
];

/** scrapboxのURLを内部リンク記法に変える
 *
 * @param url URL
 * @return scrapboxのURLのとき、内部リンク記法にして返す。それ以外の場合は元のURLをそのまま返す
 */
export const convertScrapboxURL = (
  self = scrapbox.Project.name,
  host = location.host,
): (url: URL) => string | URL =>
(url) => {
  if (url.host !== host) return url;
  const [, project, title] =
    url.pathname.match(/^\/([\w\d][\w\d-]{0,22}[\w\d])(?:\/?|\/(.+))$/) ?? [];
  if (!project) return url;
  if (reservedNames.includes(project)) return url;
  if (!title) return `[/${project}]`;
  return project === self
    ? `[${decodeURIComponent(title)}]`
    : `[/${project}/${decodeURIComponent(title)}]`;
};
