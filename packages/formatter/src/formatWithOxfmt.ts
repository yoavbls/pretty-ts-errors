import { format } from "oxfmt";

export async function formatWithOxfmt(text: string) {
  const result = await format("type.ts", text, {
    printWidth: 60,
    arrowParens: "avoid",
  });

  console.log("Prettified type:", result.code);

  if (result.errors.length > 0) {
    throw new Error(result.errors[0]?.message ?? "oxfmt formatting failed");
  }

  return result.code;
}
