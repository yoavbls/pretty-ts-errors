# Architecture of `pretty-ts-errors`

This document explains how **pretty-ts-errors** is structured and how the VS Code extension works at runtime.

> !NOTE
> Keep in mind that this document is kept minimal to avoid being out of sync with development. If critical information is missing, feel free to open a [discussion](https://github.com/yoavbls/pretty-ts-errors/discussions) or [PR](https://github.com/yoavbls/pretty-ts-errors/pulls).

## `/`

The repository is a monorepo. The root of the project contains the different packages, and the various files and directories required to develop and maintain the project.

## `apps/vscode-extension`

The VS Code extension source code.

## `packages/formatter`

Core formatting logic.

## `packages/vscode-formatter`

formatting functions used by the VS Code extension. This formatter implements features specific to VS Code.

## `packages/utils`

Small utilities shared across packages.
