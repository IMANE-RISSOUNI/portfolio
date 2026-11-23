import type { Dictionary } from "@/i18n/dictionaries/en";

export function About({
  location,
  text,
}: {
  location: string;
  text: Dictionary;
}) {
  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <h2 id="about-title">{text.nav.about}</h2>
      <div className="about-grid">
        <p>{text.about.introduction}</p>
        <dl className="about-facts">
          <div>
            <dt>{text.about.basedIn}</dt>
            <dd>{location}</dd>
          </div>
          <div>
            <dt>{text.about.languages}</dt>
            <dd>{text.about.spoken}</dd>
          </div>
          <div>
            <dt>{text.about.focus}</dt>
            <dd>{text.about.focusAreas}</dd>
          </div>
          <div>
            <dt>{text.about.education}</dt>
            <dd>{text.about.school}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
