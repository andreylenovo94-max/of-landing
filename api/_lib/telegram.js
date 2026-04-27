function telegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || "";
  return { token, chatId, hasToken: Boolean(token), hasChatId: Boolean(chatId) };
}

async function sendTelegramMessage(text) {
  const { token, chatId, hasToken, hasChatId } = telegramConfig();

  console.log("[Telegram] has token:", hasToken);
  console.log("[Telegram] has chat_id:", hasChatId);

  if (!hasToken || !hasChatId) {
    const error = new Error("Telegram config missing: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID");
    error.code = "TELEGRAM_CONFIG_MISSING";
    throw error;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });

  const result = await response.json();
  console.log("[Telegram] API response:", result);

  if (!response.ok || result.ok === false) {
    const error = new Error(result.description || "Telegram API request failed");
    error.code = "TELEGRAM_API_ERROR";
    error.telegram = result;
    throw error;
  }

  return result;
}

module.exports = { telegramConfig, sendTelegramMessage };

