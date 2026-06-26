// @ts-check

/**
 * @typedef {{
 *   kind: "command";
 *   command: string;
 *   args: unknown[];
 *   icon: string;
 *   title: string;
 * } | {
 *   kind: "link";
 *   href: string;
 *   icon: string;
 *   title: string;
 * } | {
 *   kind: "copy";
 *   value: string;
 *   icon: string;
 *   title: string;
 * }} SidebarActionModel
 *
 * @typedef {{
 *   kind: "text";
 *   text: string;
 * } | {
 *   kind: "inlineCode";
 *   language: string | null;
 *   multiline: boolean;
 *   presentation: SidebarCodePresentation | null;
 *   text: string;
 * } | {
 *   kind: "link";
 *   href: string;
 *   label: string;
 * }} SidebarInlineNode
 *
 * @typedef {{
 *   color: string | null;
 *   fontStyle: number;
 *   text: string;
 * }} SidebarHighlightedToken
 *
 * @typedef {{
 *   tokens: SidebarHighlightedToken[];
 * }} SidebarHighlightedLine
 *
 * @typedef {{
 *   backgroundColor: string | null;
 *   foregroundColor: string | null;
 *   language: string | null;
 *   lines: SidebarHighlightedLine[];
 * }} SidebarCodePresentation
 *
 * @typedef {{
 *   kind: "paragraph";
 *   lines: SidebarInlineNode[][];
 * } | {
 *   kind: "codeBlock";
 *   code: string;
 *   language: string | null;
 *   presentation: SidebarCodePresentation | null;
 * } | {
 *   kind: "typeBlock";
 *   code: string;
 *   language: string | null;
 *   presentation: SidebarCodePresentation | null;
 * } | {
 *   kind: "list";
 *   items: SidebarInlineNode[][];
 * } | {
 *   kind: "propertyList";
 *   items: string[];
 * }} SidebarBlockNode
 *
 * @typedef {{
 *   blocks: SidebarBlockNode[];
 *   code: number;
 *   rawError: string;
 * }} SidebarTranslationModel
 *
 * @typedef {{
 *   body: SidebarBlockNode[];
 *   code: number | null;
 *   message: string;
 *   title: string;
 *   actions: SidebarActionModel[];
 *   translations: SidebarTranslationModel[];
 *   note?: string;
 * }} SidebarDiagnosticModel
 *
 * @typedef {{
 *   pinned: SidebarDiagnosticModel | null;
 *   diagnostics: SidebarDiagnosticModel[];
 *   emptyMessage: string;
 * }} SidebarViewModel
 */

const api = (function () {
  const acquireVsCodeApiFn = Reflect.get(globalThis, "acquireVsCodeApi");
  const vscode =
    typeof acquireVsCodeApiFn === "function"
      ? acquireVsCodeApiFn()
      : {
          /**
           * @param {unknown} message
           */
          postMessage(message) {
            console.log("message:", message);
          },
        };

  return {
    ready() {
      vscode.postMessage({ command: "ready" });
    },
    /**
     * @param {"trace" | "debug" | "info" | "warn" | "error"} level
     * @param {string} text
     */
    log(level, text) {
      const consoleMethod =
        typeof console[level] === "function" ? console[level] : console.log;
      consoleMethod.call(console, `[pretty-ts-errors:webview] ${text}`);
      vscode.postMessage({ command: "log", level, text });
    },
    /**
     * @param {string} text
     */
    notify(text) {
      vscode.postMessage({ command: "notify", text });
    },
  };
})();

const $content = window.document.querySelector("#content");

