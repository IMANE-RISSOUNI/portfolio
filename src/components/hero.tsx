import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Profile } from "@/lib/schemas";
import { HeroIllustration } from "./hero-illustration";

export function Hero({
  profile,
  text,
}: {
  profile: Profile;
  text: Dictionary["hero"];
}) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div>
        {profile.availability.available && (
          <div className="availability">
            <span className="status-dot" aria-hidden="true" />
            {text.availability}
          </div>
        )}
        <h1 id="hero-title">{text.headline}</h1>
        <p className="hero-bio">{text.introduction}</p>
        <div className="actions">
          <a className="button primary" href="#projects">
            {text.work}
          </a>
          <a className="button" href={profile.links.cv} download>
            {text.resume}
          </a>
        </div>
      </div>
      <HeroIllustration />
    </section>
  );
}
