import { describe, it, expect } from "vitest";
import { formatDiagnosticMessage } from "@pretty-ts-errors/formatter";
import { hoverCodeBlock } from "../src/components/hoverCodeBlock";
import { plainCodeBlock } from "../src/components/plainCodeBlock";
import {
  errorWithSpecialCharsInObjectKeys,
  errorWithDashInObjectKeys,
} from "../../formatter/test/errorMessageMocks";

describe("hoverCodeBlock", () => {
  it("renders inline code with language", () => {
    const result = hoverCodeBlock("string", "type", false);
    expect(result).toContain("```type");
    expect(result).toContain("string");
    expect(result).toContain("```");
  });

  it("renders multiline code with padding", () => {
    const code = "{\n  name: string\n}";
    const result = hoverCodeBlock(code, "type", true);
    expect(result).toContain("```type");
    expect(result).toContain("<p></p>");
  });

  it("falls back to plainCodeBlock when no language", () => {
    const result = hoverCodeBlock("someCode", undefined, false);
    expect(result).toContain("<code>");
    expect(result).toContain("someCode");
  });
});

describe("plainCodeBlock", () => {
  it("wraps content in a code tag", () => {
    const result = plainCodeBlock("hello");
    expect(result).toContain("<code>hello</code>");
  });
});

describe("formatDiagnosticMessage with hoverCodeBlock", () => {
  it("formats special characters in object keys", () => {
    const result = formatDiagnosticMessage(
      errorWithSpecialCharsInObjectKeys,
      hoverCodeBlock
    );
    expect(result).toContain("```type");
    expect(result).toContain("string");
    expect(result).toContain(`"abc*bc"`);
  });

  it("formats dash in object keys", () => {
    const result = formatDiagnosticMessage(
      errorWithDashInObjectKeys,
      hoverCodeBlock
    );
    expect(result).toContain("```type");
    expect(result).toContain(`"first-name"`);
    expect(result).toContain("string");
  });
});
