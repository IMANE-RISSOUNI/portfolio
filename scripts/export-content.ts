import { randomUUID } from "node:crypto";
import { rename, rm, writeFile } from "node:fs/promises";
import { contentFile } from "../src/lib/content-file";
import {
  ContentSourceError,
  readSupabaseContent,
} from "../src/lib/supabase-content";
import { hasPortfolioEntries } from "../src/lib/supabase-mapping";
import { createScriptClient, failScript, ScriptError } from "./supabase-client";

async function exportContent() {
  const client = createScriptClient();
  const content = await readSupabaseContent(client).catch((error: unknown) => {
    if (error instanceof ContentSourceError)
      throw new ScriptError(error.message);
    throw error;
  });

  if (!hasPortfolioEntries(content)) {
    throw new ScriptError(
      "Supabase has no projects or experiences. The JSON fallback was preserved.",
    );
  }

  const temporaryFile = `${contentFile}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryFile, `${JSON.stringify(content, null, 2)}\n`, {
      flag: "wx",
    });
    await rename(temporaryFile, contentFile);
  } finally {
    await rm(temporaryFile, { force: true });
  }
  console.log(
    `Exported 1 profile, ${content.projects.length} projects, ${content.experiences.length} experiences, and ${content.skills.length} skill categories to content/content.json.`,
  );
}

exportContent().catch(failScript);
