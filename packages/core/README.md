# @pretty-ts-errors/core

Editor-agnostic formatting helpers for Pretty TypeScript Errors.

- Exposes functions to format diagnostics and messages
- Requires environment to provide simple renderers (inline/multiline code blocks, title, html dedent)

Usage:

```ts
import { configureRenderers, formatDiagnostic } from "@pretty-ts-errors/core";

configureRenderers({
  inlineCodeBlock: (c, l) => `\`${c}\``,
  multiLineCodeBlock: (c) => `\n${c}\n`,
  unStyledCodeBlock: (c) => c,
  title: () => "",
  html: (s, ...e) =>
    s.reduce((a, ss, i) => a + ss + (i < e.length ? e[i] : ""), ""),
});
```

