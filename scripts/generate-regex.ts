import fs from "fs/promises";
import fetch from "node-fetch";

type DiagnosticMessages = Record<`${string}_${number}`, string>;

const templateToRegex = (template: string, names: string[]) => {
  const escapedTemplate = template.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  let maxIndex = 0;
  const regex = escapedTemplate.replace(/\\\{([0-9]+)\\\}/g, (_, index) => {
    if (Number(index) > maxIndex) {
      maxIndex = Number(index);
    }
    return `(?<${names[Number(index)]}>.*?)`;
  });
  if (maxIndex !== names.length - 1) {
    throw new Error(
      `Expected ${maxIndex + 1} named groups, got ${names.length}`,
    );
  }

  return new RegExp(regex);
};

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
  const regexes = {
    propertiesMissingWithoutTruncation: [],
    propertiesMissingWithTruncation: [],
  } as Record<string, RegExp[]>;

  // diagnosticMessages.json is not exported in typescript library, so we fetch it from the TypeScript repository
  const enDiagnosticMessages = (await fetch(
    "https://raw.githubusercontent.com/microsoft/TypeScript/ef514af2675389d38c793d6cc1945486c367e6fa/src/compiler/diagnosticMessages.json",
  ).then((res) => res.json())) as Record<
    string,
    {
      category: "Error" | "Suggestion" | "Message" | "Warning";
      code: number;
    }
  >;

  const tsLibFiles = await fs.readdir("./node_modules/typescript/lib", {
    withFileTypes: true,
  });
  for (const dir of tsLibFiles) {
    const diagnosticMessagesPath = `./node_modules/typescript/lib/${dir.name}/diagnosticMessages.generated.json`;
    if (
      dir.isDirectory() &&
      (await fs.stat(diagnosticMessagesPath).catch(() => false))
    ) {
      const diagnosticMessages: DiagnosticMessages = await fs
        .readFile(diagnosticMessagesPath, "utf-8")
        .then((res) => JSON.parse(res));
      const propertiesMissingWithoutTruncation = getMessageFromCode(
        diagnosticMessages,
        2739,
      );
      const propertiesMissingWithTruncation = getMessageFromCode(
        diagnosticMessages,
        2740,
      );
      regexes.propertiesMissingWithoutTruncation.push(
        templateToRegex(propertiesMissingWithoutTruncation, [
          "actualType",
          "expectedType",
          "propertyProperties",
        ]),
      );
      regexes.propertiesMissingWithTruncation.push(
        templateToRegex(propertiesMissingWithTruncation, [
          "actualType",
          "expectedType",
          "propertyProperties",
          "numTruncatedProperties",
        ]),
      );
    }
  }

  console.log(JSON.stringify(regexes, null, 2));
})();
