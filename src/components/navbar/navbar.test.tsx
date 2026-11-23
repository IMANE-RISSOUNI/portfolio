// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { en } from "../../i18n/dictionaries/en";
import { ContactMenu } from "./contact-menu";
import { Navbar } from "./navbar";

const profile = {
  name: "Imane Rissouni",
  email: "person@portfolio.test",
  linkedin: "https://linkedin.test/person",
};

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("opens the contact menu, binds both links and restores focus on Escape or outside click", () => {
  render(<ContactMenu {...profile} text={en.nav} />);
  const trigger = screen.getByRole("button", { name: en.nav.conversation });
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  const email = screen.getByRole("menuitem", { name: en.nav.email });
  const linkedin = screen.getByRole("menuitem", { name: en.nav.linkedin });
  expect(email.getAttribute("href")).toBe(`mailto:${profile.email}`);
  expect(linkedin.getAttribute("href")).toBe(profile.linkedin);
  expect(linkedin.getAttribute("target")).toBe("_blank");
  expect(linkedin.getAttribute("rel")).toBe("noopener noreferrer");
  expect(document.activeElement).toBe(email);
  fireEvent.keyDown(email, { key: "Escape" });
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(trigger);

  fireEvent.click(trigger);
  fireEvent.click(document.body);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(trigger);
});

it("toggles the mobile dropdown and closes after a section link", () => {
  render(<Navbar {...profile} text={en} locale="en" />);
  const toggle = screen.getByRole("button", { name: en.nav.open });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  fireEvent.click(screen.getByRole("link", { name: en.nav.about }));
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
});
