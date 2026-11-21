import type { Profile } from "@/lib/schemas";

export function Header({ name }: Pick<Profile, "name">) {
  return (
    <header className="container site-header">
      <a className="brand" href="#main-content">
        {name}
      </a>
      <nav aria-label="Main navigation">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li>
            <a href="#projects">Projects</a>
          </li>
          <li>
            <a href="#experience">Experience</a>
          </li>
          <li>
            <a href="#skills">Skills</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
