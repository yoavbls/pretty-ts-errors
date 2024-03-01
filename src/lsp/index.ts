import {
  createConnection,
  InitializeResult,
  TextDocumentSyncKind,
  TextDocuments,
  ProposedFeatures,
  Diagnostic,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import * as fs from "fs";
import { formatDiagnostic } from "../format/formatDiagnostic";
import { prettify } from "../format/prettify";

const logStream = fs.createWriteStream("/tmp/lsp.log");
logStream.write("\n");

// Just for initial debugging purposes, will be removed when we have a proper release
const log = {
  write: (message: object | unknown) => {
    let finalMessage;
    if (typeof message === "object") {
      finalMessage = `${new Date().toISOString()} ${JSON.stringify(
        message,
        null,
        4
      )}`;
    } else {
      finalMessage = `${new Date().toISOString()} ${message}`;
    }
    finalMessage += "\n";

    logStream.write(finalMessage);
    console.log(finalMessage);
  },
};

log.write(`started`);

const connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize(() => {
  log.write("initialize");

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      diagnosticProvider: {
        identifier: "pretty-ts-errors",
        interFileDependencies: false,
        workspaceDiagnostics: false,
      },
    },
    serverInfo: {
      name: "pretty-ts-errors",
      version: "0.5.3",
    },
  };

  return result;
});

type FormatDiagnosticsParams = {
  diagnostics: Diagnostic[];
  uri: string;
};

const cache = new Map<string, string>();

connection.onRequest(
  "pretty-ts-errors/formatDiagnostics",
  ({ diagnostics, uri }: FormatDiagnosticsParams) => {
    const formattedDiagnostics = diagnostics
      .filter((diagnostic) => !cache.has(diagnostic.message))
      .map((diagnostic) => {
        return {
          ...diagnostic,
          message: formatDiagnostic(diagnostic, prettify, "plaintext"),
          source: "pretty-ts-errors",
        };
      });

    if (formattedDiagnostics.length === 0) {
      return;
    }

    log.write(
      "formattedDiagnostics: " + JSON.stringify(formattedDiagnostics, null, 2)
    );

    log.write("params: " + JSON.stringify(diagnostics, null, 2));

    // connection.sendDiagnostics({
    //   uri,
    //   diagnostics: formattedDiagnostics,
    // });

    return {
      uri,
      diagnostics: formattedDiagnostics,
    };
  }
);

documents.listen(connection);
connection.listen();
