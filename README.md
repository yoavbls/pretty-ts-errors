<a href="https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors" style="display: none;">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/icon.png" width="140">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/icon.png" width="140">
    <img src="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/empty.png" alt="Logo">
  </picture>
</a>

# Pretty `TypeScript` Errors

<b>Make TypeScript errors prettier and human-readable in VSCode.</b>

[![GitHub stars](https://img.shields.io/github/stars/yoavbls/pretty-ts-errors.svg?style=social&label=Star)](https://GitHub.com/yoavbls/pretty-ts-errors/stargazers/)
[![Visual Studio Code][vsc]](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)&nbsp;[![GitHub license](https://badgen.net/github/license/yoavbls/pretty-ts-errors)](https://github.com/yoavbls/pretty-ts-errors/blob/main/LICENSE)&nbsp;[![Visual Studio Code](https://img.shields.io/visual-studio-marketplace/i/yoavbls.pretty-ts-errors)](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)
<a href="https://github.com/yoavbls/pretty-ts-errors/discussions/43#user-content-jetbrains-support"><img src="https://cdn.icon-icons.com/icons2/2530/PNG/512/jetbrains_webstorm_button_icon_151873.png" height="20" alt="Webstorm logo"></a>
[![Cursor](https://img.shields.io/badge/Cursor-000000?logo=cursor)](https://open-vsx.org/extension/yoavbls/pretty-ts-errors)

TypeScript errors become messier as the complexity of types increases. At some point, TypeScript will throw on you a shitty heap of parentheses and `"..."`.
This extension will help you understand what's going on. For example, in this relatively simple error:

<img src="./assets/this.png" width="340.438px" />&nbsp; &nbsp; <img src="./assets/instead-of-that.png" width="350px" />

## Watch this

<a href="https://www.youtube.com/watch?v=9RM2aErJs-s" target="_blank">
 <img src="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/mentions/theo-video.png" alt="Watch theo's video" width="600" />
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
- A button that navigates you to [ts-error-translator](https://ts-error-translator.vercel.app/), where you can read the error in plain English

## Supports

- Node and Deno TypeScript error reporters (in `.ts` files)
- JSDoc type errors (in `.js` and `.jsx` files)
- React, Solid and Qwik errors (in `.tsx` and `.mdx` files)
- Astro, Svelte and Vue files when TypeScript is enabled (in `.astro`, `.svelte` and `.vue` files)
- Ember and Glimmer TypeScript errors and template issues reported by Glint (in `.hbs`, `.gjs`, and `.gts` files)

## Installation

```
code --install-extension yoavbls.pretty-ts-errors
```

Or simply by searching for `pretty-ts-errors` in the [VSCode marketplace](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)

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
    <img width="400" src="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/mentions/js-nation.png?raw=true" alt="Winning the Productivity Booster category at JSNation 2023">
  </picture>
</a>
<a href="https://twitter.com/tannerlinsley/status/1647982562026090496">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/mentions/tanner-dark.png#gh-light-mode-only">
     <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/mentions/tanner-light.png#gh-light-mode-only">
    <img width="400" src="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/mentions/tanner-dark.png#gh-dark-mode-only" alt="Tanner's tweet">
  </picture>
</a>
<a href="https://twitter.com/t3dotgg/status/1647759462709747713">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/mentions/theo-dark.png#gh-dark-mode-only">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/mentions/theo-light.png#gh-light-mode-only">
    <img width="400" src="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/mentions/theo-dark.png#gh-dark-mode-only" alt="Theo's tweet">
  </picture>
</a>
<a href="https://twitter.com/johnsoncodehk/status/1646214711204286465">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/mentions/johnson-dark.png#gh-dark-mode-only">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/mentions/johnson-light.png#gh-light-mode-only">
    <img width="400" src="https://raw.githubusercontent.com/yoavbls/pretty-ts-errors/main/assets/mentions/johnson-dark.png#gh-dark-mode-only" alt="Johnson's tweet">
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

Help by upvoting or commenting on issues we need to be resolved [here](https://github.com/yoavbls/pretty-ts-errors/discussions/43)
Any other contribution is welcome. Feel free to open any issue / PR you think.

[vsc]: https://img.shields.io/badge/Visual%20Studio%20Code-0078d7?logoColor=white&logo=data:image/png;base64,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
