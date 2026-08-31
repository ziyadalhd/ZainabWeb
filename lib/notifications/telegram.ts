/**
 * Best-effort admin alert via the official Telegram Bot API. Approved for admin-only internal
 * alerts, never for guest-facing messaging (see docs/architecture-decisions.md). A delivery
 * failure must never affect the caller.
 */
export async function sendTelegramMessage(text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!response.ok) {
      console.error("[telegram] send failed", { status: response.status });
    }
  } catch (error) {
    console.error("[telegram] send failed", { code: error instanceof Error ? error.name : "unknown" });
  }
}
