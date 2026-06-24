// The runtime package consumes pre-generated JSON, so the body filler must remain
// pure and must not depend on filesystem access or markdown parsing.
export function fillBodyWithItems(
  body: string,
  items: readonly (string | number)[],
) {
  items.forEach((item, index) => {
    const bodyRegex = new RegExp(`'?\\{${index}\\}'?`, "g");
    body = body.replace(bodyRegex, `\`${String(item)}\``);
  });

  return {
    body,
  };
}
