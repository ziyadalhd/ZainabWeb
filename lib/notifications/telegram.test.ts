import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

describe("sendTelegramMessage", () => {
  beforeEach(() => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
    vi.stubEnv("TELEGRAM_CHAT_ID", "12345");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("posts the chat id and text as JSON to the bot's sendMessage endpoint", async () => {
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
      () => Promise.resolve(new Response(null, { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchMock);

    await sendTelegramMessage("تسجيل جديد");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/bottest-token/sendMessage");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(JSON.parse(init?.body as string)).toEqual({ chat_id: "12345", text: "تسجيل جديد" });
  });

  it("does nothing when the credentials are not configured", async () => {
    vi.unstubAllEnvs();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await sendTelegramMessage("تسجيل جديد");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not throw when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network down");
    }));

    await expect(sendTelegramMessage("تسجيل جديد")).resolves.toBeUndefined();
  });

  it("does not throw on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 400 })));

    await expect(sendTelegramMessage("تسجيل جديد")).resolves.toBeUndefined();
  });
});
