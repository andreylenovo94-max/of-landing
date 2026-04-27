const { sendJson } = require("./_lib/utils");
const { sendTelegramMessage } = require("./_lib/telegram");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      sendJson(res, 405, { ok: false, message: "Method not allowed" });
      return;
    }

    const result = await sendTelegramMessage("TEST MESSAGE");
    sendJson(res, 200, { ok: true, telegram: result });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: "Server error", error: String(error) });
  }
};

