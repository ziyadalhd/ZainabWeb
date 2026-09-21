import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BookingActions } from "@/features/bookings/components/BookingActions";

describe("BookingActions", () => {
  it("requires a second explicit confirmation before cancellation", () => {
    render(
      <BookingActions
        attendanceStatus="pending"
        status="registered"
        confirmAction={vi.fn()}
        cancelAction={vi.fn()}
      />,
    );

    expect(screen.getByText(/لا تؤكدي حضورك إلا إذا كنتِ متأكدة من الحضور/)).toBeInTheDocument();
    expect(screen.getByText(/في قائمة الانتظار مشاركات/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تأكيد الحضور" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إلغاء الحجز" }));
    expect(screen.getByText("إلغاء الحجز؟ سيُحرَّر مقعدك لغيرك، ولا يمكن التراجع.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إلغاء الحجز" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "التراجع" })).toBeInTheDocument();
  });

  it("does not offer attendance confirmation for a waitlisted booking", () => {
    render(
      <BookingActions
        attendanceStatus="pending"
        status="waitlisted"
        confirmAction={vi.fn()}
        cancelAction={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "تأكيد الحضور" })).not.toBeInTheDocument();
  });
});
