import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventPanel } from "@/features/admin/components/EventPanel";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("EventPanel", () => {
  it("opens itself as a modal dialog on mount", () => {
    render(
      <EventPanel closeHref="/admin/events" label="مساحة فعالية">
        <p>محتوى الفعالية</p>
      </EventPanel>,
    );

    const dialog = screen.getByRole("dialog", { name: "مساحة فعالية" });
    expect(dialog).toHaveAttribute("open");
  });

  it("navigates to closeHref when the close button is activated", () => {
    push.mockClear();
    render(
      <EventPanel closeHref="/admin/events?view=calendar" label="مساحة فعالية">
        <p>محتوى الفعالية</p>
      </EventPanel>,
    );

    fireEvent.click(screen.getByRole("button", { name: "إغلاق مساحة الفعالية" }));

    expect(push).toHaveBeenCalledWith("/admin/events?view=calendar", { scroll: false });
  });

  it("restores focus to the trigger element by id when it closes", () => {
    push.mockClear();
    document.body.innerHTML = '<button id="event-trigger-abc">إدارة الفعالية</button>';
    const trigger = document.getElementById("event-trigger-abc")!;
    const focusSpy = vi.spyOn(trigger, "focus");

    render(
      <EventPanel closeHref="/admin/events" triggerId="event-trigger-abc" label="مساحة فعالية">
        <p>محتوى الفعالية</p>
      </EventPanel>,
    );

    fireEvent.click(screen.getByRole("button", { name: "إغلاق مساحة الفعالية" }));

    expect(focusSpy).toHaveBeenCalled();
  });
});
