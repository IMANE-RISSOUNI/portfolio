"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { Logo } from "../logo";
import { ContactLinks, ContactMenu } from "./contact-menu";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";

const sections = [
  "about",
  "projects",
  "experience",
  "skills",
  "contact",
] as const;
const desktopQuery = "(min-width: 1024px)";

export function Navbar({
  name,
  email,
  linkedin,
  locale,
  text,
}: {
  name: string;
  email: string;
  linkedin: string;
  locale: Locale;
  text: Pick<Dictionary, "nav" | "language" | "theme">;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>();
  const header = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const mobileContact = useRef<HTMLDetailsElement>(null);

  function closeMobile() {
    if (mobileContact.current) mobileContact.current.open = true;
    setOpen(false);
    trigger.current?.focus();
  }

  useEffect(() => {
    const desktop = window.matchMedia(desktopQuery);
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", onResize);
    return () => desktop.removeEventListener("change", onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !header.current?.contains(event.target)
      )
        closeMobile();
    };
    document.addEventListener("click", outside);
    return () => document.removeEventListener("click", outside);
  }, [open]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        setActive(sections.findLast((id) => visible.has(id)));
      },
      { rootMargin: "-80px 0px -45% 0px" },
    );
    for (const id of sections) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  const contact = { text: text.nav, email, linkedin };

  return (
    <header
      className="site-header"
      ref={header}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) closeMobile();
      }}
    >
      <div className="container navbar">
        <a
          className="brand"
          href="#top"
          onClick={() => {
            if (open) closeMobile();
          }}
        >
          <Logo />
          <span>{name}</span>
          <span className="sr-only">{text.nav.home}</span>
        </a>
        <button
          className="nav-icon mobile-toggle"
          type="button"
          ref={trigger}
          aria-label={open ? text.nav.close : text.nav.open}
          aria-expanded={open}
          aria-controls="navbar-panel"
          onClick={() => {
            if (open) closeMobile();
            else setOpen(true);
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path
              d={open ? "M6 6l12 12M18 6 6 18" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
        <div className="navbar-panel" id="navbar-panel" data-open={open}>
          <nav aria-label={text.nav.label}>
            <ul className="nav-links">
              {sections.map((id) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={active === id ? "true" : undefined}
                    onClick={() => {
                      if (open) closeMobile();
                    }}
                  >
                    {text.nav[id]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="nav-controls">
            <LanguageToggle locale={locale} text={text.language} />
            <ThemeToggle text={text.theme} />
            <ContactMenu {...contact} />
            <details className="mobile-contact" ref={mobileContact} open>
              <summary className="button primary">
                {text.nav.conversation}
              </summary>
              <div className="mobile-contact-links">
                <ContactLinks {...contact} onChoose={closeMobile} />
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}
