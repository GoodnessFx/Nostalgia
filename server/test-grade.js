const fs = require("fs");
const path = require("path");
const { processMediaPipeline } = require("./src/services/pipeline");
const { saveCubeLut } = require("./src/services/lut");
const { ensureDir } = require("./src/utils/files");

async function runTest() {
  await ensureDir(path.join(__dirname, "tmp"));
  await ensureDir(path.join(__dirname, "luts"));
  await ensureDir(path.join(__dirname, "output"));

  // Create a dummy red image using ffmpeg directly
  const inputPath = path.join(__dirname, "tmp", "test-input.jpg");
  const outputPath = path.join(__dirname, "output", "test-output.jpg");
  const lutPath = path.join(__dirname, "luts", "test-lut.cube");

  const ffmpeg = require("fluent-ffmpeg");
  await new Promise((resolve, reject) => {
    ffmpeg("color=c=red:s=640x480")
      .inputFormat("lavfi")
      .frames(1)
      .save(inputPath)
      .on("end", resolve)
      .on("error", reject);
  });

  await saveCubeLut(lutPath, { preset: "noir", title: "Test" });
  
  console.log("Input created. Processing...");
  await processMediaPipeline({ inputPath, outputPath, lutPath, isVideo: false });
  console.log("Processing done. Output exists:", fs.existsSync(outputPath));
}

runTest().catch(console.error);
