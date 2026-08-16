import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServiceRequestPaymentStatusForm } from "@/features/requests/components/ServiceRequestPaymentStatusForm";

async function action() {
  return {};
}

describe("ServiceRequestPaymentStatusForm", () => {
  it("keeps payment controls unique when several requests appear together", () => {
    render(
      <>
        <ServiceRequestPaymentStatusForm action={action} currentStatus="unpaid" />
        <ServiceRequestPaymentStatusForm action={action} currentStatus="deposit_paid" />
      </>,
    );

    const controls = screen.getAllByRole("combobox", { name: "حالة الدفع (تسجيل يدوي)" });
    expect(controls).toHaveLength(2);
    expect(controls[0].id).not.toBe(controls[1].id);
    expect(screen.getAllByRole("option", { name: "دُفع العربون" })).toHaveLength(2);
  });
});
