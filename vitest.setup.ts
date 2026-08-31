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

// jsdom does not implement PointerEvent, so testing-library falls back to a bare Event for
// pointerdown/pointermove — dropping pointerId and the client coordinates that drag handlers read.
// Deriving it from MouseEvent restores both.
if (typeof window !== "undefined" && typeof window.PointerEvent === "undefined") {
  class JsdomPointerEvent extends MouseEvent implements PointerEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;
    readonly width = 1;
    readonly height = 1;
    readonly pressure = 0;
    readonly tangentialPressure = 0;
    readonly tiltX = 0;
    readonly tiltY = 0;
    readonly twist = 0;
    readonly altitudeAngle = 0;
    readonly azimuthAngle = 0;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "mouse";
      this.isPrimary = init.isPrimary ?? true;
    }

    getCoalescedEvents(): PointerEvent[] {
      return [];
    }

    getPredictedEvents(): PointerEvent[] {
      return [];
    }
  }

  window.PointerEvent = JsdomPointerEvent as unknown as typeof PointerEvent;
  globalThis.PointerEvent = window.PointerEvent;
}

afterEach(() => cleanup());
