import { has, invert, objectKeys } from "@pretty-ts-errors/utils";

const parentheses = {
  "(": ")",
  "{": "}",
  "[": "]",
} as const;

const openParentheses = objectKeys(parentheses);
const closeParentheses = Object.values(parentheses);

export function addMissingParentheses(type: string): string {
  const openStack: (typeof openParentheses)[number][] = [];
  const missingClosingChars: string[] = [];

  for (const char of type) {
    if (has(openParentheses, char)) {
      openStack.push(char);
    } else if (has(closeParentheses, char)) {
      if (
        openStack.length === 0 ||
        parentheses[openStack[openStack.length - 1]] !== char
      ) {
        // Add the correct opening character before the current closing character
        openStack.push(invert(parentheses)[char]);
      } else {
        openStack.pop();
      }
    }
  }

  // Add the missing closing characters at the end of the string
  while (openStack.length > 0) {
    const openChar = openStack.pop()!;
    const closingChar = parentheses[openChar];
    missingClosingChars.push(closingChar);
  }

  let validType = type;

  // Close the last string if it's not closed
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
    // Change (param: ...) to (param) => __RETURN_TYPE__ if needed
    /(\([a-zA-Z0-9]*:.*\))/,
    (p1) => `${p1} => ...`
  );

  return validType;
}
