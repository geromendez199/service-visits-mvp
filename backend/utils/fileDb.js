const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}

module.exports = {
  readJson,
  writeJson
};
