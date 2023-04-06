/** AmazonのURLを短くする
 *
 * cf.
 * - http://urbanqee.com/html/amazon/amazon-url-shortened.html
 * - https://penpen-dev.com/blog/ama-domain/
 */
export const shortenAmazonURL = (url: URL): URL => {
  if (
    !/^(?:www\.)?amazon(?\.co|com)?\.(?:au|br|ca|fr|de|in|it|jp|mx|nl|sg|es|tr|ae|uk|cn)$/
      .test(url.hostname)
  ) return url;
  const [, asin] = url.pathname.match(/\/dp\/([\w\d]+)/) ??
    url.pathname.match(/\/gp\/product\/([\w\d]+)/) ??
    url.pathname.match(/\/exec\/obidos\/asin\/([\w\d]+)/) ??
    url.pathname.match(/\/o\/ASIN\/([\w\d]+)/) ?? [];
  if (!asin) return url;
  url.hash = "";
  url.search = "";
  url.pathname = `/dp/${asin}`;
  return url;
};
