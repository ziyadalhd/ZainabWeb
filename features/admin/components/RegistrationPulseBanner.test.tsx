import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegistrationPulseBanner } from "@/features/admin/components/RegistrationPulseBanner";

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
    chime.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    // The hidden-tab test spies on document.hidden; without this it leaks into later tests.
    vi.restoreAllMocks();
  });

  it("tracks this event's seat count and tallies arrivals since the roster was opened", async () => {
    let count = 4;
    vi.stubGlobal("fetch", vi.fn(async () => pulseResponse(++count, "نورة")));
    render(<RegistrationPulseBanner eventId={eventId} initialCount={4} capacity={20} />);

    expect(screen.getByText("٤ / ٢٠ مقعدًا")).toBeInTheDocument();

    await tick();
    expect(screen.getByText("٥ / ٢٠ مقعدًا")).toBeInTheDocument();
    expect(screen.getByText("١ تسجيل جديد — آخرها نورة")).toBeInTheDocument();

    await tick();
    expect(screen.getByText("٦ / ٢٠ مقعدًا")).toBeInTheDocument();
    expect(screen.getByText("٢ تسجيل جديد — آخرها نورة")).toBeInTheDocument();
  });

  it("stays a silent counter — announcing belongs to the dashboard-wide listener, so an arrival chimes once", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => pulseResponse(9, "نورة")));
    render(<RegistrationPulseBanner eventId={eventId} initialCount={4} capacity={20} />);

    await tick();

    expect(screen.getByText("٩ / ٢٠ مقعدًا")).toBeInTheDocument();
    expect(chime).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the idle label when the count has not moved", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => pulseResponse(4, "نورة")));
    render(<RegistrationPulseBanner eventId={eventId} initialCount={4} capacity={20} />);

    await tick();
    expect(screen.getByText("التحديث تلقائي")).toBeInTheDocument();
  });

  it("does not poll while the tab is hidden", async () => {
    const fetchMock = vi.fn(async () => pulseResponse(9, "نورة"));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);

    render(<RegistrationPulseBanner eventId={eventId} initialCount={4} capacity={20} />);
    await tick();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
