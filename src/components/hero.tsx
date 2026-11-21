import type { Profile } from "@/lib/schemas";

export function Hero({
  headline,
  bio,
  availability,
}: Pick<Profile, "headline" | "bio" | "availability">) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <h1 id="hero-title">{headline}</h1>
      <p className="hero-bio">{bio}</p>
      {availability.available && (
        <div className="availability">
          <span className="status-dot" aria-hidden="true" />
          {availability.text}
        </div>
      )}
      <div className="actions">
        <a className="button primary" href="#projects">
          See my work
        </a>
        <a className="button" href="#contact">
          Get in touch
        </a>
      </div>
    </section>
  );
}
