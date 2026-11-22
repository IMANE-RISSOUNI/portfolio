import type { SupabaseClient } from "@supabase/supabase-js";
import { contentSchema, type Content } from "./schemas";
import {
  mapExperience,
  mapProfile,
  mapProject,
  mapSkill,
  type Database,
} from "./supabase-mapping";

export class ContentSourceError extends Error {}

const batchSize = 500;

async function collectRows<Row>(
  table: string,
  signal: AbortSignal,
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: Row[] | null;
    error: unknown;
    count: number | null;
  }>,
): Promise<Row[]> {
  const rows: Row[] = [];

  while (true) {
    const { data, error, count } = await fetchPage(
      rows.length,
      rows.length + batchSize - 1,
    );
    if (signal.aborted)
      throw new ContentSourceError("Supabase request timed out");
    if (error || !Array.isArray(data) || count === null) {
      throw new ContentSourceError(`Supabase query failed for ${table}`);
    }

    rows.push(...data);
    if (rows.length === count) return rows;
    if (data.length === 0 || rows.length > count) {
      throw new ContentSourceError(`Incomplete Supabase result for ${table}`);
    }
  }
}

export async function readSupabaseContent(
  client: SupabaseClient<Database>,
): Promise<Content> {
  const signal = AbortSignal.timeout(5_000);
  const [profile, projects, experiences, skills] = await Promise.all([
    client
      .from("profile")
      .select("*")
      .eq("id", 1)
      .abortSignal(signal)
      .maybeSingle(),
    collectRows("projects", signal, (from, to) =>
      client
        .from("projects")
        .select("*", { count: "exact" })
        .order("sort_order")
        .order("id")
        .range(from, to)
        .abortSignal(signal),
    ),
    collectRows("experiences", signal, (from, to) =>
      client
        .from("experiences")
        .select("*", { count: "exact" })
        .order("sort_order")
        .order("id")
        .range(from, to)
        .abortSignal(signal),
    ),
    collectRows("skills", signal, (from, to) =>
      client
        .from("skills")
        .select("*", { count: "exact" })
        .order("sort_order")
        .order("id")
        .range(from, to)
        .abortSignal(signal),
    ),
  ]);
  if (signal.aborted)
    throw new ContentSourceError("Supabase request timed out");
  if (profile.error)
    throw new ContentSourceError("Supabase query failed for profile");
  if (!profile.data)
    throw new ContentSourceError("Supabase profile row id=1 is missing");

  const result = contentSchema.safeParse({
    profile: mapProfile(profile.data),
    projects: projects.map(mapProject),
    experiences: experiences.map(mapExperience),
    skills: skills.map(mapSkill),
  });
  if (!result.success) {
    const fields = result.error.issues.map(
      ({ path }) => path.join(".") || "(root)",
    );
    throw new ContentSourceError(
      `Invalid Supabase content at ${fields.join(", ")}`,
    );
  }
  return result.data;
}
