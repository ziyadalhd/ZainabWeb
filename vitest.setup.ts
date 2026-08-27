import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("next/font/local", () => ({
  default: () => ({
    className: "mock-thmanyah-sans",
    variable: "mock-thmanyah-sans-variable",
    style: { fontFamily: "Thmanyah Sans" },
  }),
}));

// jsdom does not implement <dialog> showModal()/close(); polyfill the minimum behavior
// (toggling the open attribute, dispatching "close" the way real dialogs do) so components
// using the native dialog element are testable.
if (typeof HTMLDialogElement !== "undefined") {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      if (!this.open) return;
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
}

afterEach(() => cleanup());
