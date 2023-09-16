const map = {
  "&lt;": "<",
  "&gt;": ">",
  "&amp;": "&",
  "&quot;": '"',
  "&#x27;": "'",
  "&#x60;": "`",
};

/** unescape notable HTML special characters
 *
 * cf. https://shanabrian.com/web/javascript/unescape-html.php
 */
export const unescapeHTML = (text: string): string =>
  text.replace(
    /&(lt|gt|amp|quot|#x27|#x60);/g,
    (match) => map[match as keyof typeof map],
  );
