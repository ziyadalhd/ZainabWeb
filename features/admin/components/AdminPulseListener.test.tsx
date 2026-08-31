import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPulseListener } from "@/features/admin/components/AdminPulseListener";
import { ToastProvider } from "@/components/ui/ToastProvider";
import type { AdminPulse } from "@/lib/domain/types";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const chime = vi.hoisted(() => vi.fn());
vi.mock("@/features/admin/registration-pulse-sound", () => ({ playRegistrationChime: chime }));

function pulse(overrides: Partial<AdminPulse> = {}): AdminPulse {
  return {
    activeCount: 12,
    latestRegistrationId: "r1",
    attendeeName: "زياد",
    eventId: "e1",
    eventTitle: "مساء بين",
    timestamp: "2026-08-31T10:00:00.000Z",
    ...overrides,
  };
}

function respond(body: AdminPulse) {
  return { ok: true, json: async () => body } as Response;
}

/** Advances past one poll interval and lets the fetch promise chain settle. */
async function tick() {
  await act(async () => {
    vi.advanceTimersByTime(15_000);
  });
}

function mountListener() {
  return render(
    <ToastProvider>
      <AdminPulseListener />
    </ToastProvider>,
  );
}

describe("AdminPulseListener", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refresh.mockClear();
    chime.mockClear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    // The hidden-tab test spies on document.hidden; without this it leaks into later tests.
    vi.restoreAllMocks();
  });

  it("treats the first poll as a baseline and announces nothing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respond(pulse())));
    mountListener();

    await tick();

    expect(chime).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("names the attendee and their event, links to the inspector, chimes, and refreshes", async () => {
    const responses = [pulse(), pulse({ latestRegistrationId: "r2", attendeeName: "زياد", activeCount: 13 })];
    vi.stubGlobal("fetch", vi.fn(async () => respond(responses.shift() ?? pulse({ latestRegistrationId: "r2", activeCount: 13 }))));
    mountListener();

    await tick();
    await tick();

    expect(screen.getByRole("status")).toHaveTextContent("تسجيل جديد: زياد في فعالية مساء بين");
    expect(screen.getByRole("link", { name: "فتح الفعالية" })).toHaveAttribute("href", "/admin/events?event=e1");
    expect(chime).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("announces a replacement registration even when the count has not moved", async () => {
    // A registration landing in the same tick as a cancellation leaves activeCount flat; the newest
    // id is what actually changed, and that is still an arrival worth announcing.
    const responses = [pulse(), pulse({ latestRegistrationId: "r2", attendeeName: "ريم" })];
    vi.stubGlobal("fetch", vi.fn(async () => respond(responses.shift() ?? pulse({ latestRegistrationId: "r2", attendeeName: "ريم" }))));
    mountListener();

    await tick();
    await tick();

    expect(screen.getByRole("status")).toHaveTextContent("تسجيل جديد: ريم");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("stays silent while nothing changes", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respond(pulse())));
    mountListener();

    await tick();
    await tick();
    await tick();

    expect(chime).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("drops the chime once muted, but keeps the toast and the refresh", async () => {
    window.localStorage.setItem("bayn:admin-pulse-muted", "1");
    const responses = [pulse(), pulse({ latestRegistrationId: "r2" })];
    vi.stubGlobal("fetch", vi.fn(async () => respond(responses.shift() ?? pulse({ latestRegistrationId: "r2" }))));
    mountListener();

    await tick();
    await tick();

    expect(chime).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "تشغيل التنبيه" })).toBeInTheDocument();
  });

  it("remembers a mute chosen from the toast", async () => {
    const responses = [pulse(), pulse({ latestRegistrationId: "r2" })];
    vi.stubGlobal("fetch", vi.fn(async () => respond(responses.shift() ?? pulse({ latestRegistrationId: "r2" }))));
    mountListener();

    await tick();
    await tick();

    await act(async () => {
      screen.getByRole("button", { name: "كتم التنبيه" }).click();
    });
    expect(window.localStorage.getItem("bayn:admin-pulse-muted")).toBe("1");
  });

  it("does not poll while the tab is hidden", async () => {
    const fetchMock = vi.fn(async () => respond(pulse()));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);

    mountListener();
    await tick();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rides out a failed poll and keeps announcing on the next one", async () => {
    const responses: Array<AdminPulse | null> = [pulse(), null, pulse({ latestRegistrationId: "r2" })];
    const fetchMock = vi.fn(async () => {
      const next = responses.shift();
      if (!next) throw new Error("network");
      return respond(next);
    });
    vi.stubGlobal("fetch", fetchMock);
    mountListener();

    await tick();
    await tick();
    expect(refresh).not.toHaveBeenCalled();

    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(chime).toHaveBeenCalledTimes(1);
  });
});
