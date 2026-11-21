import type { Project } from "@/lib/schemas";

export function Projects({ projects }: { projects: Project[] }) {
  return (
    <section id="projects" className="section" aria-labelledby="projects-title">
      <h2 id="projects-title">Projects</h2>
      <ul>
        {projects.map(
          ({ title, description, stack, repoUrl, demoUrl, year }) => (
            <li className="ruled-row" key={title + repoUrl}>
              <time className="row-meta" dateTime={String(year)}>
                {year}
              </time>
              <div>
                <h3>
                  <a className="accent-link" href={repoUrl}>
                    {title}
                  </a>
                </h3>
                <p>{description}</p>
                {demoUrl && (
                  <a
                    className="demo-link"
                    href={demoUrl}
                    aria-label={`Live demo for ${title}`}
                  >
                    Live demo
                  </a>
                )}
              </div>
              <p className="row-meta">{stack.join(", ")}</p>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
