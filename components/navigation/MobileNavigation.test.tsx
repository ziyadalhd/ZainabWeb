import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";

const items = [
  { href: "/", label: "الرئيسية" },
  { href: "/events", label: "الفعاليات" },
] as const;

describe("MobileNavigation", () => {
  it("opens, focuses the first link, and closes with Escape", () => {
    render(<MobileNavigation items={items} />);
    const trigger = screen.getByRole("button", { name: /القائمة/ });

    fireEvent.click(trigger);
    expect(screen.getByRole("navigation", { name: "التنقل للجوال" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "الرئيسية" })).toHaveFocus();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("navigation", { name: "التنقل للجوال" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps keyboard focus inside the open panel", () => {
    render(<MobileNavigation items={items} />);
    fireEvent.click(screen.getByRole("button", { name: /القائمة/ }));

    const lastLink = screen.getByRole("link", { name: "الفعاليات" });
    const closeButton = screen.getAllByRole("button", { name: "إغلاق القائمة" })[1];

    closeButton.focus();
    fireEvent.keyDown(closeButton, { key: "Tab", shiftKey: true });
    expect(lastLink).toHaveFocus();

    lastLink.focus();
    fireEvent.keyDown(lastLink, { key: "Tab" });
    expect(closeButton).toHaveFocus();
  });
});
