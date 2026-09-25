import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeClubStory } from "@/features/home/components/HomeClubStory";

const sections = [
  { title: "عن النادي", body: "الفقرة الأولى\n\nالفقرة الثانية" },
  { title: "فكرة اسم بَيْن", body: "حكاية الاسم" },
];

describe("HomeClubStory", () => {
  it("keeps the long story collapsed until a visitor opens it", () => {
    render(<HomeClubStory sections={sections} />);

    const story = screen.getByText("عن النادي").closest("details");
    expect(story).not.toHaveAttribute("open");

    fireEvent.click(screen.getByText("عن النادي"));
    expect(story).toHaveAttribute("open");
    expect(screen.getByText("الفقرة الأولى")).toBeInTheDocument();
    expect(screen.getByText("الفقرة الثانية")).toBeInTheDocument();
  });
});
