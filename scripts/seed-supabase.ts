import { createHash } from "node:crypto";
import { readContentFile } from "../src/lib/content-file";
import {
  experienceToRow,
  profileToRow,
  projectToRow,
  skillToRow,
} from "../src/lib/supabase-mapping";
import { createScriptClient, failScript, ScriptError } from "./supabase-client";

function withStableIds<Item, Row>(
  items: Item[],
  key: (item: Item) => unknown,
  map: (item: Item) => Row,
) {
  const rows = items.map((item) => ({
    ...map(item),
    id:
      1_000_000_000 +
      (createHash("sha256")
        .update(JSON.stringify(key(item)))
        .digest()
        .readUInt32BE() %
        1_000_000_000),
  }));
  if (new Set(rows.map(({ id }) => id)).size !== rows.length) {
    throw new ScriptError(
      "Seed keys collide. Check for duplicate project titles, experience identities, or skill categories.",
    );
  }
  return rows;
}

async function seed() {
  const client = createScriptClient();
  const content = await readContentFile().catch(() => {
    throw new ScriptError(
      "Could not read valid seed data from content/content.json.",
    );
  });
  const projects = withStableIds(
    content.projects,
    (item) => item.title,
    projectToRow,
  );
  const experiences = withStableIds(
    content.experiences,
    (item) => [item.organization, item.role, item.startYear],
    experienceToRow,
  );
  const skills = withStableIds(
    content.skills,
    (item) => item.category,
    skillToRow,
  );
  const writes = [
    [
      "profile",
      () =>
        client
          .from("profile")
          .upsert(profileToRow(content.profile), { onConflict: "id" })
          .abortSignal(AbortSignal.timeout(10_000)),
      1,
    ],
    [
      "projects",
      () =>
        client
          .from("projects")
          .upsert(projects, { onConflict: "id" })
          .abortSignal(AbortSignal.timeout(10_000)),
      projects.length,
    ],
    [
      "experiences",
      () =>
        client
          .from("experiences")
          .upsert(experiences, { onConflict: "id" })
          .abortSignal(AbortSignal.timeout(10_000)),
      experiences.length,
    ],
    [
      "skills",
      () =>
        client
          .from("skills")
          .upsert(skills, { onConflict: "id" })
          .abortSignal(AbortSignal.timeout(10_000)),
      skills.length,
    ],
  ] as const;

  for (const [table, write, count] of writes) {
    if (count > 0) {
      const { error } = await write();
      if (error)
        throw new ScriptError(
          `Upsert failed for ${table}. Earlier successful writes can be retried safely.`,
        );
    }
    console.log(`${table}: ${count} rows written`);
  }
}

seed().catch(failScript);
