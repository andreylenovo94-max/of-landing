const crypto = require("crypto");
const { sendJson, readJson } = require("./_lib/utils");
const { appendApplication } = require("./_lib/storage");
const { sendTelegramMessage } = require("./_lib/telegram");

function validateApplication(body) {
  const errors = [];
  if (!body.name || body.name.trim().length < 2) errors.push("Введите имя");
  if (!body.age || Number.isNaN(Number(body.age))) errors.push("Введите корректный возраст");
  if (!body.telegram || !body.telegram.trim().startsWith("@")) errors.push("Укажите Telegram в формате @username");
  if (!body.location || body.location.trim().length < 2) errors.push("Укажите город или страну");
  if (!["Да", "Нет"].includes(body.experience)) errors.push("Выберите опыт");
  return errors;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      sendJson(res, 405, { ok: false, message: "Method not allowed" });
      return;
    }

    const body = await readJson(req);
    const errors = validateApplication(body);
    if (errors.length > 0) {
      sendJson(res, 400, { ok: false, errors });
      return;
    }

    const application = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      age: Number(body.age),
      telegram: body.telegram.trim(),
      location: body.location.trim(),
      experience: body.experience,
      createdAt: new Date().toISOString()
    };

    await appendApplication(application);

    const text =
      "Новая заявка с лендинга:\n" +
      `Имя: ${application.name}\n` +
      `Возраст: ${application.age}\n` +
      `Telegram: ${application.telegram}\n` +
      `Город/Страна: ${application.location}\n` +
      `Опыт: ${application.experience}\n` +
      `Дата: ${application.createdAt}`;

    await sendTelegramMessage(text);

    sendJson(res, 201, { ok: true });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: "Server error", error: String(error) });
  }
};

