const parentheses = {
  "(": ")",
  "{": "}",
  "[": "]",
} as const;

const openParentheses = Object.keys(parentheses) as Array<
  keyof typeof parentheses
>;
const closeParentheses = Object.values(parentheses);

function invert<T extends Record<string, string>>(
  obj: T
): Record<T[keyof T], keyof T> {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    result[(obj as any)[key]] = key;
  }
  return result;
}

export function addMissingParentheses(type: string): string {
  const openStack: (typeof openParentheses)[number][] = [];
  const missingClosingChars: string[] = [];

  for (const char of type) {
    if ((openParentheses as unknown as string[]).includes(char)) {
      openStack.push(char as (typeof openParentheses)[number]);
    } else if (closeParentheses.includes(char)) {
      if (
        openStack.length === 0 ||
        parentheses[openStack[openStack.length - 1]] !== char
      ) {
        openStack.push(invert(parentheses)[char] as any);
      } else {
        openStack.pop();
      }
    }
  }

  while (openStack.length > 0) {
    const openChar = openStack.pop()!;
    const closingChar = parentheses[openChar];
    missingClosingChars.push(closingChar);
  }

  let validType = type;

  const quoteMatches = validType.match(/['"]/g);
  if (quoteMatches) {
    const lastQuote = quoteMatches[quoteMatches.length - 1];
    if (quoteMatches.length % 2 === 1) {
      validType += `...${lastQuote}`;
    }
  }

  if (validType.endsWith(":")) {
    validType += "...";
  }

  validType = (validType + "\n..." + missingClosingChars.join("")).replace(
    /(\([a-zA-Z0-9]*:.*\))/,
    (p1) => `${p1} => ...`
  );

  return validType;
}

