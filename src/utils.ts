// We re-export modules to be able to replace/change them easily across all the usages
export { compressToEncodedURIComponent } from "lz-string";
import { format } from "prettier";
import dedent from "ts-dedent";

export function prettify(text: string) {
  return format(text, {
    parser: "typescript",
    printWidth: 60,
    singleAttributePerLine: false,
    arrowParens: "avoid",
  });
}

/**
 * d stands for dedent.
 * it allow us to indent html in template literals without affecting the output
 */
export const d = dedent;

/** Similar to `Object.keys` but with stricter types */
export const keys = <const T extends {}>(object: T): Array<keyof T> =>
  <Array<keyof T>>Object.keys(object);

/** Similar to `Object.values` but with stricter types */
export const values = <const T extends {}>(object: T): Array<T[keyof T]> =>
  <Array<T[keyof T]>>Object.values(object);

/**
 * Check if an array contains a string.
 * Type guard the string if it does.
 */
export const has = (
  array: unknown[],
  item: string
): item is Extract<(typeof array)[number], string> => array.includes(item);

/**
 * Copied from radash library
 * Returns an object with { [keys]: value }
 * inverted as { [value]: key }
 */
export const invert = <
  TKey extends string | number | symbol,
  TValue extends string | number | symbol
>(
  obj: Record<TKey, TValue>
): Record<TValue, TKey> => {
  if (!obj) {
    return {} as Record<TValue, TKey>;
  }
  const keys = Object.keys(obj) as TKey[];
  return keys.reduce((acc, key) => {
    acc[obj[key]] = key;
    return acc;
  }, {} as Record<TValue, TKey>);
};
