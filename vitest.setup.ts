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

afterEach(() => cleanup());
