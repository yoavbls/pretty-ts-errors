# Pretty TypeScript Error formatter

The formatting package of [pretty-ts-errors](https://github.com/yoavbls/pretty-ts-errors)

# Usage

```typescript
import { formatDiagnosticMessage } from "@pretty-ts-errors/formatter";

function codeBlock(code: string, language?: string, multiLine?: boolean) {
  return `\`\`\`${language}
${code}
\`\`\`
`;
}

formatDiagnosticMessage(
  `Type 'string' is not assignable to type 'number'.`,
  codeBlock
);
```
