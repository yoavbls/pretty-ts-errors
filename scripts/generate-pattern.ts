import fs from "fs/promises";
import fetch from "node-fetch";

type DiagnosticMessages = Record<`${string}_${number}`, string>;

const templateToRegexAndNamedTemplate = (
  template: string,
  names: string[],
): {
  regex: string;
  template: string;
} => {
  const escapedTemplate = template.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  let maxIndex = 0;
  const regex =
    escapedTemplate.replace(/\\\{([0-9]+)\\\}/g, (_, index) => {
      if (Number(index) > maxIndex) {
        maxIndex = Number(index);
      }
      return `(?<${names[Number(index)]}>.*?)`;
    }) + "(?=$|</td>)";
  if (maxIndex !== names.length - 1) {
    throw new Error(
      `Expected ${maxIndex + 1} named groups, got ${names.length}`,
    );
  }

  const namedTemplate = template.replace(
    /\{([0-9]+)\}/g,
    (_, index) => `{${names[Number(index)]}}`,
  );

  return { regex, template: namedTemplate };
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

type Pattern = { lang: string; regex: string; template: string };

const generatePatternsFromDiagnosticMessages = (
  lang: string,
  diagnosticMessages: DiagnosticMessages,
): Record<string, Pattern> => {
  const ret: Record<string, Pattern> = {};

  // Type '...' is missing from the following properties from type '...': foo, bar
  const propertiesMissingWithoutTruncation = getMessageFromCode(
    diagnosticMessages,
    2739,
  );
  // Type '...' is missing from the following properties from type '...': foo, bar, and N more.
  const propertiesMissingWithTruncation = getMessageFromCode(
    diagnosticMessages,
    2740,
  );
  // Overload N of M, '...', gave the following error.
  const overloadError = getMessageFromCode(diagnosticMessages, 2772);

  ret.propertiesMissingWithoutTruncation = {
    ...templateToRegexAndNamedTemplate(propertiesMissingWithoutTruncation, [
      "actualType",
      "expectedType",
      "properties",
    ]),
    lang,
  };
  ret.propertiesMissingWithTruncation = {
    ...templateToRegexAndNamedTemplate(propertiesMissingWithTruncation, [
      "actualType",
      "expectedType",
      "properties",
      "numTruncatedProperties",
    ]),
    lang,
  };
  ret.overloadError = {
    ...templateToRegexAndNamedTemplate(overloadError, [
      "overloadIndex",
      "numOverloads",
      "signature",
    ]),
    lang,
  };

  return ret;
};

(async () => {
  const patterns = {
    propertiesMissingWithoutTruncation: [],
    propertiesMissingWithTruncation: [],
    overloadError: [],
  } as Record<string, Pattern[]>;

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

      const generatedPatterns = generatePatternsFromDiagnosticMessages(
        dir.name,
        diagnosticMessages,
      );
      for (const [key, pattern] of Object.entries(generatedPatterns)) {
        patterns[key].push(pattern);
      }
    }
  }

  // Translate the English diagnostic messages to the format used for other languages, and generate the regexes
  const enDiagnosticMessagesTranslated = {} as DiagnosticMessages;
  const jaDiagnosticMessages: DiagnosticMessages = JSON.parse(
    await fs.readFile(
      "./node_modules/typescript/lib/ja/diagnosticMessages.generated.json",
      "utf-8",
    ),
  );
  for (const key of Object.keys(jaDiagnosticMessages)) {
    const code = parseInt(key.match(/_(\d+)$/)?.[1]!);
    const enMessage = Object.entries(enDiagnosticMessages).find(
      ([, value]) => value.code === code,
    )?.[0];
    // The translation file has unused messages
    if (!enMessage) {
      continue;
    }
    enDiagnosticMessagesTranslated[key] = enMessage;
  }
  const generatedPatterns = generatePatternsFromDiagnosticMessages(
    "en",
    enDiagnosticMessagesTranslated,
  );
  for (const [key, pattern] of Object.entries(generatedPatterns)) {
    patterns[key].unshift(pattern);
  }

  await fs.writeFile(
    "./src/format/diagnosticPatterns.generated.json",
    JSON.stringify(patterns, null, 2),
  );
})();
