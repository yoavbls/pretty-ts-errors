// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as assert from "assert";
import { formattedDiagnosticsStore } from "../../formattedDiagnosticsStore";

suite("Extension Test Suite", () => {
  /**
   * The tests moved to the formatter package, I'm leaving
   * this here for future tests to the VSCode extension
   */
  vscode.window.showInformationMessage("Start all tests.");

  suite("Diagnostics Store Cleanup", () => {
    test("should clean up formattedDiagnosticsStore when document is closed", async () => {
      // Create a temporary document
      const doc = await vscode.workspace.openTextDocument({
        language: "typescript",
        content: "const x: number = 'string';",
      });

      const filePath = doc.uri.fsPath;

      // Manually add an entry to the store to simulate diagnostics
      formattedDiagnosticsStore.set(filePath, []);

      // Verify the entry exists
      assert.strictEqual(
        formattedDiagnosticsStore.has(filePath),
        true,
        "Store should contain entry for document"
      );

      // Close the document
      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor"
      );

      // Wait a bit for the cleanup to happen
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify the entry was removed
      assert.strictEqual(
        formattedDiagnosticsStore.has(filePath),
        false,
        "Store should not contain entry for closed document"
      );
    });
  });
});
