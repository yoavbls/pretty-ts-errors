import { has, invert, objectKeys } from "@pretty-ts-errors/utils";

const parentheses = {
  "(": ")",
  "{": "}",
  "[": "]",
} as const;

const openParentheses = objectKeys(parentheses);
const closeParentheses = Object.values(parentheses);

function isAsciiAlphaNumeric(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122)
  );
}

function addMissingFunctionReturnType(type: string): string {
  for (let openIndex = 0; openIndex < type.length; openIndex++) {
    if (type[openIndex] !== "(") continue;

    let colonIndex = openIndex + 1;
    while (colonIndex < type.length && isAsciiAlphaNumeric(type[colonIndex]!)) {
      colonIndex++;
    }

    if (type[colonIndex] !== ":") continue;

    const closeIndex = type.indexOf(")", colonIndex + 1);
    if (closeIndex === -1) return type;

    return `${type.slice(0, closeIndex + 1)} => ...${type.slice(
      closeIndex + 1
    )}`;
  }

  return type;
}

export function addMissingParentheses(type: string): string {
  const openStack: (typeof openParentheses)[number][] = [];
  const missingClosingChars: string[] = [];

  for (const char of type) {
    if (has(openParentheses, char)) {
      openStack.push(char);
    } else if (has(closeParentheses, char)) {
      const lastOpen = openStack[openStack.length - 1];
      if (lastOpen === undefined || parentheses[lastOpen] !== char) {
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

  validType = addMissingFunctionReturnType(
    validType + "\n..." + missingClosingChars.join("")
  );

  return validType;
}
