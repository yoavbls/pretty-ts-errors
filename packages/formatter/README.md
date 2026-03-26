# Pretty TypeScript Error formatter

The formatting package of [pretty-ts-errors](https://github.com/yoavbls/pretty-ts-errors)

# Usage

```typescript
import { createErrorMessagePrettifier } from "@pretty-ts-errors/formatter";

function codeBlock(code: string, language?: string, multiLine?: boolean) {
  return `\`\`\`${language}
${code}
\`\`\`
`;
}

const prettifyErrorMessage = createErrorMessagePrettifier(codeBlock);

prettifyErrorMessage(`Type 'string' is not assignable to type 'number'.`);
```
