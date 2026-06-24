function isComplexType(text: string): boolean {
  return (
    text.length >= 20 &&
    (/[{}[\]<>:;|&]/u.test(text) ||
      text.includes("=>") ||
      text.includes("${") ||
      text.includes("..."))
  );
}

function repeatIndent(level: number): string {
  return " ".repeat(level * 4);
}

function trimTrailingWhitespace(value: string): string {
  return value.replace(/[ \t]+$/u, "");
}

function normalizeSpacing(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function formatComplexType(value: string): string {
  const text = normalizeSpacing(value);
  let output = "";
  let indentLevel = 0;
  let quote: '"' | "'" | "`" | null = null;
  let escaped = false;

  const appendIndentIfNeeded = () => {
    if (output.length === 0 || output.endsWith("\n")) {
      output += repeatIndent(indentLevel);
    }
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === undefined) {
      continue;
    }

    if (quote !== null) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      appendIndentIfNeeded();
      quote = char;
      output += char;
      continue;
    }

    switch (char) {
      case "{":
      case "[":
      case "(": {
        appendIndentIfNeeded();
        output += char;
        indentLevel += 1;
        output = trimTrailingWhitespace(output);
        output += `\n${repeatIndent(indentLevel)}`;
        break;
      }
      case "}":
      case "]":
      case ")": {
        indentLevel = Math.max(indentLevel - 1, 0);
        output = trimTrailingWhitespace(output);
        if (!output.endsWith("\n")) {
          output += "\n";
        }
        output += `${repeatIndent(indentLevel)}${char}`;
        break;
      }
      case ";":
      case ",": {
        output += char;
        output = trimTrailingWhitespace(output);
        output += `\n${repeatIndent(indentLevel)}`;
        break;
      }
      case "|":
      case "&": {
        output = trimTrailingWhitespace(output);
        if (!output.endsWith("\n")) {
          output += "\n";
        }
        output += `${repeatIndent(indentLevel)}${char} `;
        break;
      }
      case ":":
        output = trimTrailingWhitespace(output);
        output += ": ";
        break;
      default:
        appendIndentIfNeeded();
        output += char;
        break;
    }
  }

  return trimTrailingWhitespace(output).trim();
}

export function formatSidebarInlineType(text: string): {
  multiline: boolean;
  text: string;
} {
  if (!isComplexType(text)) {
    return {
      multiline: false,
      text,
    };
  }

  const formatted = formatComplexType(text);
  return {
    multiline: formatted.includes("\n"),
    text: formatted,
  };
}
