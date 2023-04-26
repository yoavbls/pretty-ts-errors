import { has, invert, keys, values } from "@pretty-ts-errors/utils";

const parentheses = {
  "(": ")",
  "{": "}",
  "[": "]",
} as const;

const openParentheses = keys(parentheses);
const closeParentheses = values(parentheses);

export function addMissingParentheses(type: string): string {
  let openStack: (typeof openParentheses)[number][] = [];
  let missingClosingChars = "";

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
    missingClosingChars += closingChar;
  }

  let validType = type;

  // Close the last string if it's not closed
  if ((validType.match(/\"/g) ?? []).length % 2 === 1) {
    validType = validType + '..."';
  }
  if ((validType.match(/\'/g) ?? []).length % 2 === 1) {
    validType = validType + "...'";
  }

  validType = (validType + missingClosingChars).replace(
    // Change (param: ...) to (param) => __RETURN_TYPE__ if needed
    /(\([a-zA-Z0-9]*\:.*\))/,
    (p1) => `${p1} => ...`
  );

  return validType;
}
