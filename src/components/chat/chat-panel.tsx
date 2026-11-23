"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };
type Failure = "limited" | "unavailable";

export default function ChatPanel({
  open,
  name,
  email,
  onClose,
}: {
  open: boolean;
  name: string;
  email: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const active = useRef<AbortController | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  useEffect(() => () => active.current?.abort(), []);

  useEffect(() => {
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  function close() {
    active.current?.abort();
    dialogRef.current?.close();
    onClose();
  }

  async function send(value: string) {
    const content = value.trim();
    if (!content || content.length > 500 || active.current) return;

    const controller = new AbortController();
    active.current = controller;
    const history: Message[] = [...messages, { role: "user", content }];
    setMessages(history);
    setInput("");
    setFailure(null);
    setStreaming(true);
    let answer = "";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-10).map((message) => ({
            ...message,
            content: message.content.trim().slice(0, 500),
          })),
        }),
        signal: controller.signal,
      });
      if (response.status === 429) {
        setFailure("limited");
        return;
      }
      if (!response.ok || !response.body) throw new Error("Chat unavailable");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          answer += done
            ? decoder.decode()
            : decoder.decode(value, { stream: true });
          setMessages([...history, { role: "assistant", content: answer }]);
          if (done) break;
        }
      } finally {
        reader.releaseLock();
      }
      if (!answer.trim()) throw new Error("Empty chat reply");
    } catch {
      if (!controller.signal.aborted) {
        setMessages(history);
        setFailure("unavailable");
      }
    } finally {
      if (answer && !answer.trim()) setMessages(history);
      active.current = null;
      setStreaming(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <dialog
      ref={dialogRef}
      className="chat-panel"
      aria-label="AI assistant"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <header className="chat-header">
        <div>
          <h2>AI assistant</h2>
          <p>
            Answers come from this portfolio&apos;s content. AI can make
            mistakes.
          </p>
          <a href="#chat-provider-note">Third-party AI processing</a>
          <p id="chat-provider-note" tabIndex={-1}>
            Your messages are processed by a third-party AI provider.
          </p>
        </div>
        <button className="button" type="button" onClick={close}>
          Close
        </button>
      </header>
      <div
        className="chat-messages"
        ref={messagesRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        tabIndex={0}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message chat-message-${message.role}`}
          >
            <span className="sr-only">
              {message.role === "user" ? "You: " : "Assistant: "}
            </span>
            {message.content}
          </div>
        ))}
        {failure === "limited" && (
          <p>You&apos;re sending messages too fast, try again in a minute.</p>
        )}
        {failure === "unavailable" && (
          <p>
            The assistant is unavailable right now. You can still reach me by{" "}
            <a href={`mailto:${email}`}>email</a>.
          </p>
        )}
      </div>
      {messages.length === 0 && (
        <div className="chat-suggestions" aria-label="Suggested questions">
          {[
            `What are ${name.split(" ")[0]}'s main skills?`,
            "Which projects use FastAPI?",
            "How can I contact the portfolio owner?",
          ].map((question) => (
            <button
              type="button"
              className="button"
              key={question}
              onClick={() => {
                inputRef.current?.focus();
                void send(question);
              }}
            >
              {question}
            </button>
          ))}
        </div>
      )}
      <form className="chat-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="chat-message">
          Your message
        </label>
        <input
          ref={inputRef}
          id="chat-message"
          placeholder="Ask a question"
          maxLength={500}
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button
          className="button primary"
          type="submit"
          disabled={streaming || !input.trim()}
        >
          Send
        </button>
        {streaming && (
          <button
            className="button"
            type="button"
            onClick={() => {
              inputRef.current?.focus();
              active.current?.abort();
            }}
          >
            Stop
          </button>
        )}
      </form>
    </dialog>
  );
}
