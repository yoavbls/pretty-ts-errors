// The runtime package consumes pre-generated JSON, so the body filler must remain
// pure and must not depend on filesystem access or markdown parsing.
function createMarkdownCodeSpan(text: string): string {
  const longestBacktickRun = Math.max(
    0,
    ...Array.from(text.matchAll(/`+/gu), (match) => match[0].length),
  );
  const fence = "`".repeat(longestBacktickRun + 1);
  const needsPadding = text.startsWith("`") || text.endsWith("`");
  const content = needsPadding ? ` ${text} ` : text;
  return `${fence}${content}${fence}`;
}

export function fillBodyWithItems(
  body: string,
  items: readonly (string | number)[],
) {
  items.forEach((item, index) => {
    const bodyRegex = new RegExp(`'?\\{${index}\\}'?`, "g");
    body = body.replace(bodyRegex, createMarkdownCodeSpan(String(item)));
  });

  return {
    body,
  };
}
