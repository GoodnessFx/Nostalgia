const express = require("express");
const multer = require("multer");
const fs = require("fs/promises");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { saveCubeLut } = require("../services/lut");
const { processMediaPipeline, removeTempFile } = require("../services/pipeline");
const { ensureDir, tempFile, outputFile, lutFile, baseDir } = require("../utils/files");

const router = express.Router();
// Increased limit for large video uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 150 * 1024 * 1024 } });

function isVideo(mime = "") {
  return mime.startsWith("video/");
}

router.post("/process", upload.single("media"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Media file is required" });
  }

  const mediaIsVideo = isVideo(req.file.mimetype);
  
  await ensureDir(path.resolve(baseDir, "tmp"));
  await ensureDir(path.resolve(baseDir, "output"));
  await ensureDir(path.resolve(baseDir, "luts"));

  const ext = path.extname(req.file.originalname) || (mediaIsVideo ? ".mp4" : ".jpg");
  const outExt = mediaIsVideo ? ".mp4" : ".jpg";
  
  const inputPath = tempFile(ext);
  const outputPath = outputFile(outExt);
  const lutPath = lutFile("nostalgia");

  try {
    // 1. Save uploaded file to disk
    await fs.writeFile(inputPath, req.file.buffer);

    // 2. Generate Cinematic LUT
    await saveCubeLut(lutPath, { preset: "noir", title: "Nostalgia" });

    // 3. Process via FFmpeg pipeline (applies LUT + Unsharp Mask + Crop)
    await processMediaPipeline({ inputPath, outputPath, lutPath, isVideo: mediaIsVideo });

    // 4. Return local static URL
    const filename = path.basename(outputPath);
    const host = req.get("host");
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const outputUrl = `${protocol}://${host}/output/${filename}`;

    return res.json({
      sourceUrl: "", // We don't need to serve source back to UI
      outputUrl,
      preset: "noir",
      canDownloadLut: false, // Simplified
    });
  } catch (error) {
    console.error("Processing error:", error);
    return res.status(500).json({ error: "Failed to process media" });
  } finally {
    removeTempFile(inputPath);
    removeTempFile(lutPath);
    // Note: We don't remove outputPath because we serve it statically to the user!
  }
});

module.exports = router;
