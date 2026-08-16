import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OptionalDateTimePicker } from "@/features/scheduling/components/OptionalDateTimePicker";

describe("OptionalDateTimePicker", () => {
  it("uses the default duration until the administrator chooses a custom expiry", () => {
    const { container } = render(<OptionalDateTimePicker name="expiresAt" />);
    const customExpiry = screen.getByRole("checkbox", { name: /تحديد موعد انتهاء مختلف/ });

    expect(customExpiry).not.toBeChecked();
    expect(container.querySelector<HTMLInputElement>('input[name="expiresAt"]')?.value).toBe("");
    expect(screen.queryByRole("button", { name: /يوم انتهاء العرض/ })).not.toBeInTheDocument();

    fireEvent.click(customExpiry);
    expect(screen.getByRole("button", { name: /يوم انتهاء العرض/ })).toBeInTheDocument();
    expect(screen.getByText("اختاري اليوم لعرض موعد انتهاء العرض هنا.")).toBeInTheDocument();
    expect(container.querySelector<HTMLInputElement>('input[name="expiresAt"]')?.value).toBe("invalid");
  });

  it("keeps generated control ids unique across multiple request cards", () => {
    render(
      <>
        <OptionalDateTimePicker name="expiresAt" defaultValue="2026-08-20T18:00" />
        <OptionalDateTimePicker name="expiresAt" defaultValue="2026-08-21T20:30" />
      </>,
    );

    const changeExpiry = screen.getAllByRole("checkbox", { name: /تغيير موعد انتهاء العرض/ });
    expect(changeExpiry).toHaveLength(2);
    fireEvent.click(changeExpiry[0]);
    fireEvent.click(changeExpiry[1]);
    const dateButtons = screen.getAllByRole("button", { name: /يوم انتهاء العرض/ });
    expect(dateButtons).toHaveLength(2);
    expect(dateButtons[0].id).not.toBe(dateButtons[1].id);
    expect(screen.getByText("ينتهي العرض الخميس، ٢٠ أغسطس ٢٠٢٦ · ٦ مساءً")).toBeInTheDocument();
    expect(screen.getByText("ينتهي العرض الجمعة، ٢١ أغسطس ٢٠٢٦ · ٨:٣٠ مساءً")).toBeInTheDocument();
  });

  it("preserves an existing expiry until it is explicitly changed and then uses quarter hours", () => {
    const { container } = render(<OptionalDateTimePicker name="expiresAt" defaultValue="2026-08-22T11:32" />);
    const hidden = container.querySelector<HTMLInputElement>('input[name="expiresAt"]');

    expect(screen.getByText(/الموعد الحالي:/)).toHaveTextContent("١١:٣٢ صباحًا");
    expect(hidden?.value).toBe("2026-08-22T11:32");

    fireEvent.click(screen.getByRole("checkbox", { name: /تغيير موعد انتهاء العرض/ }));
    expect(hidden?.value).toBe("2026-08-22T11:30");
    expect(screen.getByText(/قُرّب الوقت السابق إلى أقرب ربع ساعة/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /٣٠ ونصف/ })).toHaveAttribute("aria-pressed", "true");
  });
});
