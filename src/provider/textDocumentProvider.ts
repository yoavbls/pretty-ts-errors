import { Range, TextDocumentContentProvider } from 'vscode';
import { uriStore } from './uriStore';

export const PRETTY_TS_ERRORS_SCHEME = 'pretty-ts-errors';

export const textDocumentContentProvider: TextDocumentContentProvider = {
    provideTextDocumentContent(uri) {
        const searchParams = new URLSearchParams(uri.query);
        const fsPath = uri.fsPath.replace(/\.md$/, '');
        if (!searchParams.has('range')) {
            return `range query parameter is missing for uri: ${uri}`;
        }
        const items = uriStore[fsPath];
        if (!items) {
            return `no diagnostics found for ${fsPath}`;
        }
        const range = createRangeFromString(searchParams.get('range')!);
        const item = items.find((item) => {
            return item.range.isEqual(range);
        });
        if (!item) {
            return `no diagnostic found for ${fsPath} with range ${JSON.stringify(range)}`;
        }
        return item.contents.map((content) => content.value).join('\n');
    },
};

function createRangeFromString(range: string) {
    const [start, end] = range.split('-');
    const [startLine, startCharacter] = start.split(':').map(Number);
    const [endLine, endCharacter] = end.split(':').map(Number);
    return new Range(startLine, startCharacter, endLine, endCharacter);
}
