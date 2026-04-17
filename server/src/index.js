const express = require("express");
const cors = require("cors");
const path = require("path");
const env = require("./config/env");
const editRoutes = require("./routes/edits");
const { ensureDir, baseDir } = require("./utils/files");

const app = express();

app.use(cors({ origin: env.clientOrigin === "*" ? true : env.clientOrigin }));
app.use(express.json({ limit: "100mb" }));

// Ensure output directory exists before serving it
ensureDir(path.join(baseDir, "output")).catch(() => {});
app.use("/output", express.static(path.join(baseDir, "output")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", app: "nostalgia-server" });
});

app.use("/api", editRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(env.port, () => {
    console.log(`Nostalgia backend running on port ${env.port}`);
  });
}

module.exports = app;
