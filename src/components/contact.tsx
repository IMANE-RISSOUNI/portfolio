import type { Profile } from "@/lib/schemas";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function Contact({
  email,
  links,
  text,
}: Pick<Profile, "email" | "links"> & { text: Dictionary }) {
  return (
    <section id="contact" className="section" aria-labelledby="contact-title">
      <h2 id="contact-title">{text.nav.contact}</h2>
      <a href={`mailto:${email}`} className="accent-link email">
        {email}
      </a>
      <div className="actions">
        <a className="button" href={links.github}>
          {text.github}
        </a>
        <a className="button" href={links.linkedin}>
          {text.nav.linkedin}
        </a>
        <a className="button" href={links.cv} download>
          {text.hero.resume}
        </a>
      </div>
    </section>
  );
}
