import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminSearchForm } from "@/components/navigation/AdminSearchForm";

describe("AdminSearchForm", () => {
  it("submits to the combined search page with the search term as q", () => {
    render(<AdminSearchForm />);

    const input = screen.getByRole("searchbox", { name: "ابحثي عن فعالية أو طلب أو تسجيل" });
    expect(input).toHaveAttribute("name", "q");
    expect(input.closest("form")).toHaveAttribute("action", "/admin/search");
  });

  it("uses a unique id when rendered more than once on the page", () => {
    render(
      <>
        <AdminSearchForm id="search-a" />
        <AdminSearchForm id="search-b" />
      </>,
    );

    expect(screen.getAllByRole("searchbox")).toHaveLength(2);
  });
});
