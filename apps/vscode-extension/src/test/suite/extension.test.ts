import assert from "node:assert/strict";
import path from "node:path";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  test("shows the custom hover for supported JS diagnostics", async function () {
    this.timeout(30_000);

    const exampleUri = await openExampleDocument("errors.js");
    const diagnostic = await waitForDiagnostic(exampleUri, 2741);
    const markdownStrings = await getHoverMarkdownStrings(
      exampleUri,
      diagnostic.range.start,
    );

    const hoverText = markdownStrings.map((content) => content.value).join("\n");

    assert.match(hoverText, /Show in Sidebar/u);
    assert.match(hoverText, /Local explanation/u);
    assert.match(hoverText, /TS2741/u);
    assert.match(hoverText, /```/u);
    assert.match(hoverText, /street: string/u);
    assert.match(hoverText, /country: string/u);
  });

  test("renders TS2739 as safe markdown with the missing-property list", async function () {
    this.timeout(30_000);

    const exampleUri = await openExampleDocument("errors.js");
    const diagnostic = await waitForDiagnostic(exampleUri, 2739);
    const markdownStrings = await getHoverMarkdownStrings(
      exampleUri,
      diagnostic.range.start,
    );

    assert.ok(markdownStrings.length > 0, "expected markdown hover content");

    const body = markdownStrings[0];
    assert.ok(body instanceof vscode.MarkdownString, "expected markdown body");
    assert.equal(body.supportHtml, false, "hover body must not enable HTML");

    const hoverText = markdownStrings.map((content) => content.value).join("\n");
    assert.match(hoverText, /TS2739/u);
    assert.match(hoverText, /Local explanation/u);
    assert.match(hoverText, /- name/u);
    assert.match(hoverText, /- age/u);
    assert.match(hoverText, /- address/u);
  });

  test("accepts uri-based sidebar command targets", async function () {
    this.timeout(30_000);

    const exampleUri = await openExampleDocument("errors.js");
    const diagnostic = await waitForDiagnostic(exampleUri, 2739);

    await vscode.commands.executeCommand(
      "prettyTsErrors.showErrorInSidebar",
      exampleUri.toString(),
      diagnostic.range,
      diagnostic.message,
    );
  });

  test("keeps TS2741 template literal types intact in local explanations", async function () {
    this.timeout(30_000);

    const exampleUri = await openExampleDocument("errors.ts");
    const diagnostic = await waitForDiagnostic(
      exampleUri,
      2741,
      15_000,
      "Property 'user' is missing",
    );
    const markdownStrings = await getHoverMarkdownStrings(
      exampleUri,
      diagnostic.range.start,
    );

    const hoverText = markdownStrings.map((content) => content.value).join("\n");
    assert.match(hoverText, /Local explanation/u);
    assert.match(
      hoverText,
      /``\{ user: \{ name: string; email: `\$\{string\}@\$\{string\}\.\$\{string\}`; age: number; \}; \}``/u,
    );
  });
});

async function openExampleDocument(fileName: "errors.js" | "errors.ts"): Promise<vscode.Uri> {
  const extension = vscode.extensions.all.find((candidate) => {
    return candidate.packageJSON.name === "pretty-ts-errors";
  });
  assert.ok(extension, "pretty-ts-errors extension should be discoverable");

  await extension.activate();

  const exampleUri = vscode.Uri.file(
    path.resolve(extension.extensionPath, `../../examples/${fileName}`)
  );
  const document = await vscode.workspace.openTextDocument(exampleUri);
  await vscode.window.showTextDocument(document);
  return document.uri;
}

async function getHoverMarkdownStrings(
  uri: vscode.Uri,
  position: vscode.Position,
): Promise<vscode.MarkdownString[]> {
  const hovers =
    await vscode.commands.executeCommand<vscode.Hover[]>(
      "vscode.executeHoverProvider",
      uri,
      position,
    );

  assert.ok(hovers && hovers.length > 0, "expected hover providers to return content");

  return hovers
    .flatMap((hover) => hover.contents)
    .filter((content): content is vscode.MarkdownString => {
      return content instanceof vscode.MarkdownString;
    });
}

async function waitForDiagnostic(
  uri: vscode.Uri,
  code: number,
  timeoutMs = 15_000,
  messageIncludes?: string,
): Promise<vscode.Diagnostic> {
  const startedAt = Date.now();

  for (;;) {
    const diagnostic = vscode.languages
      .getDiagnostics(uri)
      .find((item) => {
        return (
          item.code === code &&
          (messageIncludes === undefined ||
            item.message.includes(messageIncludes))
        );
      });

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
