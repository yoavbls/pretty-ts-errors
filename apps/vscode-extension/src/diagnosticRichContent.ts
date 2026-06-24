import { translateDiagnosticMessage } from "@pretty-ts-errors/error-translator";

export interface DiagnosticTextNode {
  kind: "text";
  text: string;
}

export interface DiagnosticInlineCodeNode {
  kind: "inlineCode";
  text: string;
}

export interface DiagnosticLinkNode {
  kind: "link";
  href: string;
  label: string;
}

export type DiagnosticInlineNode =
  | DiagnosticTextNode
  | DiagnosticInlineCodeNode
  | DiagnosticLinkNode;

export interface DiagnosticParagraphNode {
  kind: "paragraph";
  lines: DiagnosticInlineNode[][];
}

export interface DiagnosticCodeBlockNode {
  kind: "codeBlock";
  code: string;
  language: string | null;
}

export interface DiagnosticTypeBlockNode {
  kind: "typeBlock";
  code: string;
  language: string | null;
}

export interface DiagnosticListNode {
  kind: "list";
  items: DiagnosticInlineNode[][];
}

export interface DiagnosticPropertyListNode {
  kind: "propertyList";
  items: string[];
}

export type DiagnosticBlockNode =
  | DiagnosticParagraphNode
  | DiagnosticCodeBlockNode
  | DiagnosticTypeBlockNode
  | DiagnosticListNode
  | DiagnosticPropertyListNode;

export interface DiagnosticTranslationContentModel {
  blocks: DiagnosticBlockNode[];
  code: number;
  rawError: string;
}

export interface DiagnosticRichContentModel {
  body: DiagnosticBlockNode[];
  title: string;
  translations: DiagnosticTranslationContentModel[];
}

const fencedCodeBlockPattern =
  /((?:`{3,})[^\n]*\n[\s\S]*?\n(?:`{3,}))/gu;
const inlineTokenPattern =
  /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|`([^`]+)`/gu;
const propertyLikeItemPattern = /^[#\w.$:[\]"'-]+$/u;

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/gu, "\n");
}

function isTypeBlockLanguage(language: string | null): boolean {
  return language === "type" || language === "ts" || language === "typescript";
}

function createInlineCodeFence(code: string): string {
  const fence =
    code.includes("``") ? "```" : code.includes("`") ? "``" : "`";
  return `${fence}${code}${fence}`;
}

function createFencedCodeBlock(code: string, language: string | null): string {
  const fence = code.includes("```") ? "````" : "```";
  const infoString = language ?? "";
  return `${fence}${infoString}\n${code}\n${fence}`;
}

function parseInlineNodes(text: string): DiagnosticInlineNode[] {
  const nodes: DiagnosticInlineNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(inlineTokenPattern)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      nodes.push({
        kind: "text",
        text: text.slice(lastIndex, matchIndex),
      });
    }

    const linkLabel = match[1];
    const linkHref = match[2];
    const codeText = match[3];
    if (typeof linkLabel === "string" && typeof linkHref === "string") {
      nodes.push({
        kind: "link",
        href: linkHref,
        label: linkLabel,
      });
    } else if (typeof codeText === "string") {
      nodes.push({
        kind: "inlineCode",
        text: codeText,
      });
    }

    lastIndex = matchIndex + match[0].length;
  }

  const suffix = text.slice(lastIndex);
  if (suffix.length > 0) {
    nodes.push({
      kind: "text",
      text: suffix,
    });
  }

  if (nodes.length === 0) {
    return [
      {
        kind: "text",
        text,
      },
    ];
  }

  return nodes;
}

function parseListItems(lines: string[]): string[] {
  return lines.map((line) => line.replace(/^[-*]\s+/u, ""));
}

function isBulletList(lines: string[]): boolean {
  return (
    lines.length > 0 &&
    lines.every((line) => line.trim().length > 0 && /^[-*]\s+/u.test(line))
  );
}

function isPropertyList(items: string[]): boolean {
  return items.every((item) => propertyLikeItemPattern.test(item));
}

function parseMarkdownParagraph(paragraph: string): DiagnosticBlockNode {
  const lines = paragraph
    .split("\n")
    .map((line) => line.replace(/\s+$/u, ""))
    .filter((line) => line.length > 0);

  if (isBulletList(lines)) {
    const items = parseListItems(lines);
    if (isPropertyList(items)) {
      return {
        kind: "propertyList",
        items,
      };
    }

    return {
      kind: "list",
      items: items.map((item) => parseInlineNodes(item)),
    };
  }

  return {
    kind: "paragraph",
    lines: lines.map((line) => parseInlineNodes(line)),
  };
}

export function parseMarkdownToDiagnosticBlocks(
  markdown: string,
): DiagnosticBlockNode[] {
  const normalized = normalizeLineEndings(markdown).trim();
  if (normalized.length === 0) {
    return [];
  }

  const blocks: DiagnosticBlockNode[] = [];
  const tokens = normalized.split(fencedCodeBlockPattern).filter(Boolean);

  tokens.forEach((token) => {
    const fenceMatch =
      /^(?<fence>`{3,})(?<language>[^\n]*)\n(?<code>[\s\S]*?)\n\k<fence>$/u.exec(
        token,
      );
    if (fenceMatch?.groups) {
      const languageValue = (fenceMatch.groups["language"] ?? "").trim();
      const language = languageValue.length > 0 ? languageValue : null;
      const code = fenceMatch.groups["code"] ?? "";

      blocks.push(
        isTypeBlockLanguage(language)
          ? {
              kind: "typeBlock",
              code,
              language,
            }
          : {
              kind: "codeBlock",
              code,
              language,
            },
      );
      return;
    }

    const paragraphs = token
      .split(/\n{2,}/u)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);

    paragraphs.forEach((paragraph) => {
      blocks.push(parseMarkdownParagraph(paragraph));
    });
  });

  return blocks;
}

function renderInlineNodesToMarkdown(nodes: DiagnosticInlineNode[]): string {
  return nodes
    .map((node) => {
      switch (node.kind) {
        case "text":
          return node.text;
        case "inlineCode":
          return createInlineCodeFence(node.text);
        case "link":
          return `[${node.label}](${node.href})`;
      }
    })
    .join("");
}

export function renderDiagnosticBlocksToMarkdown(
  blocks: DiagnosticBlockNode[],
): string {
  return blocks
    .map((block) => {
      switch (block.kind) {
        case "paragraph":
          return block.lines
            .map((line) => renderInlineNodesToMarkdown(line))
            .join("\n");
        case "codeBlock":
        case "typeBlock":
          return createFencedCodeBlock(block.code, block.language);
        case "list":
          return block.items
            .map((item) => `- ${renderInlineNodesToMarkdown(item)}`)
            .join("\n");
        case "propertyList":
          return block.items.map((item) => `- ${item}`).join("\n");
      }
    })
    .join("\n\n");
}

function buildTitle(code: string | number | undefined): string {
  return typeof code === "number" ? `Error (TS${code})` : "Error";
}

export function createDiagnosticRichContentModel(
  code: string | number | undefined,
  message: string,
  bodyMarkdown: string,
): DiagnosticRichContentModel {
  return {
    body: parseMarkdownToDiagnosticBlocks(bodyMarkdown),
    title: buildTitle(code),
    translations: translateDiagnosticMessage(message).map((translation) => {
      return {
        blocks: parseMarkdownToDiagnosticBlocks(translation.body),
        code: translation.code,
        rawError: translation.rawError,
      };
    }),
  };
}
