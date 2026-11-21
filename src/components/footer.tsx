import type { Profile } from "@/lib/schemas";

export function Footer({ name, location }: Pick<Profile, "name" | "location">) {
  return (
    <footer className="container site-footer">
      <span>{name}</span>
      <span>{location}</span>
    </footer>
  );
}
