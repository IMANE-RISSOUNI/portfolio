import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createContentLoader } from "./content";
import type { Content } from "./schemas";
import {
  mapExperience,
  mapProfile,
  mapProject,
  mapSkill,
  type Database,
} from "./supabase-mapping";

vi.mock("./supabase", () => ({ createSupabaseClient: () => null }));

const profile = {
  id: 1,
  name: "Database profile",
  headline: "Backend engineer",
  bio: "Builds software.",
  location: "Remote",
  email: "engineer@portfolio.test",
  availability: false,
  availability_text: "Unavailable",
  github_url: "https://portfolio.test/github",
  linkedin_url: "https://portfolio.test/linkedin",
  cv_url: "/cv.pdf",
};
const project = {
  id: 2,
  title: "Second",
  description: "A project",
  stack: ["TypeScript"],
  repo_url: null,
  demo_url: "https://portfolio.test/demo",
  year: null,
  sort_order: 2,
  visible: true,
};
const experience = {
  id: 3,
  role: "Engineer",
  organization: "Portfolio Test",
  type: "work" as const,
  start_year: 2025,
  end_year: null,
  description: "Builds software.",
  location: "Remote",
  sort_order: 1,
  visible: true,
};
const skill = {
  id: 4,
  category: "Languages",
  items: ["TypeScript"],
  sort_order: 1,
  visible: true,
};
const fallback: Content = {
  profile: { ...mapProfile(profile), name: "Fallback profile" },
  projects: [mapProject(project)],
  experiences: [],
  skills: [],
};

type Table = keyof Database["public"]["Tables"];

function mockDatabase(
  overrides: Partial<Record<Table, unknown[] | Response>> = {},
) {
  const payloads: Record<Table, unknown[] | Response> = {
    profile: [profile],
    projects: [
      project,
      { ...project, id: 5, title: "Hidden", visible: false },
      { ...project, id: 6, title: "First", sort_order: 1 },
    ],
    experiences: [experience],
    skills: [skill],
    ...overrides,
  };

  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    init?.signal?.throwIfAborted();
    const table = new URL(String(input)).pathname.split("/").at(-1) as Table;
    const payload = payloads[table];
    if (payload instanceof Response) return payload;
    return Response.json(payload, {
      headers: {
        "content-range": `0-${Math.max(0, payload.length - 1)}/${payload.length}`,
      },
    });
  });
  const client = createClient<Database>(
    "https://portfolio.test",
    "test-anon-key",
    {
      auth: { persistSession: false },
      db: { retry: false },
      global: { fetch: fetchMock },
    },
  );
  const readFallback = vi.fn(async () => fallback);
  return {
    getContent: createContentLoader(() => client, readFallback),
    readFallback,
    fetchMock,
  };
}

describe("Supabase content", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns mapped, filtered and sorted content", async () => {
    const { getContent, readFallback, fetchMock } = mockDatabase();
    const result = await getContent();

    expect(result.profile.availability).toEqual({
      available: false,
      text: "Unavailable",
    });
    expect(result.projects.map(({ title }) => title)).toEqual([
      "First",
      "Second",
    ]);
    expect(result.experiences[0]).toMatchObject({
      startYear: 2025,
      endYear: null,
    });
    expect(result.skills[0]).toMatchObject({
      category: "Languages",
      sortOrder: 1,
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(readFallback).not.toHaveBeenCalled();
  });

  it.each([
    [
      "query error",
      () => ({
        skills: Response.json(
          { message: "sensitive upstream detail" },
          { status: 500 },
        ),
      }),
      "query failed for skills",
    ],
    ["missing profile", () => ({ profile: [] }), "profile row id=1 is missing"],
    [
      "invalid data",
      () => ({ projects: [{ ...project, year: "invalid" }] }),
      "projects.0.year",
    ],
    [
      "empty projects and experiences",
      () => ({ projects: [], experiences: [] }),
      "no visible projects or experiences",
    ],
    [
      "only hidden projects",
      () => ({ projects: [{ ...project, visible: false }], experiences: [] }),
      "no visible projects or experiences",
    ],
  ] satisfies [
    string,
    () => Partial<Record<Table, unknown[] | Response>>,
    string,
  ][])(
    "uses the entire JSON fallback after %s",
    async (_scenario, overrides, reason) => {
      const { getContent, readFallback } = mockDatabase(overrides());
      await expect(getContent()).resolves.toEqual(fallback);
      expect(readFallback).toHaveBeenCalledOnce();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(reason),
      );
      expect(console.warn).not.toHaveBeenCalledWith(
        expect.stringContaining("sensitive upstream detail"),
      );
    },
  );

  it("uses the JSON fallback after the request deadline", async () => {
    vi.spyOn(AbortSignal, "timeout").mockReturnValueOnce(
      AbortSignal.abort(new DOMException("Deadline exceeded", "TimeoutError")),
    );
    const { getContent } = mockDatabase();
    await expect(getContent()).resolves.toEqual(fallback);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("timed out"),
    );
  });
});

describe("row mapping", () => {
  it("maps profile links and availability, list ordering, and nullable fields", () => {
    expect(mapProfile(profile)).toMatchObject({
      availability: { available: false, text: "Unavailable" },
      links: {
        github: profile.github_url,
        linkedin: profile.linkedin_url,
        cv: profile.cv_url,
      },
    });
    expect(mapProject(project)).toMatchObject({
      repoUrl: undefined,
      demoUrl: project.demo_url,
      year: undefined,
      sortOrder: 2,
    });
    expect(
      mapProject({
        ...project,
        repo_url: "https://portfolio.test/repo",
        demo_url: null,
        year: 2025,
      }),
    ).toMatchObject({
      repoUrl: "https://portfolio.test/repo",
      demoUrl: undefined,
      year: 2025,
    });
    expect(mapExperience(experience)).toMatchObject({
      startYear: 2025,
      endYear: null,
      sortOrder: 1,
    });
    expect(mapSkill(skill)).toEqual({
      category: "Languages",
      items: ["TypeScript"],
      sortOrder: 1,
      visible: true,
    });
  });
});
