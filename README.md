<a href="https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors">
    <img src="./assets/icon.png" width="150" style="max-width: 0" /> 
</a>

# Pretty `TypeScript` Errors

<b>Make TypeScript errors prettier and more human-readable in VSCode.</b>  
  
[![Visual Studio Code](https://img.shields.io/badge/--007ACC?logo=visual%20studio%20code&logoColor=ffffff)](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)&nbsp;[![GitHub license](https://badgen.net/github/license/yoavbls/pretty-ts-errors)](https://github.com/yoavbls/pretty-ts-errors/blob/main/LICENSE)&nbsp;![visitor badge](https://visitor-badge.glitch.me/badge?page_id=pretty-ts-errors)


TypeScript errors become messier as the complexity of types increases. At some point, TypeScript will throw on you a shitty heap of parentheses and `"..."`.  
This extension will help you understand what's going on. For example, in this relatively simple error:

<img src="./assets/this.png" style="max-height: 350px"  height="350px" />&nbsp; &nbsp; <img src="./assets/instead-of-that.png" height="350px"  width="350px" style="max-height: 350px" />

## Features
- Syntax highlighting with your theme colors for types in error messages, supporting both light and dark themes
- Support for Node and Deno
- A button that leads you to the relevant type declaration next to the type in the error message
- A button that navigates you to the error at [typescript.tv](http://typescript.tv), where you can find a detailed explanation, sometimes with a video
- A button that navigates you to [ts-error-translator](https://ts-error-translator.vercel.app/), where you can read the error in plain English

  
## Why isn't it trivial
1. TypeScript errors contain types that are not valid in TypeScript.  
Yes, these types include things like `... more ...`, `{ ... }`, etc in an inconsistent manner. Some are also cutting in the middle because they're too long.
2. Types can't be syntax highlighted in code blocks because the part of `type X = ...` is missing, so I needed to create a new TextMate grammar, a superset of TypeScript grammar called `type`.
3. VSCode markdown blocks all styling options, so I had to find hacks to style the error messages. e.g., there isn't an inlined code block on VSCode markdown, so I used a code block inside a codicon icon, which is the only thing that can be inlined. That's why it can't be copied. but it isn't a problem because you can still hover on the error and copy things from the original error pane.  
<img src="./assets/errors-hover.png" width="600" /> 

## Contribution
Every contribution is welcome.  
Feel free to ask anything and open any issue / PR you desire.
