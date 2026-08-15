import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClubStoryTabs } from "@/features/home/components/ClubStoryTabs";

const sections = [
  { title: "عن النادي", body: "الفقرة الأولى\n\nالفقرة الثانية" },
  { title: "فكرة اسم بَيْن", body: "حكاية الاسم" },
  { title: "أهداف النادي", body: "الأهداف" },
];

describe("ClubStoryTabs", () => {
  it("shows one story at a time and supports RTL arrow navigation", () => {
    render(<ClubStoryTabs sections={sections} />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("الفقرة الأولى");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("الفقرة الثانية");

    const first = screen.getByRole("tab", { name: "عن النادي" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowLeft" });

    expect(screen.getByRole("tab", { name: "فكرة اسم بَيْن" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("حكاية الاسم");
  });
});
