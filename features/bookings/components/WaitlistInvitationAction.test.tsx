import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WaitlistInvitationAction } from "@/features/bookings/components/WaitlistInvitationAction";

describe("WaitlistInvitationAction", () => {
  it("requires an explicit action to accept the reserved seat", () => {
    render(<WaitlistInvitationAction action={vi.fn()} />);
    expect(screen.getByRole("button", { name: "قبول الدعوة وتأكيد المقعد" })).toBeInTheDocument();
  });
});
