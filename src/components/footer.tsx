import type { Profile } from "@/lib/schemas";

export function Footer({
  name,
  location,
  label,
}: Pick<Profile, "name" | "location"> & { label: string }) {
  return (
    <footer className="container site-footer" aria-label={label}>
      <span>{name}</span>
      <span>{location}</span>
    </footer>
  );
}
