import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { Experience } from "./experience";
import { Projects } from "./projects";

it("omits the project title link and date when they are absent", () => {
  const project = {
    description: "Project description",
    stack: ["TypeScript"],
    visible: true,
  };
  const html = renderToStaticMarkup(
    <Projects
      projects={[
        { ...project, title: "Unlinked project", sortOrder: 1 },
        {
          ...project,
          title: "Linked project",
          sortOrder: 2,
          year: 2025,
          repoUrl: "https://portfolio.test/repo",
        },
      ]}
    />,
  );
  expect(html).toContain("<h3>Unlinked project</h3>");
  expect(html).toContain(
    '<h3><a class="accent-link" href="https://portfolio.test/repo">Linked project</a></h3>',
  );
  expect(html.match(/<time\b/g)).toHaveLength(1);
  expect(html).toContain('dateTime="2025">2025</time>');
});

it("renders single-year, ongoing, and completed experience dates", () => {
  const experience = {
    role: "Engineer",
    type: "work" as const,
    startYear: 2023,
    description: "Experience description",
    location: "Remote",
    visible: true,
  };
  const html = renderToStaticMarkup(
    <Experience
      experiences={[
        {
          ...experience,
          organization: "Single year",
          sortOrder: 1,
          endYear: 2023,
        },
        { ...experience, organization: "Ongoing", sortOrder: 2, endYear: null },
        {
          ...experience,
          organization: "Completed",
          sortOrder: 3,
          endYear: 2025,
        },
      ]}
    />,
  );
  expect(html).toContain(">2023</span>");
  expect(html).toContain(">2023 – Present</span>");
  expect(html).toContain(">2023 – 2025</span>");
});
