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
  let ffmpegPath = "unknown";
  let err = null;
  try {
    const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
    ffmpegPath = ffmpegInstaller.path;
  } catch (e) {
    err = e.message;
  }
  res.json({ 
    status: "ok", 
    app: "nostalgia-server",
    ffmpegPath,
    err
  });
});

app.use("/api", editRoutes);

// Serve frontend in production (Render)
if (!process.env.VERCEL) {
  const distPath = path.join(process.cwd(), "app", "dist");
  app.use(express.static(distPath));
  // Express 5 catch-all route fallback
  app.use((req, res, next) => {
    if (req.method === 'GET') {
      res.sendFile(path.join(distPath, "index.html"));
    } else {
      next();
    }
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    console.log(`Nostalgia backend running on port ${env.port}`);
  });
}

module.exports = app;
