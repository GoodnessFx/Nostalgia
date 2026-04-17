const fs = require("fs/promises");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

const baseDir = process.env.VERCEL ? os.tmpdir() : process.cwd();

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function tempFile(ext = ".tmp") {
  const id = uuidv4();
  return path.resolve(baseDir, "tmp", `${id}${ext}`);
}

function outputFile(ext = ".jpg") {
  const id = uuidv4();
  return path.resolve(baseDir, "output", `${id}${ext}`);
}

function lutFile(name = "nostalgia") {
  const id = uuidv4();
  return path.resolve(baseDir, "luts", `${name}-${id}.cube`);
}

module.exports = { ensureDir, tempFile, outputFile, lutFile, baseDir };
