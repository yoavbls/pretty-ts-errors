// We re-export modules to be able to replace/change them easily across all the usages
export { compressToEncodedURIComponent } from "lz-string";
import dedent from "ts-dedent";
export { invert, objectKeys } from "typedash";

/**
 * d stands for dedent.
 * it allow us to indent html in template literals without affecting the output
 */
export const d = dedent;

/**
 * Check if an array contains a string.
 * Type guard the string if it does.
 */
export const has = (
  array: unknown[],
  item: string
): item is Extract<(typeof array)[number], string> => array.includes(item);
