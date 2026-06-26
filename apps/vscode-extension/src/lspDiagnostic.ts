import {
  DiagnosticSeverity,
  DiagnosticTag,
  Location,
  type Diagnostic,
  type DiagnosticRelatedInformation,
  type Position,
  type Range,
} from "vscode-languageclient";
import {
  Diagnostic as VsCodeDiagnostic,
  DiagnosticRelatedInformation as VsCodeDiagnosticRelatedInformation,
  DiagnosticSeverity as VsCodeDiagnosticSeverity,
  DiagnosticTag as VsCodeDiagnosticTag,
  type Position as VsCodePosition,
  type Range as VsCodeRange,
} from "vscode";

function toLspPosition(position: VsCodePosition): Position {
  return {
    line: position.line,
    character: position.character,
  };
}

function toLspRange(range: VsCodeRange): Range {
  return {
    start: toLspPosition(range.start),
    end: toLspPosition(range.end),
  };
}

function toLspSeverity(
  severity: VsCodeDiagnosticSeverity | undefined
): DiagnosticSeverity | undefined {
  switch (severity) {
    case VsCodeDiagnosticSeverity.Error:
      return DiagnosticSeverity.Error;
    case VsCodeDiagnosticSeverity.Warning:
      return DiagnosticSeverity.Warning;
    case VsCodeDiagnosticSeverity.Information:
      return DiagnosticSeverity.Information;
    case VsCodeDiagnosticSeverity.Hint:
      return DiagnosticSeverity.Hint;
    default:
      return undefined;
  }
}

function toLspTag(tag: VsCodeDiagnosticTag): DiagnosticTag | undefined {
  switch (tag) {
    case VsCodeDiagnosticTag.Deprecated:
      return DiagnosticTag.Deprecated;
    case VsCodeDiagnosticTag.Unnecessary:
      return DiagnosticTag.Unnecessary;
    default:
      return undefined;
  }
}

function toLspRelatedInformation(
  relatedInformation: VsCodeDiagnosticRelatedInformation
): DiagnosticRelatedInformation {
  return {
    location: Location.create(
      relatedInformation.location.uri.toString(),
      toLspRange(relatedInformation.location.range)
    ),
    message: relatedInformation.message,
  };
}

export interface PrettyTsLspDiagnostic extends Diagnostic {
  message: string;
}

export function toLspDiagnostic(
  diagnostic: VsCodeDiagnostic
): PrettyTsLspDiagnostic {
  const tags = (diagnostic.tags ?? [])
    .map((tag) => toLspTag(tag))
    .filter((tag): tag is DiagnosticTag => tag !== undefined);

  const lspDiagnostic: PrettyTsLspDiagnostic = {
    range: toLspRange(diagnostic.range),
    message: diagnostic.message,
  };

  const severity = toLspSeverity(diagnostic.severity);
  if (severity !== undefined) {
    lspDiagnostic.severity = severity;
  }

  if (diagnostic.source !== undefined) {
    lspDiagnostic.source = diagnostic.source;
  }

  if (
    typeof diagnostic.code === "string" ||
    typeof diagnostic.code === "number"
  ) {
    lspDiagnostic.code = diagnostic.code;
  } else if (diagnostic.code !== undefined) {
    lspDiagnostic.code = diagnostic.code.value;
    lspDiagnostic.codeDescription = {
      href: diagnostic.code.target.toString(),
    };
  }

  if (tags.length > 0) {
    lspDiagnostic.tags = tags;
  }

  if (diagnostic.relatedInformation !== undefined) {
    lspDiagnostic.relatedInformation = diagnostic.relatedInformation.map(
      (item) => toLspRelatedInformation(item)
    );
  }

  return lspDiagnostic;
}
