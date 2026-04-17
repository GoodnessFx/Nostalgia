const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

let ffmpegPath = "ffmpeg";
try {
  const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
  ffmpegPath = ffmpegInstaller.path;
  
  // Ensure FFmpeg binary is executable on Vercel/Linux
  if (process.platform !== "win32") {
    try {
      fs.chmodSync(ffmpegPath, 0o755);
    } catch (err) {
      console.error("Failed to set ffmpeg executable permissions:", err);
    }
  }
} catch (e) {
  console.error("Failed to load @ffmpeg-installer/ffmpeg", e);
}

ffmpeg.setFfmpegPath(ffmpegPath);

function removeTempFile(filePath) {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch (_err) {
    // no-op
  }
}

function buildFilterComplex(lutPath) {
  // Use relative path on Windows to avoid drive letter colon issues
  // On Linux (Vercel), use absolute path and escape colons if any exist
  let formattedLutPath = lutPath.replace(/\\/g, "/");
  if (process.platform === "win32") {
    formattedLutPath = path.relative(process.cwd(), lutPath).replace(/\\/g, "/");
  } else {
    formattedLutPath = formattedLutPath.replace(/:/g, '\\\\:');
  }
  
  return [
    `lut3d=${formattedLutPath}`,
    // Clarity +20, Texture +15 translates to a stronger unsharp mask
    "unsharp=5:5:0.8:5:5:0.0",
    // Crop tighter: eliminate seat clutter (approx 70% of original frame centered)
    "crop=iw*0.70:ih*0.70"
  ].join(",");
}

async function processMediaPipeline({ inputPath, outputPath, lutPath, isVideo }) {
  const filters = buildFilterComplex(lutPath);

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(inputPath);
    
    if (isVideo) {
      cmd
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-crf 18", "-preset medium", "-movflags +faststart", "-pix_fmt yuv420p"]);
    } else {
      cmd.outputOptions(["-q:v 2"]);
    }

    cmd
      .videoFilters(filters)
      .on("start", (commandLine) => console.log("Spawned FFmpeg with command: " + commandLine))
      .on("end", () => resolve(outputPath))
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        reject(err);
      })
      .save(outputPath);
  });
}

module.exports = { processMediaPipeline, removeTempFile };
