import {
  ExtensionMode,
  LogOutputChannel,
  window,
  type ExtensionContext,
  LogLevel as VSLogLevel,
} from "vscode";

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
type LogLevelThresholds = Record<LogLevel, number>;
type SortedLogLevelThresholds = [LogLevel, number][];

const defaultThresholds: LogLevelThresholds = {
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
 * @see {@link defaultThresholds} for the default thresholds
 */
function measure<T = unknown>(
  name: string,
  task: () => Promise<T>,
  logLevelThresholds?: Partial<LogLevelThresholds>
): Promise<T>;
function measure<T = unknown>(
  name: string,
  task: () => T,
  logLevelThresholds?: Partial<LogLevelThresholds>
): T;
function measure<T = unknown>(
  name: string,
  task: () => T | Promise<T>,
  logLevelThresholds: Partial<LogLevelThresholds> = {}
): T | Promise<T> {
  const start = performance.now();
  const thresholds = normalizeThresholds(logLevelThresholds);

  try {
    const result = task();
    if (isPromiseLike(result)) {
      return result.then(
        (value) => {
          logMeasuredDuration(name, start, thresholds);
          return value;
        },
        (error) => {
          logMeasuredDuration(name, start, thresholds);
          throw error;
        }
      );
    }
    logMeasuredDuration(name, start, thresholds);
    return result;
  } catch (error) {
    logMeasuredDuration(name, start, thresholds);
    throw error;
  }
}

function logMeasuredDuration(
  name: string,
  start: number,
  thresholds: SortedLogLevelThresholds
) {
  const duration = performance.now() - start;
  const level = findLogLevel(thresholds, duration);
  getLogger()[level](`task ${name} took ${duration.toFixed(3)}ms`);
}

function normalizeThresholds(
  logLevelThresholds: Partial<LogLevelThresholds>
): SortedLogLevelThresholds {
  logLevelThresholds = Object.assign({}, defaultThresholds, logLevelThresholds);
  // sort thresholds from high to low
  // { info: 100, warn: 1000, trace: 0 } => [[warn, 1000], [info, 100], [trace, 0]]
  return Object.entries(logLevelThresholds).sort(
    ([_a, a], [_b, b]) => b - a
  ) as SortedLogLevelThresholds;
}

function findLogLevel(
  thresholds: SortedLogLevelThresholds,
  duration: number,
  defaultLogLevel: LogLevel = "debug"
): LogLevel {
  return (
    thresholds.find(([_, threshold]) => duration > threshold)?.[0] ??
    defaultLogLevel
  );
}

function dispose() {
  if (instance !== null) {
    instance.dispose();
    instance = null;
  }
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value != null &&
    typeof value === "object" &&
    "then" in value &&
    typeof value["then"] === "function"
  );
}

function register(context: ExtensionContext) {
  if (context.extensionMode === ExtensionMode.Development) {
    const instance = getLogger();
    instance.show();
    if (instance.logLevel !== VSLogLevel.Trace) {
      instance.appendLine(
        `To see more verbose logging, set this output's log level to "Trace" (gear icon next to the dropdown).`
      );
    }
  }
  context.subscriptions.push({ dispose });
}

export const logger = {
  trace,
  debug,
  info,
  warn,
  error,
  measure,
  register,
  dispose,
};
