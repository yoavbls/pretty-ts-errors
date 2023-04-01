<img src="./assets/icon.png" width="150" /> 
<br />

# Pretty `TypeScript` Errors

<b>Make TypeScript errors prettier and more human-readable in VSCode.</b>  
TypeScript errors become messier as the complexity of types increases. At some point, TypeScript will throw on you a shitty heap of parentheses and `"..."`.  
This extension will help you understand what's going on. For example, in this relatively simple error:

<img src="./assets/this.png" height="350" />&nbsp; &nbsp; <img src="./assets/instead-of-that.png" height="350" />

## Other features:
- A link to the relevant type location in the error message
- A Button that navigates you to the error at [typescript.tv](http://typescript.tv) where you can find a detailed explanation, sometimes with a video.
- A Button that navigates you to [ts-error-translator](https://ts-error-translator.vercel.app/) where you can read the error in plain English

  
## Why isn't it trivial
1. TypeScript errors contain types that are not valid in TypeScript.  
Yes, these types include things like `... more ...`, `{ ... }`, etc in an inconsistent manner. Some are also cutting in the middle because they're too long.
2. Types can't be syntax highlighted in code blocks because the part of `type X = ...` is missing, so I needed to create a new TextMate grammar, a superset of TypeScript grammar called `type`.
3. VSCode markdown blocks all styling options, so I had to find hacks to style the error messages. e.g., there isn't an inlined code block on VSCode markdown, so I used a code block inside a codicon icon, which is the only thing that can be inlined. That's why it can't be copied.

## Contribution
Every contribution is welcome.  
Feel free to ask anything and open any issue / PR you desire.