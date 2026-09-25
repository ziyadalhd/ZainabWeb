import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeedbackWorkspace } from "./FeedbackWorkspace";
import type { AdminEventFeedbackResponse } from "@/lib/domain/types";

const responses: AdminEventFeedbackResponse[] = [
  { id: "one", eventId: "first", eventTitle: "فعالية تجريبية أولى", attendeeName: null, hospitalityRating: 5, materialRating: 4, suggestions: "اقتراح تجريبي", submittedAt: "2026-09-20T12:00:00Z" },
  { id: "two", eventId: "first", eventTitle: "فعالية تجريبية أولى", attendeeName: "مشاركة تجريبية", hospitalityRating: 3, materialRating: 2, suggestions: null, submittedAt: "2026-09-21T12:00:00Z" },
];

describe("FeedbackWorkspace", () => {
  it("summarizes feedback without inventing anonymous identities", () => {
    render(<FeedbackWorkspace responses={responses} />);
    expect(screen.getByText("مجهول")).toBeInTheDocument();
    expect(screen.getByText("مشاركة تجريبية")).toBeInTheDocument();
    expect(screen.getByLabelText("ملخص التقييمات")).toHaveTextContent("عدد الردود٢");
    expect(screen.getByLabelText("ملخص التقييمات")).toHaveTextContent("متوسط الضيافة٤");
  });

  it("shows an empty state before participants reply", () => {
    render(<FeedbackWorkspace responses={[]} />);
    expect(screen.getByText("لا توجد تقييمات مرسلة بعد")).toBeInTheDocument();
    expect(screen.getByLabelText("ملخص التقييمات")).toHaveTextContent("عدد الردود٠");
  });
});
