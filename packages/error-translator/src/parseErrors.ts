import tsErrorMessages from "./generated/tsErrorMessages.json";

type TsErrorMessageDb = Record<string, { code: number }>;

interface TSDiagnosticMatcher {
  regexGlobal: RegExp;
  regexLocal: RegExp;
  parameters: string[];
}

const DiagnosticHashMap = new Map<string, TSDiagnosticMatcher>();

const escapeRegex = /[.*+?^${}()|[\]\\]/g;

function escapeRegExp(str: string) {
  return str.replace(escapeRegex, "\\$&");
}

const parameterRegex = /{(\d)}/g;
const escapedParameterRegex = /\\\{(\d)\\\}/g;

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
    throw new Error("TypeScript diagnostic matcher database has an invalid shape.");
  }

  return value;
}

const tsErrorMessageDb = ensureTsErrorMessageDb(tsErrorMessages);

function getDiagnosticMatcher(text: string): TSDiagnosticMatcher {
  const existing = DiagnosticHashMap.get(text);

  if (existing) return existing;

  const regexSource = escapeRegExp(text).replace(escapedParameterRegex, "(.+)");
  const regexLocal = new RegExp(regexSource);
  const regexGlobal = new RegExp(regexSource, "g");
  const parameters = text.match(parameterRegex) ?? [];

  const diagnosticMatcher = {
    regexGlobal,
    regexLocal,
    parameters,
  };

  DiagnosticHashMap.set(text, diagnosticMatcher);

  return diagnosticMatcher;
}

function associateMatchedParameters(
  parameters: string[],
  matchedParams: string[],
): (string | number)[] {
  const params: Record<string, string | number> = Object.create(null);

  for (let i = 0; i < matchedParams.length; i++) {
    const parameter = parameters[i];
    if (parameter !== undefined && !(parameter in params)) {
      params[parameter] = matchedParams[i] ?? "";
    }
  }

  return Object.values(params);
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
  message: string,
): ParsedDiagnosticMessage {
  const errorMessageByKey: Record<string, ParsedDiagnosticMatch> = {};

  const keys = Object.keys(db);

  keys.forEach((newError) => {
    const dbEntry = db[newError];
    if (dbEntry === undefined) {
      return;
    }

    const { regexGlobal, regexLocal, parameters } = getDiagnosticMatcher(newError);
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
        parameters,
        matchElem.match(regexLocal)?.slice(1) ?? [],
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
