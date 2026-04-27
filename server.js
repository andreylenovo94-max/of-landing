const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
  require("dotenv").config({ path: path.join(__dirname, ".env.local"), override: true });
}

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "applications.json");
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml"
};

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

function sendJson(res, code, payload) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function validateApplication(body) {
  const errors = [];
  if (!body.name || body.name.trim().length < 2) errors.push("Введите имя");
  if (!body.age || Number.isNaN(Number(body.age))) errors.push("Введите корректный возраст");
  if (!body.telegram || !body.telegram.trim().startsWith("@")) errors.push("Укажите Telegram в формате @username");
  if (!body.location || body.location.trim().length < 2) errors.push("Укажите город или страну");
  if (!["Да", "Нет"].includes(body.experience)) errors.push("Выберите опыт");
  return errors;
}

async function saveApplication(application) {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const list = JSON.parse(raw);
  list.push(application);
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

function getTelegramConfigStatus() {
  return {
    hasToken: Boolean(TELEGRAM_BOT_TOKEN),
    hasChatId: Boolean(TELEGRAM_CHAT_ID)
  };
}

function ensureTelegramConfig() {
  const status = getTelegramConfigStatus();
  console.log("[Telegram] config status:", status);

  if (!status.hasToken || !status.hasChatId) {
    throw new Error("Telegram config missing: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID");
  }
}

async function sendTelegramMessage(text) {
  ensureTelegramConfig();

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text
    })
  });

  const telegramResult = await response.json();
  console.log("[Telegram] API response:", telegramResult);

  if (!response.ok || telegramResult.ok === false) {
    console.error("[Telegram] API error:", telegramResult);
    throw new Error(telegramResult.description || "Telegram API request failed");
  }

  return telegramResult;
}

async function sendTelegramNotification(application) {
  const text =
    "Новая заявка с лендинга:\n" +
    `Имя: ${application.name}\n` +
    `Возраст: ${application.age}\n` +
    `Telegram: ${application.telegram}\n` +
    `Город/Страна: ${application.location}\n` +
    `Опыт: ${application.experience}\n` +
    `Дата: ${application.createdAt}`;

  return sendTelegramMessage(text);
}

async function serveStaticFile(req, res) {
  const cleanPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(cleanPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const data = await fs.readFile(filePath);

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable"
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/test-telegram") {
      const result = await sendTelegramMessage("TEST MESSAGE");
      sendJson(res, 200, { ok: true, telegram: result });
      return;
    }

    if (req.method === "POST" && req.url === "/api/applications") {
      const body = JSON.parse(await readBody(req));
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

      await saveApplication(application);
      await sendTelegramNotification(application);

      sendJson(res, 201, { ok: true });
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      await serveStaticFile(req, res);
      return;
    }

    sendJson(res, 405, { ok: false, message: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: "Server error", error: String(error) });
  }
});

server.listen(PORT, async () => {
  await ensureDataFile();
  console.log("[Telegram] env loaded from .env/.env.local");
  console.log("[Telegram] has token:", Boolean(TELEGRAM_BOT_TOKEN));
  console.log("[Telegram] has chat_id:", Boolean(TELEGRAM_CHAT_ID));
  console.log(`Server running at http://localhost:${PORT}`);
});
