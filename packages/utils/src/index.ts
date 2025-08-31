import dedent from "ts-dedent";

export function objectKeys<T extends Record<string, unknown>>(
  obj: T
): (keyof T & string)[] {
  return Object.keys(obj) as (keyof T & string)[];
}

export function invert<T extends Record<string, string>>(
  obj: T
): Partial<{
  [K in T[keyof T]]: { [P in keyof T]: K extends T[P] ? P : never }[keyof T];
}> {
  const result: Partial<{
    [K in T[keyof T]]: { [P in keyof T]: K extends T[P] ? P : never }[keyof T];
  }> = {};
  for (const key in obj) {
    const value = obj[key];
    if (value !== undefined) {
      result[value] = key;
    }
  }
  return result;
}

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
