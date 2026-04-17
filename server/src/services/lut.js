const path = require("path");

function applyRgbTransforms(r, g, b) {
  let nr = r;
  let ng = g;
  let nb = b;

  // 1. Exposure: -1 stop (half the light intensity linearly)
  nr *= 0.50;
  ng *= 0.50;
  nb *= 0.50;

  // 2. Contrast: +25 S-Curve
  const contrastCurve = (v) => {
    // Simple S-curve centered around 0.5
    return v < 0.5 ? 2 * v * v : 1 - 2 * (1 - v) * (1 - v);
  };
  nr = nr * 0.75 + contrastCurve(nr) * 0.25;
  ng = ng * 0.75 + contrastCurve(ng) * 0.25;
  nb = nb * 0.75 + contrastCurve(nb) * 0.25;

  // 3. Color Temp (-10 cooler): push blue slightly, reduce red
  nr -= 0.04;
  nb += 0.04;

  // 4. Saturation & Vibrance: -15 combined (reduce saturation to 85%)
  const luma = 0.2126 * nr + 0.7152 * ng + 0.0722 * nb;
  nr = luma + (nr - luma) * 0.85;
  ng = luma + (ng - luma) * 0.85;
  nb = luma + (nb - luma) * 0.85;

  // 5. Color Grading (Split Toning)
  // Shadows -> teal/blue
  // Highlights -> warm gold
  const shadowWeight = 1 - luma;
  const highlightWeight = luma;
  
  // Shadows: teal/blue push
  nr -= shadowWeight * 0.05;
  ng += shadowWeight * 0.02;
  nb += shadowWeight * 0.08;
  
  // Highlights: warm gold push
  nr += highlightWeight * 0.06;
  ng += highlightWeight * 0.04;
  nb -= highlightWeight * 0.02;

  // 6. Tone Curve (Matte Film Look)
  // Lift blacks to create a matte floor (-30 Blacks + lifted curve)
  // Pull highlights down (-70 Highlights + crushed curve)
  // Whites -40
  // Map 0.0 -> 0.12 (lifted black)
  // Map 1.0 -> 0.90 (crushed white)
  const remap = (v) => v * (0.90 - 0.12) + 0.12;

  nr = remap(Math.max(0, Math.min(1, nr)));
  ng = remap(Math.max(0, Math.min(1, ng)));
  nb = remap(Math.max(0, Math.min(1, nb)));

  return [nr, ng, nb];
}

async function generateCubeLut({ title = "Nostalgia" }) {
  const size = 33;
  const lines = [
    `TITLE \"${title.toUpperCase()}\"`,
    "LUT_3D_SIZE 33",
    "DOMAIN_MIN 0.0 0.0 0.0",
    "DOMAIN_MAX 1.0 1.0 1.0",
  ];

  for (let b = 0; b < size; b += 1) {
    for (let g = 0; g < size; g += 1) {
      for (let r = 0; r < size; r += 1) {
        const ir = r / (size - 1);
        const ig = g / (size - 1);
        const ib = b / (size - 1);
        const [or, og, ob] = applyRgbTransforms(ir, ig, ib);
        lines.push(`${or.toFixed(6)} ${og.toFixed(6)} ${ob.toFixed(6)}`);
      }
    }
  }

  return `${lines.join("\n")}\n`;
}

async function saveCubeLut(filePath, options) {
  const fs = require("fs/promises");
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const lut = await generateCubeLut(options);
  await fs.writeFile(filePath, lut, "utf8");
  return filePath;
}

module.exports = { saveCubeLut };
