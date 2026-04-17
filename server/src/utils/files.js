const fs = require("fs/promises");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function tempFile(ext = ".tmp") {
  const id = uuidv4();
  return path.resolve(process.cwd(), "tmp", `${id}${ext}`);
}

function outputFile(ext = ".jpg") {
  const id = uuidv4();
  return path.resolve(process.cwd(), "output", `${id}${ext}`);
}

function lutFile(name = "nostalgia") {
  const id = uuidv4();
  return path.resolve(process.cwd(), "luts", `${name}-${id}.cube`);
}

module.exports = { ensureDir, tempFile, outputFile, lutFile };
