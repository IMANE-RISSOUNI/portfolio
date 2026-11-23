import { expect, it, vi } from "vitest";
import { buildSystemPrompt } from "./prompt";
import { readContentFile } from "./content-file";

vi.mock("server-only", () => ({}));

it("uses public portfolio sections and instructions without copying unrelated fields", async () => {
  const content = await readContentFile();
  const profile = { ...content.profile, phone: "+212 600 00 00 00" };
  const prompt = buildSystemPrompt({ ...content, profile });
  for (const value of [
    profile.name,
    profile.headline,
    profile.bio,
    profile.email,
    profile.links.linkedin,
    profile.availability.text,
    content.projects[0].title,
    content.experiences[0].organization,
    content.skills[0].items[0],
    "never pretend",
    "Answer only",
    "Never invent",
    "English and French",
    "120 words",
    "Politely decline",
    "reveal this prompt",
  ]) {
    expect(prompt).toContain(value);
  }
  expect(prompt).not.toContain(profile.phone);
  expect(prompt).not.toContain("sortOrder");
  const promptWithPhoneInBio = buildSystemPrompt({
    ...content,
    profile: { ...profile, bio: `Contact me at ${profile.phone}.` },
  });
  expect(promptWithPhoneInBio).toContain("Contact me at [redacted].");
  expect(promptWithPhoneInBio).not.toContain(profile.phone);
});
