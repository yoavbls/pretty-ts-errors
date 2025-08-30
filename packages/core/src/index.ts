export type { Diagnostic } from "vscode-languageserver-types";
export type PrettierFormat = (type: string) => string;
export { formatDiagnostic } from "./internal/format/formatDiagnostic.js";
export { formatDiagnosticMessage } from "./internal/format/formatDiagnosticMessage.js";
export {
  formatTypeBlock,
  prettifyType,
} from "./internal/format/formatTypeBlock.js";
export { configureRenderers } from "./internal/renderers.js";
