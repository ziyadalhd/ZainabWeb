/**
 * Temporary diagnostic route for the production Telegram alert investigation.
 * Delete this file (and its parent directory if empty) once the investigation is done.
 */
export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  let fetchOutcome: unknown;
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: "diagnostic probe from production debug route" }),
    });
    const responseBody = await response.text();
    fetchOutcome = { ok: response.ok, status: response.status, responseBody };
  } catch (error) {
    fetchOutcome = {
      threw: true,
      name: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message : String(error),
    };
  }

  return Response.json({
    hasToken: Boolean(botToken),
    hasChatId: Boolean(chatId),
    tokenLength: botToken?.length ?? 0,
    chatIdLength: chatId?.length ?? 0,
    fetchOutcome,
  });
}
