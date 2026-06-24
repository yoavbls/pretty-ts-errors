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
 *   code: number;
 *   rawError: string;
 *   body: string | null;
 * }} SidebarTranslationModel
 *
 * @typedef {{
 *   code: number | null;
 *   message: string;
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
  const vscode =
    typeof acquireVsCodeApi === "function"
      ? acquireVsCodeApi()
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
     * @param {string} text
     */
    notify(text) {
      vscode.postMessage({ command: "notify", text });
    },
  };
})();

const $content = window.document.querySelector("#content");

window.addEventListener("message", (event) => {
  const message = event.data;
  if (message?.command === "render-sidebar" && $content) {
    renderSidebar($content, /** @type {SidebarViewModel} */ (message.model));
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

/**
 * @param {HTMLElement} container
 * @param {SidebarViewModel} model
 */
function renderSidebar(container, model) {
  container.replaceChildren();

  if (model.pinned !== null) {
    container.appendChild(createPinnedSection(model.pinned));
  }

  if (model.diagnostics.length === 0) {
    if (model.pinned === null) {
      const empty = document.createElement("p");
      empty.className = "sidebar-empty-state";
      empty.textContent = model.emptyMessage;
      container.appendChild(empty);
    }
    return;
  }

  model.diagnostics.forEach((diagnostic, index) => {
    if (index > 0 || model.pinned !== null) {
      container.appendChild(document.createElement("hr"));
    }
    container.appendChild(createDiagnosticCard(diagnostic));
  });
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

  const title = document.createElement("div");
  title.className = "diagnostic-title";
  title.textContent =
    diagnostic.code === null ? "Error" : `Error (TS${diagnostic.code})`;
  header.appendChild(title);

  const actions = document.createElement("div");
  actions.className = "diagnostic-actions";
  diagnostic.actions.forEach((action) => {
    actions.appendChild(createActionElement(action));
  });
  header.appendChild(actions);

  card.appendChild(header);

  if (typeof diagnostic.note === "string" && diagnostic.note.length > 0) {
    const note = document.createElement("p");
    note.className = "diagnostic-note";
    note.textContent = diagnostic.note;
    card.appendChild(note);
  }

  const codeContainer = document.createElement("div");
  codeContainer.className = "code-container";

  const copyButton = document.createElement("button");
  copyButton.className = "copy-button";
  copyButton.type = "button";
  copyButton.title = "Copy error message";
  copyButton.dataset.copyContent = diagnostic.message;
  copyButton.appendChild(createCodicon("codicon-copy"));
  codeContainer.appendChild(copyButton);

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = diagnostic.message;
  pre.appendChild(code);
  codeContainer.appendChild(pre);
  card.appendChild(codeContainer);

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

  translations.forEach((translation) => {
    const card = document.createElement("div");
    card.className = "translation-card";

    const title = document.createElement("div");
    title.className = "translation-title";
    title.textContent = `Plain English · TS${translation.code}`;
    card.appendChild(title);

    if (translations.length > 1 || translation.rawError !== originalMessage) {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = translation.rawError;
      pre.appendChild(code);
      card.appendChild(pre);
    }

    if (translation.body === null) {
      const fallback = document.createElement("p");
      fallback.textContent = `No local plain-English translation is available for TS${translation.code} yet.`;
      card.appendChild(fallback);
    } else {
      appendMarkdownParagraphs(card, translation.body);
    }

    section.appendChild(card);
  });

  return section;
}

/**
 * @param {HTMLElement} container
 * @param {string} markdown
 */
function appendMarkdownParagraphs(container, markdown) {
  const paragraphs = markdown.split(/\r?\n\r?\n/gu).filter(Boolean);
  paragraphs.forEach((paragraph) => {
    const element = document.createElement("p");
    const lines = paragraph.split(/\r?\n/gu);
    lines.forEach((line, index) => {
      element.appendChild(createInlineMarkdownFragment(line));
      if (index < lines.length - 1) {
        element.appendChild(document.createElement("br"));
      }
    });
    container.appendChild(element);
  });
}

/**
 * @param {string} text
 */
function createInlineMarkdownFragment(text) {
  const fragment = document.createDocumentFragment();
  const tokenPattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|`([^`]+)`/gu;
  let lastIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      fragment.append(text.slice(lastIndex, matchIndex));
    }

    const [, linkLabel, linkHref, codeText] = match;
    if (typeof linkLabel === "string" && typeof linkHref === "string") {
      const link = document.createElement("a");
      link.href = linkHref;
      link.textContent = linkLabel;
      fragment.appendChild(link);
    } else if (typeof codeText === "string") {
      const code = document.createElement("code");
      code.textContent = codeText;
      fragment.appendChild(code);
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    fragment.append(text.slice(lastIndex));
  }

  return fragment;
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
  api.notify("Copied type to clipboard!");
}
