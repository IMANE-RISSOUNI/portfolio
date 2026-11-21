import type { Experience as ExperienceItem } from "@/lib/schemas";

export function Experience({ experiences }: { experiences: ExperienceItem[] }) {
  return (
    <section
      id="experience"
      className="section"
      aria-labelledby="experience-title"
    >
      <h2 id="experience-title">Experience</h2>
      <ul>
        {experiences.map(
          ({
            role,
            organization,
            startYear,
            endYear,
            description,
            location,
          }) => (
            <li
              className="ruled-row"
              key={`${organization}-${role}-${startYear}`}
            >
              <span className="row-meta">
                {startYear} – {endYear ?? "Present"}
              </span>
              <div>
                <h3>{role}</h3>
                <p className="organization">{organization}</p>
                <p>{description}</p>
              </div>
              <p className="row-meta">{location}</p>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
