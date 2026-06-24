<a href="https://marketplace.visualstudio.com/items?itemName=CyberT33N.pretty-ts-errors" style="display: none;">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/icon.png" width="140">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/icon.png" width="140">
    <img src="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/empty.png" alt="Logo">
  </picture>
</a>

# Pretty `TypeScript` Errors

<b>Make TypeScript errors prettier and human-readable in VSCode.</b>

[![GitHub stars](https://img.shields.io/github/stars/CyberT33N/pretty-ts-errors.svg?style=social&label=Star)](https://GitHub.com/CyberT33N/pretty-ts-errors/stargazers/)
[![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-0078d7?logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=CyberT33N.pretty-ts-errors)&nbsp;[![GitHub license](https://badgen.net/github/license/CyberT33N/pretty-ts-errors)](https://github.com/CyberT33N/pretty-ts-errors/blob/main/LICENSE)&nbsp;[![Visual Studio Code](https://img.shields.io/visual-studio-marketplace/i/CyberT33N.pretty-ts-errors)](https://marketplace.visualstudio.com/items?itemName=CyberT33N.pretty-ts-errors)
<a href="https://github.com/CyberT33N/pretty-ts-errors/discussions/43#user-content-jetbrains-support"><img src="https://cdn.icon-icons.com/icons2/2530/PNG/512/jetbrains_webstorm_button_icon_151873.png" height="20" alt="Webstorm logo"></a>
[![Cursor](https://img.shields.io/badge/Cursor-000000?logo=cursor)](https://open-vsx.org/extension/CyberT33N/pretty-ts-errors)

TypeScript errors become messier as the complexity of types increases. At some point, TypeScript will throw on you a shitty heap of parentheses and `"..."`.
This extension will help you understand what's going on. For example, in this relatively simple error:

<img src="./assets/this.png" width="340.438px" />&nbsp; &nbsp; <img src="./assets/instead-of-that.png" width="350px" />

## Watch this

<a href="https://www.youtube.com/watch?v=9RM2aErJs-s" target="_blank">
 <img src="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/mentions/theo-video.png" alt="Watch theo's video" width="600" />
</a>

and others from:
[Web Dev Simplified](https://www.youtube.com/watch?v=ccg-erZYO4k&list=PL0rc4JAdEsVpOriHzlAG7KUnhKIK9c7OR&index=1),
[Josh tried coding](https://www.youtube.com/watch?v=_9y29Cyo9uU&list=PL0rc4JAdEsVpOriHzlAG7KUnhKIK9c7OR&index=3),
[trash dev](https://www.youtube.com/watch?v=WJeD3DKlWT4&list=PL0rc4JAdEsVpOriHzlAG7KUnhKIK9c7OR&index=4&t=208),
and [more](https://www.youtube.com/playlist?list=PL0rc4JAdEsVpOriHzlAG7KUnhKIK9c7OR)

## Features

- Syntax highlighting with your theme colors for types in error messages, supporting both light and dark themes
- A button that leads you to the relevant type declaration next to the type in the error message
- A button that navigates you to the error at [typescript.tv](http://typescript.tv), where you can find a detailed explanation, sometimes with a video
- A local plain-English translation for supported TypeScript errors directly in the sidebar

## Supports

- Node and Deno TypeScript error reporters (in `.ts` files)
- JSDoc type errors (in `.js` and `.jsx` files)
- React, Solid and Qwik errors (in `.tsx` and `.mdx` files)
- Astro, Svelte and Vue files when TypeScript is enabled (in `.astro`, `.svelte` and `.vue` files)
- Ember and Glimmer TypeScript errors and template issues reported by Glint (in `.hbs`, `.gjs`, and `.gts` files)

## Installation

```
code --install-extension CyberT33N.pretty-ts-errors
```

Or simply by searching for `pretty-ts-errors` in the [VSCode marketplace](https://marketplace.visualstudio.com/items?itemName=CyberT33N.pretty-ts-errors)

## Development with Nx

This workspace is managed with `Nx` and `pnpm`.

### Prerequisites

```bash
pnpm install
pnpm exec nx show projects
```

Current Nx projects in this workspace:

- `pretty-ts-errors`
- `@pretty-ts-errors/error-translator`
- `@pretty-ts-errors/vscode-formatter`
- `@pretty-ts-errors/formatter`
- `@pretty-ts-errors/utils`
- `workspace-root`

### Build the application

Build the VS Code extension together with its dependent libraries:

```bash
pnpm exec nx build pretty-ts-errors
```

Build the production bundle:

```bash
pnpm exec nx build pretty-ts-errors --configuration=production
```

Package the production build as a `.vsix`:

```bash
pnpm exec nx package pretty-ts-errors
```

### Run the application in watch mode

```bash
pnpm exec nx dev pretty-ts-errors
```

Preview the standalone webview during development:

```bash
pnpm exec nx webview pretty-ts-errors
```

### Typecheck, lint, and test the application

```bash
pnpm exec nx typecheck pretty-ts-errors
pnpm exec nx lint pretty-ts-errors
pnpm exec nx test pretty-ts-errors
```

Compile the extension test suite only:

```bash
pnpm exec nx run pretty-ts-errors:compile-tests
```

Watch the extension test TypeScript compilation:

```bash
pnpm exec nx run pretty-ts-errors:watch-tests
```

### Error translator package

Validate the checked-in TypeScript diagnostic contract data:

```bash
pnpm exec nx run @pretty-ts-errors/error-translator:validate-contract-data
```

Refresh the full translator contract data after a deliberate TypeScript upgrade:

```bash
pnpm exec nx run @pretty-ts-errors/error-translator:refresh-contract-data
```

Refresh only the diagnostic matcher database:

```bash
pnpm exec nx run @pretty-ts-errors/error-translator:refresh-diagnostics-db
```

Rebuild only the bundled translation data:

```bash
pnpm exec nx run @pretty-ts-errors/error-translator:bundle-data
```

Build, lint, and test the translator package:

```bash
pnpm exec nx build @pretty-ts-errors/error-translator
pnpm exec nx lint @pretty-ts-errors/error-translator
pnpm exec nx test @pretty-ts-errors/error-translator
```

### Shared packages

Build the shared packages individually:

```bash
pnpm exec nx build @pretty-ts-errors/utils
pnpm exec nx build @pretty-ts-errors/formatter
pnpm exec nx build @pretty-ts-errors/vscode-formatter
pnpm exec nx build @pretty-ts-errors/error-translator
```

Run the package watch builds:

```bash
pnpm exec nx dev @pretty-ts-errors/utils
pnpm exec nx dev @pretty-ts-errors/formatter
pnpm exec nx dev @pretty-ts-errors/vscode-formatter
```

Lint the shared packages:

```bash
pnpm exec nx lint @pretty-ts-errors/utils
pnpm exec nx lint @pretty-ts-errors/formatter
pnpm exec nx lint @pretty-ts-errors/vscode-formatter
pnpm exec nx lint @pretty-ts-errors/error-translator
```

Run the library test suites:

```bash
pnpm exec nx test @pretty-ts-errors/formatter
pnpm exec nx test @pretty-ts-errors/vscode-formatter
pnpm exec nx test @pretty-ts-errors/error-translator
```

Watch the library tests:

```bash
pnpm exec nx run "@pretty-ts-errors/formatter:test:watch"
pnpm exec nx run "@pretty-ts-errors/vscode-formatter:test:watch"
```

Run the library coverage targets:

```bash
pnpm exec nx run "@pretty-ts-errors/formatter:test:coverage"
pnpm exec nx run "@pretty-ts-errors/vscode-formatter:test:coverage"
```

Publish the public libraries:

```bash
pnpm exec nx publish @pretty-ts-errors/formatter
pnpm exec nx publish @pretty-ts-errors/vscode-formatter
```

### Workspace commands

Format the whole workspace:

```bash
pnpm exec nx run workspace-root:format
```

Check formatting without writing changes:

```bash
pnpm exec nx run "workspace-root:format:check"
```

Synchronize Nx project references:

```bash
pnpm exec nx run workspace-root:sync
pnpm exec nx run "workspace-root:sync:check"
```

### Useful run-many examples

Build all packages and the application in one command:

```bash
pnpm exec nx run-many -t build --projects=@pretty-ts-errors/utils,@pretty-ts-errors/formatter,@pretty-ts-errors/error-translator,@pretty-ts-errors/vscode-formatter,pretty-ts-errors
```

Run all currently defined test targets in one command:

```bash
pnpm exec nx run-many -t test --projects=@pretty-ts-errors/formatter,@pretty-ts-errors/error-translator,@pretty-ts-errors/vscode-formatter,pretty-ts-errors
```

Run all current lint targets in one command:

```bash
pnpm exec nx run-many -t lint --projects=@pretty-ts-errors/utils,@pretty-ts-errors/formatter,@pretty-ts-errors/error-translator,@pretty-ts-errors/vscode-formatter,pretty-ts-errors
```

#### How to hide the original errors and make the types copyable

Follow the instructions [there](./docs/hide-original-errors.md). unfortunately, this hack is required because of VSCode limitations.

## Why isn't it trivial

1. TypeScript errors contain types that are not valid in TypeScript.
   Yes, these types include things like `... more ...`, `{ ... }`, etc in an inconsistent manner. Some are also cutting in the middle because they're too long.
2. Types can't be syntax highlighted in code blocks because the part of `type X = ...` is missing, so I needed to create a new TextMate grammar, a superset of TypeScript grammar called `type`.
3. VSCode markdown blocks all styling options, so I had to find hacks to style the error messages. e.g., there isn't an inlined code block on VSCode markdown, so I used a code block inside a codicon icon, which is the only thing that can be inlined. That's why it can't be copied. but it isn't a problem because you can still hover on the error and copy things from the original error pane.
   <img src="./assets/errors-hover.png" width="600" />

## Hype section

<a href="https://www.youtube.com/live/Zze1y2iZ3bQ?si=Yj1Qw2S8FbGbTA5c&t=11589">
  <picture>
    <img width="400" src="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/mentions/js-nation.png?raw=true" alt="Winning the Productivity Booster category at JSNation 2023">
  </picture>
</a>
<a href="https://twitter.com/tannerlinsley/status/1647982562026090496">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/mentions/tanner-dark.png#gh-light-mode-only">
     <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/mentions/tanner-light.png#gh-light-mode-only">
    <img width="400" src="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/mentions/tanner-dark.png#gh-dark-mode-only" alt="Tanner's tweet">
  </picture>
</a>
<a href="https://twitter.com/t3dotgg/status/1647759462709747713">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/mentions/theo-dark.png#gh-dark-mode-only">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/mentions/theo-light.png#gh-light-mode-only">
    <img width="400" src="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/mentions/theo-dark.png#gh-dark-mode-only" alt="Theo's tweet">
  </picture>
</a>
<a href="https://twitter.com/johnsoncodehk/status/1646214711204286465">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/mentions/johnson-dark.png#gh-dark-mode-only">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/mentions/johnson-light.png#gh-light-mode-only">
    <img width="400" src="https://raw.githubusercontent.com/CyberT33N/pretty-ts-errors/main/assets/mentions/johnson-dark.png#gh-dark-mode-only" alt="Johnson's tweet">
  </picture>
</a>

### Stars from stars

<table>
  <tbody>
    <tr>
      <td align="center">
        <a href="https://github.com/kentcdodds">
          <img src="https://images.weserv.nl/?url=github.com/kentcdodds.png&fit=cover&mask=circle" width="80"><br>
          Kent C. Dodds
        <a/>
      </td>
      <td align="center">
        <a href="https://github.com/mattpocock">
          <img src="https://images.weserv.nl/?url=github.com/mattpocock.png&fit=cover&mask=circle" width="80"><br>
          Matt Pocock
        <a/>
      </td>
      <td align="center">
        <a href="https://github.com/katt">
          <img src="https://images.weserv.nl/?url=github.com/katt.png&fit=cover&mask=circle" width="80"><br>
          Alex / KATT
        <a/>
      </td>
      <td align="center">
        <a href="https://github.com/tannerlinsley">
          <img src="https://images.weserv.nl/?url=github.com/tannerlinsley.png&fit=cover&mask=circle" width="80"><br>
          Tanner Linsley
        <a/>
      </td>
      <td align="center">
        <a href="https://github.com/t3dotgg">
          <img src="https://images.weserv.nl/?url=github.com/t3dotgg.png&fit=cover&mask=circle" width="80"><br>
          Theo Browne
        <a/>
      </td>
    </tr>
  </tbody>
</table>

## Sponsorship

Every penny will be invested in other contributors to the project, especially ones that work
on things that I can't be doing myself like adding support to the extension for other IDEs 🫂

## Contribution

Help by upvoting or commenting on issues we need to be resolved [here](https://github.com/CyberT33N/pretty-ts-errors/discussions/43)
Any other contribution is welcome. Feel free to open any issue / PR you think.
