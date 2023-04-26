export { formatDiagnosticMessage } from "./formatDiagnosticMessage";

export type CodeBlock = (
  code: string,
  language?: string,
  multiLine?: boolean
) => string;
