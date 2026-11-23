"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";

type ContactProps = {
  text: Dictionary["nav"];
  email: string;
  linkedin: string;
};

export function ContactLinks({
  text,
  email,
  linkedin,
  onChoose,
  menu = false,
}: ContactProps & {
  onChoose: () => void;
  menu?: boolean;
}) {
  return (
    <>
      <a
        role={menu ? "menuitem" : undefined}
        href={`mailto:${email}`}
        onClick={onChoose}
      >
        {text.email}
      </a>
      <a
        role={menu ? "menuitem" : undefined}
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onChoose}
      >
        {text.linkedin}
      </a>
    </>
  );
}

export function ContactMenu(props: ContactProps) {
  const [open, setOpen] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector("a")?.focus();
    const outside = (event: MouseEvent) => {
      if (event.target instanceof Node && !area.current?.contains(event.target))
        close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("click", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div className="nav-contact" ref={area}>
      <button
        ref={trigger}
        type="button"
        className="button primary"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="contact-menu"
        onClick={() => setOpen(!open)}
      >
        {props.text.conversation}
      </button>
      <div
        ref={menu}
        id="contact-menu"
        className="contact-popover"
        role="menu"
        aria-label={props.text.conversation}
        hidden={!open}
      >
        <ContactLinks {...props} menu onChoose={close} />
      </div>
    </div>
  );
}
