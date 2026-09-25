import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeInterestedSection } from "@/features/home/components/HomeInterestedSection";

describe("HomeInterestedSection", () => {
  it("opens a dedicated registration page from the home page", () => {
    render(<HomeInterestedSection />);

    expect(screen.getByRole("link", { name: "سجّلي اهتمامكِ" })).toHaveAttribute("href", "/surveys/interested-contact");
  });
});
