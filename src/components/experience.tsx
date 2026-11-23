import type { Experience as ExperienceItem } from "@/lib/schemas";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function Experience({
  experiences,
  text,
}: {
  experiences: ExperienceItem[];
  text: Dictionary;
}) {
  return (
    <section
      id="experience"
      className="section"
      aria-labelledby="experience-title"
    >
      <h2 id="experience-title">{text.nav.experience}</h2>
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
                {startYear === endYear
                  ? startYear
                  : `${startYear} – ${endYear ?? text.present}`}
              </span>
              <div>
                <h3 lang="en">{role}</h3>
                <p className="organization">{organization}</p>
                <p lang="en">{description}</p>
              </div>
              <p className="row-meta">{location}</p>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
