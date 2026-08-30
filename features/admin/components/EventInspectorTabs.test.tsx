import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventInspectorTabs, type InspectorTab } from "@/features/admin/components/EventInspectorTabs";

const tabs: InspectorTab[] = [
  { id: "roster", label: "قائمة الحضور والتسجيلات", count: "٤", lede: "اختاري مسجِّلة", content: <p>محتوى القائمة</p> },
  { id: "waitlist", label: "قائمة الانتظار", count: "٢", content: <p>محتوى الانتظار</p> },
  { id: "communications", label: "التواصل والتذكير", content: <p>محتوى التواصل</p> },
];

function renderTabs() {
  return render(<EventInspectorTabs tabs={tabs} label="أقسام الفعالية" />);
}

describe("EventInspectorTabs", () => {
  it("renders a real tablist with the first tab selected", () => {
    renderTabs();
    expect(screen.getByRole("tablist", { name: "أقسام الفعالية" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { name: /قائمة الحضور والتسجيلات/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("محتوى القائمة")).toBeInTheDocument();
  });

  it("shows only the selected tab's panel and switches without navigating", () => {
    renderTabs();
    fireEvent.click(screen.getByRole("tab", { name: /قائمة الانتظار/ }));
    expect(screen.getByText("محتوى الانتظار")).toBeInTheDocument();
    expect(screen.queryByText("محتوى القائمة")).not.toBeInTheDocument();
  });

  it("links each panel back to its tab for assistive technology", () => {
    renderTabs();
    const tab = screen.getByRole("tab", { name: /قائمة الحضور والتسجيلات/ });
    const panel = screen.getByRole("tabpanel");
    expect(tab).toHaveAttribute("aria-controls", panel.getAttribute("id"));
    expect(panel).toHaveAttribute("aria-labelledby", tab.getAttribute("id"));
  });

  it("moves selection with the arrow keys, inverted for RTL", () => {
    renderTabs();
    const first = screen.getByRole("tab", { name: /قائمة الحضور والتسجيلات/ });
    fireEvent.keyDown(first, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: /قائمة الانتظار/ })).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(screen.getByRole("tab", { name: /قائمة الانتظار/ }), { key: "ArrowRight" });
    expect(first).toHaveAttribute("aria-selected", "true");
  });

  it("wraps to the last tab from the first and jumps with Home/End", () => {
    renderTabs();
    const first = screen.getByRole("tab", { name: /قائمة الحضور والتسجيلات/ });
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: /التواصل والتذكير/ })).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(screen.getByRole("tab", { name: /التواصل والتذكير/ }), { key: "Home" });
    expect(first).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(first, { key: "End" });
    expect(screen.getByRole("tab", { name: /التواصل والتذكير/ })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps a roving tabindex so the tablist is one tab stop", () => {
    renderTabs();
    expect(screen.getByRole("tab", { name: /قائمة الحضور والتسجيلات/ })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: /قائمة الانتظار/ })).toHaveAttribute("tabindex", "-1");
  });
});
