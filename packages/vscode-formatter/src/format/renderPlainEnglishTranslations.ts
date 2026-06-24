import type { PlainEnglishTranslation } from "@pretty-ts-errors/error-translator";
import { d } from "@pretty-ts-errors/utils";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function renderInlineMarkdown(text: string): string {
  const linkPlaceholders: string[] = [];
  const codePlaceholders: string[] = [];

  const withLinks = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gu,
    (_match, label: string, url: string) => {
      const placeholder = `__PTE_LINK_${linkPlaceholders.length}__`;
      linkPlaceholders.push(
        `<a href="${escapeAttribute(url)}">${escapeHtml(label)}</a>`,
      );
      return placeholder;
    },
  );

  const withCode = withLinks.replace(/`([^`]+)`/gu, (_match, code: string) => {
    const placeholder = `__PTE_CODE_${codePlaceholders.length}__`;
    codePlaceholders.push(`<code>${escapeHtml(code)}</code>`);
    return placeholder;
  });

  let rendered = escapeHtml(withCode);

  linkPlaceholders.forEach((html, index) => {
    rendered = rendered.replace(`__PTE_LINK_${index}__`, html);
  });

  codePlaceholders.forEach((html, index) => {
    rendered = rendered.replace(`__PTE_CODE_${index}__`, html);
  });

  return rendered;
}

function renderTranslationBody(body: string): string {
  return body
    .split(/\r?\n\r?\n/u)
    .map((paragraph) => {
      const renderedParagraph = renderInlineMarkdown(paragraph).replaceAll(
        /\r?\n/gu,
        "<br>",
      );
      return `<p>${renderedParagraph}</p>`;
    })
    .join("");
}

export function renderPlainEnglishTranslations(
  translations: readonly PlainEnglishTranslation[],
): string {
  if (translations.length === 0) {
    return "";
  }

  const cards = translations
    .map((translation) => {
      const body =
        translation.body === null
          ? `<p>No local plain-English translation is available for TS${translation.code} yet.</p>`
          : renderTranslationBody(translation.body);

      return d /*html*/ `
        <div class="pretty-ts-errors-translation-card" style="margin-top: 12px; padding: 12px; border: 1px solid var(--vscode-panel-border); border-radius: 6px;">
          <div style="font-weight: 600; margin-bottom: 8px;">Plain English · TS${translation.code}</div>
          <div style="line-height: 1.6;">
            ${body}
          </div>
        </div>
      `;
    })
    .join("");

  return d /*html*/ `
    <section class="pretty-ts-errors-translation-section" style="padding-top: 12px;">
      ${cards}
    </section>
  `;
}
