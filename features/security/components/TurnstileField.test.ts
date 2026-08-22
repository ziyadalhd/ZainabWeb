import { render, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { getTurnstileRenderOptions, TurnstileField } from "@/features/security/components/TurnstileField";

describe("TurnstileField", () => {
  it("uses the flexible Arabic widget configuration", () => {
    expect(getTurnstileRenderOptions("site-key")).toEqual({
      sitekey: "site-key",
      language: "ar",
      theme: "light",
      size: "flexible",
      appearance: "interaction-only",
      retry: "auto",
      "refresh-expired": "auto",
      "refresh-timeout": "auto",
    });
  });

  it("reports a configuration failure instead of leaving the form in a loading state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("configuration unavailable")));
    const onConfigurationFailedChange = vi.fn();

    render(createElement(TurnstileField, { onConfigurationFailedChange }));

    await waitFor(() => expect(onConfigurationFailedChange).toHaveBeenCalledWith(true));
    expect(document.querySelector('[role="alert"]')).toHaveTextContent("تعذر تحميل التحقق");
    vi.unstubAllGlobals();
  });
});
