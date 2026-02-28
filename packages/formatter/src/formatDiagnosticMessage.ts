import { formatTypeBlock } from "./formatTypeBlock";

export type CodeBlockFn = (
  code: string,
  language?: string,
  multiLine?: boolean
) => string;

export function createErrorMessagePrettifier(
  codeBlock: CodeBlockFn
): (message: string) => Promise<string> {
  return async (message: string) => {
    const rules = await getRules(codeBlock);
    let output = message;

    for (const { pattern, replacer } of rules) {
      let result = "";
      let lastIndex = 0;
      for (const match of output.matchAll(pattern)) {
        const [fullMatch, ...captures] = match;
        const matchIndex = match.index ?? 0;
        result += output.slice(lastIndex, matchIndex);
        result += await replacer(...captures);
        lastIndex = matchIndex + fullMatch.length;
      }
      result += output.slice(lastIndex);
      output = result;
    }
    return output;
  };
}

type Rule = {
  pattern: RegExp;
  replacer: (...args: any[]) => string | Promise<string>;
};

async function getRules(codeBlock: CodeBlockFn): Promise<Rule[]> {
  const formatTypeScriptBlock = (code: string) => codeBlock(code, "typescript");

  const formatSimpleTypeBlock = (code: string) => codeBlock(code, "type");

  const formatTypeOrModuleBlock = (prefix: string, code: string) =>
    formatTypeBlock(
      prefix,
      ["module", "file", "file name"].includes(prefix.toLowerCase())
        ? `"${code}"`
        : code,
      codeBlock
    );

  return [
    {
      pattern: /(?:\s)'"(.*?)(?<!\\)"'(?:\s|:|.|$)/g,
      replacer: async (p1: string) => formatTypeBlock("", `"${p1}"`, codeBlock),
    },
    {
      pattern: /['“](declare module )['”](.*)['“];['”]/g,
      replacer: (p1: string, p2: string) =>
        formatTypeScriptBlock(`${p1} "${p2}"`),
    },
    {
      pattern:
        /(is missing the following properties from type\s?)'(.*)': ((?:#?\w+, )*(?:(?!and)\w+)?)/g,
      replacer: async (pre: string, type: string, post: string) => {
        const formattedType = await formatTypeBlock("", type, codeBlock);
        const list = post
          .split(", ")
          .filter(Boolean)
          .map((prop: string) => `<li>${prop}</li>`)
          .join("");
        return `${pre}${formattedType}: <ul>${list}</ul>`;
      },
    },
    {
      pattern: /(types) ['“](.*?)['”] and ['“](.*?)['”][.]?/gi,
      replacer: async (p1: string, p2: string, p3: string) => {
        const [left, right] = await Promise.all([
          formatTypeBlock(p1, p2, codeBlock),
          formatTypeBlock("", p3, codeBlock),
        ]);
        return `${left} and ${right}`;
      },
    },
    {
      pattern: /type annotation must be ['“](.*?)['”] or ['“](.*?)['”][.]?/gi,
      replacer: async (p1: string, p2: string, p3: string | number) => {
        if (typeof p3 === "string") {
          const [left, right] = await Promise.all([
            formatTypeBlock(p1, p2, codeBlock),
            formatTypeBlock("", p3, codeBlock),
          ]);
          return `${left} or ${right}`;
        }
        const [left, right] = await Promise.all([
          formatTypeBlock("", p1, codeBlock),
          formatTypeBlock("", p2, codeBlock),
        ]);
        return `${left} or ${right}`;
      },
    },
    {
      pattern: /(Overload \d of \d), ['“](.*?)['”], /gi,
      replacer: async (p1: string, p2: string) =>
        `${p1}${await formatTypeBlock("", p2, codeBlock)}`,
    },
    {
      pattern: /^['“]"[^"]*"['”]$/g,
      replacer: formatTypeScriptBlock,
    },
    {
      pattern: /(module )'([^"]*?)'/gi,
      replacer: (p1: string, p2: string) => `${p1}"${p2}"`,
    },
    {
      pattern:
        /(module|file|file name|imported via) ['"“](.*?)['"“](?=[\s(.|,]|$)/gi,
      replacer: async (p1: string, p2: string) =>
        formatTypeBlock(p1, `"${p2}"`, codeBlock),
    },
    {
      pattern:
        /(type|type alias|interface|module|file|file name|class|method's|subtype of constraint) ['“](.*?)['“](?=[\s(.|,)]|$)/gi,
      replacer: (p1: string, p2: string) => formatTypeOrModuleBlock(p1, p2),
    },
    {
      pattern:
        /(.*)['“]([^>]*)['”] (type|interface|return type|file|module|is (not )?assignable)/gi,
      replacer: async (p1: string, p2: string, p3: string) =>
        `${p1}${await formatTypeOrModuleBlock("", p2)} ${p3}`,
    },
    {
      pattern:
        /['“]((void|null|undefined|any|boolean|string|number|bigint|symbol)(\[\])?)['”]/g,
      replacer: formatSimpleTypeBlock,
    },
    {
      pattern:
        /['“](import|export|require|in|continue|break|let|false|true|const|new|throw|await|for await|[0-9]+)( ?.*?)['”]/g,
      replacer: (p1: string, p2: string) => formatTypeScriptBlock(`${p1}${p2}`),
    },
    {
      pattern: /(return|operator) ['“](.*?)['”]/gi,
      replacer: (p1: string, p2: string) =>
        `${p1} ${formatTypeScriptBlock(p2)}`,
    },
    {
      pattern: /(?<!\w)'((?:(?!["]).)*?)'(?!\w)/g,
      replacer: (p1: string) => ` ${codeBlock(p1)} `,
    },
  ];
}
