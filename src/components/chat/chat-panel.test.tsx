// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ChatPanel from "./chat-panel";

// jsdom does not implement the native dialog methods.
Object.defineProperties(HTMLDialogElement.prototype, {
  showModal: {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true;
    },
  },
  close: {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = false;
    },
  },
});

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 503 })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("shows three suggestions until a question is sent and offers email on a 503", async () => {
  render(
    <ChatPanel
      open
      name="Imane Rissouni"
      email="engineer@portfolio.test"
      onClose={() => {}}
    />,
  );
  expect(document.activeElement).toBe(screen.getByRole("textbox"));
  const suggestion = screen.getByRole("button", {
    name: "What are Imane's main skills?",
  });
  expect(
    screen.getByRole("button", { name: "Which projects use FastAPI?" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", {
      name: "How can I contact the portfolio owner?",
    }),
  ).toBeTruthy();

  fireEvent.click(suggestion);

  expect(
    screen.queryByRole("button", { name: "What are Imane's main skills?" }),
  ).toBeNull();
  expect(
    await screen.findByText(/The assistant is unavailable right now/),
  ).toBeTruthy();
  expect(screen.getByRole("link", { name: "email" }).getAttribute("href")).toBe(
    "mailto:engineer@portfolio.test",
  );
});
