import type { Profile } from "@/lib/schemas";

export function Contact({ email, links }: Pick<Profile, "email" | "links">) {
  return (
    <section id="contact" className="section" aria-labelledby="contact-title">
      <h2 id="contact-title">Contact</h2>
      <a href={`mailto:${email}`} className="accent-link email">
        {email}
      </a>
      <div className="actions">
        <a className="button" href={links.github}>
          GitHub
        </a>
        <a className="button" href={links.linkedin}>
          LinkedIn
        </a>
        <a className="button" href={links.cv} download>
          Download CV
        </a>
      </div>
    </section>
  );
}
