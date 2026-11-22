import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getContent } from "./content";
import type { Content } from "./schemas";

vi.mock("node:fs/promises", () => ({ readFile: vi.fn() }));
vi.mock("./supabase", () => ({ createSupabaseClient: () => null }));

const fixture = {
  profile: {
    name: "Test Person",
    headline: "Test headline",
    bio: "Test bio",
    location: "Test City",
    email: "person@portfolio.test",
    availability: { available: false, text: "Unavailable" },
    links: {
      github: "https://portfolio.test/github",
      linkedin: "https://portfolio.test/linkedin",
      cv: "/test-cv.pdf",
    },
  },
  projects: [
    {
      title: "Second",
      description: "Test project",
      stack: ["TypeScript"],
      repoUrl: "https://portfolio.test/second",
      year: 2025,
      sortOrder: 2,
      visible: true,
    },
    {
      title: "Hidden",
      description: "Test project",
      stack: ["TypeScript"],
      sortOrder: 0,
      visible: false,
    },
    {
      title: "First",
      description: "Test project",
      stack: ["TypeScript"],
      sortOrder: 1,
      visible: true,
    },
  ],
  experiences: [],
  skills: [],
} satisfies Content;

describe("getContent", () => {
  beforeEach(() => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(fixture));
  });

  it("filters out hidden items", async () => {
    const { projects } = await getContent();
    expect(projects).toHaveLength(2);
    expect(projects.every(({ visible }) => visible)).toBe(true);
  });

  it("sorts visible items by sortOrder", async () => {
    const { projects } = await getContent();
    expect(projects.map(({ title }) => title)).toEqual(["First", "Second"]);
  });

  it("accepts projects without a year or links", async () => {
    const { projects } = await getContent();
    expect(projects[0]).toEqual(fixture.projects[2]);
  });

  it("reports the file and field path for invalid data", async () => {
    const projects = fixture.projects.map((project, index) =>
      index === 1 ? { ...project, stack: "TypeScript" } : project,
    );
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ ...fixture, projects }),
    );

    const path = join(process.cwd(), "content", "content.json");
    await expect(getContent()).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(`${path}:\nprojects.1.stack: `),
      }),
    );
  });
});
