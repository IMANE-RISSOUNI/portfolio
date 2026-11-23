import type { Project } from "@/lib/schemas";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function Projects({
  projects,
  text,
}: {
  projects: Project[];
  text: Dictionary;
}) {
  return (
    <section id="projects" className="section" aria-labelledby="projects-title">
      <h2 id="projects-title">{text.nav.projects}</h2>
      <ul>
        {projects.map(
          ({ title, description, stack, repoUrl, demoUrl, year }) => (
            <li className="ruled-row" key={title + (repoUrl ?? "")}>
              {year === undefined ? (
                <span className="hidden sm:block" aria-hidden="true" />
              ) : (
                <time className="row-meta" dateTime={String(year)}>
                  {year}
                </time>
              )}
              <div>
                <h3>
                  {repoUrl ? (
                    <a className="accent-link" href={repoUrl}>
                      {title}
                    </a>
                  ) : (
                    title
                  )}
                </h3>
                <p lang="en">{description}</p>
                {demoUrl && (
                  <a
                    className="demo-link"
                    href={demoUrl}
                    aria-label={`${text.demoFor} ${title}`}
                  >
                    {text.demo}
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
