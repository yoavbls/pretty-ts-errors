// @ts-check

// wrap this in IIFE because `vscode` should **NEVER** be leaked into the global scope
// @see https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension
const api = (function () {
  // fallback logs to console, keep it for local development
  const vscode =
    typeof acquireVsCodeApi === "function"
      ? acquireVsCodeApi()
      : {
          /**
           * @param {unknown} message
           */
          postMessage(message) {
            console.log(`message: `, message);
          },
        };
  return {
    /**
     * Show a notification message in vscode
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
  switch (message.command) {
    case "update-content": {
      if ($content) {
        $content.innerHTML = message.html;
      }
    }
  }
});

window.document.addEventListener("click", (event) => {
  const element = /** @type {HTMLElement} */ (event.target);
  if (
    element.tagName.toLowerCase() === "button" &&
    element.hasAttribute("data-copy-content")
  ) {
    handleCopyContentEvent(element);
  }
});

/**
 *
 * @param {HTMLElement} element
 */
function handleCopyContentEvent(element) {
  const parent = element.parentElement;
  if (parent?.classList.contains("code-container")) {
    const pre = parent.querySelector("pre");
    const code = pre?.querySelector("code");
    const content = code?.innerText;
    if (content) {
      copyToClipboard(content);
    }
  }
}

/**
 * Copy `text` to the user's clipboard
 * @param {string} text
 */
async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
  api.notify("Copied type to clipboard!");
}
