import type { Skill } from "@/lib/schemas";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function Skills({
  skills,
  text,
}: {
  skills: Skill[];
  text: Dictionary;
}) {
  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <h2 id="skills-title">{text.nav.skills}</h2>
      <ul
        lang="en"
        className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {skills.map(({ category, items }) => (
          <li key={category}>
            <h3>{category}</h3>
            <p>{items.join(", ")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
