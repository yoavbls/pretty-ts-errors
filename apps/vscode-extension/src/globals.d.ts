// "@types/node": "^16.11.68" misses a bunch of global declarations, this file fixes the one's we use.

declare global {
  declare const TextDecoder: new (
    encoding?: string,
    options?: {
      fatal?: boolean | undefined;
      ignoreBOM?: boolean | undefined;
    }
  ) => import("util").TextDecoder;
}

export {};
