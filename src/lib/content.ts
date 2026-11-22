import { cache } from "react";
import { readContentFile } from "./content-file";
import type { Content } from "./schemas";
import { createSupabaseClient } from "./supabase";
import { ContentSourceError, readSupabaseContent } from "./supabase-content";
import { hasPortfolioEntries } from "./supabase-mapping";

function visibleInOrder<T extends { visible: boolean; sortOrder: number }>(
  items: T[],
): T[] {
  return items
    .filter(({ visible }) => visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function prepareContent({
  profile,
  projects,
  experiences,
  skills,
}: Content): Content {
  return {
    profile,
    projects: visibleInOrder(projects),
    experiences: visibleInOrder(experiences),
    skills: visibleInOrder(skills),
  };
}

export function createContentLoader(
  createClient = createSupabaseClient,
  readFallback = readContentFile,
): () => Promise<Content> {
  return async () => {
    try {
      const client = createClient();
      if (!client)
        throw new ContentSourceError(
          "SUPABASE_URL or SUPABASE_ANON_KEY is missing",
        );

      const content = prepareContent(await readSupabaseContent(client));
      if (!hasPortfolioEntries(content)) {
        throw new ContentSourceError(
          "Supabase has no visible projects or experiences",
        );
      }
      return content;
    } catch (error) {
      const reason =
        error instanceof ContentSourceError
          ? error.message
          : "Unexpected Supabase client failure";
      console.warn(`[content] ${reason}. Using content/content.json.`);
    }

    return prepareContent(await readFallback());
  };
}

export const getContent = cache(createContentLoader());
