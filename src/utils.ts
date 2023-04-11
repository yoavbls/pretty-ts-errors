export const keys = <const T extends {}>(object: T): Array<keyof T> =>
  <Array<keyof T>>Object.keys(object);

export const values = <const T extends {}>(object: T): Array<T[keyof T]> =>
  <Array<T[keyof T]>>Object.values(object);

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
