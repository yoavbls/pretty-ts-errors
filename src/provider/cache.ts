import { Diagnostic, MarkdownString, Range, Uri } from "vscode";

type CacheStore = {
    [key: Uri["path"]]: {
        [key: string]: FormattedDiagnostic
    }
};

export type FormattedDiagnostic = { range: Range, contents: MarkdownString[] };

export class Cache {
    private _cache: CacheStore = {};

    // Deletes stale diagnostics in cache
    deleteStale(path: Uri["path"], diagnostics: Diagnostic[]) {
        const newCache: CacheStore = { [path]: {} };

        for (let d of diagnostics) {
            const key: string = JSON.stringify(d.range.start) + JSON.stringify(d.range.end) + d.code;
            if (this._cache[path] && this._cache[path][key]) {
                newCache[path][key] = this._cache[path][key];
            }
        }

        // overwrite stale cache[path] with newCache[path]
        // cache will contain only relevant entries which already have formatted markdown
        this._cache[path] = newCache[path];
    }

    // Filters incoming diagnostics and returns only those not in cache (new diagnostics)
    filter(path: Uri["path"], diagnostics: Diagnostic[]) {
        return diagnostics.filter(d => {
            // If cache is empty all diagnostics will be new
            if (!this._cache[path]) { return true; }
            else {
                const key: string = JSON.stringify(d.range.start) + JSON.stringify(d.range.end) + d.code;
                const cachedDiagnostic = this._cache[path][key];
                return !cachedDiagnostic;
            }
        });
    }

    // Sets new formatted diagnostic in cache
    set(path: Uri["path"], diagnostic: Diagnostic, fDiagnostic: FormattedDiagnostic) {
        // If cache is empty create path object in cache to avoid undefined error
        if (!this._cache[path]) { this._cache[path] = {}; }

        const key: string = JSON.stringify(diagnostic.range.start) + JSON.stringify(diagnostic.range.end) + diagnostic.code;
        this._cache[path][key] = fDiagnostic;
    }

    // Returns cached diagnostic as array
    get(path: Uri["path"]) {
        const cacheAsArray = [];
        if (this._cache[path] && Object.keys(this._cache[path]).length) {
            cacheAsArray.push(...Object.values(this._cache[path]));
        }
        return cacheAsArray;
    }
}
