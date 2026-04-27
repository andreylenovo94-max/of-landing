const fs = require("fs/promises");
const path = require("path");

async function appendApplication(application) {
  // On Vercel, only /tmp is writable.
  const filePath =
    process.env.VERCEL === "1"
      ? path.join("/tmp", "applications.json")
      : path.join(process.cwd(), "data", "applications.json");

  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  let list = [];
  try {
    const raw = await fs.readFile(filePath, "utf8");
    list = JSON.parse(raw);
  } catch {
    list = [];
  }

  list.push(application);
  await fs.writeFile(filePath, JSON.stringify(list, null, 2), "utf8");
}

module.exports = { appendApplication };