window.addEventListener("error", (event) => {
  api.log(
    "error",
    `window error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
  );
});

window.addEventListener("unhandledrejection", (event) => {
  const reason =
    event.reason instanceof Error
      ? event.reason.stack ?? event.reason.message
      : String(event.reason);
  api.log("error", `unhandled rejection: ${reason}`);
});

window.addEventListener("message", (event) => {
  const message = event.data;
  if (message?.command === "render-sidebar" && $content instanceof HTMLElement) {
    const model = /** @type {SidebarViewModel} */ (message.model);
    api.log(
      "debug",
      `render-sidebar received ${model.diagnostics.length} diagnostics and ${model.pinned === null ? 0 : 1} pinned item(s)`,
    );
    renderSidebar($content, model);
  }
});

window.document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const copyButton = target.closest("[data-copy-content]");
  if (copyButton instanceof HTMLElement) {
    const content = copyButton.dataset.copyContent;
    if (typeof content === "string" && content.length > 0) {
      void copyToClipboard(content);
    }
  }
});

api.ready();
api.log("debug", "sidebar webview script initialized");

/**
 * @param {HTMLElement} container
 * @param {SidebarViewModel} model
 */
function renderSidebar(container, model) {
  container.replaceChildren();
  const stack = document.createElement("div");
  stack.className = "diagnostic-stack";

  if (model.pinned !== null) {
    stack.appendChild(createPinnedSection(model.pinned));
  }

  if (model.diagnostics.length === 0) {
    if (model.pinned === null) {
      const empty = document.createElement("section");
      empty.className = "sidebar-empty-state";
      const title = document.createElement("h2");
      title.className = "empty-state-title";
      title.textContent = "No active diagnostics";
      const body = document.createElement("p");
      body.textContent = model.emptyMessage;
      empty.append(title, body);
      stack.appendChild(empty);
    }
    container.appendChild(stack);
    return;
  }

  model.diagnostics.forEach((diagnostic) => {
    stack.appendChild(createDiagnosticCard(diagnostic));
  });

  container.appendChild(stack);
}

/**
 * @param {SidebarDiagnosticModel} diagnostic
 */
function createPinnedSection(diagnostic) {
  const section = document.createElement("section");
  section.className = "pinned-section";

  const header = document.createElement("div");
  header.className = "pinned-header";

  const label = document.createElement("span");
  label.className = "pinned-label";
  label.appendChild(createCodicon("codicon-pinned"));
  label.append(" Pinned error");

  header.appendChild(label);
  header.appendChild(
    createCommandLink(
      "prettyTsErrors.unpinError",
      [],
      "Unpin error",
      "codicon-close",
      "unpin-button",
    ),
  );

  section.appendChild(header);
  section.appendChild(createDiagnosticCard(diagnostic));

  return section;
}

/**
 * @param {SidebarDiagnosticModel} diagnostic
 */
function createDiagnosticCard(diagnostic) {
  const card = document.createElement("article");
  card.className = "diagnostic-card";

  const header = document.createElement("div");
  header.className = "diagnostic-header";

  const titleGroup = document.createElement("div");
  titleGroup.className = "diagnostic-title-group";

  const eyebrow = document.createElement("span");
  eyebrow.className = "diagnostic-eyebrow";
  eyebrow.textContent = "TypeScript diagnostic";

  const title = document.createElement("h2");
  title.className = "diagnostic-title";
  title.textContent = diagnostic.title;
  titleGroup.append(eyebrow, title);
  header.appendChild(titleGroup);

  const actions = document.createElement("div");
  actions.className = "diagnostic-actions";
  diagnostic.actions.forEach((action) => {
    actions.appendChild(createActionElement(action));
  });
  header.appendChild(actions);

  card.appendChild(header);

  if (typeof diagnostic.note === "string" && diagnostic.note.length > 0) {
    const note = document.createElement("div");
    note.className = "diagnostic-note";
    note.textContent = diagnostic.note;
    card.appendChild(note);
  }

  const messageSection = document.createElement("section");
  messageSection.className = "diagnostic-message-section";
  appendLayoutBlocks(messageSection, diagnostic.body);
  card.appendChild(messageSection);

  if (diagnostic.translations.length > 0) {
    card.appendChild(
      createTranslationsSection(diagnostic.translations, diagnostic.message),
    );
  }

  return card;
}

/**
 * @param {SidebarTranslationModel[]} translations
 * @param {string} originalMessage
 */
function createTranslationsSection(translations, originalMessage) {
  const section = document.createElement("section");
  section.className = "translation-section";

  const header = document.createElement("div");
  header.className = "translation-section-header";

  const label = document.createElement("span");
  label.className = "section-eyebrow";
  label.textContent = "Local explanation";
  header.appendChild(label);
  section.appendChild(header);

  translations.forEach((translation) => {
    const card = document.createElement("div");
    card.className = "translation-card";

    const title = document.createElement("div");
    title.className = "translation-title";
    title.textContent = `TS${translation.code}`;
    card.appendChild(title);

    if (translations.length > 1 || translation.rawError !== originalMessage) {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = translation.rawError;
      pre.appendChild(code);
      card.appendChild(pre);
    }

    appendLayoutBlocks(card, translation.blocks);

    section.appendChild(card);
  });

  return section;
}

/**
 * @param {HTMLElement} container
 * @param {SidebarBlockNode[]} blocks
 */
function appendLayoutBlocks(container, blocks) {
  blocks.forEach((block) => {
    switch (block.kind) {
      case "paragraph": {
        const paragraph = document.createElement("p");
        paragraph.className = "diagnostic-paragraph";
        block.lines.forEach((line, index) => {
          paragraph.appendChild(createInlineNodesFragment(line));
          if (index < block.lines.length - 1) {
            paragraph.appendChild(document.createElement("br"));
          }
        });
        container.appendChild(paragraph);
        return;
      }
      case "codeBlock":
      case "typeBlock": {
        container.appendChild(
          createCodeBlockElement(
            block.code,
            block.kind === "typeBlock" ? "type-code-container" : "",
            block.presentation,
          ),
        );
        return;
      }
      case "list": {
        const list = document.createElement("ul");
        list.className = "diagnostic-list";
        block.items.forEach((item) => {
          const listItem = document.createElement("li");
          listItem.appendChild(createInlineNodesFragment(item));
          list.appendChild(listItem);
        });
        container.appendChild(list);
        return;
      }
      case "propertyList": {
        const list = document.createElement("div");
        list.className = "property-list";
        block.items.forEach((item) => {
          const chip = document.createElement("span");
          chip.className = "property-chip";
          chip.textContent = item;
          list.appendChild(chip);
        });
        container.appendChild(list);
        return;
      }
    }
  });
}

/**
 * @param {string} codeText
 * @param {string} [extraClassName]
 * @param {SidebarCodePresentation | null} [presentation]
 */
function createCodeBlockElement(codeText, extraClassName = "", presentation = null) {
  const codeContainer = document.createElement("div");
  codeContainer.className = ["code-container", extraClassName]
    .filter(Boolean)
    .join(" ");
  applyCodePresentationStyles(codeContainer, presentation);

  const copyButton = document.createElement("button");
  copyButton.className = "copy-button";
  copyButton.type = "button";
  copyButton.title = "Copy code block";
  copyButton.setAttribute("aria-label", "Copy code block");
  copyButton.dataset.copyContent = codeText;
  copyButton.appendChild(createCodicon("codicon-copy"));
  codeContainer.appendChild(copyButton);

  const pre = document.createElement("pre");
  const code = createCodeElement(codeText, presentation);
  pre.appendChild(code);
  codeContainer.appendChild(pre);

  return codeContainer;
}

/**
 * @param {SidebarInlineNode[]} nodes
 */
function createInlineNodesFragment(nodes) {
  const fragment = document.createDocumentFragment();
  nodes.forEach((node) => {
    switch (node.kind) {
      case "text":
        fragment.append(node.text);
        return;
      case "inlineCode": {
        const code = createCodeElement(node.text, node.presentation);
        code.className = node.multiline
          ? "inline-rich-code inline-rich-code-multiline"
          : "inline-rich-code";
        fragment.appendChild(code);
        return;
      }
      case "link": {
        const link = document.createElement("a");
        link.href = node.href;
        link.target = "_blank";
        link.rel = "noreferrer noopener";
        link.textContent = node.label;
        fragment.appendChild(link);
        return;
      }
    }
  });

  return fragment;
}

/**
 * @param {HTMLElement} element
 * @param {SidebarCodePresentation | null} presentation
 */
function applyCodePresentationStyles(element, presentation) {
  if (presentation?.backgroundColor) {
    element.style.backgroundColor = presentation.backgroundColor;
  }
  if (presentation?.foregroundColor) {
    element.style.color = presentation.foregroundColor;
  }
}

/**
 * @param {SidebarHighlightedToken} token
 * @returns {HTMLSpanElement}
 */
function createHighlightedTokenElement(token) {
  const span = document.createElement("span");
  span.className = "highlighted-code-token";
  span.textContent = token.text;
  if (token.color) {
    span.style.color = token.color;
  }
  if ((token.fontStyle & 1) !== 0) {
    span.style.fontStyle = "italic";
  }
  if ((token.fontStyle & 2) !== 0) {
    span.style.fontWeight = "700";
  }
  if ((token.fontStyle & 4) !== 0) {
    span.style.textDecoration = "underline";
  }
  return span;
}

/**
 * @param {string} codeText
 * @param {SidebarCodePresentation | null} presentation
 * @returns {HTMLElement}
 */
function createCodeElement(codeText, presentation) {
  const code = document.createElement("code");
  applyCodePresentationStyles(code, presentation);

  if (presentation === null) {
    code.textContent = codeText;
    return code;
  }

  presentation.lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      code.appendChild(document.createTextNode("\n"));
    }

    if (line.tokens.length === 0) {
      return;
    }

    line.tokens.forEach((token) => {
      code.appendChild(createHighlightedTokenElement(token));
    });
  });

  return code;
}

/**
 * @param {SidebarActionModel} action
 */
function createActionElement(action) {
  switch (action.kind) {
    case "command":
      return createCommandLink(action.command, action.args, action.title, action.icon);
    case "link":
      return createExternalLink(action.href, action.title, action.icon);
    case "copy":
      return createCopyButton(action.value, action.title, action.icon);
  }
}

/**
 * @param {string} command
 * @param {unknown[]} args
 * @param {string} title
 * @param {string} icon
 * @param {string} [extraClassName]
 */
function createCommandLink(command, args, title, icon, extraClassName = "") {
  const link = document.createElement("a");
  link.href = `command:${command}?${encodeURIComponent(JSON.stringify(args))}`;
  link.title = title;
  link.setAttribute("aria-label", title);
  link.className = ["action-link", extraClassName].filter(Boolean).join(" ");
  link.appendChild(createCodicon(icon));
  return link;
}

/**
 * @param {string} href
 * @param {string} title
 * @param {string} icon
 */
function createExternalLink(href, title, icon) {
  const link = document.createElement("a");
  link.href = href;
  link.title = title;
  link.setAttribute("aria-label", title);
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.className = "action-link";
  link.appendChild(createCodicon(icon));
  return link;
}

/**
 * @param {string} value
 * @param {string} title
 * @param {string} icon
 */
function createCopyButton(value, title, icon) {
  const button = document.createElement("button");
  button.type = "button";
  button.title = title;
  button.setAttribute("aria-label", title);
  button.className = "action-button";
  button.dataset.copyContent = value;
  button.appendChild(createCodicon(icon));
  return button;
}

/**
 * @param {string} iconClass
 */
function createCodicon(iconClass) {
  const icon = document.createElement("span");
  icon.className = `codicon ${iconClass}`;
  return icon;
}

/**
 * @param {string} text
 */
async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
  api.notify("Copied block to clipboard!");
}
