import { Range, Uri } from "vscode";

export function tryEnsureUri(
  maybeUriLike: unknown
): { isValidUri: true; uri: Uri } | { isValidUri: false; uri?: undefined } {
  if (maybeUriLike instanceof Uri) {
    return { isValidUri: true, uri: maybeUriLike };
  }
  if (typeof maybeUriLike === "string") {
    try {
      return { isValidUri: true, uri: Uri.parse(maybeUriLike) };
    } catch (error) {
      return { isValidUri: false };
    }
  }
  if (isUriLike(maybeUriLike)) {
    return { isValidUri: true, uri: Uri.from(maybeUriLike) };
  }
  return { isValidUri: false };
}

type UriLike = Parameters<typeof Uri.from>[0];

function isUriLike(value: unknown): value is UriLike {
  return (
    typeof value === "object" &&
    value != null &&
    "scheme" in value &&
    typeof value.scheme === "string"
  );
}

export function tryEnsureRange(
  maybeRangeLike: unknown
):
  | { isValidRange: true; range: Range }
  | { isValidRange: false; range?: undefined } {
  if (maybeRangeLike instanceof Range) {
    return { isValidRange: true, range: maybeRangeLike };
  }
  if (isRangeLike(maybeRangeLike)) {
    return {
      isValidRange: true,
      range: new Range(
        maybeRangeLike.start.line,
        maybeRangeLike.start.character,
        maybeRangeLike.end.line,
        maybeRangeLike.end.character
      ),
    };
  }
  return { isValidRange: false };
}

type RangeLike = { start: PositionLike; end: PositionLike };

function isRangeLike(value: unknown): value is RangeLike {
  return (
    typeof value === "object" &&
    value != null &&
    "start" in value &&
    isPositionLike(value.start) &&
    "end" in value &&
    isPositionLike(value.end)
  );
}

type PositionLike = { line: number; character: number };

function isPositionLike(value: unknown): value is PositionLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "line" in value &&
    typeof value.line === "number" &&
    "character" in value &&
    typeof value.character === "number"
  );
}
