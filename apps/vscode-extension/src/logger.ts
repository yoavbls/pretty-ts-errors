import { LogOutputChannel, window } from "vscode";

let instance: null | LogOutputChannel = null;

function getLogger(): LogOutputChannel {
  if (instance !== null) {
    return instance;
  }
  instance = window.createOutputChannel("Pretty TypeScript Errors", {
    log: true,
  });
  return instance;
}

function info(...args: Parameters<LogOutputChannel["info"]>) {
  getLogger().info(...args);
}

function trace(...args: Parameters<LogOutputChannel["trace"]>) {
  getLogger().trace(...args);
}

function debug(...args: Parameters<LogOutputChannel["debug"]>) {
  getLogger().debug(...args);
}
function warn(...args: Parameters<LogOutputChannel["warn"]>) {
  getLogger().warn(...args);
}

function error(...args: Parameters<LogOutputChannel["error"]>) {
  getLogger().error(...args);
}

type LogLevel = "info" | "trace" | "debug" | "warn" | "error";

const defaultThresholds: Record<LogLevel, number> = {
  error: 5000,
  warn: 1000,
  info: 100,
  debug: 50,
  trace: 0,
};

/**
 * Both in the browser and Node >= 16 (vscode 1.77 has node >= 16) have `performance` available as a global
 * But `@types/node` is missing its global declaration, this fixes the type error we get from using it
 */
declare const performance: import("perf_hooks").Performance;

/**
 * Measures the time it took to run `task` and reports it to the `logger` based on `logLevelThresholds`.
 *
 * NOTE: supports synchronous `task`s only
 * @see {@link defaultThresholds} for the default thresholds
 */
function measure<T = unknown>(
  name: string,
  task: () => T,
  logLevelThresholds: Partial<Record<LogLevel, number>> = {}
): T {
  const start = performance.now();
  const result = task();
  const end = performance.now();
  const duration = end - start;
  logLevelThresholds = Object.assign({}, defaultThresholds, logLevelThresholds);
  const thresholds = Object.entries(logLevelThresholds) as [LogLevel, number][];
  // sort thresholds from high to low
  // { info: 100, warn: 1000, trace: 0 } => [[warn, 1000], [info, 100], [trace, 0]]
  thresholds.sort(([_a, a], [_b, b]) => b - a);
  const level: LogLevel =
    thresholds.find(([_, threshold]) => duration > threshold)?.[0] || "trace";
  getLogger()[level](`${name} took ${duration.toFixed(3)}ms`);
  return result;
}

function dispose() {
  if (instance !== null) {
    instance.dispose();
    instance = null;
  }
}

export const logger = {
  trace,
  debug,
  info,
  warn,
  error,
  measure,
  dispose,
};
