import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { contentSchema, type Content } from "./schemas";

export const contentFile = join(process.cwd(), "content", "content.json");

export async function readContentFile(): Promise<Content> {
  const source = await readFile(contentFile, "utf8");
  let data: unknown;

  try {
    data = JSON.parse(source.replace(/^\uFEFF/, ""));
  } catch (cause) {
    throw new Error(`Invalid JSON in ${contentFile}`, { cause });
  }

  const result = contentSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map(
      ({ path, message }) => `${path.join(".") || "(root)"}: ${message}`,
    );
    throw new Error(
      `Invalid portfolio content in ${contentFile}:\n${issues.join("\n")}`,
    );
  }

  return result.data;
}
