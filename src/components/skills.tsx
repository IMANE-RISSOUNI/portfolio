import type { Skill } from "@/lib/schemas";

export function Skills({ skills }: { skills: Skill[] }) {
  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <h2 id="skills-title">Skills</h2>
      <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
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
