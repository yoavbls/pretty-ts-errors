import fs from "fs/promises";
import fetch from "node-fetch";

type DiagnosticMessages = Record<`${string}_${number}`, string>;

const getMessageFromCode = (
  diagnosticMessages: DiagnosticMessages,
  code: number,
) => {
  for (const key in diagnosticMessages) {
    if (key.endsWith(`_${code}`)) {
      return diagnosticMessages[key];
    }
  }
  throw new Error(`Could not find message for code ${code}`);
};

(async () => {
  // diagnosticMessages.json is not exported in typescript library, so we fetch it from the TypeScript repository
  const enDiagnosticMessages: Record<
    string,
    {
      category: "Error" | "Suggestion" | "Message" | "Warning";
      code: number;
    }
  > = await fetch(
    "https://raw.githubusercontent.com/microsoft/TypeScript/ef514af2675389d38c793d6cc1945486c367e6fa/src/compiler/diagnosticMessages.json",
  ).then((res) => res.json());

  const tsLibFiles = await fs.readdir("./node_modules/typescript/lib", {
    withFileTypes: true,
  });
  for (const file of tsLibFiles) {
    if (
      file.isDirectory() &&
      (await fs
        .stat(
          `./node_modules/typescript/lib/${file.name}/diagnosticMessages.generated.json`,
        )
        .catch(() => false))
    ) {
      const diagnosticMessages: DiagnosticMessages = await fs
        .readFile(
          `./node_modules/typescript/lib/${file.name}/diagnosticMessages.generated.json`,
          "utf-8",
        )
        .then((res) => JSON.parse(res));
      console.log(diagnosticMessages);
    }
  }
})();
