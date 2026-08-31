import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  notifyAttendanceConfirmed,
  notifyNewRegistration,
  notifyRegistrationCancelled,
} from "@/lib/notifications/admin-alerts";

describe("admin Telegram alert templates", () => {
  beforeEach(() => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
    vi.stubEnv("TELEGRAM_CHAT_ID", "12345");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function textOf(fetchMock: ReturnType<typeof stubFetch>): string {
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body as string) ?? "{}") as { text?: string };
    return body.text ?? "";
  }

  function stubFetch() {
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
      () => Promise.resolve(new Response(null, { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("labels a confirmed new registration", async () => {
    const fetchMock = stubFetch();

    await notifyNewRegistration({ attendeeName: "سارة", eventTitle: "أمسية الشعر", status: "registered" });

    const text = textOf(fetchMock);
    expect(text).toContain("تسجيل جديد");
    expect(text).toContain("سارة");
    expect(text).toContain("أمسية الشعر");
    expect(text).toContain("مؤكد");
  });

  it("labels a waitlisted new registration", async () => {
    const fetchMock = stubFetch();

    await notifyNewRegistration({ attendeeName: "سارة", eventTitle: "أمسية الشعر", status: "waitlisted" });

    expect(textOf(fetchMock)).toContain("قائمة انتظار");
  });

  it("announces a confirmed attendance", async () => {
    const fetchMock = stubFetch();

    await notifyAttendanceConfirmed({ attendeeName: "نورة", eventTitle: "ورشة الخط" });

    const text = textOf(fetchMock);
    expect(text).toContain("تأكيد حضور");
    expect(text).toContain("نورة");
    expect(text).toContain("ورشة الخط");
  });

  it("announces a cancellation", async () => {
    const fetchMock = stubFetch();

    await notifyRegistrationCancelled({ attendeeName: "ريم", eventTitle: "نادي القراءة" });

    const text = textOf(fetchMock);
    expect(text).toContain("إلغاء تسجيل");
    expect(text).toContain("ريم");
    expect(text).toContain("نادي القراءة");
  });
});
