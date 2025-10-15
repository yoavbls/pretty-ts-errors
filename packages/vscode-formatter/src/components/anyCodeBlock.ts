import { inlineCodeBlock, multiLineCodeBlock } from "./codeBlock";
import { unstyledCodeBlock } from "./plainCodeBlock";

export const anyCodeBlock = (
  code: string,
  language?: string,
  multiLine?: boolean
) => {
  if (!language) {
    return unstyledCodeBlock(code);
  }
  if (multiLine) {
    return multiLineCodeBlock(code, language);
  }
  return inlineCodeBlock(code, language);
};
