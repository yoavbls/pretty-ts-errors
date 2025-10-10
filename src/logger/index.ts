import { LogOutputChannel, window } from 'vscode';

let instance: null | LogOutputChannel = null;

function logger(): LogOutputChannel {
    if (instance !== null) {
        return instance;
    }
    instance = window.createOutputChannel('Pretty TypeScript Errors', { log: true });
    return instance;
}

export function info(...args: Parameters<LogOutputChannel['info']>) {
    logger().info(...args)
}

export function trace(...args: Parameters<LogOutputChannel['trace']>) {
    logger().trace(...args)
}

export function debug(...args: Parameters<LogOutputChannel['debug']>) {
    logger().debug(...args)
}
export function warn(...args: Parameters<LogOutputChannel['warn']>) {
    logger().warn(...args)
}

export function error(...args: Parameters<LogOutputChannel['error']>) {
    logger().error(...args)
}

type LogLevel = 'info' | 'trace' | 'debug' | 'warn' | 'error';

const defaultThresholds: Record<LogLevel, number> = {
    error: 5000,
    warn: 1000,
    info: 100,
    debug: 50,
    trace: 0,
};

export function measure<T = unknown>(name: string, task: () => T, logLevelThresholds: Partial<Record<LogLevel, number>> = {}): T {
    const performanceMarkStart = performance.mark(`${name}-start`);
    const result = task();
    const performanceMarkEnd = performance.mark(`${name}-end`);
    const performanceMeasure = performance.measure(name, performanceMarkStart.name, performanceMarkEnd.name);
    logLevelThresholds = Object.assign({}, defaultThresholds, logLevelThresholds);
    const thresholds = Object.entries(logLevelThresholds) as [LogLevel, number][];
    // sort thresholds from high to low
    // { info: 100, warn: 1000, trace: 0 } => [[warn, 1000], [info, 100], [trace, 0]]
    thresholds.sort(([_a, a], [_b, b]) => b - a);
    const level: LogLevel = thresholds.find(([_, threshold]) => performanceMeasure.duration > threshold)?.[0] || 'trace';
    logger()[level](`${name} took ${performanceMeasure.duration}ms`);
    return result;
}

export function dispose() {
    if (instance !== null) {
        instance.dispose();
        instance = null;
    }
}
