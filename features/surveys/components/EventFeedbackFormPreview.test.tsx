import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventFeedbackFormPreview } from "@/features/surveys/components/EventFeedbackFormPreview";

describe("EventFeedbackFormPreview", () => {
  it("contains only the approved feedback controls and cannot submit", () => {
    render(<EventFeedbackFormPreview />);

    expect(screen.getByRole("group", { name: "تقييم الضيافة" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "تقييم المادة" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(10);
    expect(screen.getByRole("textbox", { name: "المقترحات" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "الإرسال غير متاح حاليًا" })).toBeDisabled();
  });
});
