import assert from "node:assert/strict";
import path from "node:path";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  test("shows the custom hover for supported JS diagnostics", async function () {
    this.timeout(30_000);

    const extension = vscode.extensions.all.find((candidate) => {
      return candidate.packageJSON.name === "pretty-ts-errors";
    });
    assert.ok(extension, "pretty-ts-errors extension should be discoverable");

    await extension.activate();

    const exampleUri = vscode.Uri.file(
      path.resolve(extension.extensionPath, "../../examples/errors.js")
    );
    const document = await vscode.workspace.openTextDocument(exampleUri);
    await vscode.window.showTextDocument(document);

    const diagnostic = await waitForDiagnostic(exampleUri, 2741);
    const hovers =
      await vscode.commands.executeCommand<vscode.Hover[]>(
        "vscode.executeHoverProvider",
        exampleUri,
        diagnostic.range.start
      );

    assert.ok(hovers && hovers.length > 0, "expected hover providers to return content");

    const hoverText = hovers
      .flatMap((hover) => hover.contents)
      .map((content) => {
        if (typeof content === "string") {
          return content;
        }

        if (content instanceof vscode.MarkdownString) {
          return content.value;
        }

        return "value" in content ? content.value : "";
      })
      .join("\n");

    assert.match(hoverText, /Show in Sidebar/u);
    assert.match(hoverText, /Local explanation/u);
    assert.match(hoverText, /TS2741/u);
  });
});

async function waitForDiagnostic(
  uri: vscode.Uri,
  code: number,
  timeoutMs = 15_000
): Promise<vscode.Diagnostic> {
  const startedAt = Date.now();

  for (;;) {
    const diagnostic = vscode.languages
      .getDiagnostics(uri)
      .find((item) => item.code === code);

    if (diagnostic !== undefined) {
      return diagnostic;
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Timed out waiting for TS${code} diagnostics in ${uri.fsPath}`);
    }

    await delay(100);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
