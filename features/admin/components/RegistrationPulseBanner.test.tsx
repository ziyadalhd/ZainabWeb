import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegistrationPulseBanner } from "@/features/admin/components/RegistrationPulseBanner";
import { ToastProvider } from "@/components/ui/ToastProvider";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const chime = vi.hoisted(() => vi.fn());
vi.mock("@/features/admin/registration-pulse-sound", () => ({ playRegistrationChime: chime }));

const eventId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function pulseResponse(activeCount: number, latestName: string | null) {
  return { ok: true, json: async () => ({ activeCount, latestId: "r1", latestName }) } as Response;
}

/** Advances past one poll interval and lets the fetch promise chain settle. */
async function tick() {
  await act(async () => {
    vi.advanceTimersByTime(15_000);
  });
}

describe("RegistrationPulseBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refresh.mockClear();
    chime.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("announces a new registration with a badge, a toast, a chime and a refresh", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => pulseResponse(5, "نورة")));
    render(
      <ToastProvider>
        <RegistrationPulseBanner eventId={eventId} initialCount={4} capacity={20} />
      </ToastProvider>,
    );

    expect(screen.getByText("٤ / ٢٠ مقعدًا")).toBeInTheDocument();
    await tick();

    expect(screen.getByText("٥ / ٢٠ مقعدًا")).toBeInTheDocument();
    expect(screen.getByText("١ تسجيل جديد — آخرها نورة")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("تسجيل جديد: نورة");
    expect(chime).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("stays quiet when the count has not moved", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => pulseResponse(4, "نورة")));
    render(
      <ToastProvider>
        <RegistrationPulseBanner eventId={eventId} initialCount={4} capacity={20} />
      </ToastProvider>,
    );

    await tick();
    expect(screen.getByText("التحديث تلقائي")).toBeInTheDocument();
    expect(chime).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("keeps announcing but drops the chime once the admin mutes it", async () => {
    let count = 4;
    vi.stubGlobal("fetch", vi.fn(async () => pulseResponse(++count, "نورة")));
    render(
      <ToastProvider>
        <RegistrationPulseBanner eventId={eventId} initialCount={4} capacity={20} />
      </ToastProvider>,
    );

    await act(async () => {
      screen.getByRole("button", { name: "كتم التنبيه الصوتي" }).click();
    });
    await tick();

    expect(screen.getByRole("button", { name: "تشغيل التنبيه الصوتي" })).toHaveAttribute("aria-pressed", "true");
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(chime).not.toHaveBeenCalled();
  });

  it("does not poll while the tab is hidden", async () => {
    const fetchMock = vi.fn(async () => pulseResponse(9, "نورة"));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);

    render(
      <ToastProvider>
        <RegistrationPulseBanner eventId={eventId} initialCount={4} capacity={20} />
      </ToastProvider>,
    );

    await tick();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
