import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PosterFrame } from "@/components/ui/PosterFrame";

describe("PosterFrame", () => {
  it("keeps one accessible full poster and a decorative backdrop", () => {
    const { container } = render(<PosterFrame src="/poster.jpg" alt="بوستر الفعالية" sizes="100vw" />);
    expect(screen.getByAltText("بوستر الفعالية")).toHaveClass("poster-frame__image");
    expect(container.querySelector(".poster-frame__backdrop")).toHaveAttribute("aria-hidden", "true");
  });
});
