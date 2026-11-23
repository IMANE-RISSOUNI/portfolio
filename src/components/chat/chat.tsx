"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import "./chat.css";

const ChatPanel = dynamic(() => import("./chat-panel"), { ssr: false });

export function Chat({ name, email }: { name: string; email: string }) {
  const [opened, setOpened] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="button primary chat-launcher"
        aria-haspopup="dialog"
        aria-expanded={opened}
        onClick={() => {
          setLoaded(true);
          setOpened(true);
        }}
      >
        Ask my AI assistant
      </button>
      {loaded && (
        <ChatPanel
          open={opened}
          name={name}
          email={email}
          onClose={() => {
            setOpened(false);
            trigger.current?.focus();
          }}
        />
      )}
    </>
  );
}
