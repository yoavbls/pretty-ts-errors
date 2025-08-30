import { Diagnostic } from "vscode-languageserver-types";

export type Inline = (code: string, language: string) => string;
export type Multi = (code: string, language: string) => string;
export type Unstyled = (content: string) => string;
export type Title = (diagnostic: Diagnostic) => string;
export type Html = (strings: TemplateStringsArray, ...expr: any[]) => string;

export let inlineCodeBlock: Inline;
export let multiLineCodeBlock: Multi;
export let unStyledCodeBlock: Unstyled;
export let title: Title;
export let d: Html;

export function configureRenderers(renderers: {
  inlineCodeBlock: Inline;
  multiLineCodeBlock: Multi;
  unStyledCodeBlock: Unstyled;
  title: Title;
  html: Html;
}) {
  inlineCodeBlock = renderers.inlineCodeBlock;
  multiLineCodeBlock = renderers.multiLineCodeBlock;
  unStyledCodeBlock = renderers.unStyledCodeBlock;
  title = renderers.title;
  d = renderers.html;
}

