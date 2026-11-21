import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import { contentSchema, type Content } from "./schemas";

const contentFile = "content/content.json";

function visibleInOrder<T extends { visible: boolean; sortOrder: number }>(
  items: T[],
): T[] {
  return items
    .filter(({ visible }) => visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export const getContent = cache(async (): Promise<Content> => {
  const source = await readFile(join(process.cwd(), contentFile), "utf8");
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

  const { profile, projects, experiences, skills } = result.data;
  return {
    profile,
    projects: visibleInOrder(projects),
    experiences: visibleInOrder(experiences),
    skills: visibleInOrder(skills),
  };
});
