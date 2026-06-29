import tsErrorMessages from "./generated/tsErrorMessages.json" with {
  type: "json",
};

type TsErrorMessageDb = Record<string, { code: number }>;

interface TSDiagnosticMatcher {
  regexGlobal: RegExp;
  regexLocal: RegExp;
  parameterIndexes: number[];
}

const DiagnosticHashMap = new Map<string, TSDiagnosticMatcher>();

const escapeRegex = /[.*+?^${}()|[\]\\]/g;

function escapeRegExp(str: string) {
  return str.replace(escapeRegex, "\\$&");
}

const parameterRegex = /{(\d+)}/g;
const escapedParameterRegex = /\\\{(\d+)\\\}/g;

function isTsErrorMessageDb(value: unknown): value is TsErrorMessageDb {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.values(value).every((entry) => {
    return (
      typeof entry === "object" &&
      entry !== null &&
      "code" in entry &&
      typeof entry.code === "number"
    );
  });
}

function ensureTsErrorMessageDb(value: unknown): TsErrorMessageDb {
  if (!isTsErrorMessageDb(value)) {
    throw new Error(
      "TypeScript diagnostic matcher database has an invalid shape."
    );
  }

  return value;
}

const tsErrorMessageDb = ensureTsErrorMessageDb(tsErrorMessages);

function getDiagnosticMatcher(text: string): TSDiagnosticMatcher {
  const existing = DiagnosticHashMap.get(text);

  if (existing) {
    return existing;
  }

  const regexSource = escapeRegExp(text).replace(escapedParameterRegex, "(.+)");
  const regexLocal = new RegExp(regexSource);
  const regexGlobal = new RegExp(regexSource, "g");
  const parameterIndexes = Array.from(
    text.matchAll(parameterRegex),
    ([, parameterIndex]) => Number(parameterIndex)
  );

  const diagnosticMatcher = {
    regexGlobal,
    regexLocal,
    parameterIndexes,
  };

  DiagnosticHashMap.set(text, diagnosticMatcher);

  return diagnosticMatcher;
}

function associateMatchedParameters(
  parameterIndexes: number[],
  matchedParams: string[]
): (string | number)[] {
  const paramsByIndex = new Map<number, string | number>();

  for (let i = 0; i < matchedParams.length; i++) {
    const parameterIndex = parameterIndexes[i];
    if (
      parameterIndex !== undefined &&
      Number.isInteger(parameterIndex) &&
      !paramsByIndex.has(parameterIndex)
    ) {
      paramsByIndex.set(parameterIndex, matchedParams[i] ?? "");
    }
  }

  if (paramsByIndex.size === 0) {
    return [];
  }

  const highestParameterIndex = Math.max(...paramsByIndex.keys());

  return Array.from({ length: highestParameterIndex + 1 }, (_unused, index) => {
    return paramsByIndex.get(index) ?? "";
  });
}

interface ParseInfo {
  rawError: string;
  startIndex: number;
  endIndex: number;
  items: (string | number)[];
}

export interface ParsedDiagnosticMatch {
  code: number;
  error: string;
  parseInfo: ParseInfo;
}

export type ParsedDiagnosticMessage = ParsedDiagnosticMatch[];

export function parseErrorsWithDb(
  db: TsErrorMessageDb,
  message: string
): ParsedDiagnosticMessage {
  const errorMessageByKey: Record<string, ParsedDiagnosticMatch> = {};

  const keys = Object.keys(db);

  keys.forEach((newError) => {
    const dbEntry = db[newError];
    if (dbEntry === undefined) {
      return;
    }

    const { regexGlobal, regexLocal, parameterIndexes } =
      getDiagnosticMatcher(newError);
    const matches = message.match(regexGlobal);

    if (matches === null) {
      return;
    }

    let searchOffset = 0;

    for (const matchElem of matches) {
      const startIndex = message.indexOf(matchElem, searchOffset);
      if (startIndex === -1) {
        continue;
      }
      const endIndex = startIndex + matchElem.length;
      const key = `${startIndex}_${endIndex}`;
      searchOffset = endIndex;

      const items = associateMatchedParameters(
        parameterIndexes,
        matchElem.match(regexLocal)?.slice(1) ?? []
      );

      const errorObj: ParsedDiagnosticMatch = {
        code: dbEntry.code,
        error: newError,
        parseInfo: {
          rawError: matchElem,
          startIndex,
          endIndex,
          items,
        },
      };

      if (errorMessageByKey[key]) {
        const existingRule = errorMessageByKey[key];

        errorMessageByKey[key] =
          newError.length > existingRule.error.length ? errorObj : existingRule;
      } else {
        errorMessageByKey[key] = errorObj;
      }
    }
  });

  const sortedMatches = Object.values(errorMessageByKey).sort((left, right) => {
    if (left.parseInfo.startIndex !== right.parseInfo.startIndex) {
      return left.parseInfo.startIndex - right.parseInfo.startIndex;
    }

    return right.parseInfo.endIndex - left.parseInfo.endIndex;
  });

  const filteredMatches: ParsedDiagnosticMatch[] = [];

  for (const candidate of sortedMatches) {
    const isContainedByAcceptedMatch = filteredMatches.some((accepted) => {
      return (
        candidate.parseInfo.startIndex >= accepted.parseInfo.startIndex &&
        candidate.parseInfo.endIndex <= accepted.parseInfo.endIndex
      );
    });

    if (!isContainedByAcceptedMatch) {
      filteredMatches.push(candidate);
    }
  }

  return filteredMatches;
}

export function parseErrors(message: string): ParsedDiagnosticMessage {
  return parseErrorsWithDb(tsErrorMessageDb, message);
}
