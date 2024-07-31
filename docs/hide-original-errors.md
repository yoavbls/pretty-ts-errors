To hide the original errors, display only the prettified ones, and make type blocks copyable, you can use the following hack:

## The Hack

1. Install the [Custom CSS and JS Loader](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css) extension from the VSCode marketplace.

2. Follow the installation instructions provided by the extension, and use [this CSS file](./pretty-ts-errors-hack.css).

## Why Do We Need This Hack?

### Hiding Original Errors

Unfortunately, VSCode doesn't currently support formatted diagnostics. Once it does, we'll be able to convert the extension to a TypeScript LSP Plugin that replaces the original error with the prettified version.  
For updates on this feature, follow [this issue](https://github.com/yoavbls/pretty-ts-errors/issues/3).

### Making Type Blocks Copyable

VSCode sanitizes and removes most CSS properties for security reasons. We've opened an [issue](https://github.com/microsoft/vscode/issues/180496) and submitted a [PR](https://github.com/microsoft/vscode/pull/180498) to allow the use of the `display` property. This would enable us to layout the types in a way that allows copying.

Until this change is approved, you can use the hack described above as a workaround.
